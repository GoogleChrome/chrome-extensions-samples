chrome.management.getAll((extensions) => {
  const extensionList = document.getElementById('extensionList');

  extensions.forEach((extension) => {
    // Create list item for each extension
    const li = document.createElement('li');

    // Create and set icon for the extension
    const icon = document.createElement('img');
    icon.src = extension.icons ? extension.icons[0].url : 'images/sample.png'; // Use default icon if not available
    icon.width = 24;
    icon.height = 24;
    li.appendChild(icon);

    // Create and set name of the extension
    const name = document.createElement('span');
    name.textContent = extension.name;
    li.appendChild(name);

    // Create and set version of the extension
    const version = document.createElement('span');
    version.textContent = ` (v${extension.version})`;
    li.appendChild(version);

    // Create and set uninstall button for the extension
    const button = document.createElement('button');
    button.textContent = 'Uninstall';
    button.addEventListener('click', () => {
      // Send message to background script to uninstall extension
      chrome.runtime.sendMessage(
        { action: 'uninstall', id: extension.id },
        () => {
          // Remove the extension from the list after uninstalling
          li.remove();
        }
      );
    });
    li.appendChild(button);

    // Append the list item to the extension list
    extensionList.appendChild(li);
  });
});
