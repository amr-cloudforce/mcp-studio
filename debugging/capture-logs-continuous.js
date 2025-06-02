const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

let logFile = null;
let ws = null;

async function getTargets() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:9222/json', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
    });
}

function writeLog(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    // Write to console
    console.log(logEntry.trim());
    
    // Write to file if specified
    if (logFile) {
        fs.appendFileSync(logFile, logEntry);
    }
}

async function captureLogs(outputFile) {
    logFile = outputFile;
    
    try {
        writeLog('Starting log capture...');
        writeLog('Fetching available targets...');
        
        const targets = await getTargets();
        
        writeLog('Available targets:');
        targets.forEach((target, index) => {
            writeLog(`${index}: ${target.title} - ${target.type} - ${target.url}`);
        });
        
        // Find the main target (usually the first one or the one with the app URL)
        const mainTarget = targets.find(t => t.type === 'page') || targets[0];
        
        if (!mainTarget) {
            writeLog('No suitable target found');
            return;
        }
        
        writeLog(`Connecting to target: ${mainTarget.title}`);
        writeLog(`WebSocket URL: ${mainTarget.webSocketDebuggerUrl}`);
        
        ws = new WebSocket(mainTarget.webSocketDebuggerUrl);
        
        ws.on('open', () => {
            writeLog('Connected to DevTools Protocol');
            
            // Enable Runtime domain to receive console messages
            ws.send(JSON.stringify({
                id: 1,
                method: 'Runtime.enable'
            }));
            
            // Enable Console domain
            ws.send(JSON.stringify({
                id: 2,
                method: 'Console.enable'
            }));
            
            // Get existing console messages
            ws.send(JSON.stringify({
                id: 3,
                method: 'Runtime.evaluate',
                params: {
                    expression: 'console.log("Log capture started at " + new Date().toISOString())'
                }
            }));
        });
        
        ws.on('message', (data) => {
            // Output ALL Chrome DevTools messages immediately as raw data
            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] RAW: ${data.toString()}\n`;
            
            // Write immediately to console and file - force real-time output
            process.stdout.write(logEntry);
            if (logFile) {
                fs.appendFileSync(logFile, logEntry);
            }
        });
        
        ws.on('error', (error) => {
            writeLog(`WebSocket error: ${error}`);
        });
        
        ws.on('close', () => {
            writeLog('Connection closed');
        });
        
    } catch (error) {
        writeLog(`Error: ${error}`);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    writeLog('Received SIGINT, closing connection...');
    if (ws) {
        ws.close();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    writeLog('Received SIGTERM, closing connection...');
    if (ws) {
        ws.close();
    }
    process.exit(0);
});

// Get output file from command line argument
const outputFile = process.argv[2] || 'debug-logs.txt';
captureLogs(outputFile);
