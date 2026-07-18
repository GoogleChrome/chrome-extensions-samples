const LOGS_CONTAINER = document.getElementById('logs');

const getFormattedTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

const appendLog = (text) => {
  const log = document.createElement('div');
  log.classList.add('log-item');
  log.innerText = `[${getFormattedTime()}] ${text}`;
  LOGS_CONTAINER.appendChild(log);
  LOGS_CONTAINER.scrollTop = LOGS_CONTAINER.scrollHeight;
};

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'append-log') {
    appendLog(message.text);
  }
});
