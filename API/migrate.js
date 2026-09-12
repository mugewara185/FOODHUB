const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect('mongodb://127.0.0.1:27017/FOODHUB');
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  for (let user of users) {
    if (user.role && (!user.roles || user.roles.length === 0)) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { roles: [user.role] }, $unset: { role: 1 } }
      );
      console.log(`Migrated user ${user.email} with role: ${user.role}`);
    }
  }
  console.log('Migration complete');
  process.exit(0);
}

migrate().catch(console.error);
