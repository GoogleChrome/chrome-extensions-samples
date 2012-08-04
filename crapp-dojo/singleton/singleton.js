var creationTime = new Date(),
    creationMessage = creationTime.toLocaleString();

document.getElementById('created-at').textContent = creationMessage;
