import DOMPurify from '../node_modules/dompurify/dist/purify.es.mjs';
import { marked } from '../node_modules/marked/marked.min';

// The underlying model has a context of 1,024 tokens, out of which 26 are used by the internal prompt,
// leaving about 998 tokens for the input text. Each token corresponds, roughly, to about 4 characters, so 4,000
// is used as a limit to warn the user the content might be too long to summarize.
const MAX_MODEL_CHARS = 4000;

let pageContent = '';

const summaryElement = document.body.querySelector('#summary');
const warningElement = document.body.querySelector('#warning');

chrome.storage.session.get('pageContent', ({ pageContent }) => {
  onContentChange(pageContent);
});

chrome.storage.session.onChanged.addListener((changes) => {
  const pageContent = changes['pageContent'];
  onContentChange(pageContent.newValue);
});

async function onContentChange(newContent) {
  if (pageContent == newContent) {
    // no new content, do nothing
    return;
  }
  pageContent = newContent;
  let summary;
  if (newContent) {
    if (newContent.length > MAX_MODEL_CHARS) {
      updateWarning(
        `Text is too long for summarization with ${newContent.length} characters (maximum supported content length is ~4000 characters).`
      );
    } else {
      updateWarning('');
    }
    showSummary('Loading...');
    summary = await generateSummary(newContent);
  } else {
    summary = "There's nothing to summarize";
  }
  showSummary(summary);
}

async function generateSummary(text) {
  try {
    let session = await createSummarizer((message, progress) => {
      console.log(`${message} (${progress.loaded}/${progress.total})`);
    });
    let summary = await session.summarize(text);
    session.destroy();
    return summary;
  } catch (e) {
    console.log('Summary generation failed');
    console.error(e);
    return 'Error: ' + e.message;
  }
}

async function createSummarizer() {
  if (!window.ai || !window.ai.summarizer) {
    throw new Error('AI Summarization is not supported in this browser');
  }
  const canSummarize = await window.ai.summarizer.capabilities();
  let summarizer;
  if (canSummarize && canSummarize.available !== 'no') {
    if (canSummarize.available === 'readily') {
      // The summarizer can immediately be used.
      summarizer = await window.ai.summarizer.create();
    } else {
      // The summarizer can be used after the model download.
      summarizer = await window.ai.summarizer.create();
      summarizer.addEventListener('downloadprogress', (e) => {
        console.log('Downloading model', e.loaded, e.total);
      });
      await summarizer.ready;
    }
  } else {
    throw new Error(`AI Summarizer not available (${canSummarize.available})`);
  }
  return summarizer;
}

async function showSummary(text) {
  summaryElement.innerHTML = DOMPurify.sanitize(marked.parse(text));
}

async function updateWarning(warning) {
  warningElement.textContent = warning;
  if (warning) {
    warningElement.removeAttribute('hidden');
  } else {
    warningElement.setAttribute('hidden', '');
  }
}
