# Code Obfuscation for MCP Studio

This document explains how to use the code obfuscation feature in MCP Studio to protect your source code in distributed builds.

## What is Code Obfuscation?

Code obfuscation is the process of transforming code into a version that is difficult for humans to understand while preserving its functionality. This helps protect your intellectual property by making it harder for others to reverse-engineer your application.

## Benefits of Obfuscation

- **Intellectual Property Protection**: Makes it harder for others to understand and copy your code
- **Security Enhancement**: Hides sensitive information and logic in your code
- **Tamper Resistance**: Makes it more difficult for attackers to modify your code

## How Obfuscation Works in MCP Studio

The obfuscation process in MCP Studio:

1. Creates a copy of your project in the `dist-obfuscated` directory
2. Obfuscates all JavaScript files using `javascript-obfuscator`
3. Copies all non-JS files (HTML, CSS, assets, etc.) as-is
4. Preserves the project structure for building

## Obfuscation Features

The obfuscation in MCP Studio includes:

- **Name Mangling**: Renames variables, functions, and parameters to meaningless identifiers
- **Control Flow Flattening**: Transforms the control flow to make it harder to follow
- **Dead Code Injection**: Adds meaningless code to confuse readers
- **String Encryption**: Encrypts string literals in the code
- **Self-Defending**: Prevents the code from running if it's modified or debugged

## How to Use Code Obfuscation

### Method 1: Using npm Scripts

To build with obfuscation using npm scripts:

```bash
# Obfuscate code only (creates dist-obfuscated directory)
npm run obfuscate

# Build for Mac with obfuscation
npm run build:obfuscated:mac

# Build for Windows with obfuscation
npm run build:obfuscated:windows

# Build for all platforms with obfuscation
npm run build:obfuscated:all
```

### Method 2: Using the build-and-release.sh Script

The `build-and-release.sh` script now accepts an optional third parameter to enable obfuscation:

```bash
# Build for all platforms with obfuscation
./build-and-release.sh all false true

# Build for Mac with obfuscation and set as latest
./build-and-release.sh mac true true

# Build for Windows with obfuscation
./build-and-release.sh windows false true
```

The parameters are:
1. Platform: `all`, `mac`, `mac-arm64`, `mac-x64`, or `windows`
2. Make Latest: `true` or `false`
3. Obfuscate: `true` or `false`

## Customizing Obfuscation

You can customize the obfuscation settings by modifying the `obfuscationOptions` object in the `obfuscate.js` file. The available options are documented in the [javascript-obfuscator documentation](https://github.com/javascript-obfuscator/javascript-obfuscator).

Some key options you might want to adjust:

- `controlFlowFlattening`: Makes code harder to follow but may impact performance
- `deadCodeInjection`: Adds meaningless code to confuse readers
- `debugProtection`: Prevents debugging
- `stringArrayEncoding`: Controls how strings are encoded

## Excluding Files from Obfuscation

If you need to exclude specific files from obfuscation (e.g., third-party libraries or files that don't work when obfuscated), add them to the `excludeFiles` array in `obfuscate.js`:

```javascript
const excludeFiles = [
    'js/third-party-library.js',
    'js/config/sensitive-config.js'
];
```

## Troubleshooting

If you encounter issues with obfuscated builds:

1. **Performance Issues**: Reduce the obfuscation level by setting `controlFlowFlattening` to `false` or reducing its threshold
2. **Runtime Errors**: Try disabling `selfDefending` or `debugProtection`
3. **Specific File Issues**: Add problematic files to the `excludeFiles` array

## Security Considerations

While obfuscation makes your code harder to understand, it is not a complete security solution:

- Determined attackers can still reverse-engineer obfuscated code with enough time and resources
- Obfuscation does not encrypt sensitive data like API keys (use environment variables for those)
- The application's functionality remains the same, so its behavior can still be analyzed

For maximum security, combine obfuscation with other security practices like proper authentication, authorization, and data encryption.
