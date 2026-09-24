// cd API && node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mail = 'john@foodhub.dev'
const resetPassword = 'Password123!';
(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/FOODHUB2');
  const hash = await bcrypt.hash(resetPassword, 10);
  await mongoose.connection.db.collection('users').updateOne(
    { email: mail },
    { $set: { password: hash } }
  );
  console.log(`password for ${mail} is reset to ${resetPassword}`);
  process.exit(0);
})();
// "
