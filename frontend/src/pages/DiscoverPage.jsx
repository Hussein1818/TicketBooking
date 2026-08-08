import {
  Search,
  SlidersHorizontal,
  Calendar,
  MapPin,
  Users,
  Zap,
  Loader2,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import EventCard from "../components/EventCard";
import { getEvents } from "../services/eventsApi";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";


const CATEGORIES = [
  "ALL CATEGORIES",
  "Cinema",
  "Anime",
  "Gaming",
  "Music",
  "Art",
  "Shows",
  "Tech",
  "Entrepreneurship",
  "Business",
  "Workshops",
  "Self Growth",
  "Sports",
];

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop";

function getImageSrc(imageUrl) {
  if (!imageUrl) return FALLBACK_IMG;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BASE_URL}${imageUrl}`;
}

function formatAttending(count) {
  if (!count || count === 0) return null;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K+ Attending`;
  return `${count}+ Attending`;
}

function formatPrice(price) {
  if (price === undefined || price === null || price === 0) return "Free";
  return `EGP ${Number(price).toLocaleString()}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "TBA";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function DiscoverPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState(
    location.state?.category || "ALL CATEGORIES"
  );
  const [search, setSearch] = useState("");
  const PAGE_SIZE = 48;

  useEffect(() => {
    const fetchEvents = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        // Pass category to API when not "ALL CATEGORIES"
        const category = activeCategory !== "ALL CATEGORIES" ? activeCategory : undefined;
        const data = await getEvents({ page, pageSize: PAGE_SIZE, category });
        const list = Array.isArray(data) ? data : (data?.items || data?.data || []);

        if (list.length < PAGE_SIZE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        setEvents(prev => page === 1 ? list : [...prev, ...list]);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    fetchEvents();
  }, [page, activeCategory]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchCat =
        activeCategory === "ALL CATEGORIES" ||
        (e.category || "").toUpperCase() === activeCategory.toUpperCase();
      const matchSearch =
        !search ||
        (e.name || e.title || "").toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [events, activeCategory, search]);

  // Hero = first event in the filtered list
  const heroEvent = filtered[0] || null;
  const restEvents = filtered.slice(1);

  return (
    <DashboardLayout>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-6xl px-4 py-8"
      >
        {/* ── Header ── */}
        <motion.div
          variants={itemVariants}
          className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
        >
          <div>
            <h1 className="mb-3 text-5xl font-bold tracking-tighter text-white drop-shadow-md">
              Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">Velocity</span>
            </h1>
            <p className="max-w-lg text-base text-zinc-400 leading-relaxed">
              Access elite tech summits, underground raves, and private circuits curated just for you.
            </p>
          </div>

          <div className="flex w-full items-center gap-3 md:w-auto">
            <div className="relative flex-1 md:w-72">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="w-full rounded-full bg-white/[0.03] border border-white/10 py-3.5 pl-12 pr-5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:bg-white/[0.05] focus:border-[#14B8A6]/50 transition-all backdrop-blur-md shadow-inner"
              />
            </div>
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.03] border border-white/10 transition-all hover:bg-white/[0.08] backdrop-blur-md">
              <SlidersHorizontal className="h-5 w-5 text-zinc-300" />
            </button>
          </div>
        </motion.div>

        {/* ── Category Filter Chips ── */}
        <motion.div variants={itemVariants} className="mb-10 flex flex-wrap gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setPage(1); setEvents([]); }}
              className={`rounded-full px-5 py-2 text-xs font-bold tracking-widest transition-all duration-300 backdrop-blur-md shadow-sm ${
                activeCategory === cat
                  ? "bg-gradient-to-r from-[#14B8A6] to-[#0F766E] text-white shadow-[0_0_15px_rgba(20,184,166,0.3)] scale-105"
                  : "bg-white/[0.02] border border-white/10 text-zinc-300 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* ── Hero + Side Panel ── */}
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#14B8A6]" />
          </div>
        ) : heroEvent ? (
          <motion.div
            variants={itemVariants}
            className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-3"
          >
            {/* Hero Card */}
            <div className="relative flex min-h-[450px] flex-col justify-end overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-10 lg:col-span-2 shadow-2xl group">
              <div className="absolute inset-0 z-0">
                <img
                  src={getImageSrc(heroEvent.imageUrl || heroEvent.coverImage)}
                  alt={heroEvent.name}
                  className="h-full w-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
              </div>

              <div className="relative z-10 w-full">
                <div className="mb-5 flex gap-3">
                  <span className="rounded-full bg-gradient-to-r from-[#14B8A6] to-[#0F766E] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_0_10px_rgba(20,184,166,0.3)]">
                    Featured
                  </span>
                  {heroEvent.isClosed && (
                    <span className="rounded-full bg-red-500/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                      Closed
                    </span>
                  )}
                  {heroEvent.category && (
                    <span className="rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                      {heroEvent.category}
                    </span>
                  )}
                </div>

                <h2 className="mb-4 text-4xl font-bold uppercase tracking-tighter text-white sm:text-5xl drop-shadow-md">
                  {heroEvent.name || heroEvent.title || "Unnamed Event"}
                </h2>

                <div className="mb-8 flex flex-wrap gap-5 text-sm font-medium text-zinc-300">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                      <Calendar className="h-4 w-4 text-[#14B8A6]" />
                    </div>
                    {formatDate(heroEvent.eventDate || heroEvent.date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                      <MapPin className="h-4 w-4 text-[#14B8A6]" />
                    </div>
                    {heroEvent.venue || heroEvent.location || "TBA"}
                  </div>
                  {heroEvent.attendingCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                        <Users className="h-4 w-4 text-[#14B8A6]" />
                      </div>
                      {formatAttending(heroEvent.attendingCount)}
                    </div>
                  )}
                </div>

                <div className="mt-auto flex flex-col items-start justify-between border-t border-white/10 pt-6 sm:flex-row sm:items-end">
                  <div>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                      Entry From
                    </p>
                    <p className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                      {formatPrice(heroEvent.ticketPrice ?? heroEvent.price)}
                    </p>
                  </div>
                  <Link
                    to={`/booking/${heroEvent.id}`}
                    className="mt-6 rounded-full bg-white px-10 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-zinc-200 sm:mt-0 hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Side Panel */}
            <div className="flex flex-col gap-8">
              {/* Fast Track Card */}
              <div className="relative flex h-full flex-col justify-center rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 shadow-2xl overflow-hidden group">
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#14B8A6]/20 blur-[60px] rounded-full pointer-events-none group-hover:opacity-70 transition-opacity"></div>
                <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-6 shadow-inner relative z-10">
                  <Zap className="h-6 w-6 text-[#14B8A6]" />
                </div>
                <h3 className="mb-3 text-2xl font-bold tracking-tight text-white relative z-10">
                  Fast Track Access
                </h3>
                <p className="mb-8 text-sm leading-relaxed text-zinc-400 relative z-10">
                  Skip the queue at all partnered events with Obsidian VIP membership.
                </p>
                <Link to="/vip" className="block text-center w-full rounded-full bg-white/5 border border-white/10 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10 hover:border-white/20 relative z-10">
                  Learn More
                </Link>
              </div>

              {/* Second event as side card (or static banner) */}
              {restEvents[0] ? (
                <Link
                  to={`/booking/${restEvents[0].id}`}
                  className="group relative flex min-h-[160px] h-full cursor-pointer flex-col justify-end overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 shadow-2xl"
                >
                  <div className="absolute inset-0 z-0">
                    <img
                      src={getImageSrc(restEvents[0].imageUrl || restEvents[0].coverImage)}
                      alt={restEvents[0].name}
                      className="h-full w-full object-cover opacity-40 transition-all duration-700 group-hover:scale-105 group-hover:opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  </div>
                  <div className="relative z-10 flex w-full items-end justify-between">
                    <div>
                      <h3 className="mb-2 text-xl font-bold tracking-tight text-white drop-shadow-md">
                        {(restEvents[0].name || restEvents[0].title || "").toUpperCase()}
                      </h3>
                      <p className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">
                        {formatPrice(restEvents[0].ticketPrice ?? restEvents[0].price)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                        {restEvents[0].venue || restEvents[0].location || ""}
                      </p>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="group relative flex min-h-[160px] h-full cursor-pointer flex-col justify-end overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 shadow-2xl">
                  <div className="absolute inset-0 z-0">
                    <img
                      src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop"
                      alt="Cyber Circuit"
                      className="h-full w-full object-cover opacity-30 transition-all duration-700 group-hover:scale-105 group-hover:opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  </div>
                  <div className="relative z-10 flex w-full items-end justify-between">
                    <div>
                      <h3 className="mb-2 text-xl font-bold tracking-tight text-white">
                        CYBER CIRCUIT 01
                      </h3>
                      <p className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">120.00 EGP</p>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                      BERLIN / NOV 12
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}

        {/* ── All Events Grid ── */}
        <motion.div
          variants={itemVariants}
          className="mb-8 text-2xl font-bold tracking-tight text-white"
        >
          {activeCategory === "ALL CATEGORIES" ? "All Experiences" : activeCategory}
        </motion.div>

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#14B8A6]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {restEvents.length > 0 ? (
              restEvents.map((event, index) => (
                <motion.div variants={itemVariants} key={event.id || index}>
                  <Link to={`/booking/${event.id}`} className="block h-full transition-transform hover:-translate-y-2 duration-300">
                    <EventCard 
                      image={getImageSrc(event.imageUrl || event.coverImage)}
                      location={event.venue || event.location || "TBA"}
                      date={formatDate(event.eventDate || event.date)}
                      status={event.isClosed ? 'CLOSED' : (event.category ? event.category.toUpperCase() : "AVAILABLE")}
                      title={event.name || event.title || "Unnamed Event"}
                      description={event.description || "No description available."}
                      price={formatPrice(event.ticketPrice ?? event.price)}
                    />
                  </Link>
                </motion.div>
              ))
            ) : (
              !loading && filtered.length <= 1 && (
                <div className="col-span-3 rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl py-16 text-center text-lg font-medium tracking-tight text-zinc-400 shadow-xl">
                  <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center border border-white/5 mx-auto mb-6">
                    <Calendar className="w-8 h-8 text-zinc-600" />
                  </div>
                  No events found in this category
                </div>
              )
            )}
          </div>
        )}

        {/* ── Load More Button ── */}
        {!loading && hasMore && filtered.length > 0 && (
          <motion.div variants={itemVariants} className="mt-16 flex justify-center pb-12">
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={loadingMore}
              className="flex items-center gap-3 rounded-full bg-white/[0.03] border border-white/10 px-10 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-white/[0.08] disabled:opacity-50 shadow-lg backdrop-blur-md"
            >
              {loadingMore && <Loader2 className="h-5 w-5 animate-spin text-[#14B8A6]" />}
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
