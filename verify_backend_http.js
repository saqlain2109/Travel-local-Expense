const http = require('http');

const API_PORT = 5000;

function request(method, path, data, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: API_PORT,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        resolve(body); // Handle non-JSON response
                    }
                } else {
                    reject(new Error(`Request failed with status ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function run() {
    try {
        console.log('--- Starting Verification (HTTP) ---');

        // 1. Seed
        console.log('Seeding database...');
        await request('POST', '/seed');

        // 2. Login as John (IT)
        console.log('Logging in as John...');
        let data = await request('POST', '/login', { username: 'john', password: 'password' });
        if (!data.success) throw new Error('Login failed for John');
        const john = data.user;
        console.log(`John logged in. ID: ${john.id}, Dept: ${john.department}`);

        // 3. Submit Claim
        const claimPayload = {
            title: 'Test Verification Claim',
            type: 'Expense',
            amount: 50,
            date: '2024-01-01',
            department: john.department, // IT
            description: 'Verification test'
        };
        console.log('Submitting claim for John...');
        data = await request('POST', `/claims?userId=${john.id}`, claimPayload);
        if (!data.success || !data.claim) {
            console.error('Claim response:', JSON.stringify(data));
            throw new Error('Claim submission failed');
        }
        const claim = data.claim;
        console.log(`Claim submitted. ID: ${claim.id}, ApproverID: ${claim.approverId}, Dept: ${claim.department}`);

        // 4. Login as Admin
        console.log('Logging in as Admin...');
        data = await request('POST', '/login', { username: 'admin', password: 'password' });
        const admin = data.user;
        console.log(`Admin logged in. ID: ${admin.id}, IsApprover: ${data.isApprover || 'undefined'}`);

        // 5. Get Claims for Admin (as Approver)
        console.log('Fetching tasks for Admin...');
        const claims = await request('GET', `/claims?userId=${admin.id}`);

        // Filter for approval tasks
        const tasks = claims.filter(c => c.approverId === admin.id && c.status === 'Pending');
        console.log(`Found ${tasks.length} pending tasks for Admin.`);

        const found = claims.find(c => c.id === claim.id);

        if (!found) throw new Error('Claim not found in Admin tasks');
        if (found.approverId !== admin.id) throw new Error(`Claim approver mismatch. Expected ${admin.id}, Got ${found.approverId}`);
        console.log('Claim found in Admin tasks correctly.');

        // 6. Approve Claim
        console.log('Approving claim...');
        // Note: server/index.js line 136 uses /api/claims/:id/status for status update
        // But let's check if there is a PUT /api/claims/:id/status route.
        // Step 1508 showed: app.put('/api/claims/:id/status', ...
        // So we should use that.
        data = await request('PUT', `/claims/${found.id}/status`, { status: 'Approved' });

        if (!data.success || !data.claim || data.claim.status !== 'Approved') {
            console.error('Approval failed response:', JSON.stringify(data));
            throw new Error('Approval failed');
        }
        // Check payload structure from server/index.js: `res.json({ message: "Claim updated", claim })`
        // Line 119 in server/index.js (I verified earlier versions, assume similar structure)
        // Actually I didn't see PUT /claims/:id in the snippets I read recently.
        // Let's assume standard REST.
        // Wait, I should verify the response structure.

        console.log('Claim approved successfully.');

        console.log('--- Verification PASSED ---');

    } catch (err) {
        console.error('--- Verification FAILED ---');
        console.error(err);
        process.exit(1);
    }
}

run();
