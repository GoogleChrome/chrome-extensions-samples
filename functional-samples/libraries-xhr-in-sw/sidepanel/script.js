const fetchedTitle = new URLSearchParams(location.search).get('title');
document.body.innerText = `This tab has the title "${fetchedTitle}"`;
