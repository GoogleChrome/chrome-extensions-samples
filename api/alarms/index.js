let display = document.getElementById('display');
let form = document.querySelector('.create-alarm');
let clearButton = document.getElementById('clear-display');
let refreshButton = document.getElementById('refresh-display');

let alarmManager = new AlarmManager({ display });

// DOM event bindings

//// Alarm display buttons

clearButton.addEventListener('click', cancelAllAlarms);
refreshButton.addEventListener('click', refreshAlarmDisplay);

//// New alarm form

form.addEventListener('submit', (event) => {
  event.preventDefault();
  let formData = new FormData(form);
  let data = Object.fromEntries(formData);

  let name = data['alarm-name'];
  let delay = Number.parseFloat(data['time-value']);
  let delayFormat = data['time-format'];
  let period = Number.parseFloat(data['period']);

  createAlarm({ name, delay, delayFormat, period });
});

// Initialize display

refreshAlarmDisplay();

// ???

function destroyAllAlarms() {
  [...display.children].forEach(alarm => {
    alarm.destroy();
  })
}

function cancelAllAlarms() {
  chrome.alarms.clearAll();
  destroyAllAlarms();
}

function refreshAlarmDisplay() {
  destroyAllAlarms();
  chrome.alarms.getAll((alarms) => {
    for (let alarm of alarms) {
      let el = document.createElement('crx-alarm');
      el.setAttribute('alarm-name', alarm.name);
      display.appendChild(el);
    }
  });
}

/**
 * @param {Object} options
 * @param {string} options.name
 * @param {number} options.delay
 * @param {"ms"|"min"} options.delayFormat;
 * @param {number} options.period;
 */
function createAlarm(options) {
  let alarmInfo = {};

  if (options.delayFormat === 'ms') {
    // Specified in milliseconds, use `when` property
    //
    // This takes a fixed timestamp in ms since Unix epoch.
    alarmInfo.when = Date.now() + options.delay;
  } else if (options.delayFormat === 'min') {
    // specified in minutes, use `delayInMinutes` property
    alarmInfo.delayInMinutes = options.delay;
  } else {
    throw new Error(`Unknown time format provided ("${options.delayFormat}"). Known values are "ms" and "min".`);
  }

  if (options.period) {
    alarmInfo.periodInMinutes = options.period;
  }

  chrome.alarms.create(options.name, alarmInfo);

  let el = display.querySelectorAll(`[alarm-name="${options.name}"]`);

  // Instantiate crx-alarm instance for this alarm
  let alarm = document.createElement('crx-alarm');
  alarm.setAttribute('alarm-name', options.name);
  display.appendChild(alarm);
}

// Alarm Element

class ExtensionAlarm extends HTMLElement {
  static template = document.createElement('template');

  constructor() {
    super();

    // Instantiate template
    let template = ExtensionAlarm.template.content.cloneNode(true);

    this._shadowRoot = this.attachShadow({ mode: 'open' });
    this._shadowRoot.appendChild(template);

    // Store references to dynamically driven UI values
    this.rootEl = this._shadowRoot.querySelector('.alarm-info');
    this.nameEl = this._shadowRoot.querySelector('.alarm__name');
    this.statusEl = this._shadowRoot.querySelector('.alarm__status');
    this.scheduleEl = this._shadowRoot.querySelector('.alarm__schedule');
    this.periodEl = this._shadowRoot.querySelector('.alarm__period');

    this.boundAlarmHandler = this.handleAlarmFired.bind(this);
  }

  static get observedAttributes() {
    return ['alarm-name'];
  }

  attributeChangedCallback(attName, _oldAttrValue, newAttrValue) {
    if (attName === 'alarm-name') {
      chrome.alarms.get(newAttrValue, alarm => this.render(alarm));
      this.unbind();
      chrome.alarms.onAlarm.addListener(this.boundAlarmHandler);
    }
  }

  render(alarm) {
    if (!alarm) {
      throw new Error('Attempting to render an alarm, but no alarm data provided');
    }

    // Render current alarm data
    this.nameEl.innerText = alarm.name;

    let date = new Date(alarm.scheduledTime);
    this.scheduleEl.innerText = date.toISOString();

    if (alarm.scheduledTime > Date.now()) {
      this.statusEl.innerText = 'Scheduled';
    }

    if (alarm.periodInMinutes) {
      this.periodEl.innerText = `Every ${alarm.periodInMinutes} minute(s)`
    } else {
      this.periodEl.innerText = 'One-time';
    }
  }

  handleAlarmFired(alarm) {
    // We're registered for updates on all alarms, but we only care about our own
    if (alarm.name !== this.getAttribute('alarm-name')) {
      return;
    }

    if (alarm.periodInMinutes) {
      this.render(alarm);
    } else {
      this.rootEl.classList.add('alarm-info--finished');
      this.statusEl.innerText = 'Completed';
      this.unbind();
    }
  }

  unbind() {
    if (this.boundAlarmHandler) {
      chrome.alarms.onAlarm.removeListener(this.boundAlarmHandler);
    }
  }

  destroy() {
    this.unbind();
    this.parentElement.removeChild(this);
  }
}

ExtensionAlarm.template.innerHTML = `
<link rel="stylesheet" href="index.css">
<div class="alarm-info">
  <table class="alarm-info__table">
    <tr>
      <th class="alarm-info-label">Name</th>
      <td class="alarm__name"></td>
    </tr>
    <tr>
      <th class="alarm-info-label">Status</th>
      <td class="alarm__status"></td>
    </tr>
    <tr>
      <th class="alarm-info-label">Next&nbsp;Tick</th>
      <td class="alarm__schedule"></td>
    </tr>
    <tr>
      <th class="alarm-info-label">Period</th>
      <td class="alarm__period"></td>
    </tr>
  </table>
</div>
`;

customElements.define('crx-alarm', ExtensionAlarm);
