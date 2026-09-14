import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, ComposedChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import {
  BookOpen, CheckCircle2, Clock, AlertTriangle, Users as UsersIcon,
  Send, BookMarked, CalendarCheck, Loader2, RefreshCw, TrendingUp,
  TrendingDown, Minus, Activity, Library, Sparkles, BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi, borrowApi, reservationsApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import Card from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { formatDate, formatDateTime } from '../utils/format';
import BroadcastModal from '../components/ui/BroadcastModal';

/* ── Color palette ─────────────────────────────────────── */
const C = {
  brand:   '#0071ce',
  cyan:    '#22d3ee',
  green:   '#10b981',
  amber:   '#f59e0b',
  rose:    '#f43f5e',
  violet:  '#8b5cf6',
  orange:  '#fb923c',
  teal:    '#14b8a6',
};
const PIE_COLORS  = [C.brand, C.cyan, C.green, C.amber, C.violet, C.rose, C.orange, C.teal];
const STATUS_COLOR = { borrowed: C.brand, overdue: C.rose, returned: C.green, lost: '#64748b' };

/* ── Shared SVG gradient defs (rendered once) ───────────── */
function GradDefs() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden>
      <defs>
        <linearGradient id="gArea"  x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={C.brand}  stopOpacity={0.3} />
          <stop offset="95%" stopColor={C.brand}  stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="gRes"   x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={C.violet} stopOpacity={0.3} />
          <stop offset="95%" stopColor={C.violet} stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="gActive" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={C.green}  stopOpacity={0.3} />
          <stop offset="95%" stopColor={C.green}  stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="gOver"  x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={C.rose}   stopOpacity={0.3} />
          <stop offset="95%" stopColor={C.rose}   stopOpacity={0.02} />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Tooltip ───────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, labelMap = {} }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-brand-500/20 bg-white dark:bg-slate-900 shadow-2xl px-4 py-3 text-sm min-w-[150px]">
      {label && <p className="text-xs font-bold text-brand-600 dark:text-brand-400 mb-2 uppercase tracking-wider">{label}</p>}
      {payload.map((e) => (
        <div key={e.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: e.color ?? e.fill }} />
            <span className="text-slate-500 dark:text-slate-300">{labelMap[e.dataKey] ?? e.name ?? e.dataKey}</span>
          </span>
          <span className="font-bold text-slate-800 dark:text-white">{e.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Pie inner label ───────────────────────────────────── */
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null;
  const RAD = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  return (
    <text x={cx + r * Math.cos(-midAngle * RAD)} y={cy + r * Math.sin(-midAngle * RAD)}
      fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

/* ── Animated counter ─────────────────────────────────── */
function AnimatedCounter({ target }) {
  const [value, setValue] = useState(0);
  const ref = useRef(target);
  useEffect(() => {
    if (ref.current === target) return;
    ref.current = target;
    let start = 0;
    const step = Math.ceil(target / 30);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setValue(start);
      if (start >= target) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  useEffect(() => { setValue(target); }, [target]);
  return <>{value}</>;
}

/* ── Trend chip ───────────────────────────────────────── */
function TrendChip({ current, previous }) {
  if (!previous) return null;
  const diff = current - previous;
  const pct  = Math.abs(((diff / previous) * 100)).toFixed(0);
  if (diff > 0) return <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full"><TrendingUp className="h-3 w-3"/>+{pct}%</span>;
  if (diff < 0) return <span className="flex items-center gap-0.5 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400 px-1.5 py-0.5 rounded-full"><TrendingDown className="h-3 w-3"/>-{pct}%</span>;
  return <span className="flex items-center gap-0.5 text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full"><Minus className="h-3 w-3"/>0%</span>;
}

/* ── KPI card ─────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, tone, to, trend, accent }) {
  const inner = (
    <div className={`relative overflow-hidden rounded-2xl p-5 h-full border border-brand-500/10 bg-brand-50/70 dark:bg-brand-950/70 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5`}>
      {/* accent glow spot */}
      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={`grid h-12 w-12 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend}
      </div>
      <p className="text-3xl font-extrabold font-display text-slate-800 dark:text-white leading-none tabular-nums">
        <AnimatedCounter target={value} />
      </p>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5 truncate">{label}</p>
    </div>
  );
  if (to) return <Link to={to} className="block h-full">{inner}</Link>;
  return inner;
}

/* ── Utilization bar ──────────────────────────────────── */
function UtilBar({ label, total, borrowed, color }) {
  const pct = total > 0 ? Math.round((borrowed / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{label}</span>
        <span className="text-xs font-bold ml-2 shrink-0" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[10px] text-slate-400 mt-0.5">{borrowed}/{total} copies in use</p>
    </div>
  );
}

/* ── Section header ───────────────────────────────────── */
function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-brand-500 shrink-0" />
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{children}</h3>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   USER DASHBOARD
═══════════════════════════════════════════════════════ */
function UserDashboard({ user }) {
  const { data: loansData, isLoading: loansLoading } = useQuery({
    queryKey: ['my-loans-dash'],
    queryFn: () => borrowApi.list({ limit: 10 }).then((r) => r.data.data)
  });
  const { data: resData, isLoading: resLoading } = useQuery({
    queryKey: ['my-reservations-dash'],
    queryFn: () => reservationsApi.list({ limit: 10 }).then((r) => r.data.data)
  });

  const loans        = loansData?.rows || [];
  const reservations = resData?.rows   || [];
  const activeLoans  = loans.filter((l) => l.status === 'borrowed' || l.status === 'overdue');
  const overdueLoans = loans.filter((l) => l.status === 'overdue');
  const pendingRes   = reservations.filter((r) => r.status === 'pending');

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white p-6 shadow-lg overflow-hidden relative">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-8 bottom-4 h-24 w-24 rounded-full bg-cyan-400/10 blur-xl" />
        <p className="text-brand-200 text-sm font-medium relative">{greeting} 👋</p>
        <h1 className="text-3xl font-bold font-display mt-1 relative">Welcome back, {user?.first_name || 'Reader'}!</h1>
        <p className="text-brand-300 text-base mt-1 relative">Here's what's happening with your library account.</p>
        <div className="flex gap-3 mt-4 flex-wrap relative">
          <Link to="/books" className="flex items-center gap-2 bg-white text-brand-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors shadow-sm">
            <BookOpen className="h-4 w-4" />Browse Books
          </Link>
          <Link to="/my-loans" className="flex items-center gap-2 bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/25 transition-colors">
            <BookMarked className="h-4 w-4" />My Loans
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loansLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : <>
            <KpiCard icon={BookMarked} label="Active Loans"          value={activeLoans.length}   accent={C.brand}  tone="bg-brand-500/10 text-brand-700"   to="/my-loans" />
            <KpiCard icon={AlertTriangle} label="Overdue Books"      value={overdueLoans.length}  accent={C.rose}   tone={overdueLoans.length > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-100 text-slate-400'} to="/my-loans" />
            <KpiCard icon={CalendarCheck} label="Pending Reservations" value={pendingRes.length}  accent={C.violet} tone="bg-violet-500/10 text-violet-600"  to="/reservations" />
          </>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Your Current Loans">
          {loansLoading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto my-6" />
            : activeLoans.length === 0
            ? <div className="text-center py-8">
                <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No active loans.</p>
                <Link to="/books" className="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline mt-1 inline-block">Browse books →</Link>
              </div>
            : <ul className="divide-y divide-brand-500/10">
                {activeLoans.map((loan) => {
                  const dueDate = new Date(loan.due_date);
                  const isOverdue = dueDate < new Date();
                  const daysLeft  = Math.ceil((dueDate - new Date()) / 86400000);
                  return (
                    <li key={loan.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{loan.book_title}</p>
                        <p className={`text-xs mt-0.5 ${isOverdue ? 'text-rose-500 font-medium' : 'text-slate-400'}`}>
                          {isOverdue ? `Overdue by ${Math.abs(daysLeft)} day(s)` : `Due ${formatDate(loan.due_date)}`}
                        </p>
                      </div>
                      <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${isOverdue ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30' : 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'}`}>
                        {isOverdue ? 'Overdue' : `${daysLeft}d left`}
                      </span>
                    </li>
                  );
                })}
              </ul>}
        </Card>

        <Card title="Your Reservations">
          {resLoading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto my-6" />
            : pendingRes.length === 0
            ? <div className="text-center py-8">
                <CalendarCheck className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No pending reservations.</p>
                <Link to="/reservations" className="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline mt-1 inline-block">Reserve a book →</Link>
              </div>
            : <ul className="divide-y divide-brand-500/10">
                {pendingRes.map((res) => (
                  <li key={res.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{res.book_title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Expires {formatDate(res.expires_at)}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">Pending</span>
                  </li>
                ))}
              </ul>}
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STAFF DASHBOARD
═══════════════════════════════════════════════════════ */
function StaffDashboard({ user }) {
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardApi.summary().then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-[380px] rounded-2xl" />
          <Skeleton className="h-[380px] rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-[380px] rounded-2xl" />
          <Skeleton className="h-[380px] rounded-2xl" />
        </div>
      </div>
    );
  }

  const totals   = data?.totals   || {};
  const monthly  = data?.monthlyBorrowStats || [];
  const resMonthly = data?.reservationTrend || [];
  const prevMonth  = monthly[monthly.length - 2]?.total ?? null;
  const curMonth   = monthly[monthly.length - 1]?.total ?? null;

  // Merge monthly + reservation trend by month key
  const mergedTrend = (() => {
    const map = {};
    monthly.forEach((m) => { map[m.month] = { month: m.month, borrows: Number(m.total) }; });
    resMonthly.forEach((m) => {
      if (map[m.month]) map[m.month].reservations = Number(m.total);
      else map[m.month] = { month: m.month, borrows: 0, reservations: Number(m.total) };
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  })();

  const statusTimeline = (data?.statusTimeline || []).map((r) => ({
    month:    r.month,
    Active:   Number(r.active),
    Returned: Number(r.returned),
    Overdue:  Number(r.overdue),
  }));

  const loanStatusDonut = [
    { name: 'Available',  value: totals.availableBooks ?? 0, fill: C.green  },
    { name: 'Borrowed',   value: totals.borrowedBooks  ?? 0, fill: C.brand  },
    { name: 'Overdue',    value: totals.overdueBooks   ?? 0, fill: C.rose   },
  ].filter((d) => d.value > 0);

  const topAuthors  = data?.topAuthors         || [];
  const catUtil     = data?.categoryUtilization || [];
  const catDist     = data?.categoryDistribution || [];
  const radarData   = catDist.slice(0, 6).map((c) => ({ subject: c.category, books: Number(c.book_count) }));

  const axisStyle = {
    tick: { fill: 'currentColor', fontWeight: 600, fontSize: 11 },
    stroke: 'transparent',
  };

  return (
    <div className="space-y-5">
      <GradDefs />

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Live overview of the BMVEI library system.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isAdmin && (
            <button onClick={() => setIsBroadcastOpen(true)}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 rounded-xl font-semibold shadow-sm transition-colors text-sm">
              <Send className="w-4 h-4" />Broadcast
            </button>
          )}
        </div>
      </div>

      {/* ── Row 1: KPI cards ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard icon={Library}      label="Total Books"  value={totals.totalBooks     ?? 0} accent={C.brand}  tone="bg-brand-500/10 text-brand-700"   to="/books" />
        <KpiCard icon={CheckCircle2} label="Available"    value={totals.availableBooks ?? 0} accent={C.green}  tone="bg-green-500/10 text-green-600" />
        <KpiCard icon={Clock}        label="Borrowed"     value={totals.borrowedBooks  ?? 0} accent={C.cyan}   tone="bg-cyan-400/15 text-cyan-700"    to="/borrow-return?status=borrowed"
          trend={<TrendChip current={curMonth} previous={prevMonth} />} />
        <KpiCard icon={AlertTriangle} label="Overdue"     value={totals.overdueBooks   ?? 0} accent={C.rose}   tone="bg-rose-500/10 text-rose-600"   to="/borrow-return?status=overdue" />
        <KpiCard icon={UsersIcon}    label="Members"      value={totals.activeMembers  ?? 0} accent={C.violet} tone="bg-violet-500/10 text-violet-700" to="/members" />
      </div>

      {/* ── Row 2: Area trends + Donut ─────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Dual-line area chart */}
        <Card className="p-5">
          <SectionLabel icon={Activity}>Borrowing vs Reservation Trend</SectionLabel>
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={mergedTrend} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#64748b" strokeOpacity={0.2} />
              <XAxis dataKey="month" {...axisStyle} tickLine={false} />
              <YAxis {...axisStyle} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip labelMap={{ borrows: 'Borrows', reservations: 'Reservations' }} />} />
              <defs>
                <linearGradient id="gBorrow2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.brand}  stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={C.brand}  stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gRes2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.violet} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={C.violet} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="borrows"      stroke={C.brand}  strokeWidth={2.5} fill="url(#gBorrow2)"
                dot={{ r: 4, fill: C.brand,  strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, fill: C.cyan, stroke: C.brand, strokeWidth: 2 }} />
              <Area type="monotone" dataKey="reservations" stroke={C.violet} strokeWidth={2.5} fill="url(#gRes2)"
                dot={{ r: 4, fill: C.violet, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '20px' }}
                formatter={(v) => <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 capitalize">{v}</span>} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {/* Loan status donut */}
        <Card className="p-5">
          <SectionLabel icon={BarChart3}>Book Status</SectionLabel>
          {loanStatusDonut.length === 0
            ? <div className="flex items-center justify-center h-80 text-slate-400 text-sm">No data yet.</div>
            : <div className="relative h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={loanStatusDonut} dataKey="value" nameKey="name"
                      innerRadius={110} outerRadius={160} paddingAngle={4} labelLine={false} label={PieLabel}>
                      {loanStatusDonut.map((e) => <Cell key={e.name} fill={e.fill} stroke="transparent" />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: '10px' }}
                      formatter={(v) => <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center total */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-8">
                  <p className="text-sm text-slate-400 font-medium">Total Copies</p>
                  <p className="text-4xl font-black text-slate-800 dark:text-white">
                    {(totals.borrowedBooks ?? 0) + (totals.availableBooks ?? 0) + (totals.overdueBooks ?? 0)}
                  </p>
                </div>
              </div>}
        </Card>
      </div>

      {/* ── Row 3: Status timeline + Popular books ─────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Stacked bar — status breakdown over time */}
        <Card className="p-5">
          <SectionLabel icon={Activity}>Loan Status Timeline</SectionLabel>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={statusTimeline} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#64748b" strokeOpacity={0.2} />
              <XAxis dataKey="month" {...axisStyle} tickLine={false} tickFormatter={(v) => v.slice(5)} />
              <YAxis {...axisStyle} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="Returned" stackId="a" fill={C.green}  radius={[0,0,0,0]} maxBarSize={48} />
              <Bar dataKey="Active"   stackId="a" fill={C.brand}  radius={[0,0,0,0]} maxBarSize={48} />
              <Bar dataKey="Overdue"  stackId="a" fill={C.rose}   radius={[6,6,0,0]} maxBarSize={48} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '20px' }}
                formatter={(v) => <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{v}</span>} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Popular books horizontal bars */}
        <Card className="p-5">
          <SectionLabel icon={Sparkles}>Most Popular Books</SectionLabel>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={data?.popularBooks || []} layout="vertical"
              margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#64748b" strokeOpacity={0.2} horizontal={false} />
              <XAxis type="number" {...axisStyle} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="title" fontSize={11} stroke="transparent"
                tick={{ fill: 'currentColor', fontWeight: 600, fontSize: 12 }}
                tickLine={false} width={180}
                tickFormatter={(v) => v.length > 25 ? `${v.slice(0, 25)}…` : v} />
              <Tooltip content={<ChartTooltip labelMap={{ borrow_count: 'Times Borrowed' }} />} />
              <Bar dataKey="borrow_count" radius={[0, 8, 8, 0]} maxBarSize={28}>
                {(data?.popularBooks || []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Row 4: Radar + Author chart + Category util + Activity ─ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Radar — category book distribution */}
        <Card className="p-5">
          <SectionLabel icon={BarChart3}>Category Radar</SectionLabel>
          {radarData.length === 0
            ? <div className="flex items-center justify-center h-80 text-slate-400 text-sm">No categories yet.</div>
            : <ResponsiveContainer width="100%" height={380}>
                <RadarChart data={radarData} margin={{ top: 12, right: 20, left: 20, bottom: 12 }}>
                  <PolarGrid stroke="#64748b" strokeOpacity={0.3} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 13, fontWeight: 600 }} />
                  <Radar name="Books" dataKey="books" stroke={C.brand} fill={C.brand} fillOpacity={0.25} dot={{ r: 5, fill: C.brand }} />
                  <Tooltip content={<ChartTooltip />} />
                </RadarChart>
              </ResponsiveContainer>}
        </Card>

        {/* Top authors bar */}
        <Card className="p-5">
          <SectionLabel icon={Sparkles}>Top Authors</SectionLabel>
          {topAuthors.length === 0
            ? <div className="flex items-center justify-center h-80 text-slate-400 text-sm">No data yet.</div>
            : <ResponsiveContainer width="100%" height={380}>
                <BarChart data={topAuthors} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
                  <XAxis type="number" {...axisStyle} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="author" fontSize={12} stroke="transparent"
                    tick={{ fill: 'currentColor', fontWeight: 600, fontSize: 12 }} tickLine={false} width={140}
                    tickFormatter={(v) => v.length > 20 ? `${v.slice(0, 20)}…` : v} />
                  <Tooltip content={<ChartTooltip labelMap={{ borrow_count: 'Borrows' }} />} />
                  <Bar dataKey="borrow_count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {topAuthors.map((_, i) => <Cell key={i} fill={PIE_COLORS[(i + 2) % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>}
        </Card>

        {/* Category utilization progress bars */}
        <Card className="p-5">
          <SectionLabel icon={BarChart3}>Category Utilization</SectionLabel>
          <div className="space-y-5 mt-4">
            {catUtil.length === 0
              ? <p className="text-sm text-slate-400 text-center pt-16">No data yet.</p>
              : catUtil.map((c, i) => (
                <UtilBar key={c.category}
                  label={c.category}
                  total={Number(c.total)}
                  borrowed={Number(c.borrowed)}
                  color={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
          </div>
        </Card>

        {/* Recent activity feed */}
        {isAdmin && (
          <Card className="p-5">
            <SectionLabel icon={Activity}>Live Activity</SectionLabel>
            <ul className="space-y-4 max-h-[380px] overflow-y-auto pr-2 mt-4">
              {(data?.recentActivity || []).map((a) => (
                <li key={a.id} className="flex gap-3 border-b border-brand-500/10 pb-3 last:border-0">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-500 shrink-0 ring-4 ring-brand-500/10" />
                  <div className="min-w-0">
                    <p className="text-sm leading-snug text-slate-700 dark:text-slate-200">
                      <span className="font-semibold">{a.first_name ? `${a.first_name} ${a.last_name}` : 'System'}</span>{' '}
                      <span className="text-slate-500">{a.action.replace(/_/g, ' ').toLowerCase()}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{formatDateTime(a.created_at)}</p>
                  </div>
                </li>
              ))}
              {(!data?.recentActivity || data.recentActivity.length === 0) &&
                <p className="text-sm text-slate-400 text-center pt-16">No activity yet.</p>}
            </ul>
          </Card>
        )}
      </div>

      {isAdmin && <BroadcastModal open={isBroadcastOpen} onClose={() => setIsBroadcastOpen(false)} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ROUTE
═══════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase();
  if (role === 'user') return <UserDashboard user={user} />;
  return <StaffDashboard user={user} />;
}
