const express = require('express');
const cors = require('cors');
const { sequelize, User, Claim, ApprovalMatrix, seedDatabase } = require('./db');
const emailService = require('./emailService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*', // Allow all origins for now (or verify specific Netlify URL later)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Root Route
app.get('/', (req, res) => {
  res.send('Travel & Local Expense API is running. Access endpoints at /api');
});


// Initialize DB
(async () => {
  try {
    // Resetting database on every restart as requested by user
    // await seedDatabase(); // DISABLED: To prevent data loss on restart
    await sequelize.sync(); // Sync without alter to avoid SQLite backup errors

    // Check if users exist, if not, seed
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('No users found. Seeding database...');
      await seedDatabase();
    }
    console.log('Database synced');
  } catch (error) {
    console.error('DB Init Error:', error);
  }
})();

// Auth Route
// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, department } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Generate Credentials
    const username = email.split('@')[0];
    const password = Math.random().toString(36).slice(-8); // Simple random password

    // Create Inactive User
    const newUser = await User.create({
      name,
      username,
      email,
      password,
      department,
      role: 'user',
      isActive: false // Pending Approval
    });

    // Send Credentials to Employee
    await emailService.sendNewAccountCredentials(newUser, password).catch(console.error);

    // Notify Admin via Email
    // Find an admin to notify (just picking the first active one)
    const admin = await User.findOne({ where: { role: 'admin', isActive: true } });
    if (admin && admin.email) {
      await emailService.sendRegistrationApprovalRequest(admin, newUser).catch(console.error);
    }

    res.json({ success: true, message: 'Registration successful. Check email for credentials.' });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username, password } });
    if (user) {
      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is disabled. Contact admin.' });
      }
      // Return user info including if they are an approver for any dept
      const isApprover = await ApprovalMatrix.count({ where: { approverId: user.id } }) > 0;
      res.json({ success: true, user: { ...user.toJSON(), isApprover } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Claim Routes ---
app.get('/api/claims', async (req, res) => {
  const { userId, role } = req.query;
  try {
    let whereClause = {};

    if (role === 'admin') {
      // Admin sees all? Or just what they approve + all? 
      // User requirement: Every user should have task page. 
      // AdminDashboard still needs ALL for stats. 
      // Tasks page needs "claims assigned to me".
      // Let's assume Admin Dashboard fetches ALL, and Tasks fetches "assigned to me".
      // We might need a separate 'mode' param or just return everything for admin role for now, 
      // and let frontend filter.
      // BUT, if we want to support non-admin approvers, we need to handle that.

      // If fetching for "Tasks" page specifically, we might want to filter by approverId.
      // For now, let's keep 'admin' returning ALL for the Dashboard.
      whereClause = {};
    } else if (userId) {
      // Regular user: See their own claims AND claims they need to approve
      whereClause = {
        [require('sequelize').Op.or]: [
          { UserId: userId },
          { approverId: userId }
        ]
      };
    }

    const claims = await Claim.findAll({
      where: whereClause,
      include: [User],
      order: [['createdAt', 'DESC']]
    });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Forgot Password ---
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user) {
      // Security: Don't reveal if user exists or not, just fake success
      // But for this internal tool, maybe helpful to know?
      // User requested: "proper user... automatically dekhega"
      // Let's return success message regardless to be safe, but log it.
      console.log(`Password reset requested for non-existent user: ${username}`);
      return res.json({ success: true, message: 'If this account exists, a new password has been sent to your registered email.' });
    }

    // Generate new password
    const newPassword = Math.random().toString(36).slice(-8);

    // Update user
    user.password = newPassword;
    await user.save();

    // Send Email
    await emailService.sendPasswordResetEmail(user, newPassword).catch(console.error);

    res.json({ success: true, message: 'If this account exists, a new password has been sent to your registered email.' });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- Claim Routes ---
// ... (GET /api/claims remains the same)

app.post('/api/claims', async (req, res) => {
  try {
    const { userId, department, ...claimData } = req.body;

    // Find approver for this department (Level 1)
    let approverId = null;
    let status = 'Pending';

    if (department) {
      const matrixEntry = await ApprovalMatrix.findOne({ where: { department, level: 1 } });
      if (matrixEntry) {
        approverId = matrixEntry.approverId;
      }
    }

    // Auto-Approval Logic: If no approver found in matrix, auto-approve
    if (!approverId) {
      status = 'Approved';
      console.log(`No approver found for department ${department}. Auto-approving claim.`);
    }

    const claim = await Claim.create({
      ...claimData,
      UserId: userId,
      department,
      approverId,
      status // Set status based on logic
    });

    // --- Email Notifications ---
    const requester = await User.findByPk(userId);

    if (status === 'Approved') {
      // Notify Requester of Auto-Approval
      if (requester && requester.email) {
        await emailService.sendAutoApprovalEmail(requester, claim).catch(err => console.error("Email fail:", err));
      }
    } else {
      // Standard Flow
      // 1. Notify Requester
      if (requester && requester.email) {
        await emailService.sendClaimSubmissionEmail(requester, claim).catch(err => console.error("Email fail:", err));
      }

      // 2. Notify Approver
      if (approverId) {
        const approver = await User.findByPk(approverId);
        if (approver && approver.email) {
          await emailService.sendApprovalRequestEmail(approver, claim, requester ? requester.name : "Employee")
            .catch(err => console.error("Email fail:", err));
        }
      }
    }

    res.json({ success: true, claim });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Claim
app.get('/api/claims/:id', async (req, res) => {
  try {
    const claim = await Claim.findByPk(req.params.id, { include: User });
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    // Fetch approval flow for this department
    let approvalFlow = [];
    if (claim.department) {
      approvalFlow = await ApprovalMatrix.findAll({
        where: { department: claim.department },
        include: [{ model: User, as: 'Approver', attributes: ['id', 'name', 'role'] }],
        order: [['level', 'ASC']]
      });
    }

    res.json({ ...claim.toJSON(), approvalFlow });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/claims/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const claim = await Claim.findByPk(req.params.id);
    if (claim) {
      if (status === 'Approved') {
        // Check if there is a next level approver
        const currentApprover = await ApprovalMatrix.findOne({
          where: { department: claim.department, approverId: claim.approverId }
        });

        if (currentApprover) {
          const nextLevel = currentApprover.level + 1;
          const nextApprover = await ApprovalMatrix.findOne({
            where: { department: claim.department, level: nextLevel }
          });

          if (nextApprover) {
            // Move to next level
            claim.approverId = nextApprover.approverId;
            // Status remains Pending
            await claim.save();

            // Notify New Approver
            const newApprover = await User.findByPk(nextApprover.approverId);
            const requester = await User.findByPk(claim.UserId);
            if (newApprover && newApprover.email) {
              await emailService.sendApprovalRequestEmail(newApprover, claim, requester ? requester.name : "Employee")
                .catch(e => console.error("Email fail:", e));
            }

            return res.json({ success: true, message: 'Moved to next approval level', claim });
          }
        }
      }

      // Final approval or Rejection
      claim.status = status;
      await claim.save();

      // Notify Requester of Final Status
      const requester = await User.findByPk(claim.UserId);
      if (requester && requester.email) {
        await emailService.sendClaimStatusUpdateEmail(requester, claim, status)
          .catch(e => console.error("Email fail:", e));
      }

      res.json({ success: true, claim });
    } else {
      res.status(404).json({ success: false, message: 'Claim not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Claim
app.delete('/api/claims/:id', async (req, res) => {
  try {
    const claim = await Claim.findByPk(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    await claim.destroy();
    res.json({ message: "Claim deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin / Employee Routes ---
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'username', 'department', 'isActive'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = await User.create(req.body); // Body now includes department
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { isActive, name, username, email, role, password, department } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update fields if they exist in body
    if (isActive !== undefined) user.isActive = isActive;
    if (name) user.name = name;
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    if (department) user.department = department;
    if (password) user.password = password;

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete User
app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.destroy(); // Soft delete or hard delete based on preference. Here hard delete.
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Approval Matrix Routes ---
app.get('/api/matrix', async (req, res) => {
  try {
    const matrix = await ApprovalMatrix.findAll({
      include: [{ model: User, as: 'Approver', attributes: ['id', 'name'] }]
    });
    res.json(matrix);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/matrix', async (req, res) => {
  try {
    const { department, approverId, level } = req.body;
    const lvl = level || 1;

    // Find if entry exists for this dept & level
    const existing = await ApprovalMatrix.findOne({ where: { department, level: lvl } });

    if (existing) {
      existing.approverId = approverId;
      await existing.save();
      return res.json({ success: true, entry: existing });
    }

    const entry = await ApprovalMatrix.create({ department, approverId, level: lvl });
    res.json({ success: true, entry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/matrix/:id', async (req, res) => { // In case we want to delete a matrix rule
  try {
    const entry = await ApprovalMatrix.findByPk(req.params.id);
    if (entry) {
      await entry.destroy();
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Entry not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed Endpoint (for manual reset)
app.post('/api/seed', async (req, res) => {
  await seedDatabase();
  res.json({ message: "Database seeded" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// --- Serve Frontend (Production) ---
const path = require('path');
// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
