import { ArrowRight, Loader2, Users } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import EventCard from "../components/EventCard";
import { useState, useEffect } from "react";
import axios from "axios";
import useAuthStore from "../store/useAuthStore";

import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import LogoLoop from "../components/LogoLoop";
import CountUp from "../components/CountUp";
import {
  Spotify,
  Visa,
  Mastercard,
  Stripe,
  Apple,
  Google,
  Meta,
  Netflix,
  Twitch,
  Youtube,
  Discord,
  Slack,
  Airbnb,
} from "brand-logos";
import qrImg from "../assets/qr.png";
import creditImg from "../assets/credet.png";
import ticketImg from "../assets/ticket.png";
import bgImg from "../assets/background.png";
import layersImg from "../assets/Group 8.png";
import group4Img from "../assets/Group 4.png";

const RedbullIcon = (props) => (
  <svg viewBox="0 0 120 40" {...props}>
    <text
      x="0"
      y="30"
      fontFamily="Arial, sans-serif"
      fontWeight="900"
      fontSize="30"
      fontStyle="italic"
      letterSpacing="-1"
      fill="currentColor"
    >
      Red Bull
    </text>
  </svg>
);

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  const [showWelcome, setShowWelcome] = useState(() => {
    return !sessionStorage.getItem("hasVisitedHome");
  });

  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
        sessionStorage.setItem("hasVisitedHome", "true");
      }, 2500); // 2.5 seconds
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const baseUrl =
          import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";

        // Fetch events for everyone
        const eventsResponse = await axios.get(
          `${baseUrl}/api/Events?page=1&pageSize=6`,
        );
        setEvents(eventsResponse.data?.items || eventsResponse.data || []);

        // Fetch stats if admin
        if (token && isAdmin) {
          const statsResponse = await axios.get(
            `${baseUrl}/api/Admin/dashboard`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
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
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <>
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            key="welcome-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#09090b]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              exit={{ scale: 1.1, opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative flex flex-col items-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-32 -z-10 rounded-full bg-gradient-to-tr from-[#00D5BE]/20 via-transparent to-transparent blur-[50px]"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-32 -z-10 rounded-full bg-gradient-to-bl from-[#00D5BE]/20 via-transparent to-transparent blur-[50px]"
              />
              <motion.h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent mb-8 drop-shadow-2xl tracking-tighter">
                TicketOK
              </motion.h1>
              <div className="flex items-center gap-3">
                <motion.div
                  className="h-2 w-2 rounded-full bg-[#00D5BE] shadow-[0_0_10px_#00D5BE]"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="h-2 w-2 rounded-full bg-[#00D5BE] shadow-[0_0_10px_#00D5BE]"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="h-2 w-2 rounded-full bg-[#00D5BE] shadow-[0_0_10px_#00D5BE]"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DashboardLayout>
        <img
          src={bgImg}
          alt="background glow"
          className="absolute top-[-100px] right-[-160px] w-[750px] md:max-w-none md:top-[-300px] md:right-[-350px] md:w-[1100px] object-cover opacity-100 mix-blend-lighten pointer-events-none"
        />

        {/* Hero Section - Full Page Width */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative flex justify-center -mx-4 -mt-6 mb-20 min-h-[320px] overflow-hidden px-4 py-14 md:-mx-8 md:-mt-0 md:min-h-[430px] md:px-8 md:py-[72px] lg:min-h-[520px]"
        >
          <div className="z-10 mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center gap-12">
            <div className="relative w-fit mx-auto mt-10 md:mt-0">
              <h1 className="select-none z-0 text-center text-[clamp(75px,20vw,370px)] font-semibold leading-none tracking-normal opacity-0 pointer-events-none">
                TicketOK
              </h1>
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
                className="absolute left-[-18px] md:left-8 bottom-13 md:bottom-13 font-bold text-white text-[10px] sm:text-sm md:text-2xl tracking-wide drop-shadow-lg z-0"
              >
                All Events
              </motion.div>
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
                className="absolute right-[-28px] md:right-0 bottom-13 md:bottom-13 font-bold text-white text-[10px] sm:text-sm md:text-2xl tracking-wide drop-shadow-lg z-0"
              >
                In One Place
              </motion.div>
            </div>
          </div>

          {/* Bottom Info Block */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
            className="absolute bottom-5 left-6 md:bottom-2 md:left-12 z-30 max-w-[280px] md:max-w-[350px]"
          >
            <div className="flex items-start gap-3">
              <img
                src={group4Img}
                alt=""
                aria-hidden="true"
                className="mt-1 h-4 w-4 md:h-5 md:w-5 object-contain"
              />
              <div>
                <h3 className="mb-1 md:mb-2 text-xs md:text-sm font-bold text-white">
                  Book Moments, Not Just Tickets
                </h3>
                <p className="text-[10px] md:text-xs font-semibold leading-relaxed text-zinc-400">
                  From unforgettable concerts to exciting entertainment
                  experiences, reserve your seat, and enjoy every moment.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Bottom Right Info Block (Active Users) */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.9 }}
            className="absolute bottom-[110px] right-5 md:bottom-[0px] md:right-[70px] z-30 flex flex-col items-start justify-center rounded-[12px] sm:rounded-[16px] md:rounded-[24px] bg-gradient-to-br from-white/30 to-white/20 backdrop-blur-xl border border-white/20 p-2 sm:p-2.5 md:p-4 min-w-[70px] sm:min-w-[100px] md:min-w-[160px]"
          >
            {/* Icon Box */}
            <div className="mb-1 sm:mb-2 md:mb-4 rounded-[8px] sm:rounded-[10px] md:rounded-[12px] bg-white/10 p-1 sm:p-1.5 md:p-2 w-fit border border-white/10 shadow-inner">
              <div className="rounded-full flex items-center justify-center">
                <Users
                  className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#00D5BE]"
                  strokeWidth={2.5}
                />
              </div>
            </div>

            <div className="text-white text-base sm:text-2xl md:text-[40px] font-bold flex items-center tracking-tighter leading-none mb-0 md:mb-1.5 drop-shadow-sm">
              <CountUp
                from={0}
                to={150}
                separator=","
                direction="up"
                duration={2}
                className="count-up-text"
              />
              K+
            </div>
            <div className="text-zinc-300/90 text-[7px] sm:text-[9px] md:text-sm font-medium tracking-wide mt-0.5">
              Active Users
            </div>
          </motion.div>
        </motion.div>

        <div className="z-0 absolute top-[5px] left-1/2 -translate-x-1/2 w-[95%] md:translate-x-0 md:left-auto md:top-[0px] md:right-[70px] md:w-[100%] md:max-w-[1150px] pointer-events-none">
          <div className="relative w-full h-full">
            <img
              src={layersImg}
              alt="Layered Cards"
              className="relative w-full h-auto object-contain drop-shadow-[0_0_1px_rgba(255,255,255,0.3)]"
            />
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-6xl space-y-8 pb-12"
        >
          {/* Sponsor Logos Strip */}
          <motion.div variants={itemVariants} className="mt-8">
            <p className="text-center text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-4">
              Trusted By
            </p>
            <LogoLoop
              logos={[
                { name: "Spotify", icon: Spotify },
                { name: "Visa", icon: Visa },
                { name: "Stripe", icon: Stripe },
                { name: "Google", icon: Google },
                { name: "Meta", icon: Meta },
                { name: "Netflix", icon: Netflix },
                { name: "Youtube", icon: Youtube },
                { name: "Discord", icon: Discord },
                { name: "Slack", icon: Slack },
                { name: "Airbnb", icon: Airbnb },
              ]}
              speed={25}
              gap={64}
            />
          </motion.div>
          {/* Platform Features - New Design */}
          <motion.div
            variants={itemVariants}
            className="mt-8 rounded-2xl bg-[#111214]"
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              Platform Features
            </h2>
            <p className="text-sm text-zinc-400 mb-8 max-w-md">
              A smart booking experience that lets you choose your seat in real
              time, pay securely, and receive your digital ticket instantly.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* QR Code - Large */}
              <div className="rounded-xl bg-gradient-to-r from-transparent to-[#00D5BE] p-[1px] md:row-span-2">
                <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#111214] p-6 flex flex-col justify-between min-h-[200px]">
                  <div className="relative z-10">
                    <h3 className="text-[17px] md:text-xl font-bold text-white mb-1.5 md:mb-2">
                      QR Code Entry
                    </h3>
                    <p className="text-[13px] md:text-lg font-medium md:font-semibold text-zinc-400 leading-relaxed drop-shadow-md pr-16 sm:pr-0">
                      Each ticket includes a unique QR code that can be scanned
                      at the event entrance for quick and secure verification.
                    </p>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    viewport={{ once: true }}
                    className="absolute -bottom-4 -right-2 pointer-events-none z-0"
                  >
                    <img
                      src={qrImg}
                      alt="QR"
                      className="w-[229px] sm:w-[340px] h-auto object-contain opacity-50 sm:opacity-80"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Secure Payment */}
              <div className="rounded-xl bg-gradient-to-l from-transparent to-[#00D5BE] p-[1px]">
                <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#111214] p-6 flex flex-col justify-between min-h-[160px]">
                  <div className="relative z-10">
                    <h3 className="text-[17px] md:text-xl font-bold text-white mb-1.5 md:mb-2">
                      Secure Payment Integration
                    </h3>
                    <p className="text-[12px] md:text-base font-medium md:font-semibold text-zinc-400 leading-relaxed drop-shadow-md pr-20 sm:pr-0">
                      Pay safely using integrated payment methods{" "}
                      <br className="hidden md:block" /> including credit cards
                    </p>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="absolute -bottom-2 -right-2 pointer-events-none z-0"
                  >
                    <img
                      src={creditImg}
                      alt="Card"
                      className="w-35 sm:w-50 h-auto object-contain opacity-60 sm:opacity-90"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Instant Tickets */}
              <div className="rounded-xl bg-gradient-to-l from-transparent to-[#00D5BE] p-[1px]">
                <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#111214] p-6 flex flex-col justify-between min-h-[160px]">
                  <div className="relative z-10">
                    <h3 className="text-[17px] md:text-xl font-bold text-white mb-1.5 md:mb-2">
                      Instant Digital Tickets
                    </h3>
                    <p className="text-[12px] md:text-base font-medium md:font-semibold text-zinc-400 leading-relaxed drop-shadow-md pr-20 sm:pr-0">
                      Once payment is confirmed, the system automatically{" "}
                      <br className="hidden md:block" /> generates a
                      professional digital ticket in PDF
                    </p>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="absolute -bottom-2 -right-2 pointer-events-none z-0"
                  >
                    <img
                      src={ticketImg}
                      alt="Ticket"
                      className="w-44 sm:w-52 h-auto object-contain opacity-10 sm:opacity-90"
                    />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Active Events */}
          <motion.div variants={itemVariants} className="pt-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white tracking-tight">
                  Active Events
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Find your next unforgettable experience.
                </p>
              </div>
              <Link
                to="/events"
                className="flex items-center text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
              >
                Explore all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/5 bg-[#16171a] h-56 animate-pulse"
                  />
                ))
              ) : events.length === 0 ? (
                <div className="col-span-3 text-center text-zinc-400 py-12 text-sm">
                  No events available right now.
                </div>
              ) : (
                events.slice(0, 3).map((event) => (
                  <Link
                    to={`/booking/${event.id}`}
                    key={event.id}
                    className="block"
                  >
                    <EventCard
                      image={
                        event.imageUrl
                          ? `https://ticketok.runasp.net${event.imageUrl}`
                          : "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop"
                      }
                      location={event.location || event.venue || "TBA"}
                      date={
                        event.date || event.eventDate
                          ? new Date(
                              event.date || event.eventDate,
                            ).toLocaleDateString()
                          : "TBA"
                      }
                      status={event.status || "AVAILABLE"}
                      title={
                        event.name ||
                        event.title ||
                        event.eventName ||
                        "Unnamed Event"
                      }
                      description={
                        event.description || "No description available."
                      }
                      price={
                        event.price || event.ticketPrice || event.initialPrice
                          ? `EGP ${event.price || event.ticketPrice || event.initialPrice}`
                          : "Free"
                      }
                    />
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Floating Action Button */}
        {isAdmin && (
          <Link
            to="/manage-event"
            className="z-100 fixed bottom-8 right-8 flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-bold text-black shadow-xl shadow-black/50 transition-transform hover:scale-105 active:scale-95"
          >
            <span className="text-lg leading-none">+</span> New Event
          </Link>
        )}
      </DashboardLayout>
    </>
  );
}
