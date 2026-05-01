import { ArrowRight, Loader2 } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import EventCard from '../components/EventCard';
import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import LineWaves from '../components/LineWaves';
import LogoLoop from '../components/LogoLoop';
import { Spotify, Visa, Mastercard, Stripe, Apple, Google, Meta, Netflix, Twitch, Youtube, Discord, Slack, Airbnb } from 'brand-logos';
import qrImg from '../assets/qr.png';
import creditImg from '../assets/credet.png';
import ticketImg from '../assets/ticket.png';

const RedbullIcon = (props) => (
  <svg viewBox="0 0 120 40" {...props}>
    <text x="0" y="30" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="30" fontStyle="italic" letterSpacing="-1" fill="currentColor">Red Bull</text>
  </svg>
);

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore(state => state.token);
  const isAdmin = useAuthStore(state => state.isAdmin);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://ticketok.runasp.net';
        
        // Fetch events for everyone
        const eventsResponse = await axios.get(`${baseUrl}/api/Events?page=1&pageSize=6`);
        setEvents(eventsResponse.data?.items || eventsResponse.data || []);

        // Fetch stats if admin
        if (token && isAdmin) {
          const statsResponse = await axios.get(`${baseUrl}/api/Admin/dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setStats(statsResponse.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, isAdmin]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <DashboardLayout>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-6xl space-y-8 pb-12"
      >
        {/* Hero Section - New Design */}
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl border border-white/10  min-h-[400px] sm:min-h-[360px] flex flex-col items-center justify-center text-center px-6 py-16">
          {/* LineWaves Background — no pointer-events-none so mouse events reach canvas */}
          <div className="absolute inset-0">
            <LineWaves
              speed={0.4}
              innerLineCount={28}
              outerLineCount={5}
              warpIntensity={1.6}
              rotation={-30}
              edgeFadeWidth={0.5}
              colorCycleSpeed={0.5}
              brightness={0.15}
              color1="#ffffff"
              color2="#ffffff"
              color3="#14b8a6"
              enableMouseInteraction={true}
              mouseInfluence={1.5}
            />
          </div>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-[#111214]/30 pointer-events-none" />

          {/* Text content — pointer-events-none so mouse passes through to canvas, but buttons override with pointer-events-auto */}
          <div className="relative z-10 max-w-xl w-full pointer-events-none">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
              Ready for your next<br/>experience?
            </h1>
            <p className="text-sm text-zinc-200 leading-relaxed mb-8">
              Find events, pick your seat, and get your ticket instantly.<br/>
              Don't just watch… be there.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pointer-events-auto">
              <Link to="/events" className="w-full sm:w-auto rounded-lg bg-teal-400 px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-teal-300 text-center">
                Browse Events
              </Link>
              <Link to="/tickets" className="w-full sm:w-auto rounded-lg border border-white/20 bg-white/5 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 text-center backdrop-blur-sm">
                My Tickets
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Sponsor Logos Strip */}
        <motion.div variants={itemVariants} className="mt-8">
          <p className="text-center text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-4">Trusted By</p>
          <LogoLoop 
            logos={[
              { name: 'Spotify', icon: Spotify },
              { name: 'Visa', icon: Visa },
              { name: 'Stripe', icon: Stripe },
              { name: 'Google', icon: Google },
              { name: 'Meta', icon: Meta },
              { name: 'Netflix', icon: Netflix },
              { name: 'Youtube', icon: Youtube },
              { name: 'Discord', icon: Discord },
              { name: 'Slack', icon: Slack },
              { name: 'Airbnb', icon: Airbnb },
            ]} 
            speed={25} 
            gap={64} 
          />
        </motion.div>
           {/* Platform Features - New Design */}
        <motion.div variants={itemVariants} className="mt-8 rounded-2xl bg-[#111214]">
          <h2 className="text-2xl font-bold text-white mb-2">Platform Features</h2>
          <p className="text-sm text-zinc-400 mb-8 max-w-md">
            A smart booking experience that lets you choose your seat in real time, pay securely, and receive your digital ticket instantly.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* QR Code - Large */}
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#1a1b1f] p-6 md:row-span-2 flex flex-col justify-between min-h-[200px]">
              <div className="relative z-10">
                <h3 className="text-base font-bold text-white mb-2">QR Code Entry</h3>
                <p className="text-xs text-zinc-400 leading-relaxed drop-shadow-md">
                  Each ticket includes a unique QR code that can be scanned at the event entrance for quick and secure verification.
                </p>
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="absolute -bottom-4 -right-2 pointer-events-none z-0"
              >
                <img src={qrImg} alt="QR" className="w-[229px] sm:w-[340px] h-auto object-contain opacity-50 sm:opacity-80" />
              </motion.div>
            </div>

            {/* Secure Payment */}
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#1a1b1f] p-6 flex flex-col justify-between min-h-[160px]">
              <div className="relative z-10">
                <h3 className="text-base font-bold text-white mb-2">Secure Payment Integration</h3>
                <p className="text-xs text-zinc-400 leading-relaxed drop-shadow-md">
                  Pay safely using integrated payment methods including credit cards
                </p>
              </div>
              <motion.div 
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="absolute -bottom-2 -right-2 pointer-events-none z-0"
              >
                <img src={creditImg} alt="Card" className="w-35 sm:w-50 h-auto object-contain opacity-60 sm:opacity-90" />
              </motion.div>
            </div>

            {/* Instant Tickets */}
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#1a1b1f] p-6 flex flex-col justify-between min-h-[160px]">
              <div className="relative z-10">
                <h3 className="text-base font-bold text-white mb-2">Instant Digital Tickets</h3>
                <p className="text-xs text-zinc-400 leading-relaxed drop-shadow-md">
                  Once payment is confirmed, the system automatically generates a professional digital ticket in PDF
                </p>
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="absolute -bottom-2 -right-2 pointer-events-none z-0"
              >
                <img src={ticketImg} alt="Ticket" className="w-44 sm:w-52 h-auto object-contain opacity-10 sm:opacity-90" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Active Events */}
        <motion.div variants={itemVariants} className="pt-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">Active Events</h2>
              <p className="text-sm text-zinc-400 mt-1">Find your next unforgettable experience.</p>
            </div>
            <Link to="/events" className="flex items-center text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors">
              Explore all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-white/5 bg-[#16171a] h-56 animate-pulse" />
              ))
            ) : events.length === 0 ? (
              <div className="col-span-3 text-center text-zinc-400 py-12 text-sm">No events available right now.</div>
            ) : (
              events.slice(0, 3).map((event) => (
                <Link to={`/booking/${event.id}`} key={event.id} className="block">
                  <EventCard 
                    image={event.imageUrl ? `https://ticketok.runasp.net${event.imageUrl}` : "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop"}
                    location={event.location || event.venue || "TBA"}
                    date={event.date || event.eventDate ? new Date(event.date || event.eventDate).toLocaleDateString() : "TBA"}
                    status={event.status || "AVAILABLE"}
                    title={event.name || event.title || event.eventName || "Unnamed Event"}
                    description={event.description || "No description available."}
                    price={event.price || event.ticketPrice || event.initialPrice ? `EGP ${event.price || event.ticketPrice || event.initialPrice}` : "Free"}
                  />
                </Link>
              ))
            )}
          </div>
        </motion.div>

      </motion.div>

      {/* Floating Action Button */}
      {isAdmin && (
        <Link to="/manage-event" className="fixed bottom-8 right-8 flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-bold text-black shadow-xl shadow-black/50 transition-transform hover:scale-105 active:scale-95">
          <span className="text-lg leading-none">+</span> New Event
        </Link>
      )}

    </DashboardLayout>
  );
}
