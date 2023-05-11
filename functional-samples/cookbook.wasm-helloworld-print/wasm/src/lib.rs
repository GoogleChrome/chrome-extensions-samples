use wasm_bindgen::prelude::*;
use web_sys::console;

// will be called when the wasm module is loaded
// https://rustwasm.github.io/docs/wasm-bindgen/reference/attributes/on-rust-exports/start.html
#[wasm_bindgen(start)]
pub fn main() {
    console::log_1(&"[from wasm] Inited.".into());
}

#[wasm_bindgen]
pub fn print() {
    console::log_1(&"[from wasm] Hello World!".into());
}

#[wasm_bindgen]
pub fn print_with_value(value: &str) {
    // with 2-args log function
    console::log_2(&"[from wasm] Hello".into(), &value.into());
}
