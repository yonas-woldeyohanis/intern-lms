const catchAsync = require('../utils/catchAsync');
const authService = require('../services/authService');
const env = require('../config/env');

const REFRESH_COOKIE_NAME = 'bmvei_refresh_token';

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth'
  });
}

const login = catchAsync(async (req, res) => {
  const { identifier, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login({ identifier, password }, req);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ success: true, data: { user, accessToken } });
});

const refresh = catchAsync(async (req, res) => {
  const token = req.cookies ? req.cookies[REFRESH_COOKIE_NAME] : null;
  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No refresh token provided.' } });
  }
  const { user, accessToken, refreshToken } = await authService.refresh(token);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ success: true, data: { user, accessToken } });
});

const logout = catchAsync(async (req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
  res.status(200).json({ success: true, data: { message: 'Logged out successfully.' } });
});

const me = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});

const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.status(200).json({ success: true, data: { message: 'Password changed successfully.' } });
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await authService.requestPasswordReset(email);
  const payload = { message: 'If an account with that email exists, password reset instructions have been generated.' };
  // Dev convenience only: expose the raw token so this system is testable without
  // a configured mail provider. Remove this field once SMTP/SES/SendGrid is wired in.
  if (env.nodeEnv !== 'production' && result.token) {
    payload.devResetToken = result.token;
  }
  res.status(200).json({ success: true, data: payload });
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);
  res.status(200).json({ success: true, data: { message: 'Password has been reset. You may now log in.' } });
});

module.exports = { login, refresh, logout, me, changePassword, forgotPassword, resetPassword };
