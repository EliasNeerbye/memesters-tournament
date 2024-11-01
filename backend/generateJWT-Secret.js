const crypto = require('crypto');
const generateJWTSecret = () => crypto.randomBytes(32).toString('hex');
console.log(generateJWTSecret());
