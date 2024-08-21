import { isProbablyReaderable, Readability } from '@mozilla/readability';

function canBeParsed(document) {
  return isProbablyReaderable(document, {
    minContentLength: 100
  });
}

function parse(document) {
  if (!canBeParsed(document)) {
    console.log('cannot be parsed');
    return false;
  }
  const documentClone = document.cloneNode(true);
  const article = new Readability(documentClone).parse();
  console.log('parse result', article.textContent);
  return article.textContent; // .replace(/^\s+|\s+$|\s+(?=\s)/g, "");
}

parse(window.document);
