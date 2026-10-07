// cd API && node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/../.env' });

const mail = 'owner.spice@foodhub.dev'
const resetPassword = 'ownerowner';

// const mail = 'dev@foodhub.dev'
// const resetPassword = 'devdev';
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const hash = await bcrypt.hash(resetPassword, 10);
  await mongoose.connection.db.collection('users').updateOne(
    { email: mail },
    { $set: { password: hash } }
  );
  console.log(`password for ${mail} is reset to ${resetPassword}`);
  process.exit(0);
})();
// "
