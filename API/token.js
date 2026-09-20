require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: '6aad6084ed0930cf2320b59f', roles: ['admin', 'delivery_partner'], email: 'admin0@example.com' },
  process.env.JWT_SECRET || 'fallback_secret',
  { expiresIn: '1h' }
);

console.log(token);
