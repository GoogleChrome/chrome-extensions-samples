/* eslint-disable no-undef */

importScripts('./wasm/pkg/helloworld_demo.js');

chrome.runtime.onInstalled.addListener(() => {
  runDemo();
});

async function runDemo() {
  // Initialize the WASM module
  await wasm_bindgen('./wasm/pkg/helloworld_demo_bg.wasm');

  // Call the exported functions from the WASM module
  wasm_bindgen.print();
  wasm_bindgen.print_with_value('John');
}
