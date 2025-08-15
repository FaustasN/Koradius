const crypto = require('crypto');

// Generate a 32-byte (256-bit) key and convert to hex
const encryptionKey = crypto.randomBytes(32).toString('hex');

console.log('Generated 64-character hex encryption key:');
console.log(encryptionKey);
console.log('\nAdd this to your .env file as:');
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
