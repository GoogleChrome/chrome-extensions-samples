// Copyright 2022 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

const DYNAMIC_SCRIPT_ID = "dynamic-script";

async function isDynamicContentScriptRegistered() {
  const scripts = await chrome.scripting.getRegisteredContentScripts();
  return scripts.some((s) => s.id === DYNAMIC_SCRIPT_ID);
}

document.querySelector("#inject-programmatic").addEventListener("click", async () => {
  // First, unregister the dynamic content script.
  const dynamicContentScriptRegistered = await isDynamicContentScriptRegistered();

  if (dynamicContentScriptRegistered) {
    await chrome.scripting.unregisterContentScripts({ ids: [DYNAMIC_SCRIPT_ID] });
  }

  // Now, execute the script. We handle this in the service worker so we can
  // wait for the tab to open and **then** inject our script.
  const world = document.querySelector("[name='world']").value;
  chrome.runtime.sendMessage({ name: "inject-programmatic", options: { world } });
});

document.querySelector("#register-dynamic").addEventListener("click", async () => {
  const persistAcrossSessions = document.querySelector("[name='persist']").value === "yes";
  const matches = document.querySelector("[name='matches']").value;
  const runAt = document.querySelector("[name='run-at']").value;
  const allFrames = document.querySelector("[name='persist']").value === "yes";
  const world = document.querySelector("[name='world']").value;

  await chrome.scripting
    .registerContentScripts([{
      id: DYNAMIC_SCRIPT_ID,
      js: ["content-script.js"],
      persistAcrossSessions,
      matches: [matches],
      runAt,
      allFrames,
      world
    }]);

  // Only open the page by default if the `matches` field hasn't been changed.
  if (matches === "https://example.com/*") {
    await chrome.tabs.create({ url: "https://example.com" });
  }

  updateUI();
});

document.querySelector("#unregister-dynamic").addEventListener("click", async () => {
  await chrome.scripting.unregisterContentScripts({ ids: [DYNAMIC_SCRIPT_ID] });
  updateUI();
});

const PROGRAMMATIC_TAB_SELECTOR = "[name='type'][value='programmatic']";
const DYNAMIC_TAB_SELECTOR = "[name='type'][value='dynamic']";

function updateUI() {
  const type = document.querySelector(PROGRAMMATIC_TAB_SELECTOR).checked ? "programmatic" : "dynamic";

  // Update selected tab.
  document.querySelector(PROGRAMMATIC_TAB_SELECTOR).parentElement.className = type === "programmatic" ? "selected" : "";
  document.querySelector(DYNAMIC_TAB_SELECTOR).parentElement.className = type === "dynamic" ? "selected" : "";

  // Only show some fields for dynamic scripts.
  document.querySelector("[name='run-at']").parentElement.style.display = type === "dynamic" ? "" : "none";
  document.querySelector("[name='persist']").parentElement.style.display = type === "dynamic" ? "" : "none";
  document.querySelector("[name='all-frames']").parentElement.style.display = type === "dynamic" ? "" : "none";
  document.querySelector("[name='matches']").parentElement.style.display = type === "dynamic" ? "" : "none";
  document.querySelector(".hint").style.display = type === "dynamic" ? "" : "none";

  // Update visible buttons.
  document.querySelector(".programmatic-buttons").style.display = type === "programmatic" ? "flex" : "none";
  document.querySelector(".dynamic-buttons").style.display = type === "dynamic" ? "flex" : "none";

  // Decide if the register or unregister button is visible for dynamic scripts.
  isDynamicContentScriptRegistered().then((dynamicContentScriptRegistered) => {
    document.querySelector("#register-dynamic").toggleAttribute("disabled", dynamicContentScriptRegistered);
    document.querySelector("#unregister-dynamic").toggleAttribute("disabled", !dynamicContentScriptRegistered);
  });
}


updateUI();

document.querySelector(PROGRAMMATIC_TAB_SELECTOR).addEventListener("change", (e) => {
  e.target.checked && updateUI();
});

document.querySelector(DYNAMIC_TAB_SELECTOR).addEventListener("change", (e) => {
  e.target.checked && updateUI();
});
