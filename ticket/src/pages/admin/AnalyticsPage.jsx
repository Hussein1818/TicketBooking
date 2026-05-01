import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { ParentSize } from '@visx/responsive';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import {
  BarChart3, Calendar, MapPin, Loader2, AlertCircle,
  TrendingUp, Ticket, Users, DollarSign, Star, ChevronLeft, RefreshCw, Trash2
} from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { getEventAnalytics, deleteEvent } from '../../services/adminApi';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ticketok.runasp.net';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1540039155733-d76d6c482ce5?q=80&w=800&auto=format&fit=crop';

const resolveImg = (url) => !url ? FALLBACK_IMG : url.startsWith('http') ? url : `${BASE_URL}${url}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA';
const formatPrice = (p) => (!p || p === 0) ? 'Free' : `EGP ${Number(p).toLocaleString()}`;

// ── Mini bar chart ───────────────────────────────────────────────
function AnalyticsBarChart({ data, width, height }) {
  if (!data?.length || width < 10) return null;
  const xScale = scaleBand({ range: [0, width], domain: data.map((_, i) => i), padding: 0.25 });
  const yScale = scaleLinear({ range: [height, 0], domain: [0, Math.max(...data.map((d) => d.value ?? 0), 1)] });
  return (
    <svg width={width} height={height}>
      <Group>
        {data.map((d, i) => {
          const bh = height - (yScale(d.value ?? 0) ?? 0);
          return (
            <Bar key={i} x={xScale(i)} y={height - bh} width={xScale.bandwidth()} height={bh}
              fill={i === data.length - 1 ? '#30d8c0' : '#272b30'} rx={2} />
          );
        })}
      </Group>
    </svg>
  );
}

// ── Stat card ────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent = 'text-teal-400', sub }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#111214] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent}`} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

// ── Event selector card ──────────────────────────────────────────
function EventCard({ event, selected, onClick }) {
  const img = resolveImg(event.imageUrl || event.coverImage);
  const name = event.name || event.title || 'Unnamed Event';
  return (
    <button
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-xl border text-left transition-all duration-200 ${
        selected
          ? 'border-teal-400/60 ring-1 ring-teal-400/40 shadow-[0_0_16px_rgba(48,216,192,0.15)]'
          : 'border-white/5 hover:border-white/20'
      }`}
    >
      {/* Image */}
      <div className="relative h-32 overflow-hidden bg-zinc-900">
        <img src={img} alt={name}
          className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${selected ? 'opacity-80' : 'opacity-50 group-hover:opacity-70'}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111214] via-[#111214]/40 to-transparent" />
        {selected && (
          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-teal-400">
            <BarChart3 className="h-3 w-3 text-black" />
          </div>
        )}
        {event.category && (
          <span className="absolute left-2 top-2 rounded bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
            {event.category}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="bg-[#16171a] p-3">
        <p className="mb-1.5 truncate text-sm font-semibold text-white">{name}</p>
        <div className="flex flex-wrap gap-2 text-[10px] text-zinc-500">
          {(event.eventDate || event.date) && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(event.eventDate || event.date)}
            </span>
          )}
          {(event.venue || event.location) && (
            <span className="flex items-center gap-1 truncate max-w-[120px]">
              <MapPin className="h-3 w-3" />
              {event.venue || event.location}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs font-bold text-teal-400">
          {formatPrice(event.ticketPrice ?? event.price)}
        </p>
      </div>
    </button>
  );
}

export default function AnalyticsPage() {
  const token = useAuthStore((s) => s.token);

  // ── Events list ───────────────────────────────────────────────
  const [events, setEvents]           = useState([]);
  const [eventsLoading, setEvtLoad]   = useState(true);
  const [eventsError, setEvtError]    = useState('');

  // ── Selected event + its analytics ───────────────────────────
  const [selected, setSelected]       = useState(null);
  const [analytics, setAnalytics]     = useState(null);
  const [analyticsLoading, setALoad]  = useState(false);
  const [analyticsError, setAError]   = useState('');

  // ── Delete State ───────────────────────────────────────────────
  const [isDeleting, setIsDeleting]           = useState(false);
  const [deleteError, setDeleteError]         = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Fetch all events ──────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      setEvtLoad(true);
      try {
        const res  = await axios.get(`${BASE_URL}/api/Events?page=1&pageSize=1000`);
        const data = res.data?.items || res.data || [];
        setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        setEvtError('Failed to load events.');
      } finally {
        setEvtLoad(false);
      }
    };
    fetch();
  }, []);

  // ── Fetch analytics for selected event ────────────────────────
  const fetchAnalytics = async (event) => {
    setSelected(event);
    setAnalytics(null);
    setAError('');
    setALoad(true);
    try {
      const data = await getEventAnalytics(event.id, token);
      setAnalytics(data);
    } catch (e) {
      setAError(
        e?.response?.data?.message || e?.response?.data?.title || e?.message || 'Failed to fetch analytics.'
      );
    } finally {
      setALoad(false);
    }
  };

  const clearSelection = () => { 
    setSelected(null); 
    setAnalytics(null); 
    setAError(''); 
    setDeleteError('');
    setShowDeleteConfirm(false);
  };

  const handleDeleteEvent = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteEvent(selected.id, token);
      setEvents(events.filter(e => e.id !== selected.id));
      clearSelection();
    } catch (e) {
      setDeleteError(
        e?.response?.data?.message || e?.response?.data?.title || e?.message || 'Failed to delete event.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Derived analytics values ──────────────────────────────────
  const revenue   = analytics?.revenue       ?? analytics?.totalRevenue   ?? null;
  const sold      = analytics?.ticketsSold   ?? analytics?.sold           ?? null;
  const capacity  = analytics?.totalCapacity ?? analytics?.capacity       ?? null;
  const attendees = analytics?.attendees     ?? analytics?.totalAttendees ?? null;
  const avgRating = analytics?.averageRating ?? analytics?.rating         ?? null;
  const remaining = capacity !== null && sold !== null ? capacity - sold : null;
  const soldPct   = capacity && sold ? Math.round((sold / capacity) * 100) : null;

  const buildChartData = (a) => {
    if (!a) return [];
    if (Array.isArray(a.salesByDay))   return a.salesByDay.map((v, i) => ({ value: Number(v) }));
    if (Array.isArray(a.dailySales))   return a.dailySales.map((v) => ({ value: Number(v) }));
    if (Array.isArray(a.salesHistory)) return a.salesHistory.map((v) => ({ value: Number(v.value ?? v) }));
    return [];
  };
  const chartData = buildChartData(analytics);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-12">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
              <BarChart3 className="h-6 w-6 text-teal-400" />
              Event Analytics
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {selected ? `Viewing: ${selected.name || selected.title}` : 'Select an event to view detailed analytics.'}
            </p>
          </div>
          {selected && (
            <button onClick={clearSelection}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1e1f23] px-3 py-2 text-sm text-zinc-400 transition hover:border-white/30 hover:text-white">
              <ChevronLeft className="h-4 w-4" /> All Events
            </button>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            EVENTS GRID — always visible
        ══════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-white/5 bg-[#16171a] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
              {selected ? 'Switch Event' : 'Choose an Event'}
            </h2>
            <span className="text-xs text-zinc-600">{events.length} events</span>
          </div>

          {eventsError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" /> {eventsError}
            </div>
          )}

          {eventsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
            </div>
          ) : events.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">No events found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {events.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  selected={selected?.id === ev.id}
                  onClick={() => fetchAnalytics(ev)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            ANALYTICS PANEL — shown after selection
        ══════════════════════════════════════════════════════ */}
        {selected && (
          <div className="space-y-5">

            {/* Selected event banner */}
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#16171a]">
              <div className="absolute inset-0 z-0">
                <img src={resolveImg(selected.imageUrl || selected.coverImage)}
                  alt={selected.name} className="h-full w-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#16171a] via-[#16171a]/80 to-[#16171a]/40" />
              </div>
              <div className="relative z-10 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-400">Analyzing</p>
                  <h2 className="mt-1 text-xl font-bold text-white">
                    {selected.name || selected.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-400">
                    {(selected.eventDate || selected.date) && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-teal-400" />
                        {formatDate(selected.eventDate || selected.date)}
                      </span>
                    )}
                    {(selected.venue || selected.location) && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-teal-400" />
                        {selected.venue || selected.location}
                      </span>
                    )}
                  </div>
                </div>
                {analytics && (
                  <div className="flex shrink-0 items-center gap-2">
                    {showDeleteConfirm ? (
                      <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                        <span className="text-xs font-medium text-zinc-400">Are you sure?</span>
                        <button onClick={handleDeleteEvent} disabled={isDeleting}
                          className="flex items-center gap-2 rounded-lg bg-red-500/20 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/30 disabled:opacity-60">
                          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Delete'}
                        </button>
                        <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}
                          className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-60">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20 hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                        <button onClick={() => fetchAnalytics(selected)} disabled={analyticsLoading}
                          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-teal-400/30 hover:text-white disabled:opacity-60">
                          <RefreshCw className={`h-4 w-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
                          Refresh
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Delete Error */}
            {deleteError && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" /> {deleteError}
              </div>
            )}

            {/* Loading */}
            {analyticsLoading && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/5 bg-[#16171a] py-16">
                <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
                <p className="text-sm text-zinc-400">Loading analytics...</p>
              </div>
            )}

            {/* Error */}
            {analyticsError && !analyticsLoading && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" /> {analyticsError}
              </div>
            )}

            {/* Results */}
            {analytics && !analyticsLoading && (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard icon={DollarSign} label="Revenue"
                    value={revenue !== null ? `EGP ${Number(revenue).toLocaleString()}` : null}
                    accent="text-teal-400" />
                  <StatCard icon={Ticket} label="Tickets Sold"
                    value={sold !== null ? Number(sold).toLocaleString() : null}
                    sub={soldPct !== null ? `${soldPct}% of capacity` : null}
                    accent="text-blue-400" />
                  <StatCard icon={Users} label="Remaining"
                    value={remaining !== null ? Number(remaining).toLocaleString() : null}
                    sub={capacity !== null ? `of ${Number(capacity).toLocaleString()} total` : null}
                    accent="text-violet-400" />
                  <StatCard
                    icon={Star}
                    label={attendees !== null ? 'Attendees' : 'Avg Rating'}
                    value={
                      attendees !== null
                        ? Number(attendees).toLocaleString()
                        : avgRating !== null
                        ? `${Number(avgRating).toFixed(1)} / 5`
                        : null
                    }
                    accent="text-amber-400"
                  />
                </div>

                {/* Chart */}
                {chartData.length > 1 && (
                  <div className="rounded-xl border border-white/5 bg-[#16171a] p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-teal-400" />
                      <h2 className="text-sm font-bold text-white">Sales Trend</h2>
                    </div>
                    <div className="h-[140px] w-full">
                      <ParentSize>
                        {({ width, height }) => (
                          <AnalyticsBarChart data={chartData} width={width} height={height} />
                        )}
                      </ParentSize>
                    </div>
                  </div>
                )}

                {/* Raw JSON */}
                <details className="rounded-xl border border-white/5 bg-[#16171a] p-4">
                  <summary className="cursor-pointer select-none text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                    Raw API Response
                  </summary>
                  <pre className="mt-4 overflow-x-auto rounded-lg bg-[#0a0a0c] p-4 text-xs text-zinc-400 leading-relaxed">
                    {JSON.stringify(analytics, null, 2)}
                  </pre>
                </details>
              </>
            )}
          </div>
        )}

        {/* Empty hint */}
        {!selected && !eventsLoading && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-12">
            <BarChart3 className="h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">Click any event card above to load its analytics</p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
