const bcrypt = require('bcrypt');
const crypto = require('crypto');
const dayjs = require('dayjs');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/userRepository');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/token');
const auditService = require('../services/auditService');

async function login({ identifier, password }, req) {
  const user = await userRepository.findByUsernameOrEmail(identifier);

  // Always run bcrypt.compare even on a missing user (against a dummy hash)
  // to avoid timing attacks that reveal whether a username/email exists.
  const dummyHash = '$2b$12$CwTycUXWue0Thq9StjUM0uJ8Q6VGH9K0fJXqz9uYW6y6Y6WQb8Nya';
  const hashToCheck = user ? user.password_hash : dummyHash;
  const passwordMatches = await bcrypt.compare(password, hashToCheck);

  if (!user) {
    throw AppError.unauthorized('Invalid username/email or password.');
  }

  if (user.locked_until && dayjs(user.locked_until).isAfter(dayjs())) {
    const minutesLeft = dayjs(user.locked_until).diff(dayjs(), 'minute') + 1;
    throw AppError.forbidden(`Account temporarily locked due to repeated failed logins. Try again in ${minutesLeft} minute(s).`);
  }

  if (user.status !== 'active') {
    throw AppError.forbidden('Your account is not active. Contact an administrator.');
  }

  if (!passwordMatches) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    let lockedUntil = null;
    if (attempts >= env.security.maxFailedLoginAttempts) {
      lockedUntil = dayjs().add(env.security.accountLockMinutes, 'minute').format('YYYY-MM-DD HH:mm:ss');
    }
    await userRepository.recordLoginFailure(user.id, attempts, lockedUntil);
    await auditService.record({ userId: user.id, action: 'LOGIN_FAILED', entityType: 'user', entityId: user.id, req });
    throw AppError.unauthorized('Invalid username/email or password.');
  }

  await userRepository.recordLoginSuccess(user.id);
  await auditService.record({ userId: user.id, action: 'LOGIN_SUCCESS', entityType: 'user', entityId: user.id, req });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  return { user: userRepository.stripHash(user), accessToken, refreshToken };
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token. Please log in again.');
  }
  const user = await userRepository.findById(payload.sub);
  if (!user || user.status !== 'active') {
    throw AppError.unauthorized('Account no longer available.');
  }
  const accessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  return { accessToken, refreshToken: newRefreshToken, user: userRepository.stripHash(user) };
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await userRepository.findById(userId);
  if (!user) throw AppError.notFound('User not found.');

  const matches = await bcrypt.compare(currentPassword, user.password_hash);
  if (!matches) throw AppError.badRequest('Current password is incorrect.');

  const hash = await bcrypt.hash(newPassword, env.security.bcryptSaltRounds);
  await userRepository.updatePassword(userId, hash);
  await auditService.record({ userId, action: 'PASSWORD_CHANGED', entityType: 'user', entityId: userId });
}

async function requestPasswordReset(email) {
  const user = await userRepository.findByUsernameOrEmail(email);
  // Always respond success-shaped regardless of whether the email exists,
  // to avoid leaking which emails are registered (user enumeration defense).
  if (!user) return { token: null };

  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expires = dayjs().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');

  await userRepository.setResetToken(user.id, hashedToken, expires);
  await auditService.record({ userId: user.id, action: 'PASSWORD_RESET_REQUESTED', entityType: 'user', entityId: user.id });

  // In production this token is emailed to the user via a mail provider,
  // never returned in the API response. Wiring in a mail service (e.g.
  // SendGrid/SES) is a deployment-time integration step — see README.
  return { token };
}

async function resetPassword(rawToken, newPassword) {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const user = await userRepository.findByResetToken(hashedToken);
  if (!user) throw AppError.badRequest('This password reset link is invalid or has expired.');

  const hash = await bcrypt.hash(newPassword, env.security.bcryptSaltRounds);
  await userRepository.updatePassword(user.id, hash);
  await auditService.record({ userId: user.id, action: 'PASSWORD_RESET_COMPLETED', entityType: 'user', entityId: user.id });
}

module.exports = { login, refresh, changePassword, requestPasswordReset, resetPassword };
