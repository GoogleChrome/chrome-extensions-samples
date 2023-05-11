# Using WASM in Manifest V3

This recipe shows how to use WASM in Manifest V3.

To load WASM in Manifest V3, we need to use the `wasm-unsafe-eval` CSP directive ([Content Security Policy][0]).

## Overview

### Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an unpacked extension.
3. Find the extension named "WASM Load Example - Helloworld (no-modules)" and inspect the service worker.

You will see the following output:

```
[from wasm] Inited.
[from wasm] Hello World!
[from wasm] Hello John
```

### Build WASM locally

We have already built the WASM file for you. If you want to build it yourself, follow the steps below.

1. Install [Rust](https://www.rust-lang.org/install.html).

2. Install [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/).

   ```bash
   cargo install wasm-pack
   ```

3. Build WASM.

   ```bash
   cd wasm
   wasm-pack build --target no-modules
   ```

[0]: https://developer.chrome.com/docs/extensions/mv3/manifest/content_security_policy/
