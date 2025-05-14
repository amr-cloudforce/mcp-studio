#!/usr/bin/env node

/**
 * Code Obfuscation Script for MCP Studio
 * 
 * This script obfuscates JavaScript files in the project to protect the source code
 * in the distributed application.
 */

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Configuration for the obfuscator
const obfuscationOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.7,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: true,
    debugProtectionInterval: true,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
};

// Directories to obfuscate
const dirsToObfuscate = [
    'js',
    'js/config',
    'js/features',
    'js/features/quick-add',
    'js/ui',
    'js/ui/server-form',
    'js/ui/server-form/template-handlers',
    'js/utils'
];

// Files to exclude from obfuscation (if any)
const excludeFiles = [
    // Add any files you want to exclude here
];

// Output directory for obfuscated files
const outputDir = 'dist-obfuscated';

// Create output directory structure
console.log('Creating output directory structure...');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

dirsToObfuscate.forEach(dir => {
    const outputPath = path.join(outputDir, dir);
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }
});

// Copy non-JS files and obfuscate JS files
console.log('Copying non-JS files and obfuscating JS files...');

// First, copy the main files from the root directory
const rootFiles = [
    'index.html',
    'main.js',
    'preload.js',
    'package.json',
    'package-lock.json'
];

rootFiles.forEach(file => {
    const sourcePath = path.join(__dirname, file);
    const destPath = path.join(outputDir, file);
    
    if (file.endsWith('.js') && !excludeFiles.includes(file)) {
        // Obfuscate JS files
        const code = fs.readFileSync(sourcePath, 'utf8');
        const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, obfuscationOptions).getObfuscatedCode();
        fs.writeFileSync(destPath, obfuscatedCode);
        console.log(`Obfuscated: ${file}`);
    } else {
        // Copy non-JS files as-is
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied: ${file}`);
    }
});

// Process directories
function processDirectory(dir) {
    const fullDir = path.join(__dirname, dir);
    const files = fs.readdirSync(fullDir);
    
    files.forEach(file => {
        const sourcePath = path.join(fullDir, file);
        const destPath = path.join(outputDir, dir, file);
        
        if (fs.statSync(sourcePath).isDirectory()) {
            // Create subdirectory if it doesn't exist
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
            }
            // Process subdirectory
            processDirectory(path.join(dir, file));
        } else if (file.endsWith('.js') && !excludeFiles.includes(path.join(dir, file))) {
            // Obfuscate JS files
            const code = fs.readFileSync(sourcePath, 'utf8');
            const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, obfuscationOptions).getObfuscatedCode();
            fs.writeFileSync(destPath, obfuscatedCode);
            console.log(`Obfuscated: ${path.join(dir, file)}`);
        } else {
            // Copy non-JS files as-is
            fs.copyFileSync(sourcePath, destPath);
            console.log(`Copied: ${path.join(dir, file)}`);
        }
    });
}

// Process all directories
dirsToObfuscate.forEach(dir => {
    processDirectory(dir);
});

// Copy assets and CSS directories
['assets', 'css'].forEach(dir => {
    const sourceDir = path.join(__dirname, dir);
    const destDir = path.join(outputDir, dir);
    
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    
    const files = fs.readdirSync(sourceDir);
    files.forEach(file => {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(destDir, file);
        
        if (fs.statSync(sourcePath).isDirectory()) {
            // Create subdirectory if it doesn't exist
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
            }
            // Process subdirectory recursively
            const subfiles = fs.readdirSync(sourcePath);
            subfiles.forEach(subfile => {
                const subSourcePath = path.join(sourcePath, subfile);
                const subDestPath = path.join(destPath, subfile);
                fs.copyFileSync(subSourcePath, subDestPath);
                console.log(`Copied: ${path.join(dir, file, subfile)}`);
            });
        } else {
            // Copy file
            fs.copyFileSync(sourcePath, destPath);
            console.log(`Copied: ${path.join(dir, file)}`);
        }
    });
});

// Copy icon files
['icon.icns', 'icon.ico', 'icon.png'].forEach(file => {
    const sourcePath = path.join(__dirname, file);
    const destPath = path.join(outputDir, file);
    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied: ${file}`);
    }
});

console.log('\nObfuscation complete! The obfuscated files are in the', outputDir, 'directory.');
console.log('To build the app with obfuscated code, run:');
console.log('  cd', outputDir, '&& npm run dist');
