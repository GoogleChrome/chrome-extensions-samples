/* eslint-disable no-undef */
//creates an initial notification when the action button is clicked.

//Creating a notification based on type
function createNotification(type) {
  let title, message, nextType;
  switch (type) {
    case 'basic':
      title = 'Basic Notification';
      message = 'Back to Basics!';
      nextType = 'image';
      break;
    case 'image':
      title = 'Image Notification';
      message = 'Look at this image notification!';
      nextType = 'progress';
      break;
    case 'progress':
      title = 'Progress Notification';
      message = "You've made it to the progress notification! (Almost there!)";
      nextType = 'list';
      break;
    case 'list':
      title = 'List Notification';
      message = "We've listed all types!";
      nextType = 'basic';
      break;
  }

  let options = {
    type: type,
    title: title,
    message: message
  };

  if (type == 'image') {
    options.iconUrl = 'icon.png';
  }

  if (type == 'list') {
    options.items = [
      { title: 'list element 1', message: 'list message 1' },
      { title: 'list element 2', message: 'list message 2' }
    ];
  }

  if (type == 'progress') {
    options.progress = 99;
  }

  chrome.notifications.create(options, () => {
    createNotification(nextType);
  });
}

chrome.action.onClicked.addListener(() => {
  createNotification('basic');
});

//cycle through notification templates based on the previously created type.
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId == 'basic') {
    createNotification('image');
  } else if (notificationId == 'image') {
    createNotification('progress');
  } else if (notificationId == 'progress') {
    createNotification('list');
  } else if (notificationId == 'list') {
    createNotification('basic');
  }
});
