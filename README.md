# Tinymesh CC Tool

## Introduction

This tool is meant for working with Tinymesh TM-series RF modules. It provides the following features:

- [x] Configuring the module
- [x] Communicating between different modules
- [x] Reading module information
- [x] Spectrum analysis
- [ ] Calibration

## Installation instructions

## Development Setup

Install the following tools on your system:

- [VS Code](https://code.visualstudio.com/): The Development Editor recommended for this project.
- [The Rust Programming Language](https://www.rust-lang.org/tools/install): The backend is written in Rust.
- [Node.js and NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm): The `npm` (Node Package Manager) serves as the build and package management tool of our project.
- Install Tauri CLI using the following command: `npm install --save-dev @tauri-apps/cli`
- Linux users also need a `libudev` dependency installed on their system.

The following VS Code extensions are also recommended:

- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [VS Code's rust-analyzer extension](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

Once you've setup all the required tools for building this project, its time to setup the project for development on your system:

- Download the source code of this project from this repository. You can download the source code via git or use the Code button above to download the source code as a compressed archive and extract it somewhere on your system.
- Change to the project directory and open a Terminal / Command Prompt / Powershell there.
- Run `npm install` to fetch all the dependencies.
- Run `npm run tauri dev` to run the CC tool.
- Run `npm run tauri build` to build an installer for the tool. Please note that this command will only generate the installer for the platform which you are using.
  - On Windows, it will produce a EXE and MSI installer.
  - On macOS, it will produce an app bundle.
  - On Linux (Ubuntu), it will generate a DEB file.

## Project Structure

Below is a tree listing _some_ important folders / files of this project. It is recommended to keep this tree updated, so that the developer(s) have a fair idea of each file/folder's importance.

📦tinymesh-cc-tool **(The project directory)**
┣ 📂src **(Contains the frontend code)**
┃ ┣ 📂assets
┃ ┣ 📂components **(React Components for our project)**
┃ ┃ ┣ 📜AppTabs.tsx
┃ ┃ ┣ 📜ButtonComp.tsx
┃ ┃ ┣ 📜CommunicationPanel.tsx
┃ ┃ ┣ 📜ConfigAndCommunicationTab.tsx
┃ ┃ ┣ 📜ConfigModeToggle.tsx
┃ ┃ ┣ 📜ConfigPanel.tsx
┃ ┃ ┣ 📜ConnectDisconnectButton.tsx
┃ ┃ ┣ 📜DeviceInfo.tsx
┃ ┃ ┣ 📜DeviceSelect.tsx
┃ ┃ ┣ 📜Header.tsx
┃ ┃ ┣ 📜InputWithDatalist.tsx
┃ ┃ ┣ 📜RSSIChart.tsx
┃ ┃ ┣ 📜TerminalPanel.tsx
┃ ┃ ┗ 📜TestModeSelect.tsx
┃ ┣ 📂utils **(Some commonly used frontend utility functions)**
┃ ┃ ┣ 📜connection_util.ts
┃ ┃ ┗ 📜device_info_util.ts
┃ ┣ 📜App.tsx **(This is the main react component that lays out all the other components of our front-end)**
┃ ┣ 📜DataTypes.tsx
┃ ┣ 📜index.css
┃ ┗ 📜main.tsx
┣ 📂src-tauri **(Contains the backend code)**
┃ ┣ 📂icons
┃ ┣ 📂resources
┃ ┃ ┗ 📂tests
┃ ┃ ┃ ┣ 📜config_response.txt
┃ ┃ ┃ ┗ 📜RF TM4070.rmd
┃ ┣ 📂src
┃ ┃ ┣ 📜device_config_parser.rs **(Contains code for parsing the device configuration that is received using the Read Config button)**
┃ ┃ ┣ 📜input_processing.rs **(Contains code for parsing the input string sent by Communication Panel into a vector of bytes)**
┃ ┃ ┣ 📜lib.rs
┃ ┃ ┣ 📜main.rs **(The entry point of our back-end)**
┃ ┃ ┣ 📜mk_module_description.rs **(High-level RMD file parser, that calls the low-level parser and parses RMD file into a struct)**
┃ ┃ ┣ 📜module_description_parser.rs **(Low-level RMD file parser that parses RMD file into a HashMap)**
┃ ┃ ┗ 📜tinymesh_comm.rs **(Contains all the Tauri commands that will be invoked from the front-end Javascript/Typescript code using the `invoke` function)**
┃ ┣ 📂tests
┃ ┃ ┣ 📜device_config_parser_test.rs
┃ ┃ ┣ 📜input_processing_test.rs
┃ ┃ ┗ 📜module_description_parser_test.rs
┃ ┣ 📜.gitignore
┃ ┣ 📜build.rs
┃ ┣ 📜Cargo.toml
┃ ┗ 📜tauri.conf.json **(Tauri Window config JSON)**. Refer [this configuration page](https://tauri.app/v1/api/config/).
┣ 📜.gitignore
┣ 📜index.html **(The entry point of our front-end)**
┣ 📜package.json
┣ 📜postcss.config.js
┣ 📜README.md
┣ 📜tailwind.config.js
┣ 📜tsconfig.json
┗ 📜vite.config.ts
