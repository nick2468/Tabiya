// Windows release builds open no console window: this is a desktop app.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tabiya_lib::run()
}
