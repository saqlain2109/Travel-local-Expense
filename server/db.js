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

// Using SQLite for easy local setup. Change dialect to 'postgres' for PostgreSQL.
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || path.join(__dirname, 'database.sqlite'),
    logging: false
});

const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false }, // In real app, hash this!
    role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    department: { type: DataTypes.STRING } // New: User's department
});

const ApprovalMatrix = sequelize.define('ApprovalMatrix', {
    department: { type: DataTypes.STRING, allowNull: false }, // Removed unique:true to allow multiple levels per dept
    approverId: { type: DataTypes.INTEGER, allowNull: false },
    level: { type: DataTypes.INTEGER, defaultValue: 1 } // Level 1 is first approver
});

const Claim = sequelize.define('Claim', {
    title: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false }, // 'Travel' or 'Expense'
    amount: { type: DataTypes.FLOAT, allowNull: false },
    date: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), defaultValue: 'Pending' },
    description: { type: DataTypes.TEXT },
    // Specific fields
    category: { type: DataTypes.STRING }, // For Expense (Food, Office, etc.)
    destination: { type: DataTypes.STRING }, // For Travel
    startDate: { type: DataTypes.STRING }, // For Travel
    endDate: { type: DataTypes.STRING }, // For Travel
    receiptUrl: { type: DataTypes.STRING }, // For Expense
    relatedClaimId: { type: DataTypes.INTEGER }, // To link Expense to a Travel Request
    department: { type: DataTypes.STRING }, // New: Department charged for this claim
    approverId: { type: DataTypes.INTEGER } // New: The user who needs to approve this
});

// Relations
User.hasMany(Claim);
Claim.belongsTo(User);
ApprovalMatrix.belongsTo(User, { foreignKey: 'approverId', as: 'Approver' });

const seedDatabase = async () => {
    await sequelize.sync({ force: true });

    const admin = await User.create({
        name: 'Admin User',
        username: 'admin',
        email: 'admin@example.com',
        password: 'password',
        role: 'admin',
        department: 'IT'
    });

    const manager = await User.create({
        name: 'Sarah Manager',
        username: 'sarah',
        email: 'sarah@example.com',
        password: 'password',
        role: 'user', // Managers are users with approval rights
        department: 'Finance'
    });

    const employee = await User.create({
        name: 'John Doe',
        username: 'john',
        email: 'user@example.com',
        password: 'password',
        role: 'user',
        department: 'IT'
    });

    // Seed Matrix: IT claims go to Admin (for demo), Finance claims go to Sarah
    await ApprovalMatrix.bulkCreate([
        { department: 'IT', approverId: admin.id },
        { department: 'Finance', approverId: manager.id }
    ]);

    console.log('Database seeded with fresh data!');
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
        .filter(c => c.status === 'Approved')
        .reduce((sum, c) => sum + c.amount, 0);

    // 2. Status Counts
    const statusCounts = {
        Pending: claims.filter(c => c.status === 'Pending').length,
        Approved: claims.filter(c => c.status === 'Approved').length,
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
                return c.status === 'Approved' &&
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

module.exports = { sequelize, User, Claim, ApprovalMatrix, seedDatabase, getDashboardStats };
