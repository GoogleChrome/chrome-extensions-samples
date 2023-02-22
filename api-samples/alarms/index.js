// Copyright 2021 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

const display = document.querySelector('.alarm-display');
const log = document.querySelector('.alarm-log');
const form = document.querySelector('.create-alarm');
const clearButton = document.getElementById('clear-display');
const refreshButton = document.getElementById('refresh-display');
const pad = (val, len = 2) => val.toString().padStart(len, '0');

// DOM event bindings

// Alarm display buttons

clearButton.addEventListener('click', () => manager.cancelAllAlarms());
refreshButton.addEventListener('click', () => manager.refreshDisplay());

// New alarm form

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Extract form values
  const name = data['alarm-name'];
  const delay = Number.parseFloat(data['time-value']);
  const delayFormat = data['time-format'];
  const period = Number.parseFloat(data['period']);

  // Prepare alarm info for creation call
  const alarmInfo = {};

  if (delayFormat === 'ms') {
    // Specified in milliseconds, use `when` property
    alarmInfo.when = Date.now() + delay;
  } else if (delayFormat === 'min') {
    // specified in minutes, use `delayInMinutes` property
    alarmInfo.delayInMinutes = delay;
  }

  if (period) {
    alarmInfo.periodInMinutes = period;
  }

  // Create the alarm – this uses the same signature as chrome.alarms.create
  manager.createAlarm(name, alarmInfo);
});

class AlarmManager {
  constructor(display, log) {
    this.displayElement = display;
    this.logElement = log;

    this.logMessage('Manager: initializing demo');

    this.displayElement.addEventListener('click', this.handleCancelAlarm);
    chrome.alarms.onAlarm.addListener(this.handleAlarm);
  }

  logMessage(message) {
    const date = new Date();
    const pad = (val, len = 2) => val.toString().padStart(len, '0');
    const h = pad(date.getHours());
    const m = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    const ms = pad(date.getMilliseconds(), 3);
    const time = `${h}:${m}:${s}.${ms}`;

    const logLine = document.createElement('div');
    logLine.textContent = `[${time}] ${message}`;

    // Log events in reverse chronological order
    this.logElement.insertBefore(logLine, this.logElement.firstChild);
  }

  handleAlarm = async (alarm) => {
    const json = JSON.stringify(alarm);
    this.logMessage(`Alarm "${alarm.name}" fired\n${json}}`);
    await this.refreshDisplay();
  };

  handleCancelAlarm = async (event) => {
    if (!event.target.classList.contains('alarm-row__cancel-button')) {
      return;
    }

    const name = event.target.parentElement.dataset.name;
    await this.cancelAlarm(name);
    await this.refreshDisplay();
  };

  async cancelAlarm(name) {
    // TODO: Remove custom promise wrapper once the Alarms API supports promises
    return new Promise((resolve) => {
      chrome.alarms.clear(name, (wasCleared) => {
        if (wasCleared) {
          this.logMessage(`Manager: canceled alarm "${name}"`);
        } else {
          this.logMessage(`Manager: could not canceled alarm "${name}"`);
        }

        resolve(wasCleared);
      });
    });
  }

  // Thin wrapper around alarms.create to log creation event
  createAlarm(name, alarmInfo) {
    chrome.alarms.create(name, alarmInfo);
    const json = JSON.stringify(alarmInfo, null, 2).replace(/\s+/g, ' ');
    this.logMessage(`Created "${name}"\n${json}`);
    this.refreshDisplay();
  }

  renderAlarm(alarm, isLast) {
    const alarmEl = document.createElement('div');
    alarmEl.classList.add('alarm-row');
    alarmEl.dataset.name = alarm.name;
    alarmEl.textContent = JSON.stringify(alarm, 0, 2) + (isLast ? '' : ',');

    const cancelButton = document.createElement('button');
    cancelButton.classList.add('alarm-row__cancel-button');
    cancelButton.textContent = 'cancel';
    alarmEl.appendChild(cancelButton);

    this.displayElement.appendChild(alarmEl);
  }

  async cancelAllAlarms() {
    // TODO: Remove custom promise wrapper once the Alarms API supports promises
    return new Promise((resolve) => {
      chrome.alarms.clearAll((wasCleared) => {
        if (wasCleared) {
          this.logMessage(`Manager: canceled all alarms"`);
        } else {
          this.logMessage(`Manager: could not canceled all alarms`);
        }

        resolve(wasCleared);
      });
    });
  }

  async populateDisplay() {
    // TODO: Remove custom promise wrapper once the Alarms API supports promises
    return new Promise((resolve) => {
      chrome.alarms.getAll((alarms) => {
        for (const [index, alarm] of alarms.entries()) {
          const isLast = index === alarms.length - 1;
          this.renderAlarm(alarm, isLast);
        }
        resolve();
      });
    });
  }

  // Simple locking mechanism to prevent multiple concurrent refreshes from rendering duplicate
  // entries in the alarms list
  #refreshing = false;

  async refreshDisplay() {
    if (this.#refreshing) {
      return;
    } // refresh in progress, bail

    this.#refreshing = true; // acquire lock
    try {
      await Promise.all([this.clearDisplay(), this.populateDisplay()]);
    } finally {
      this.#refreshing = false; // release lock
    }
  }

  async clearDisplay() {
    this.displayElement.textContent = '';
  }
}

const manager = new AlarmManager(display, log);
manager.refreshDisplay();
