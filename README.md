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

- use react-resizable-panels
- Create a config file = give path of modules directory there, log file path
- calibration mode: aes key configuration
- UI: failures should be reported on device unable to connect
- UI: connect / disconnect button should properly bring device into communication mode
- UI: config mode state should be reflected properly on refresh
- Config panel input validation
- UI theme uniformity
- Display device model, hw and fw version

## Other Links

- [Contributing to this project](./CONTRIBUTING.md)
