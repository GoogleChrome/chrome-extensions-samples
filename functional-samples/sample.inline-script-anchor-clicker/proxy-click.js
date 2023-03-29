// add a custom event listener handle click event
window.addEventListener('proxy-click', function ({ relatedTarget: element }) {
  console.log('proxy-click event received, element: ', element);
  if (element) {
    element.click();
  }
});
