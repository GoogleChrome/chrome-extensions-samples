// Copyright 2021 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

if (!customElements) {

  // Either we didn't register the polyfill for the content script world or something else is
  // terribly wrong.
  console.error('customElements global not found. Cannot register a custom element');

} else if (customElements.get('custom-element-demo') === undefined) {

  // Everything looks good, let's register our element.
  let template = document.createElement('template');
  template.innerHTML = `<p>Hello, World!</p>`;

  class CustomElementDemo extends HTMLElement {
    constructor() {
      super();

      const shadowRoot = this.attachShadow({mode: 'open'});
      shadowRoot.appendChild(template.content.cloneNode(true));
    }

    attributeChangedCallback(name, oldValue, newValue) {
      console.log('Attribute changed', {name, oldValue, newValue});

      if (name === 'given-name') {
        this.shadowRoot.getElementById('greeting-target').innerText = newValue;
      }
    }
  }

  customElements.define('custom-element-demo', CustomElementDemo);

}
