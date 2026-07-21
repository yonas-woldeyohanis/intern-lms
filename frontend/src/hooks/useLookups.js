import { useQuery } from '@tanstack/react-query';
import { authorsApi, publishersApi, categoriesApi, shelvesApi, departmentsApi } from '../api/endpoints';

function toOptions(rows, labelKey) {
  return (rows || []).map((r) => ({ value: r.id, label: r[labelKey] }));
}

export function useAuthorsOptions() {
  const { data } = useQuery({ queryKey: ['authors', 'all'], queryFn: () => authorsApi.list({}).then((r) => r.data.data) });
  return toOptions(data, 'full_name');
}

export function usePublishersOptions() {
  const { data } = useQuery({ queryKey: ['publishers', 'all'], queryFn: () => publishersApi.list({}).then((r) => r.data.data) });
  return toOptions(data, 'name');
}

export function useCategoriesOptions() {
  const { data } = useQuery({ queryKey: ['categories', 'all'], queryFn: () => categoriesApi.list({}).then((r) => r.data.data) });
  return toOptions(data, 'name');
}

export function useShelvesOptions() {
  const { data } = useQuery({ queryKey: ['shelves', 'all'], queryFn: () => shelvesApi.list({}).then((r) => r.data.data) });
  return toOptions(data, 'code');
}

export function useDepartmentsOptions() {
  const { data } = useQuery({ queryKey: ['departments', 'all'], queryFn: () => departmentsApi.list({}).then((r) => r.data.data) });
  return toOptions(data, 'name');
}
