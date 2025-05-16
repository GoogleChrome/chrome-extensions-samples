/* global LanguageModel */

import anyDateParser from './node_modules/any-date-parser/dist/index.mjs';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'createCalendarEvent',
    title: 'Create Calendar Event',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'createCalendarEvent') {
    const selectedText = info.selectionText;
    try {
      // Extract event details from text using the prompt API
      const event = await parseEventDetails(selectedText);
      // Convert date to RFC 5545 date format
      const startDate = parse(
        [
          event.start_time,
          event.start_date,
          event.start_year,
          event.timezone
        ].join(' ')
      );
      const endDate = parse(
        [event.end_time, event.end_date, event.end_year, event.timezone].join(
          ' '
        )
      );
      event.dates = format(startDate) + '/' + format(endDate);

      const googleCalendarUrl = createGoogleCalendarUrl(event);
      chrome.tabs.create({ url: googleCalendarUrl.toString() });
    } catch (e) {
      console.log(e);
    }
  }
});

function parse(dateString) {
  const parsed = anyDateParser.attempt(dateString);
  return new Date(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    parsed.hour,
    parsed.minute
  );
}

function format(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return [year, month, day, 'T', hours, minutes, seconds].join('');
}

function createGoogleCalendarUrl(eventDetails) {
  const googleCalendarUrl = new URL(
    'https://calendar.google.com/calendar/render?action=TEMPLATE'
  );
  const params = googleCalendarUrl.searchParams;
  if (eventDetails.title) {
    params.append('text', eventDetails.title);
  }
  if (eventDetails.dates) {
    params.append('dates', eventDetails.dates);
  }
  if (eventDetails.description) {
    params.append('details', eventDetails.description);
  }
  if (eventDetails.location) {
    params.append('location', eventDetails.location);
  }
  return googleCalendarUrl;
}

async function parseEventDetails(text) {
  const session = await LanguageModel.create({
    temperature: 1.0,
    topK: 1.0
  });

  let prompt = `
    The following text describes an event. Extract "title", "start_time", "start_date", "start_year", "end_time", "end_date", "end_year", "description", "timezone" and "location" of the event. Return only JSON as result.

    * If no year is provided, use the current year ${new Date().getFullYear()}.
    * If no timezone is provided, leave it empty.
    * Do not convert the start time or end time

    Here is the text:

     ${text}`;

  const result = await session.prompt(prompt);
  return JSON.parse(fixCommonJSONMistakes(result), null, '  ');
}

function addCommaBetweenQuotes(str) {
  return str.replace(/"([^"]*)"\s+"([^"]*)"/g, '"$1", "$2"');
}

function extractTextBetweenCurlyBraces(str) {
  if (str[0] === '[') return str;
  const firstBraceIndex = str.indexOf('{');
  const lastBraceIndex = str.lastIndexOf('}');

  if (firstBraceIndex === -1 || lastBraceIndex === -1) {
    return null; // No curly braces found
  }

  return str.substring(firstBraceIndex, lastBraceIndex + 1);
}

function curlyToBrackets(str) {
  // Check if the input is a string
  if (typeof str !== 'string') {
    return 'Input must be a string.';
  }

  // Use a regular expression to match curly braces with quoted strings inside
  return str.replace(/\{("([^"]*)"(?:,\s*)?)*\}/g, function (match) {
    // Remove curly braces and replace with brackets
    return '[' + match.slice(1, -1) + ']';
  });
}

function fixCommonJSONMistakes(str) {
  str = str.trim();
  str = curlyToBrackets(str);
  str = extractTextBetweenCurlyBraces(str);
  str = addCommaBetweenQuotes(str);
  return str;
}
