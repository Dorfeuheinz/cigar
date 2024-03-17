# Tinymesh CC Tool

## Introduction

This tool is meant for working with Tinymesh TM-series RF modules. It provides the following features:

- [x] Configuring the module
- [x] Communicating between different modules
- [x] Reading module information
- [x] Spectrum analysis
- [ ] Calibration

## Installation instructions

- On Windows and macOS, use the corresponding installers for your system.
- Linux users also need the `libudev` dependency installed on their system. Check if your distro has a package containing the term `libudev` in it and install.

## Feature plan

- Add logging support
- Package modules folder with the app installer
- UI: failures should be reported on device unable to connect
- UI: connect / disconnect button should properly bring device into communication mode
- UI: config mode state should be reflected properly on refresh
- Fix issue of duplicate events on config change.
- Emit events from current window instead of app based events
- Config panel input validation
- Add CI / CD pipeline
- Add Tinymesh assets for app banner and app icons
- calibration mode: aes key configuration
- UI theme uniformity for flowbite components
- Display device model, hw and fw version
- use react-resizable-panels

## Other Links

- [Documentation for Developers](./CONTRIBUTING.md)
