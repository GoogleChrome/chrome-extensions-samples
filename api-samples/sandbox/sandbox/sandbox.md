# Sandbox

This sample creates a tab with a sandboxed iframe (`sandbox.html`) to which the main page (`mainpage.html`)
passes a counter variable. The sandboxed page uses the
Handlebars template library to evaluate and compose a message
using the counter variable which is then passed back to the main page for rendering.

## Overview

The default Content Security Policy (CSP) settings of the extension disallows the use of `eval()` so using a sandbox is necessary to use external resources for this extension.
