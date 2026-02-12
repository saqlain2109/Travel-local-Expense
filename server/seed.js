const { seedDatabase } = require('./db');

const runSeed = async () => {
    try {
        await seedDatabase();
        console.log('Seeding completed successfully via db.js logic.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

runSeed();
