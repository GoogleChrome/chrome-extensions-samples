document.getElementById('query').addEventListener('input', (evt) => {
    // Enable the search button only if there is text in the query
    document.getElementById('search').disabled = evt.target.value == '';
});

document.getElementById('search').addEventListener('click', () => {
    const query = document.getElementById('query').value;
    const location = document.getElementById('location').value;

    // Don't search if the query is empty
    if(query == '') return;

    chrome.search.query({text: query, disposition: location});
});