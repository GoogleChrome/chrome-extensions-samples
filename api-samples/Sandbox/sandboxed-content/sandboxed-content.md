# Sandboxed Content

This sample creates a tab containing a sandboxed iframe (`sandbox.html`).
The sandbox uses `eval()` function to write some HTML to its own document.

## Overview

The default packaged app Content Security Policy (CSP) value disallows the use of eval() so using a sandbox is necessary to make use of external resources for this extension.
