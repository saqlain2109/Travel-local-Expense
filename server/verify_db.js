const { sequelize, User } = require('./db');

(async () => {
    try {
        const users = await User.findAll();
        console.log('--- USERS IN DB ---');
        users.forEach(u => {
            console.log(`ID: ${u.id} | User: ${u.username} | Email: ${u.email} | Role: ${u.role} | Pass: ${u.password}`);
        });
        console.log('-------------------');
    } catch (err) {
        console.error('Error reading DB:', err);
    } finally {
        await sequelize.close();
    }
})();
