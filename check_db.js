const { sequelize, User } = require('./server/db');

(async () => {
    try {
        const users = await User.findAll();
        console.log(`Found ${users.length} users:`);
        users.forEach(u => console.log(`- ${u.username} (${u.department || 'No Dept'})`));
    } catch (err) {
        console.error('Error querying users:', err);
    } finally {
        await sequelize.close();
    }
})();
