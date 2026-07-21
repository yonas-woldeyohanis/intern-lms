import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  BookOpen, CheckCircle2, Clock, AlertTriangle, Users as UsersIcon,
  Send, BookMarked, CalendarCheck, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi, borrowApi, reservationsApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import Card from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { formatDate, formatDateTime } from '../utils/format';
import BroadcastModal from '../components/ui/BroadcastModal';

const COLORS = ['#0F3D5C', '#E8A33D', '#2E6E97', '#F0BC55', '#7AABC9', '#8A5714'];
const STATUS_COLOR = { borrowed: '#2E6E97', overdue: '#ef4444', returned: '#22c55e', lost: '#94a3b8' };

/** Generic dark-aware tooltip for recharts */
function ChartTooltip({ active, payload, label, labelMap = {} }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl px-4 py-3 text-sm min-w-[130px]">
      {label && (
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{label}</p>
      )}
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ background: entry.color || entry.fill }} />
            <span className="text-slate-600 dark:text-slate-300">{labelMap[entry.dataKey] || entry.name || entry.dataKey}</span>
          </span>
          <span className="font-bold text-slate-800 dark:text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone, subtext }) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${tone}`}>
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-800 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
        {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   USER DASHBOARD  (personal view)
───────────────────────────────────────────── */
function UserDashboard({ user }) {
  const { data: loansData, isLoading: loansLoading } = useQuery({
    queryKey: ['my-loans-dash'],
    queryFn: () => borrowApi.list({ limit: 10 }).then((r) => r.data.data)
  });
  const { data: resData, isLoading: resLoading } = useQuery({
    queryKey: ['my-reservations-dash'],
    queryFn: () => reservationsApi.list({ limit: 10 }).then((r) => r.data.data)
  });

  const loans = loansData?.rows || [];
  const reservations = resData?.rows || [];
  const activeLoans = loans.filter((l) => l.status === 'borrowed');
  const overdueLoans = loans.filter((l) => l.status === 'overdue');
  const pendingRes = reservations.filter((r) => r.status === 'pending');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 text-white p-6 shadow-lg">
        <p className="text-brand-200 text-sm font-medium">{greeting} 👋</p>
        <h1 className="text-2xl font-bold mt-1">
          Welcome back, {user?.first_name || 'Reader'}!
        </h1>
        <p className="text-brand-300 text-sm mt-1">Here's what's happening with your library account.</p>
        <div className="flex gap-3 mt-4">
          <Link
            to="/books"
            className="flex items-center gap-2 bg-accent-400 text-brand-950 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-accent-300 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Browse Books
          </Link>
          <Link
            to="/my-loans"
            className="flex items-center gap-2 bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/25 transition-colors"
          >
            <BookMarked className="h-4 w-4" />
            My Loans
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loansLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatCard
              icon={BookMarked} label="Active Loans" value={activeLoans.length}
              tone="bg-brand-500/10 text-brand-700 dark:text-brand-300"
            />
            <StatCard
              icon={AlertTriangle} label="Overdue Books" value={overdueLoans.length}
              tone={overdueLoans.length > 0 ? 'bg-danger-500/10 text-danger-600' : 'bg-slate-100 text-slate-400'}
            />
            <StatCard
              icon={CalendarCheck} label="Pending Reservations" value={pendingRes.length}
              tone="bg-accent-400/15 text-accent-700 dark:text-accent-300"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Current loans */}
        <Card title="Your Current Loans">
          {loansLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto my-6" />
          ) : activeLoans.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">You have no active loans.</p>
              <Link to="/books" className="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline mt-1 inline-block">
                Browse books →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeLoans.map((loan) => {
                const dueDate = new Date(loan.due_date);
                const isOverdue = dueDate < new Date();
                const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <li key={loan.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-white text-sm truncate">{loan.book_title}</p>
                      <p className={`text-xs mt-0.5 ${isOverdue ? 'text-danger-500 font-medium' : 'text-slate-400'}`}>
                        {isOverdue ? `Overdue by ${Math.abs(daysLeft)} day(s)` : `Due ${formatDate(loan.due_date)}`}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                      isOverdue ? 'bg-danger-50 text-danger-600 dark:bg-danger-900/30' : 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    }`}>
                      {isOverdue ? 'Overdue' : `${daysLeft}d left`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Active reservations */}
        <Card title="Your Reservations">
          {resLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto my-6" />
          ) : pendingRes.length === 0 ? (
            <div className="text-center py-8">
              <CalendarCheck className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No pending reservations.</p>
              <Link to="/reservations" className="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline mt-1 inline-block">
                Reserve a book →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingRes.map((res) => (
                <li key={res.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white text-sm truncate">{res.book_title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Expires {formatDate(res.expires_at)}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
                    Pending
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ADMIN / LIBRARIAN DASHBOARD  (ops view)
───────────────────────────────────────────── */
function StaffDashboard({ user }) {
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardApi.summary().then((r) => r.data.data)
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    );
  }

  const totals = data?.totals || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Live overview of the BMVEI library system.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsBroadcastOpen(true)}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
          >
            <Send className="w-4 h-4" />
            Send Broadcast
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={BookOpen} label="Total Books" value={totals.totalBooks ?? 0} tone="bg-brand-500/10 text-brand-700" />
        <StatCard icon={CheckCircle2} label="Available" value={totals.availableBooks ?? 0} tone="bg-success-500/10 text-success-600" />
        <StatCard icon={Clock} label="Borrowed" value={totals.borrowedBooks ?? 0} tone="bg-accent-400/20 text-accent-600" />
        <StatCard icon={AlertTriangle} label="Overdue" value={totals.overdueBooks ?? 0} tone="bg-danger-500/10 text-danger-600" />
        <StatCard icon={UsersIcon} label="Active Members" value={totals.activeMembers ?? 0} tone="bg-brand-500/10 text-brand-700" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Monthly Borrowing Trend" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.monthlyBorrowStats || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" fontSize={12} stroke="#94a3b8" />
              <YAxis fontSize={12} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip content={<ChartTooltip labelMap={{ total: 'Borrows' }} />} />
              <Line type="monotone" dataKey="total" stroke="#0F3D5C" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5, fill: '#E8A33D' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Category Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data?.categoryDistribution || []}
                dataKey="book_count"
                nameKey="category"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
              >
                {(data?.categoryDistribution || []).map((entry, index) => (
                  <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Most Popular Books" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.popularBooks || []} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" fontSize={12} stroke="#94a3b8" allowDecimals={false} />
              <YAxis type="category" dataKey="title" fontSize={11} stroke="#94a3b8" width={160} tickFormatter={(v) => v.length > 22 ? `${v.slice(0, 22)}…` : v} />
              <Tooltip content={<ChartTooltip labelMap={{ borrow_count: 'Times Borrowed' }} />} />
              <Bar dataKey="borrow_count" fill="#E8A33D" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {isAdmin && (
          <Card title="Recent Activity">
            <ul className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {(data?.recentActivity || []).map((a) => (
                <li key={a.id} className="text-sm border-b border-slate-50 dark:border-slate-800 pb-2 last:border-0">
                  <p className="text-slate-700 dark:text-slate-200">
                    <span className="font-medium">{a.first_name ? `${a.first_name} ${a.last_name}` : 'System'}</span>{' '}
                    <span className="text-slate-400">{a.action.replace(/_/g, ' ').toLowerCase()}</span>
                  </p>
                  <p className="text-xs text-slate-400">{formatDateTime(a.created_at)}</p>
                </li>
              ))}
              {(!data?.recentActivity || data.recentActivity.length === 0) && (
                <p className="text-sm text-slate-400">No recent activity.</p>
              )}
            </ul>
          </Card>
        )}
      </div>

      {isAdmin && (
        <BroadcastModal open={isBroadcastOpen} onClose={() => setIsBroadcastOpen(false)} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROUTE COMPONENT  (picks the right dashboard)
───────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase();

  if (role === 'user') return <UserDashboard user={user} />;
  return <StaffDashboard user={user} />;
}
