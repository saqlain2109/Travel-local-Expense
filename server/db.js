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

const { Sequelize, DataTypes } = require('sequelize');

// Using SQLite for easy local setup. On Vercel, use /tmp/database.sqlite
const defaultDbStorage = process.env.VERCEL
    ? path.join('/tmp', 'database.sqlite')
    : path.join(__dirname, 'database.sqlite');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || defaultDbStorage,
    logging: false
});

const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false }, // In real app, hash this!
    role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    department: { type: DataTypes.STRING }, // User's department
    delegatedApproverId: { type: DataTypes.INTEGER }, // Out-of-office delegate
    delegatedUntil: { type: DataTypes.STRING } // Date until delegation is active
});

const Department = sequelize.define('Department', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.STRING }
});

const ExpenseCategory = sequelize.define('ExpenseCategory', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    icon: { type: DataTypes.STRING, defaultValue: 'Tag' },
    maxLimit: { type: DataTypes.FLOAT, defaultValue: 500 }, // Max allowable per claim before warning
    description: { type: DataTypes.STRING },
    isReceiptRequired: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const ApprovalMatrix = sequelize.define('ApprovalMatrix', {
    department: { type: DataTypes.STRING, allowNull: false },
    approverId: { type: DataTypes.INTEGER, allowNull: false },
    level: { type: DataTypes.INTEGER, defaultValue: 1 } // Level 1 is first approver
});

const Claim = sequelize.define('Claim', {
    title: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false }, // 'Travel' or 'Expense'
    amount: { type: DataTypes.FLOAT, allowNull: false },
    date: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'Pending' }, // 'Pending', 'Approved', 'Rejected', 'Disbursed', 'Clarification'
    description: { type: DataTypes.TEXT },
    // Specific fields
    category: { type: DataTypes.STRING }, // For Expense (Food, Travel, etc.)
    destination: { type: DataTypes.STRING }, // For Travel
    startDate: { type: DataTypes.STRING }, // For Travel
    endDate: { type: DataTypes.STRING }, // For Travel
    receiptUrl: { type: DataTypes.STRING }, // For Expense
    relatedClaimId: { type: DataTypes.INTEGER }, // To link Expense to a Travel Request
    department: { type: DataTypes.STRING }, // Department charged for this claim
    approverId: { type: DataTypes.INTEGER }, // Current active approver
    
    // Enterprise Extensions
    advanceAmount: { type: DataTypes.FLOAT, defaultValue: 0 }, // Travel Advance taken
    settlementBalance: { type: DataTypes.FLOAT, defaultValue: 0 }, // Net refund or payment balance
    utrNumber: { type: DataTypes.STRING }, // Bank UTR / Transaction Ref ID
    paymentDate: { type: DataTypes.STRING }, // When finance disbursed
    paymentMethod: { type: DataTypes.STRING }, // Bank Transfer, UPI, Corporate Card, Cash
    clarificationQuery: { type: DataTypes.TEXT }, // Query asked by approver
    clarificationResponse: { type: DataTypes.TEXT }, // Response by employee
    isPolicyViolation: { type: DataTypes.BOOLEAN, defaultValue: false },
    policyViolationReason: { type: DataTypes.STRING }
});

const ClaimAuditLog = sequelize.define('ClaimAuditLog', {
    claimId: { type: DataTypes.INTEGER, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false }, // 'Submitted', 'Level 1 Approved', 'Clarification Requested', 'Disbursed', 'Rejected'
    performedByName: { type: DataTypes.STRING, allowNull: false },
    performedByRole: { type: DataTypes.STRING, defaultValue: 'User' },
    comments: { type: DataTypes.TEXT },
    utrNumber: { type: DataTypes.STRING },
    paymentMethod: { type: DataTypes.STRING },
    paymentDate: { type: DataTypes.STRING },
    timestamp: { type: DataTypes.STRING, defaultValue: () => new Date().toISOString() }
});

// Relations
User.hasMany(Claim);
Claim.belongsTo(User);
ApprovalMatrix.belongsTo(User, { foreignKey: 'approverId', as: 'Approver' });
Claim.hasMany(ClaimAuditLog, { as: 'AuditLogs', foreignKey: 'claimId', onDelete: 'CASCADE' });
// Auto-migrate missing SQLite columns on existing tables
const ensureColumnsExist = async () => {
    try {
        await sequelize.query('ALTER TABLE Users ADD COLUMN delegatedApproverId INTEGER;').catch(() => {});
        await sequelize.query('ALTER TABLE Users ADD COLUMN delegatedUntil TEXT;').catch(() => {});
        await sequelize.query('ALTER TABLE Claims ADD COLUMN advanceAmount REAL DEFAULT 0;').catch(() => {});
        await sequelize.query('ALTER TABLE Claims ADD COLUMN settlementBalance REAL DEFAULT 0;').catch(() => {});
        await sequelize.query('ALTER TABLE Claims ADD COLUMN utrNumber TEXT;').catch(() => {});
        await sequelize.query('ALTER TABLE Claims ADD COLUMN paymentDate TEXT;').catch(() => {});
        await sequelize.query('ALTER TABLE Claims ADD COLUMN paymentMethod TEXT;').catch(() => {});
        await sequelize.query('ALTER TABLE Claims ADD COLUMN clarificationQuery TEXT;').catch(() => {});
        await sequelize.query('ALTER TABLE Claims ADD COLUMN clarificationResponse TEXT;').catch(() => {});
        await sequelize.query('ALTER TABLE Claims ADD COLUMN isPolicyViolation INTEGER DEFAULT 0;').catch(() => {});
        await sequelize.query('ALTER TABLE Claims ADD COLUMN policyViolationReason TEXT;').catch(() => {});
    } catch (e) {
        // Silently continue
    }
};

const seedDatabase = async () => {
    await sequelize.sync({ force: true });
    await ensureColumnsExist();

    const admin = await User.create({
        name: 'Admin User',
        username: 'admin',
        email: 'admin@example.com',
        password: 'password',
        role: 'admin',
        department: 'IT',
        isActive: true
    });

    console.log('Database initialized with only Admin user!');
};

const getDashboardStats = async (userId, role) => {
    const whereClause = {};
    if (role !== 'admin' && userId) {
        whereClause.UserId = userId;
    }

    // 1. Total Requests & Amounts
    const claims = await Claim.findAll({ where: whereClause });
    const totalRequests = claims.length;
    const totalAmount = claims
        .filter(c => c.status === 'Approved' || c.status === 'Disbursed')
        .reduce((sum, c) => sum + (c.amount || 0), 0);

    // 2. Status Counts
    const statusCounts = {
        Pending: claims.filter(c => c.status === 'Pending').length,
        Approved: claims.filter(c => c.status === 'Approved').length,
        Disbursed: claims.filter(c => c.status === 'Disbursed').length,
        Clarification: claims.filter(c => c.status === 'Clarification').length,
        Rejected: claims.filter(c => c.status === 'Rejected').length
    };

    // 3. Monthly Stats (Last 6 Months)
    const monthlyStats = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        const year = d.getFullYear();
        const monthIdx = d.getMonth();

        const monthlyAmount = claims
            .filter(c => {
                const cDate = new Date(c.date);
                return (c.status === 'Approved' || c.status === 'Disbursed') &&
                    cDate.getMonth() === monthIdx &&
                    cDate.getFullYear() === year;
            })
            .reduce((sum, c) => sum + c.amount, 0);

        monthlyStats.push({ name: monthLabel, amount: monthlyAmount });
    }

    // 4. Recent Activity
    const recentActivity = await Claim.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: [{ model: User, attributes: ['name'] }]
    });

    return {
        totalRequests,
        totalAmount,
        statusCounts,
        monthlyStats,
        recentActivity
    };
};

module.exports = { sequelize, User, Claim, ApprovalMatrix, Department, ExpenseCategory, ClaimAuditLog, seedDatabase, getDashboardStats, ensureColumnsExist };
