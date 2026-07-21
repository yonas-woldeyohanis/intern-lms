const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/userRepository');
const userService = require('../services/userService');

const list = catchAsync(async (req, res) => {
  const { page, limit, search, role, status, departmentId } = req.query;
  const result = await userRepository.list({ page, limit, search, role, status, departmentId });
  res.status(200).json({ success: true, data: result });
});

const getOne = catchAsync(async (req, res) => {
  const user = await userRepository.findById(req.params.id);
  if (!user) throw AppError.notFound('User not found.');
  res.status(200).json({ success: true, data: { user: userRepository.stripHash(user) } });
});

const create = catchAsync(async (req, res) => {
  // Librarians may only create regular 'user' (member) accounts.
  if (req.user.role === 'librarian') {
    const requestedRole = (req.body.role || 'user').toLowerCase();
    if (requestedRole !== 'user') {
      throw AppError.forbidden('Librarians can only create member (user) accounts.');
    }
    req.body.role = 'user'; // ensure it's set correctly
  }
  const user = await userService.createUser(req.body, req.user.id, req);
  res.status(201).json({ success: true, data: { user } });
});

const update = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user.id, req);
  res.status(200).json({ success: true, data: { user } });
});

const resetPassword = catchAsync(async (req, res) => {
  await userService.resetUserPassword(req.params.id, req.body.newPassword, req.user.id, req);
  res.status(200).json({ success: true, data: { message: 'Password reset successfully.' } });
});

const remove = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user.id, req);
  res.status(200).json({ success: true, data: { message: 'User deleted successfully.' } });
});

const updateOwnProfile = catchAsync(async (req, res) => {
  const { firstName, lastName, phone } = req.body;
  const user = await userService.updateUser(req.user.id, { firstName, lastName, phone }, req.user.id, req);
  res.status(200).json({ success: true, data: { user } });
});

module.exports = { list, getOne, create, update, resetPassword, remove, updateOwnProfile };
