// using native fetch

const API_URL = 'http://localhost:5000/api';

async function run() {
    try {
        console.log('--- Starting Verification ---');

        // 1. Seed
        console.log('Seeding database...');
        await fetch(`${API_URL}/seed`, { method: 'POST' });

        // 2. Login as John (IT)
        console.log('Logging in as John...');
        let res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'john', password: 'password' })
        });
        let data = await res.json();
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
        res = await fetch(`${API_URL}/claims?userId=${john.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(claimPayload)
        });
        data = await res.json();
        const claimId = data.id; // Corrected: variable name was wrong in previous thought
        if (!data.title) throw new Error('Claim submission failed');
        console.log(`Claim submitted. ID: ${data.id}, ApproverID: ${data.approverId}`);

        // 4. Login as Admin
        console.log('Logging in as Admin...');
        res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'password' })
        });
        data = await res.json();
        const admin = data.user;
        console.log(`Admin logged in. ID: ${admin.id}, IsApprover: ${data.isApprover || 'undefined'}`);

        // 5. Get Claims for Admin (as Approver)
        console.log('Fetching tasks for Admin...');
        // Standard user getClaims returns OR condition (mine + assigned)
        res = await fetch(`${API_URL}/claims?userId=${admin.id}`);
        const claims = await res.json();

        // Filter for approval tasks
        const tasks = claims.filter(c => c.approverId === admin.id && c.status === 'Pending');
        console.log(`Found ${tasks.length} pending tasks for Admin.`);

        const targetClaim = tasks.find(c => c.id === claimId); // Check based on ID we got
        // But wait, the POST returns the object, it has ID.
        // Actually the POST response from server/index.js: `res.json(claim)`
        // So `data.id` is correct.

        // My previous logic: `data` from POST was the claim object.
        // I need to find the claim created in step 3. 
        // The ID is data.id.
        // Let's ensure we find it.
        const found = claims.find(c => c.id === data.id);

        if (!found) throw new Error('Claim not found in Admin tasks');
        if (found.approverId !== admin.id) throw new Error(`Claim approver mismatch. Expected ${admin.id}, Got ${found.approverId}`);
        console.log('Claim found in Admin tasks correctly.');

        // 6. Approve Claim
        console.log('Approving claim...');
        res = await fetch(`${API_URL}/claims/${found.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Approved' })
        });
        data = await res.json();
        if (data.status !== 'Approved') throw new Error('Approval failed');
        console.log('Claim approved successfully.');

        console.log('--- Verification PASSED ---');

    } catch (err) {
        console.error('--- Verification FAILED ---');
        console.error(err);
        process.exit(1);
    }
}

run();
