const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role_name, username: user.username },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn, issuer: 'bmvei-lms' }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, type: 'refresh' },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn, issuer: 'bmvei-lms' }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret, { issuer: 'bmvei-lms' });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret, { issuer: 'bmvei-lms' });
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
