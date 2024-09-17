const textReplacements = [
    { oldText: 'Watch out! Enemy Rhodesian Ridgeback Pack!', newText: 'THESE DOGS ARE FUCKING CRAZY!' },
    { oldText: 'Crossroads', newText: 'pee' },
    { oldText: 'Hoard', newText: 'poo' }
];

function replaceTextContent() {
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let node;
    while (node = walker.nextNode()) {
        let text = node.nodeValue;
        
        textReplacements.forEach(({ oldText, newText }) => {
            text = text.replace(new RegExp(oldText, 'g'), newText);
        });
        node.nodeValue = text;
    }
}

replaceTextContent();