window.onload = e => {
  console.log('Settings Page loaded');
  const mockButtonElement = document.createElement('button');
  mockButtonElement.appendChild(document.createTextNode(`Mock Button`));  
  mockButtonElement.onclick = () => {
    console.log('mock button clicked');
  };
  document.body.appendChild(mockButtonElement);
};

