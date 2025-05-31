const WebSocket = require('ws');
const http = require('http');

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

async function captureLogs() {
    try {
        console.log('Fetching available targets...');
        const targets = await getTargets();
        
        console.log('Available targets:');
        targets.forEach((target, index) => {
            console.log(`${index}: ${target.title} - ${target.type} - ${target.url}`);
        });
        
        // Find the main target (usually the first one or the one with the app URL)
        const mainTarget = targets.find(t => t.type === 'page') || targets[0];
        
        if (!mainTarget) {
            console.log('No suitable target found');
            return;
        }
        
        console.log(`\nConnecting to target: ${mainTarget.title}`);
        console.log(`WebSocket URL: ${mainTarget.webSocketDebuggerUrl}`);
        
        const ws = new WebSocket(mainTarget.webSocketDebuggerUrl);
        
        ws.on('open', () => {
            console.log('Connected to DevTools Protocol');
            
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
            try {
                const message = JSON.parse(data);
                
                if (message.method === 'Runtime.consoleAPICalled') {
                    const { type, args, timestamp } = message.params;
                    const time = new Date(timestamp).toISOString();
                    const values = args.map(arg => arg.value || arg.description || '[object]').join(' ');
                    console.log(`[${time}] ${type.toUpperCase()}: ${values}`);
                } else if (message.method === 'Runtime.exceptionThrown') {
                    const { exceptionDetails } = message.params;
                    console.log(`[ERROR] ${exceptionDetails.text} at ${exceptionDetails.url}:${exceptionDetails.lineNumber}`);
                } else if (message.id && message.result) {
                    console.log(`Response ${message.id}:`, message.result);
                }
            } catch (e) {
                console.log('Failed to parse message:', data.toString());
            }
        });
        
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
        
        ws.on('close', () => {
            console.log('Connection closed');
        });
        
        // Keep the script running for 10 seconds to capture logs
        setTimeout(() => {
            console.log('\nCapture complete. Closing connection...');
            ws.close();
            process.exit(0);
        }, 10000);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

captureLogs();
