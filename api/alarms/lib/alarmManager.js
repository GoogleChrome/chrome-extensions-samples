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
