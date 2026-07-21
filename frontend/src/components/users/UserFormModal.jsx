import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { usersApi } from '../../api/endpoints';
import { useDepartmentsOptions } from '../../hooks/useLookups';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'user', label: 'User (Employee)' }
];
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' }
];

export default function UserFormModal({ open, onClose, user, onSuccess, isLibrarian = false }) {
  const isEdit = !!user;
  const departmentOptions = useDepartmentsOptions();
  const [values, setValues] = useState({});

  // Librarians can only assign the 'user' role
  const roleOptions = isLibrarian
    ? [{ value: 'user', label: 'User (Employee/Member)' }]
    : ROLE_OPTIONS;

  useEffect(() => {
    if (open) {
      setValues(user ? {
        firstName: user.first_name, lastName: user.last_name, email: user.email,
        phone: user.phone || '', username: user.username, role: user.role_name,
        departmentId: user.department_id || '', status: user.status, employeeId: user.employee_id || ''
      } : { role: 'user', status: 'active' });
    }
  }, [open, user]);

  const saveMutation = useMutation({
    mutationFn: () => isEdit ? usersApi.update(user.id, values) : usersApi.create(values),
    onSuccess: () => {
      toast.success(isEdit ? 'User updated successfully.' : 'User created successfully.');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      const details = err.response?.data?.error?.details;
      if (details?.length) details.forEach((d) => toast.error(d.message));
      else toast.error(err.response?.data?.error?.message || 'Failed to save user.');
    }
  });

  function set(key, val) { setValues((v) => ({ ...v, [key]: val })); }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit User' : 'Create New User'} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First Name" value={values.firstName || ''} onChange={(e) => set('firstName', e.target.value)} required />
          <Input label="Last Name" value={values.lastName || ''} onChange={(e) => set('lastName', e.target.value)} required />
          <Input label="Email" type="email" value={values.email || ''} onChange={(e) => set('email', e.target.value)} required />
          <Input label="Phone" value={values.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="+251..." />
          <Input label="Employee ID" value={values.employeeId || ''} onChange={(e) => set('employeeId', e.target.value)} />
          <Select label="Department" options={departmentOptions} value={values.departmentId || ''} onChange={(e) => set('departmentId', e.target.value)} />
          {!isEdit && (
            <>
              <Input label="Username" value={values.username || ''} onChange={(e) => set('username', e.target.value)} required />
              <Input label="Temporary Password" type="password" value={values.password || ''} onChange={(e) => set('password', e.target.value)} required
                hint="Min 8 chars, upper, lower, number, special char." />
            </>
          )}
          <Select label="Role" options={roleOptions} value={values.role || ''} onChange={(e) => set('role', e.target.value)} required disabled={isLibrarian} />
          {isEdit && !isLibrarian && <Select label="Status" options={STATUS_OPTIONS} value={values.status || ''} onChange={(e) => set('status', e.target.value)} required />}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saveMutation.isPending}>{isEdit ? 'Save Changes' : 'Create User'}</Button>
        </div>
      </form>
    </Modal>
  );
}
