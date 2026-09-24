// scripts/check-password.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://127.0.0.1:27017/FOODHUB2';

const email = 'owner.GoldenSpoon@foodhub.dev';
const passwordToCheck = 'ownerowner';

(async () => {
    try {
        await mongoose.connect(MONGO_URI);

        const user = await mongoose.connection.db
            .collection('users')
            .findOne({ email });

        if (!user) {
            console.log('User not found:', email);
            return;
        }

        if (!user.password) {
            console.log('User does not have a password hash.');
            return;
        }

        const matches = await bcrypt.compare(passwordToCheck, user.password);

        console.log(`Email: ${email}`);
        console.log(`Password matches: ${matches}`);

        if (matches) {
            console.log('✅ Password is correct.');
        } else {
            console.log('❌ Password is incorrect.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
})();
