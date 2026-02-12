const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '🚀 Starting Travel & Expense App...');

// Function to spawn a child process
const runProcess = (name, command, args, cwd, color) => {
    const child = spawn(command, args, {
        cwd: cwd,
        shell: true,
        stdio: 'pipe'
    });

    child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) console.log(`${color}[${name}]\x1b[0m ${line.trim()}`);
        });
    });

    child.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) console.error(`\x1b[31m[${name} ERROR]\x1b[0m ${line.trim()}`);
        });
    });

    child.on('close', (code) => {
        console.log(`${color}[${name}]\x1b[0m exited with code ${code}`);
        process.exit(code);
    });

    return child;
};

// Start Server
const server = runProcess('SERVER', 'npm', ['run', 'server'], path.join(__dirname), '\x1b[35m');

// Start Client
const client = runProcess('CLIENT', 'npm', ['run', 'client'], path.join(__dirname), '\x1b[34m');

// Handle cleanup
const cleanup = () => {
    console.log('\n\x1b[33m🛑 Stopping all services...\x1b[0m');
    server.kill();
    client.kill();
    process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
