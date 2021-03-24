let display = document.getElementById('display');
let form = document.getElementById('create-alarm');
let clearButton = document.getElementById('clear-display');
let refreshButton = document.getElementById('refresh-display');

let alarmManager = new AlarmManager();

// Chrome event bindings

chrome.alarms.onAlarm.addListener(alarm => {
  console.log('alarm fired', alarm);
});

// DOM event bindings

//// Alarm display buttons

clearButton.addEventListener('click', cancelAllAlarms);

//// New alarm form

form.addEventListener('submit', (event) => {
  event.preventDefault();
  new FormData(form);
});

form.addEventListener('formdata', (event) =>{
  let {formData} = event;

  for (let [formKey, formValue] of formData) {
    console.log(formKey, formValue);
  }
  console.log('---');
});

// Individual alarm UI
class AlarmManager {
  constructor(displayElement) {
    this.display = displayElement;
    this.alarmListener = alarm => this.handleAlarmFired(alarm);

    chrome.alarms.onAlarm.addListener(this.alarmListener);
  }

  destroy() {
    chrome.alarms.onAlarm.removeListener(this.alarmListener);
  }

  /**
   * @param {Object} options
   * @param {string} options.name
   * @param {number} options.delay
   * @param {"ms"|"min"} options.delayFormat;
   * @param {number} options.period;
   */
  create(options) {
    let alarmInfo = {};

    if (options.delayFormat == 'ms') {
      // specified in milliseconds, use `when` property
      alarmInfo.when = options.delay;
    } else {
      // assume minutes, use `delayInMinutes` property
      alarmInfo.delayInMinutes = options.delay;
    }

    if (options.period) {
      alarmInfo.periodInMinutes = options.period;
    }

    chrome.alarms.create(options.name, alarmInfo);
  }

  async clear(name) {
    return new Promise((resolve, reject) => {
      chrome.alarms.clear(name, (wasCleared) => {
        let data = { name, wasCleared };
        if (wasCleared) {
          resolve(data);
        } else {
          reject(data);
        }
      });
    });
  }

  clearAll() {
    chrome.alarm.clearAll((wasCleared) => {
      // update alarm display to show all have been canceled
    });
  }

  handleAlarmFired() {

  }
}

class ExtensionAlarm extends HTMLElement{
  static extensionAlarmTemplate = document.createElement('template');

  constructor() {
    super();

    // Instantiate template
    let template = ExtensionAlarm.template.content.cloneNode(true);

    this.shadowRoot = this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(template);

    // Store references to dynamically driven UI values
    this.rootEl = template.querySelector('.alarm-info');
    this.nameEl = template.querySelector('.alarm__name');
    this.statusEl = template.querySelector('.alarm__status');
    this.scheduleEl = template.querySelector('.alarm__schedule');
    this.periodEl = template.querySelector('.alarm__period');
  }

  handleAlarmFired() {
    let isPeriodic = false;
    if (isPeriodic) return;

    this.rootEl.classList.add('alarm-info--fired');
  }
}

ExtensionAlarm.template.innerHTML = `
<div class="alarm-info">
  <table class="alarm-info__table">
    <tr>
      <th class="alarm-info-label">Alarm Name</th>
      <td class="alarm__name"></td>
    </tr>
    <tr>
      <th class="alarm-info-label">Status</th>
      <td class="alarm__status"></td>
    </tr>
    <tr>
      <th class="alarm-info-label">Next Tick</th>
      <td class="alarm__schedule"></td>
    </tr>
    <tr>
      <th class="alarm-info-label">Period</th>
      <td class="alarm__period"></td>
    </tr>
  </table>
</div>
`;

let knownAlarms = new Set();

function cancelAllAlarms() {
  chrome.alarms.clearAll();
  display.innerHTML = '';
}
