// cd API && node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/../.env' });

const mail = 'john@foodhub.dev'
const resetPassword = 'Password123!';
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
