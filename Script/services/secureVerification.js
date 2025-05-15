// Importing required modules 
const crypto = require('crypto');

// Encryption Configuration
const ENCRYPTION_KEY = crypto.createHash('sha256')
    .update(String(process.env.ENCRYPTION_KEY))
    .digest('base64')
    .substr(0, 32);

const IV_LENGTH = 16; // AES block size

// Encrypt Data
const encrypt = (text) => {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
        console.error("Error encrypting data:", error.message);
        throw error;
    }
};

// Decrypt Data
const decrypt = (text) => {
    try {
        const parts = text.split(':');
        if (parts.length !== 2) throw new Error('Invalid encrypted data format');

        const iv = Buffer.from(parts[0], 'hex');
        if (iv.length !== IV_LENGTH) throw new Error('Invalid IV length');

        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(parts[1], 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error("Error decrypting data:", error.message);
        throw error;
    }
};



module.exports = { encrypt, decrypt };
