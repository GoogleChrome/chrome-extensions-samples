// Copyright 2022 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

const article = document.querySelector("article");

// `document.querySelector` may return null if the selector doesn't match anything.
if (article) {
  const text = article.textContent;
  /**
   * count all groups of non-whitespace characters
   * /\w+/g only matches the latin alphabet
   * don't count /\s/ b/c this matches empty strings and leading and trailing spaces
   */
  const words = text.matchAll(/[^\s]+/g);
  // matchAll returns an iterator, convert to array to get word count
  const wordCount = [...words].length;
  const readingTime = Math.round(wordCount / 200);
  const badge = document.createElement("div");
  badge.textContent = `⏱️ ${readingTime} min read`;

  // API reference docs
  const heading = article.querySelector("h1");
  // Articles with date
  const date = article.querySelector("time")?.parentNode;
  // https://stackoverflow.com/a/50066247/4842857
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentElement
  (date ?? heading).insertAdjacentElement("afterend", badge);
}
