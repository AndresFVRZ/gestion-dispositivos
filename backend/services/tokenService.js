// backend/services/tokenService.js
const crypto = require('crypto');

const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const getTokenExpiry = () => {
    return new Date(Date.now() + 60 * 60 * 1000); // 1 hora
};

module.exports = { generateResetToken, getTokenExpiry };