# CONTRIBUTING TO THIS PROJECT

This document is meant for those who are going to work on this project and those who wish to dive a bit deeper into its internals.

Developer(s) are requested to keep the following documentation up to date.

## Table of Contents

- [Development Setup](#development-setup)
- [Tool Behavior](#tool-behavior)
- [Project Structure](#project-structure)
- [Documentation for backend](#documentation-for-backend)
- [Where to find logs](#where-to-find-logs)
- [RMD file format](#rmd-file-format)
  - [Background](#background)
  - [Low-level View](#low-level-view)
  - [High-level View](#high-level-view)

## Development Setup

Install the following tools on your system:

- [VS Code](https://code.visualstudio.com/): The Development Editor recommended for this project.
- [The Rust Programming Language](https://www.rust-lang.org/tools/install): The backend is written in Rust.
- [Node.js and NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm): The `npm` (Node Package Manager) serves as the build and package management tool of our project.
- Linux users also need a few dependencies installed on their system. Do that via the command: `sudo apt install libudev-dev libgtk-3-dev libatk1.0-dev libpango1.0-dev libgdk-pixbuf2.0-dev libwebkit2gtk-4.0-dev libjavascriptcoregtk-4.0-dev libsoup2.4-dev libgdk-pixbuf2.0-dev`. Any other errors (if occurring) can be individually resolved.

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

## Tool Behavior

The CC tool is primarily a serial communication tool that can read some bytes from a serial port and write some bytes to it. Here's a simple philosophy of how operations are broadly done:

- Writing bytes is generally done in response to user's request, so writing always happens on main thread.
- The device can receive bytes at anytime in communication mode, since it could be connected to another device, so reading bytes and printing them to console should be a continuous background activity, since we can't do much with the received bytes anyway, we just need to print them to the log window.
- However, there are times, when the user needs to send some bytes and read bytes back and perform actions accordingly, especially in configuration mode.
  - For example: a user sends ASCII 0 to read the config from the device. In return, they'll read bytes containing config of the device.
  - In these cases, we should stop background reading, do our task of sending and reading some bytes, and then restart background reading task once done.

## Project Structure

This project uses React for front-end and Rust for back-end. This is made possible by the Tauri framework.

The rationale behind this decision is the following:

- Goal was to create a cross-platform application. To create cross-platform desktop apps using Web technologies, we can use Electron (powered by Node.js) or Tauri (Node.js, Rust etc.).
- To leverage the existing skillset of the team. Since many of us maintain web UI's, we went with a web-technologies based front-end.
- Using React means we can use 3rd party components with very little to no changes for building our UI. NPM also provides a vast array of 3rd party JS libraries, such as `react-google-charts`, `tanstack`, `flowbite`, `tailwindcss` and `react` itself.
- Regarding backend, the focus was on ease of use, ease of setting up things and achieving rapid development speeds. Here, the pros of Rust and the cons of C/C++ come into play.
  - C/C++ don't ship with dedicated cross platform build and dependency management tooling. There are 3rd party tools available, but its overall a fragmented ecosystem.
  - Rust gives us a nice `serialport-rs` crate for doing serial I/O in a cross-platform way. Also, it has a large standard library, and has a strict compiler and borrow checker and thus makes it harder to make mistakes, compared to C/C++. However, please be advised that this is by no means a silver bullet - its still quite easy to write a Rust program that crashes (or in Rust lingo, panics!).

Below is a tree listing _some_ important folders / files of this project. It is recommended to keep this tree updated, so that the developer(s) have a fair idea of each file/folder's importance.

```
📦tinymesh-cc-tool (The project directory)
┣ 📂src (Contains the frontend code)
┃ ┣ 📂assets
┃ ┣ 📂components (React Components for our project)
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
┃ ┣ 📂utils (Some commonly used frontend utility functions)
┃ ┃ ┣ 📜connection_util.ts
┃ ┃ ┗ 📜device_info_util.ts
┃ ┣ 📜App.tsx (This is the main react component that lays out all the other components of our front-end)
┃ ┣ 📜DataTypes.tsx
┃ ┣ 📜index.css
┃ ┗ 📜main.tsx
┣ 📂src-tauri (Contains the backend code)
┃ ┣ 📂icons
┃ ┣ 📂resources
┃ ┃ ┗ 📂tests
┃ ┃ ┃ ┣ 📜config_response.txt
┃ ┃ ┃ ┗ 📜RF TM4070.rmd
┃ ┣ 📂src
┃ ┃ ┣ 📜device_config_parser.rs (Contains code for parsing the device configuration that is received using the Read Config button)
┃ ┃ ┣ 📜input_processing.rs (Contains code for parsing the input string sent by Communication Panel into a vector of bytes)
┃ ┃ ┣ 📜lib.rs
┃ ┃ ┣ 📜main.rs (The entry point of our back-end)
┃ ┃ ┣ 📜mk_module_description.rs (High-level RMD file parser, that calls the low-level parser and parses RMD file into a struct)
┃ ┃ ┣ 📜module_description_parser.rs (Low-level RMD file parser that parses RMD file into a HashMap)
┃ ┃ ┗ 📜tinymesh_comm.rs (Contains all the Tauri commands that will be invoked from the front-end Javascript/Typescript code using the `invoke` function)
┃ ┣ 📂tests
┃ ┃ ┣ 📜device_config_parser_test.rs
┃ ┃ ┣ 📜input_processing_test.rs
┃ ┃ ┗ 📜module_description_parser_test.rs
┃ ┣ 📜.gitignore
┃ ┣ 📜build.rs
┃ ┣ 📜Cargo.toml (This is the backend project configuration file)
┃ ┗ 📜tauri.conf.json (Tauri Window config JSON). Refer [this configuration page](https://tauri.app/v1/api/config/).
┣ 📜.gitignore
┣ 📜index.html (The entry point of our front-end)
┣ 📜package.json (npm configuration file - mainly for frontend)
┣ 📜postcss.config.js
┣ 📜README.md
┣ 📜tailwind.config.js
┣ 📜tsconfig.json
┗ 📜vite.config.ts
```

## Documentation for Backend

The backend of this project is written in Rust. So, we're using standard rust tooling to generate the documentation for our project. For backend, you can generate the documentation in the following steps:

- Navigate to `src-tauri` folder of this project.
- Launch a terminal from this folder and enter the command: `cargo doc`.
- Once `cargo` has finished execution, it will generate documentation which can be accessed from `src-tauri/target/doc/tinymesh_cc_tool/index.html` page.

## Where to find logs

The logs can be found in the following folders:

| Platform | Log location                             |
| -------- | ---------------------------------------- |
| macOS    | `$HOME/Library/Logs/com.tinymesh.cctool` |
| Windows  | `%APPDATA%\com.tinymesh.cctool\logs`     |
| Linux    | `$HOME/.config/com.tinymesh.cctool/logs` |

## RMD File Format

### Background

If you look at this CC tool or the one made by Radiocrafts, you'll see that they'll have a `Modules` directory which contains a bunch of files with the extension `.RMD/.rmd` etc. Each file in the modules directory represents a (Tinymesh) module which is supported by the CC tool. I don't know the full name of the RMD abbreviation, so I've affectionately given it the full form of **Radiocrafts Module Description**, in honor of the original CC tool. It could also very well be the original name.

Whenever a user tries to read the device configuration of the connected device via the CC tool, here's what happens:

- It will read the entire configuration memory, and will decode the device name, firmware info and hardware revision from address 0x3c onwards.
- The tool then tries to search for a RMD file of the same name as the device name in the modules folder.
- If the file is found, it will decode the configuration and we'll show the user the unlocked cells of the device configuration memory in a nice table. If not, there's not much we can do and we'll fail.

So, understanding RMD file format is necessary to properly configure the device, show / run testmodes, display device information etc.

### Low-level View

At its core, RMD file format can be thought of as a hashmap, so our low-level parser parses it into one. Here are some guidelines:

1. Anything after `//` or ` //` is a comment, and as such is ignored by the parser.
2. Anything enclosed in `[` and `]` is the **key**. Empty keys are not added to the hashmap.
3. Once we've identified a key, any lines that follow (except for the comments) are combined to a multi-line string that makes up the **value**. We'll keep on adding to the current value, till we encounter a line that matches step 2.

### High-level View

The RMD file will contain keys for stuff like the following:

- No. of testmodes: `TESTMODE NUMBER`.
- Description of each testmode via entries like: `TESTMODE 1 NAME`, `TESTMODE 1 HINT`, `TESTMODE 1 SEQUENCE_ON`, `TESTMODE 1 SEQUENCE_OFF`.
- Each cell of configuration memory is represented using entries like the following:
  - `M 0x00 NAME`: Name of the cell at address `0x00`.
  - `M 0x00 HINT`: A description of the cell at address `0x00`.
  - `M 0x00 MIN_MAX`: Minimum and maximum values allowed for the cell at address `0x00`.
  - `M 0x00 ALLOW`: Allowed values (space-separated) for the cell at address `0x00`.
  - `M 0x00 DEF`: Default value for the cell at address `0x00`.

Also, since we aim to achieve parity with the existing tool and do more with our own, we've added some changes of our own to the RMD file format. Here's an overview and the rationale behind the changes:

- Testmodes dropdown is now split into 2 sections: Quick options and Testmodes. Accordingly, we've introduced some new keys of our own, namely `QUICKMODE NUMBER` and corresponding `QUICKMODE 1 NAME`, `QUICKMODE 1 HINT`, `QUICKMODE 1 SEQUENCE_ON`, `QUICKMODE 1 SEQUENCE_OFF`.
- We also aim to work with the calibration memory of the device, so we've added fields for representing cells of calibration memory as well to the RMD file. The cell descriptions of calibration memory and config memory are pretty similar. In order to separate them from the config memory cells, we've prefixed them with `C`. For example:

```
[C 0x00 NAME]
Temp Offset

[C 0x00 MIN_MAX]
0 255

[C 0x00 DEF]
128

[C 0x00 HINT]
Offset added to TEMP.

Temperature offset in 0.25
degree (C) increments.
Increase for positive
adjustment, decrease for
negative adjustment of TEMP
value
[]
```
