# Sandboxed Content

This sample creates a tab containing a sandboxed iframe (`sandbox.html`).
The sandbox calls `eval()` to write some HTML to its own document.

## Overview

The default Content Security Policy (CSP) settings of the extension disallows the use of `eval()` so using a sandbox is necessary to use external resources for this extension.
