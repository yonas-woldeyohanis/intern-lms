const bcrypt = require('bcrypt');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const userRepository = require('../repositories/userRepository');
const roleRepository = require('../repositories/roleRepository');
const auditService = require('../services/auditService');

async function createUser(payload, actorId, req) {
  const exists = await userRepository.existsByUsernameOrEmail(payload.username, payload.email);
  if (exists) throw AppError.conflict('A user with this username or email already exists.');

  const role = await roleRepository.findByName(payload.role);
  if (!role) throw AppError.badRequest('Invalid role specified.');

  const passwordHash = await bcrypt.hash(payload.password, env.security.bcryptSaltRounds);

  const user = await userRepository.create({
    employeeId: payload.employeeId || null,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phone: payload.phone || null,
    username: payload.username,
    passwordHash,
    roleId: role.id,
    departmentId: payload.departmentId || null,
    status: payload.status || 'active'
  });

  await auditService.record({ userId: actorId, action: 'USER_CREATED', entityType: 'user', entityId: user.id, description: user.username, req });
  return userRepository.stripHash(user);
}

async function updateUser(id, payload, actorId, req) {
  const existing = await userRepository.findById(id);
  if (!existing) throw AppError.notFound('User not found.');

  const fields = {
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    department_id: payload.departmentId,
    status: payload.status
  };

  if (payload.role) {
    const role = await roleRepository.findByName(payload.role);
    if (!role) throw AppError.badRequest('Invalid role specified.');
    fields.role_id = role.id;
  }

  Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);

  const user = await userRepository.update(id, fields);
  await auditService.record({ userId: actorId, action: 'USER_UPDATED', entityType: 'user', entityId: id, description: user.username, req });
  return userRepository.stripHash(user);
}

async function resetUserPassword(id, newPassword, actorId, req) {
  const existing = await userRepository.findById(id);
  if (!existing) throw AppError.notFound('User not found.');
  const hash = await bcrypt.hash(newPassword, env.security.bcryptSaltRounds);
  await userRepository.updatePassword(id, hash);
  await auditService.record({ userId: actorId, action: 'USER_PASSWORD_RESET_BY_ADMIN', entityType: 'user', entityId: id, req });
}

async function deleteUser(id, actorId, req) {
  const existing = await userRepository.findById(id);
  if (!existing) throw AppError.notFound('User not found.');
  if (Number(id) === Number(actorId)) {
    throw AppError.badRequest('You cannot delete your own account while logged in.');
  }
  await userRepository.remove(id);
  await auditService.record({ userId: actorId, action: 'USER_DELETED', entityType: 'user', entityId: id, description: existing.username, req });
}

module.exports = { createUser, updateUser, resetUserPassword, deleteUser };
