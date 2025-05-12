# MCP Studio Release Process

This document outlines the process for creating and releasing new versions of MCP Studio.

## Prerequisites

- Node.js and npm installed
- Electron Builder installed (`npm install -g electron-builder`)
- For macOS builds: macOS machine (for universal builds, an Apple Silicon Mac is recommended)
- For Windows builds: Windows machine or a macOS machine with Wine installed

## Release Process Overview

1. Update version in package.json
2. Build the application for different platforms
3. Update the landing page with the new release information
4. Deploy the landing page to Netlify

## Detailed Steps

### 1. Update Version

Update the version number in the main `package.json` file:

```json
{
  "name": "mcp-studio",
  "version": "1.2.0",
  ...
}
```

Commit the change:

```bash
git commit -am "Bump version to 1.2.0"
```

### 2. Build and Release

Use the `build-and-release.sh` script to automate the build and release process:

```bash
# Build for all platforms (mac and windows) and set the macOS build as latest
./build-and-release.sh 1.2.0 all true

# Or specify a single platform:

# Build and release a universal macOS build and set as latest
./build-and-release.sh 1.2.0 mac true

# Build and release architecture-specific macOS builds (optional)
./build-and-release.sh 1.2.0 mac-arm64 false
./build-and-release.sh 1.2.0 mac-x64 false

# Build and release a Windows build
./build-and-release.sh 1.2.0 windows false
```

By default, if you don't specify a platform, it will build for all platforms:

```bash
# Equivalent to './build-and-release.sh 1.2.0 all false'
./build-and-release.sh 1.2.0
```

This script will:
- Build the application for the specified platform
- Copy the build to the landing page's releases directory
- Update the releases.json file with the new version information

### 3. Manual Release (Alternative)

If you prefer to do the process manually:

#### a. Build the application

For macOS (universal build):
```bash
npm run build:mac-universal
```

For macOS (Apple Silicon):
```bash
npm run build:mac-arm
```

For macOS (Intel):
```bash
npm run build:mac-intel
```

For Windows:
```bash
npm run build:windows
```

#### b. Copy the builds to the landing page

```bash
mkdir -p landing-page/public/releases
cp dist/mcp-studio-mac-v1.2.0.dmg landing-page/public/releases/
```

#### c. Update the releases.json file

```bash
cd landing-page
npm run update-release 1.2.0 mac --latest
```

### 4. Deploy the Landing Page

```bash
cd landing-page
npm run netlify-build
```

## Architecture-Specific Builds

MCP Studio supports different build types:

- **Universal macOS Build**: Works on both Intel and Apple Silicon Macs
- **Apple Silicon Build**: Optimized for M1/M2 Macs
- **Intel Mac Build**: For older Intel-based Macs
- **Windows Build**: For Windows machines

The landing page will automatically detect the user's platform and architecture and offer the appropriate download.

## Troubleshooting

### Build Issues

- **macOS Code Signing**: If you encounter code signing issues, make sure you have the appropriate certificates installed.
- **Windows Build on macOS**: If building Windows on macOS, ensure Wine is installed.

### Netlify Deployment Issues

- **Missing Assets**: If assets are missing on Netlify, check the webpack configuration to ensure all assets are being copied to the dist directory.
- **404 Errors**: If you see 404 errors for assets, check the path references in your components.
