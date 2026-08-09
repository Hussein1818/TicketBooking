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
import useAuthStore from '../../store/useAuthStore';
import { getEventAnalytics, deleteEvent } from '../../services/adminApi';
import { getEvents } from '../../services/eventsApi';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1540039155733-d76d6c482ce5?q=80&w=800&auto=format&fit=crop';
const _BASE = import.meta.env.VITE_API_BASE_URL || 'https://ticketok.runasp.net';
const resolveImg = (url) => !url ? FALLBACK_IMG : url.startsWith('http') ? url : `${_BASE}${url}`;
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
// eslint-disable-next-line no-unused-vars
function StatCard({ icon: Icon, label, value, accent = 'text-[#14B8A6]', sub }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-5 backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-1 hover:bg-white/[0.04] duration-300">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/40 border border-white/5 shadow-inner ${accent}`}>
          <Icon className="h-5 w-5 drop-shadow-sm" />
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
        <p className="truncate text-3xl font-bold text-white drop-shadow-sm">{value ?? '—'}</p>
        {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
      </div>
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
      className={`group relative w-full overflow-hidden rounded-[1.5rem] border text-left transition-all duration-300 ${
        selected
          ? 'border-[#14B8A6]/60 ring-1 ring-[#14B8A6]/40 shadow-[0_0_20px_rgba(20,184,166,0.15)] bg-white/[0.04]'
          : 'border-white/5 bg-white/[0.02] backdrop-blur-xl hover:border-white/20 hover:bg-white/[0.04]'
      }`}
    >
      {/* Image */}
      <div className="relative h-32 overflow-hidden bg-zinc-900/50">
        <img src={img} alt={name}
          className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${selected ? 'opacity-80' : 'opacity-50 group-hover:opacity-70'}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        {selected && (
          <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#14B8A6] shadow-[0_0_10px_rgba(20,184,166,0.5)]">
            <BarChart3 className="h-3.5 w-3.5 text-black" />
          </div>
        )}
        {event.category && (
          <span className="absolute left-2 top-2 rounded bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
            {event.category}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="mb-1.5 truncate text-sm font-bold text-white drop-shadow-sm">{name}</p>
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
        <p className="mt-2 text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">
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
    const fetchAllEvents = async () => {
      setEvtLoad(true);
      try {
        const data = await getEvents({ page: 1, pageSize: 1000 });
        setEvents(Array.isArray(data) ? data : (data?.items || []));
      } catch {
        setEvtError('Failed to load events.');
      } finally {
        setEvtLoad(false);
      }
    };
    fetchAllEvents();
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
        e?.response?.data?.detail || e?.response?.data?.message || e?.response?.data?.title || (typeof e?.response?.data === 'string' ? e?.response?.data : null) || e?.message || 'Failed to delete event.'
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
    if (Array.isArray(a.salesByDay))   return a.salesByDay.map((v) => ({ value: Number(v) }));
    if (Array.isArray(a.dailySales))   return a.dailySales.map((v) => ({ value: Number(v) }));
    if (Array.isArray(a.salesHistory)) return a.salesHistory.map((v) => ({ value: Number(v.value ?? v) }));
    return [];
  };
  const chartData = buildChartData(analytics);

  return (
    <DashboardLayout>
      {selected ? (
        <>
          {/* Immersive Hero Header */}
          <div className="relative -mx-4 md:-mx-8 -mt-6 md:-mt-10 h-[50vh] min-h-[400px] bg-[#111214] mb-8">
            <div className="absolute inset-0 z-0">
              <img 
                src={resolveImg(selected.imageUrl || selected.coverImage)} 
                alt={selected.name} 
                className="w-full h-full object-cover opacity-80"
                style={{ maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)', WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)' }}
              />
            </div>
            
            {/* Overlay Event Details */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 md:p-12 pb-16">
              <div className="max-w-4xl mx-auto w-full">
                <p className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-2">Analyzing</p>
                <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-lg mb-4 leading-none">
                  {selected.name || selected.title}
                </h1>
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex flex-wrap items-center gap-6 text-sm md:text-base font-bold text-zinc-300 uppercase tracking-widest drop-shadow-md">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#14B8A6]" />
                      {selected.eventDate || selected.date ? formatDate(selected.eventDate || selected.date) : "No Date"}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#14B8A6]" />
                      {selected.venue || selected.location || "No Location"}
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex shrink-0 items-center gap-2">
                    {showDeleteConfirm ? (
                      <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200 bg-black/50 p-2 rounded-xl backdrop-blur-md border border-white/10">
                        <span className="text-xs font-medium text-zinc-300 px-2">Are you sure?</span>
                        <button onClick={handleDeleteEvent} disabled={isDeleting}
                          className="flex items-center gap-2 rounded-lg bg-red-500/80 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-red-500 disabled:opacity-60">
                          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Delete'}
                        </button>
                        <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}
                          className="rounded-lg bg-white/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/30 disabled:opacity-60">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center gap-2 rounded-xl bg-red-500/20 backdrop-blur-md px-5 py-2.5 text-sm font-bold text-red-400 shadow-lg border border-red-500/30 transition hover:bg-red-500/30 hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                        <button onClick={() => fetchAnalytics(selected)} disabled={analyticsLoading}
                          className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-white/20 hover:border-teal-400/50 hover:text-teal-400 disabled:opacity-60">
                          <RefreshCw className={`h-4 w-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
                          Refresh
                        </button>
                        <button onClick={clearSelection}
                          className="flex items-center gap-2 rounded-xl bg-white border border-white/10 px-5 py-2.5 text-sm font-bold text-black shadow-lg transition hover:bg-zinc-200">
                          <ChevronLeft className="h-4 w-4" /> All Events
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mx-auto max-w-7xl space-y-8 pb-12 px-4">
            {/* Delete Error */}
            {deleteError && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" /> {deleteError}
              </div>
            )}

            {/* Loading */}
            {analyticsLoading && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl py-24">
                <Loader2 className="h-10 w-10 animate-spin text-teal-400" />
                <p className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Loading analytics...</p>
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
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                   <StatCard icon={DollarSign} label="Revenue"
                    value={revenue !== null ? `EGP ${Number(revenue).toLocaleString()}` : null}
                    accent="text-[#14B8A6]" />
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
                  <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl p-8 lg:p-10">
                    <div className="mb-6 flex items-center gap-3">
                      <TrendingUp className="h-6 w-6 text-[#14B8A6]" />
                      <h2 className="text-xl font-bold text-white drop-shadow-sm uppercase tracking-widest">Sales Trend</h2>
                    </div>
                    <div className="h-[200px] w-full">
                      <ParentSize>
                        {({ width, height }) => (
                          <AnalyticsBarChart data={chartData} width={width} height={height} />
                        )}
                      </ParentSize>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Events Grid Selection */}
            <div className="mt-16 rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl p-8 lg:p-10">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white drop-shadow-sm uppercase tracking-widest">Switch Event</h2>
                  <p className="text-sm text-zinc-400 mt-1">Select another event to view its analytics.</p>
                </div>
                <span className="text-xs font-bold text-zinc-600 bg-white/5 px-3 py-1 rounded-full">{events.length} events</span>
              </div>
              
              {eventsError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 mb-6">
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
          </div>
        </>
      ) : (
        <>
          {/* Ambient Lighting */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-[#0F766E]/15 blur-[150px] rounded-full mix-blend-screen" />
            <div className="absolute top-[40%] right-[-10%] w-[700px] h-[700px] bg-[#14B8A6]/10 blur-[150px] rounded-full mix-blend-screen" />
            <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-[#0F766E]/15 blur-[180px] rounded-full mix-blend-screen" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl space-y-8 pb-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">
            {/* ── Page header ── */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tighter text-white drop-shadow-md">
                  <BarChart3 className="h-8 w-8 text-[#14B8A6]" />
                  Event <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">Analytics</span>
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Select an event to view detailed analytics.
                </p>
              </div>
            </div>

            {/* EVENTS GRID */}
            <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl p-8 lg:p-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                  Choose an Event
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
            
            {/* Empty hint */}
            {!eventsLoading && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-12">
                <BarChart3 className="h-8 w-8 text-zinc-700" />
                <p className="text-sm text-zinc-500">Click any event card above to load its analytics</p>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
