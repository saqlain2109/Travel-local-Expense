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
                // If 403 or 401, we might want to return it to check failure
                if (res.statusCode >= 200 && res.statusCode < 500) {
                    try {
                        resolve({ status: res.statusCode, body: JSON.parse(body) });
                    } catch (e) {
                        resolve({ status: res.statusCode, body: body });
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

function ensureSuccess(res, msg) {
    if (res.status >= 200 && res.status < 300 && (res.body.success || res.body.id || res.body.user)) {
        console.log(`[PASS] ${msg}`);
        return res.body;
    }
    console.error(`[FAIL] ${msg} - Status: ${res.status}`, JSON.stringify(res.body));
    throw new Error(msg);
}

async function run() {
    try {
        console.log('--- Starting Multi-Level Verification ---');

        // 1. Seed to ensure admin exists
        await request('POST', '/seed');

        // 2. Login as Admin
        let res = await request('POST', '/login', { username: 'admin', password: 'password' });
        const admin = ensureSuccess(res, 'Admin Login').user;

        // 3. Create Users
        console.log('Creating users...');
        const userA = ensureSuccess(await request('POST', '/users', { name: 'Approver 1', username: 'app1', email: 'app1@test.com', password: 'password', role: 'user', department: 'MultiLevel', isActive: true }), 'Create User A').user;
        const userB = ensureSuccess(await request('POST', '/users', { name: 'Approver 2', username: 'app2', email: 'app2@test.com', password: 'password', role: 'user', department: 'MultiLevel', isActive: true }), 'Create User B').user;
        const userDisabled = ensureSuccess(await request('POST', '/users', { name: 'Disabled User', username: 'disabled', email: 'dis@test.com', password: 'password', role: 'user', department: 'IT', isActive: false }), 'Create Disabled User').user;
        const employee = ensureSuccess(await request('POST', '/users', { name: 'Employee', username: 'emp', email: 'emp@test.com', password: 'password', role: 'user', department: 'MultiLevel', isActive: true }), 'Create Employee').user;

        // 4. Setup Matrix
        console.log('Setting up Matrix...');
        ensureSuccess(await request('POST', '/matrix', { department: 'MultiLevel', approverId: userA.id, level: 1 }), 'Set Matrix Level 1');
        ensureSuccess(await request('POST', '/matrix', { department: 'MultiLevel', approverId: userB.id, level: 2 }), 'Set Matrix Level 2');

        // 5. Submit Claim
        console.log('Submitting Claim...');
        res = await request('POST', `/claims?userId=${employee.id}`, {
            title: 'MultiLevel Claim', type: 'Expense', amount: 100, date: '2024-01-01', department: 'MultiLevel', userId: employee.id
        });
        const claim = ensureSuccess(res, 'Submit Claim').claim;
        if (claim.approverId !== userA.id) throw new Error(`Claim assigned to wrong approver. Expected ${userA.id}, Got ${claim.approverId}`);
        console.log(`[PASS] Claim correctly assigned to Level 1 (User A)`);

        // 6. User A Approves
        console.log('Level 1 Approval...');
        res = await request('PUT', `/claims/${claim.id}/status`, { status: 'Approved' });
        const updatedClaim1 = ensureSuccess(res, 'User A Approve').claim;

        // Should NOT be Approved status, but assigned to User B
        // Wait, the API returns the updated claim. 
        if (updatedClaim1.status === 'Approved') throw new Error('Claim fully approved too early!');
        if (updatedClaim1.approverId !== userB.id) throw new Error(`Claim not moved to Level 2. Approver is ${updatedClaim1.approverId}`);
        console.log(`[PASS] Claim moved to Level 2 (User B)`);

        // 7. User B Approves
        console.log('Level 2 Approval...');
        res = await request('PUT', `/claims/${claim.id}/status`, { status: 'Approved' });
        const updatedClaim2 = ensureSuccess(res, 'User B Approve').claim;

        if (updatedClaim2.status !== 'Approved') throw new Error(`Claim not approved! Status: ${updatedClaim2.status}`);
        console.log(`[PASS] Claim fully approved`);

        // 8. Test Disabled Login
        console.log('Testing Disabled Login...');
        res = await request('POST', '/login', { username: 'disabled', password: 'password' });
        if (res.status === 403) {
            console.log(`[PASS] Disabled user blocked (403 Forbidden)`);
        } else {
            console.error(`[FAIL] Disabled user login status: ${res.status}`);
            throw new Error('Disabled user could log in');
        }

        console.log('--- Verification PASSED ---');

    } catch (err) {
        console.error('--- Verification FAILED ---');
        console.error(err);
        process.exit(1);
    }
}

run();
