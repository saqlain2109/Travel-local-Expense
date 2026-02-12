const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Using SQLite for easy local setup. Change dialect to 'postgres' for PostgreSQL.
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
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

module.exports = { sequelize, User, Claim, ApprovalMatrix, seedDatabase };
