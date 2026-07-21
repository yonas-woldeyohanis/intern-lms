import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileBarChart, FileSpreadsheet, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsApi } from '../api/endpoints';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { downloadBlob } from '../utils/format';

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(null); // `${type}-${format}`

  const { data } = useQuery({
    queryKey: ['report-types'],
    queryFn: () => reportsApi.listTypes().then((r) => r.data.data.types)
  });

  async function handleDownload(type, format) {
    const key = `${type}-${format}`;
    setDownloading(key);
    try {
      const response = await reportsApi.download(type, format);
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      downloadBlob(response.data, `${type}-report.${ext}`);
    } catch {
      toast.error('Failed to generate report.');
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Reports</h1>
        <p className="text-sm text-slate-400">Generate and export professional reports as PDF or Excel.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data || []).map((report) => (
          <Card key={report.key}>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-brand-500/10 p-2.5 text-brand-700">
                <FileBarChart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">{report.label}</h3>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary" icon={FileText} className="flex-1"
                loading={downloading === `${report.key}-pdf`}
                onClick={() => handleDownload(report.key, 'pdf')}
              >
                PDF
              </Button>
              <Button
                variant="secondary" icon={FileSpreadsheet} className="flex-1"
                loading={downloading === `${report.key}-excel`}
                onClick={() => handleDownload(report.key, 'excel')}
              >
                Excel
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
