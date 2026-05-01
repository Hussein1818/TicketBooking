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
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import EventCard from "../components/EventCard";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";

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
  const [activeCategory, setActiveCategory] = useState("ALL CATEGORIES");
  const [search, setSearch] = useState("");
  const PAGE_SIZE = 12;

  useEffect(() => {
    const fetchEvents = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const response = await axios.get(`${BASE_URL}/api/Events?page=${page}&pageSize=${PAGE_SIZE}`);
        const data = response.data?.items || response.data || [];
        
        if (data.length < PAGE_SIZE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        setEvents(prev => page === 1 ? (Array.isArray(data) ? data : []) : [...prev, ...(Array.isArray(data) ? data : [])]);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    fetchEvents();
  }, [page]);

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
        className="mx-auto max-w-6xl"
      >
        {/* ── Header ── */}
        <motion.div
          variants={itemVariants}
          className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"
        >
          <div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-white">
              Discover <span className="text-teal-400">Velocity</span>
            </h1>
            <p className="max-w-md text-sm text-zinc-400">
              Access elite tech summits, underground raves, and private circuits.
            </p>
          </div>

          <div className="flex w-full items-center gap-2 md:w-auto">
            <div className="relative flex-1 md:w-64">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="w-full rounded-lg bg-[#1a1b1f] py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
              />
            </div>
            <button className="flex h-[40px] items-center justify-center rounded-lg bg-[#1a1b1f] px-3 transition-colors hover:bg-white/5">
              <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
            </button>
          </div>
        </motion.div>

        {/* ── Category Filter Chips ── */}
        <motion.div variants={itemVariants} className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wider transition-colors ${
                activeCategory === cat
                  ? "bg-teal-400 text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* ── Hero + Side Panel ── */}
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-teal-400" />
          </div>
        ) : heroEvent ? (
          <motion.div
            variants={itemVariants}
            className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3"
          >
            {/* Hero Card */}
            <div className="relative flex min-h-[400px] flex-col justify-end overflow-hidden rounded-xl border border-white/5 bg-zinc-900 p-8 lg:col-span-2">
              <div className="absolute inset-0 z-0">
                <img
                  src={getImageSrc(heroEvent.imageUrl || heroEvent.coverImage)}
                  alt={heroEvent.name}
                  className="h-full w-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111214] via-[#111214]/60 to-transparent" />
              </div>

              <div className="relative z-10 w-full">
                <div className="mb-4 flex gap-2">
                  <span className="rounded bg-teal-400 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
                    Featured
                  </span>
                  {heroEvent.isClosed && (
                    <span className="rounded bg-red-500/80 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                      Closed
                    </span>
                  )}
                  {heroEvent.category && (
                    <span className="rounded bg-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                      {heroEvent.category}
                    </span>
                  )}
                </div>

                <h2 className="mb-3 text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl">
                  {heroEvent.name || heroEvent.title || "Unnamed Event"}
                </h2>

                <div className="mb-6 flex flex-wrap gap-4 text-xs font-medium text-zinc-300">
                  <div className="flex items-center gap-1.5 hover:text-white">
                    <Calendar className="h-4 w-4 text-teal-400" />
                    {formatDate(heroEvent.eventDate || heroEvent.date)}
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-white">
                    <MapPin className="h-4 w-4 text-teal-400" />
                    {heroEvent.venue || heroEvent.location || "TBA"}
                  </div>
                  {heroEvent.attendingCount > 0 && (
                    <div className="flex items-center gap-1.5 hover:text-white">
                      <Users className="h-4 w-4 text-teal-400" />
                      {formatAttending(heroEvent.attendingCount)}
                    </div>
                  )}
                </div>

                <div className="mt-auto flex flex-col items-start justify-between border-t border-white/10 pt-4 sm:flex-row sm:items-end">
                  <div>
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Entry From
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-white">
                      {formatPrice(heroEvent.ticketPrice ?? heroEvent.price)}
                    </p>
                  </div>
                  <Link
                    to={`/booking/${heroEvent.id}`}
                    className="mt-4 rounded bg-white px-8 py-3 text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200 sm:mt-0"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Side Panel */}
            <div className="flex flex-col gap-6">
              {/* Fast Track Card */}
              <div className="flex h-full flex-col justify-center rounded-xl border border-white/5 bg-[#1a1b1f] p-6">
                <Zap className="mb-4 h-6 w-6 text-teal-400" />
                <h3 className="mb-3 text-lg font-medium tracking-tight text-white">
                  Fast Track Access
                </h3>
                <p className="mb-6 text-xs leading-relaxed text-zinc-400">
                  Skip the queue at all partnered events with Obsidian VIP
                  membership.
                </p>
                <Link to="/vip" className="block text-center w-full rounded bg-white/5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/10">
                  Learn More
                </Link>
              </div>

              {/* Second event as side card (or static banner) */}
              {restEvents[0] ? (
                <Link
                  to={`/booking/${restEvents[0].id}`}
                  className="group relative flex min-h-[140px] h-full cursor-pointer flex-col justify-end overflow-hidden rounded-xl border border-white/5 bg-zinc-900 p-6"
                >
                  <div className="absolute inset-0 z-0">
                    <img
                      src={getImageSrc(restEvents[0].imageUrl || restEvents[0].coverImage)}
                      alt={restEvents[0].name}
                      className="h-full w-full object-cover opacity-30 transition-all duration-700 group-hover:scale-105 group-hover:opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#16171a] to-transparent" />
                  </div>
                  <div className="relative z-10 flex w-full items-end justify-between">
                    <div>
                      <h3 className="mb-1 text-sm font-medium tracking-tight text-white">
                        {(restEvents[0].name || restEvents[0].title || "").toUpperCase()}
                      </h3>
                      <p className="text-sm font-bold text-teal-400">
                        {formatPrice(restEvents[0].ticketPrice ?? restEvents[0].price)}
                      </p>
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                      {restEvents[0].venue || restEvents[0].location || ""}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="group relative flex min-h-[140px] h-full cursor-pointer flex-col justify-end overflow-hidden rounded-xl border border-white/5 bg-zinc-900 p-6">
                  <div className="absolute inset-0 z-0">
                    <img
                      src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop"
                      alt="Cyber Circuit"
                      className="h-full w-full object-cover opacity-30 transition-all duration-700 group-hover:scale-105 group-hover:opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#16171a] to-transparent" />
                  </div>
                  <div className="relative z-10 flex w-full items-end justify-between">
                    <div>
                      <h3 className="mb-1 text-sm font-medium tracking-tight text-white">
                        CYBER CIRCUIT 01
                      </h3>
                      <p className="text-sm font-bold text-teal-400">120.00 $</p>
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
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
          className="mb-4 text-xl font-bold uppercase tracking-wider text-white"
        >
          {activeCategory === "ALL CATEGORIES" ? "All Events" : activeCategory}
        </motion.div>

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-teal-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {restEvents.length > 0 ? (
              restEvents.map((event, index) => (
                <motion.div variants={itemVariants} key={event.id || index}>
                  <Link to={`/booking/${event.id}`} className="block h-full">
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
                <div className="col-span-3 rounded-xl border border-white/5 bg-[#1a1b1f]/50 py-10 text-center text-sm font-medium uppercase tracking-widest text-zinc-500">
                  No events found
                </div>
              )
            )}
          </div>
        )}

        {/* ── Load More Button ── */}
        {!loading && hasMore && filtered.length > 0 && (
          <motion.div variants={itemVariants} className="mt-12 flex justify-center pb-8">
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={loadingMore}
              className="flex items-center gap-2 rounded-lg bg-teal-500/10 px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-teal-400 transition-colors hover:bg-teal-500/20 disabled:opacity-50"
            >
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
