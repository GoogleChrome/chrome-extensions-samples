chrome.runtime.onInstalled.addListener(() => {
  const PERIOD = 1 * 60;
  const ClockName = "alarm_clock_event";

  chrome.alarms.create(ClockName, {
    delayInMinutes: 0,
    periodInMinutes: PERIOD,
  });

  const options = {
    type: "basic",
    title: "AlarmClock",
    message: `Now the time is:${new Date().getHours()}:${new Date().getMinutes()}`,
    iconUrl: "../images/logo.png",
  };
  chrome.alarms.onAlarm.addListener(function (ev) {
    if (ev.name == ClockName) {
      chrome.notifications.create(`MyClock${Date.now()}`, options, function (ev) {
      });
    }
  });
});
