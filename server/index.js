const path = require('path');
const fs = require('fs');

// Ensure module resolution works across OneDrive sync paths and local caches
const possibleNodeModules = [
  'C:\\Users\\usesa\\.gemini\\antigravity\\brain\\53471831-a9d4-4787-8868-9b7cbfa38d10\\scratch\\backend_deps\\node_modules',
  path.join(__dirname, 'node_modules'),
  path.join(__dirname, '..', 'node_modules'),
  'C:\\Users\\usesa\\OneDrive - MSFT\\Desktop\\Travel-Local Expense claim\\server\\node_modules',
  'C:\\Users\\usesa\\OneDrive - MSFT\\Desktop\\Travel-Local Expense claim\\node_modules'
];
process.env.NODE_PATH = possibleNodeModules.filter(p => fs.existsSync(p)).join(path.delimiter);
require('module').Module._initPaths();

const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize, User, Claim, ApprovalMatrix, Department, ExpenseCategory, ClaimAuditLog, seedDatabase, getDashboardStats } = require('./db');
const emailService = require('./emailService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Explicit CORS Headers & Preflight Handler for Cross-Origin Deployments
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Root Route
app.get('/', (req, res) => {
  res.send('Travel & Local Expense API is running. Access endpoints at /api');
});


// Initialize DB
(async () => {
  try {
    await sequelize.sync();

    // Check if users exist, if not, seed with Admin
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('No users found. Creating Admin...');
      await seedDatabase();
    }

    // Seed default departments if table is empty
    const deptCount = await Department.count();
    if (deptCount === 0) {
      console.log('Initializing standard department master...');
      await Department.bulkCreate([
        { name: 'IT', description: 'Information Technology & Systems' },
        { name: 'Finance', description: 'Finance & Accounting' },
        { name: 'HR', description: 'Human Resources' },
        { name: 'Sales', description: 'Sales & Business Development' },
        { name: 'Marketing', description: 'Marketing & Public Relations' },
        { name: 'Operations', description: 'General Operations & Administration' }
      ]);
    }

    // Seed default expense categories if table is empty
    const catCount = await ExpenseCategory.count();
    if (catCount === 0) {
      console.log('Initializing standard expense categories master...');
      await ExpenseCategory.bulkCreate([
        { name: 'Food & Meals', icon: 'Utensils', maxLimit: 50, description: 'Daily meals, team lunch and breakfast' },
        { name: 'Travel (Local)', icon: 'Car', maxLimit: 100, description: 'Taxi, Cab, Metro, Bus, Auto travel' },
        { name: 'Hotel & Accommodation', icon: 'Building', maxLimit: 250, description: 'Hotel stays for official trips' },
        { name: 'Office Supplies', icon: 'Package', maxLimit: 150, description: 'Stationery, printing, postage' },
        { name: 'Client Entertainment', icon: 'Coffee', maxLimit: 200, description: 'Client meetings, dinners and hospitality' },
        { name: 'Fuel & Mileage', icon: 'Fuel', maxLimit: 75, description: 'Fuel reimbursement for personal vehicle' },
        { name: 'Software & Tools', icon: 'Laptop', maxLimit: 300, description: 'Subscriptions, software & digital tools' }
      ]);
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
    let username = email.split('@')[0];
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      username = `${username}_${Math.floor(1000 + Math.random() * 9000)}`;
    }
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
      whereClause = {};
    } else if (userId) {
      // Check if any manager delegated their approval to this user
      const todayStr = new Date().toISOString().split('T')[0];
      const delegatingUsers = await User.findAll({
        where: { delegatedApproverId: userId }
      });
      const validDelegatorIds = delegatingUsers
        .filter(u => !u.delegatedUntil || u.delegatedUntil >= todayStr)
        .map(u => u.id);

      const allApproverIds = [parseInt(userId, 10), ...validDelegatorIds];

      whereClause = {
        [require('sequelize').Op.or]: [
          { UserId: userId },
          { approverId: allApproverIds }
        ]
      };
    }

    const claims = await Claim.findAll({
      where: whereClause,
      include: [
        { model: User },
        { model: ClaimAuditLog, as: 'AuditLogs' }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Dashboard Stats ---
app.get('/api/dashboard/summary', async (req, res) => {
  const { userId, role } = req.query;
  try {
    const stats = await getDashboardStats(userId, role);
    res.json(stats);
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- Forgot Password ---
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user) {
      console.log(`Password reset requested for non-existent user: ${username}`);
      return res.json({ success: true, message: 'If this account exists, a new password has been sent to your registered email.' });
    }

    const newPassword = Math.random().toString(36).slice(-8);
    user.password = newPassword;
    await user.save();

    await emailService.sendPasswordResetEmail(user, newPassword).catch(console.error);
    res.json({ success: true, message: 'If this account exists, a new password has been sent to your registered email.' });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- Claim Creation with Audit Log & Duplicate Check ---
app.post('/api/claims', async (req, res) => {
  try {
    const { userId, department, ...claimData } = req.body;

    // Check potential duplicate
    const duplicate = await Claim.findOne({
      where: {
        UserId: userId,
        amount: claimData.amount,
        date: claimData.date,
        title: claimData.title
      }
    });

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
      status
    });

    // Create Initial Audit Log
    const requester = await User.findByPk(userId);
    await ClaimAuditLog.create({
      claimId: claim.id,
      action: status === 'Approved' ? 'Auto-Approved (No Matrix Configured)' : 'Claim Submitted',
      performedByName: requester ? requester.name : 'Employee',
      performedByRole: requester ? requester.role : 'user',
      comments: claimData.description || (duplicate ? '⚠️ Note: Potential duplicate submission detected' : 'Submitted for department approval')
    });

    // --- Email Notifications ---
    if (status === 'Approved') {
      if (requester && requester.email) {
        await emailService.sendAutoApprovalEmail(requester, claim).catch(err => console.error("Email fail:", err));
      }
    } else {
      if (requester && requester.email) {
        await emailService.sendClaimSubmissionEmail(requester, claim).catch(err => console.error("Email fail:", err));
      }
      if (approverId) {
        const approver = await User.findByPk(approverId);
        if (approver && approver.email) {
          await emailService.sendApprovalRequestEmail(approver, claim, requester ? requester.name : "Employee")
            .catch(err => console.error("Email fail:", err));
        }
      }
    }

    res.json({ success: true, claim, duplicateWarning: !!duplicate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Claim with Audit Logs & Flow
app.get('/api/claims/:id', async (req, res) => {
  try {
    const claim = await Claim.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'department', 'role'] },
        { model: ClaimAuditLog, as: 'AuditLogs' }
      ]
    });
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

// Status Update with Multi-Level Progression and Audit Logging
app.put('/api/claims/:id/status', async (req, res) => {
  const { status, comments, performedByName, performedByRole } = req.body;
  try {
    const claim = await Claim.findByPk(req.params.id);
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });

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
          // Log Level Step Approval
          await ClaimAuditLog.create({
            claimId: claim.id,
            action: `Level ${currentApprover.level} Approved`,
            performedByName: performedByName || 'Approver',
            performedByRole: performedByRole || 'Manager',
            comments: comments || `Approved at Level ${currentApprover.level}. Escalated to Level ${nextLevel}.`
          });

          // Move to next level
          claim.approverId = nextApprover.approverId;
          await claim.save();

          // Notify New Approver
          const newApprover = await User.findByPk(nextApprover.approverId);
          const requester = await User.findByPk(claim.UserId);
          if (newApprover && newApprover.email) {
            await emailService.sendApprovalRequestEmail(newApprover, claim, requester ? requester.name : "Employee")
              .catch(e => console.error("Email fail:", e));
          }

          return res.json({ success: true, message: `Moved to Level ${nextLevel} approval`, claim });
        }
      }
    }

    // Final Approval or Rejection
    claim.status = status;
    await claim.save();

    // Log Final Decision
    await ClaimAuditLog.create({
      claimId: claim.id,
      action: status === 'Approved' ? 'Final Claim Approved' : 'Claim Rejected',
      performedByName: performedByName || 'Approver',
      performedByRole: performedByRole || 'Manager',
      comments: comments || (status === 'Approved' ? 'All approval levels completed. Ready for payout.' : 'Claim has been rejected.')
    });

    // Notify Requester
    const requester = await User.findByPk(claim.UserId);
    if (requester && requester.email) {
      await emailService.sendClaimStatusUpdateEmail(requester, claim, status)
        .catch(e => console.error("Email fail:", e));
    }

    res.json({ success: true, claim });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request Clarification (Approver queries employee)
app.post('/api/claims/:id/clarify', async (req, res) => {
  try {
    const { query, performedByName, performedByRole } = req.body;
    if (!query) return res.status(400).json({ message: "Query message is required" });

    const claim = await Claim.findByPk(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    claim.status = 'Clarification';
    claim.clarificationQuery = query;
    await claim.save();

    await ClaimAuditLog.create({
      claimId: claim.id,
      action: 'Clarification Requested',
      performedByName: performedByName || 'Approver',
      performedByRole: performedByRole || 'Manager',
      comments: query
    });

    res.json({ success: true, message: "Clarification requested", claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Respond to Clarification (Employee replies)
app.post('/api/claims/:id/respond-clarification', async (req, res) => {
  try {
    const { response, performedByName } = req.body;
    if (!response) return res.status(400).json({ message: "Response message is required" });

    const claim = await Claim.findByPk(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    claim.status = 'Pending';
    claim.clarificationResponse = response;
    await claim.save();

    await ClaimAuditLog.create({
      claimId: claim.id,
      action: 'Clarification Provided',
      performedByName: performedByName || 'Employee',
      performedByRole: 'user',
      comments: response
    });

    res.json({ success: true, message: "Response submitted. Claim returned to pending approval.", claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Finance Disbursement & Payout Tracking
app.post('/api/claims/:id/disburse', async (req, res) => {
  try {
    const { utrNumber, paymentDate, paymentMethod, performedByName, comments } = req.body;
    if (!utrNumber) return res.status(400).json({ message: "UTR / Transaction Reference Number is required" });

    const claim = await Claim.findByPk(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    claim.status = 'Disbursed';
    claim.utrNumber = utrNumber;
    claim.paymentDate = paymentDate || new Date().toISOString().split('T')[0];
    claim.paymentMethod = paymentMethod || 'Bank Transfer';
    await claim.save();

    await ClaimAuditLog.create({
      claimId: claim.id,
      action: 'Payment Disbursed / Paid',
      performedByName: performedByName || 'Finance Officer',
      performedByRole: 'Finance',
      comments: comments || `Payment disbursed via ${claim.paymentMethod}. Transaction Ref/UTR: ${utrNumber}`,
      utrNumber: utrNumber,
      paymentMethod: claim.paymentMethod,
      paymentDate: claim.paymentDate
    });

    res.json({ success: true, message: "Claim marked as Disbursed / Paid", claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Claim Details
app.put('/api/claims/:id', async (req, res) => {
  try {
    const { title, description, amount, date, type, category, startDate, endDate, receiptUrl, advanceAmount } = req.body;
    const claim = await Claim.findByPk(req.params.id);

    if (!claim) return res.status(404).json({ message: "Claim not found" });

    if (title) claim.title = title;
    if (description) claim.description = description;
    if (amount) claim.amount = amount;
    if (date) claim.date = date;
    if (type) claim.type = type;
    if (category) claim.category = category;
    if (startDate) claim.startDate = startDate;
    if (endDate) claim.endDate = endDate;
    if (receiptUrl) claim.receiptUrl = receiptUrl;
    if (advanceAmount !== undefined) {
      claim.advanceAmount = advanceAmount;
      claim.settlementBalance = (parseFloat(amount || claim.amount || 0) - parseFloat(advanceAmount || 0));
    }

    await claim.save();
    res.json({ success: true, claim });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// Out-of-Office Approver Delegation
app.put('/api/users/:id/delegate', async (req, res) => {
  try {
    const { delegatedApproverId, delegatedUntil } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.delegatedApproverId = delegatedApproverId || null;
    user.delegatedUntil = delegatedUntil || null;
    await user.save();

    res.json({ success: true, message: "Approval delegation updated", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Expense Category Master Routes ---
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await ExpenseCategory.findAll({ order: [['name', 'ASC']] });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, icon, maxLimit, description, isReceiptRequired } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Category name is required" });

    const existing = await ExpenseCategory.findOne({ where: { name: name.trim() } });
    if (existing) return res.status(400).json({ message: "Category already exists" });

    const category = await ExpenseCategory.create({
      name: name.trim(),
      icon: icon || 'Tag',
      maxLimit: maxLimit !== undefined ? parseFloat(maxLimit) : 500,
      description: description?.trim() || '',
      isReceiptRequired: isReceiptRequired !== undefined ? isReceiptRequired : true
    });
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, icon, maxLimit, description, isReceiptRequired } = req.body;
    const category = await ExpenseCategory.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    if (name && name.trim()) category.name = name.trim();
    if (icon) category.icon = icon;
    if (maxLimit !== undefined) category.maxLimit = parseFloat(maxLimit);
    if (description !== undefined) category.description = description.trim();
    if (isReceiptRequired !== undefined) category.isReceiptRequired = isReceiptRequired;

    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const category = await ExpenseCategory.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    await category.destroy();
    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Department Master Routes ---
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await Department.findAll({ order: [['name', 'ASC']] });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Department name is required" });
    const existing = await Department.findOne({ where: { name: name.trim() } });
    if (existing) return res.status(400).json({ message: "Department already exists" });

    const department = await Department.create({ name: name.trim(), description: description?.trim() || '' });
    res.json({ success: true, department });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/departments/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ message: "Department not found" });

    if (name && name.trim()) department.name = name.trim();
    if (description !== undefined) department.description = description.trim();
    await department.save();
    res.json({ success: true, department });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/departments/:id', async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ message: "Department not found" });

    await department.destroy();
    res.json({ success: true, message: "Department deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Approval Matrix Routes (Supports Dynamic / Multi-level 1 to N) ---
app.get('/api/matrix', async (req, res) => {
  try {
    const matrix = await ApprovalMatrix.findAll({
      include: [{ model: User, as: 'Approver', attributes: ['id', 'name', 'role', 'department', 'email'] }],
      order: [['department', 'ASC'], ['level', 'ASC']]
    });
    res.json(matrix);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/matrix', async (req, res) => {
  try {
    const { department, approverId, level } = req.body;
    const lvl = parseInt(level, 10) || 1;

    // Find if entry exists for this dept & level
    const existing = await ApprovalMatrix.findOne({ where: { department, level: lvl } });

    if (existing) {
      existing.approverId = approverId;
      await existing.save();
      const updated = await ApprovalMatrix.findByPk(existing.id, {
        include: [{ model: User, as: 'Approver', attributes: ['id', 'name', 'role', 'department', 'email'] }]
      });
      return res.json({ success: true, entry: updated });
    }

    const entry = await ApprovalMatrix.create({ department, approverId, level: lvl });
    const created = await ApprovalMatrix.findByPk(entry.id, {
      include: [{ model: User, as: 'Approver', attributes: ['id', 'name', 'role', 'department', 'email'] }]
    });
    res.json({ success: true, entry: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/matrix/:id', async (req, res) => {
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
  res.json({ success: true, message: "Database seeded" });
});

// --- Serve Frontend ---
const clientDistCandidates = [
  path.join(__dirname, '../client/dist'),
  'C:\\Users\\usesa\\.gemini\\antigravity\\brain\\53471831-a9d4-4787-8868-9b7cbfa38d10\\scratch\\client_deps\\dist'
];
const distPath = clientDistCandidates.find(p => fs.existsSync(p)) || clientDistCandidates[0];

app.use(express.static(distPath));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 Expense Claim System is LIVE and RUNNING!`);
    console.log(`🔗 Web Application: http://localhost:${PORT}`);
    console.log(`🔗 Backend API:     http://localhost:${PORT}/api`);
    console.log(`=================================================\n`);
  });
}

module.exports = app;

