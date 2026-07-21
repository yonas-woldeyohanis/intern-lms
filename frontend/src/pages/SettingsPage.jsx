import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { settingsApi } from '../api/endpoints';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const LABELS = {
  loan_period_days: 'Default Loan Period (days)',
  max_renewals: 'Maximum Renewals per Loan',
  max_books_per_user: 'Maximum Concurrent Loans per Member',
  reservation_hold_hours: 'Reservation Hold Duration (hours)'
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.list().then((r) => r.data.data.settings)
  });

  const [values, setValues] = useState({});

  useEffect(() => {
    if (data) {
      const map = {};
      data.forEach((s) => { map[s.setting_key] = s.setting_value; });
      setValues(map);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (key) => settingsApi.update(key, values[key]),
    onSuccess: () => {
      toast.success('Setting saved.');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to save setting.')
  });

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">System Settings</h1>
        <p className="text-sm text-slate-400">Configure library-wide policies and organization details.</p>
      </div>

      <Card>
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading settings...</p>
        ) : (
          <div className="space-y-4">
            {(data || []).filter(s => s.setting_key !== 'org_name').map((s) => (
              <div key={s.setting_key} className="flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    label={LABELS[s.setting_key] || s.setting_key}
                    hint={s.description}
                    value={values[s.setting_key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [s.setting_key]: e.target.value }))}
                  />
                </div>
                <Button
                  variant="secondary" icon={Save}
                  loading={saveMutation.isPending && saveMutation.variables === s.setting_key}
                  onClick={() => saveMutation.mutate(s.setting_key)}
                >
                  Save
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
