import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function formatDate(value, fmt = 'MMM D, YYYY') {
  if (!value) return '—';
  return dayjs(value).format(fmt);
}

export function formatDateTime(value) {
  if (!value) return '—';
  return dayjs(value).format('MMM D, YYYY h:mm A');
}

export function formatRelativeTime(value) {
  if (!value) return '';
  return dayjs(value).fromNow();
}

export function daysUntil(dateStr) {
  return dayjs(dateStr).diff(dayjs(), 'day');
}

export function fullName(user) {
  if (!user) return '—';
  return `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim();
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
