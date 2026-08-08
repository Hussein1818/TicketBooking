import { ArrowRight, ArrowUpRight, Loader2, Users, Search, Star, Music, Trophy, Palette, Mic, CheckCircle, Sparkles, Ticket, Zap, Flame, Globe, Mail, MapPin, Phone } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import EventCard from "../components/EventCard";
import { useState, useEffect } from "react";
import useAuthStore from "../store/useAuthStore";
import { getEvents } from "../services/eventsApi";
import { getDashboard } from "../services/adminApi";
import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
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
import sportsBg from "../assets/sports_bg.png";
import theaterBg from "../assets/theater_bg.png";
import comedyBg from "../assets/comedy_bg.png";
import concertBg from "../assets/concert_bg.png";


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

const BentoCard = ({ children, className, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay, ease: "easeOut" }}
    viewport={{ once: true, margin: "-100px" }}
    whileHover={{ scale: 0.98, transition: { duration: 0.2 } }}
    className={`group relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-white/[0.08] to-transparent p-[1px] ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-tr from-[#00D5BE]/10 via-transparent to-purple-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    <div className="relative h-full w-full rounded-[2rem] bg-[#0c0c0e] p-8 md:p-10 flex flex-col overflow-hidden">
      {children}
    </div>
  </motion.div>
);

const STACKED_FEATURES = [
  {
    title: "Smart Tickets",
    desc: "Say goodbye to paper. QR-powered digital tickets update in real-time, preventing fraud and making entry a breeze.",
    icon: Ticket
  },
  {
    title: "Instant Access",
    desc: "Book in seconds. No queues, no waiting. Pay with your preferred method and secure your spot instantly.",
    icon: Zap
  },
  {
    title: "Exclusive Perks",
    desc: "Unlock backstage passes, early entry, and premium seating options tailored just for you.",
    icon: Flame
  }
];

const FeatureStack = () => {
  return (
    <div className="pt-32 pb-16 max-w-5xl mx-auto px-4 flex flex-col items-center">
      <div className="text-center mb-32 relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-md">
          Unmatched <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">Features</span>
        </h2>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Everything you need to own the night and manage your events seamlessly.
        </p>
      </div>

      <div className="relative w-full max-w-5xl h-[360px] flex justify-center group cursor-pointer mt-16">
        {STACKED_FEATURES.map((feat, i) => {
          const reverseIndex = STACKED_FEATURES.length - 1 - i; 
          return (
            <div 
              key={i}
              className="absolute w-full md:w-[1000px] rounded-[2rem] bg-gradient-to-b from-[#1c1e22] to-[#111214] border border-white/5 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-12 transition-all duration-500 ease-out shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:!scale-[1.02] hover:!opacity-100 hover:!-translate-y-4 hover:!z-50"
              style={{
                zIndex: i,
                top: `${-reverseIndex * 75}px`,
                transform: `scale(${1 - reverseIndex * 0.05})`,
                opacity: 1 - reverseIndex * 0.25,
              }}
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <feat.icon className="w-7 h-7 text-white opacity-80" />
                </div>
                <h3 className="text-3xl md:text-5xl font-bold text-white tracking-tight">{feat.title}</h3>
              </div>
              <p className="text-zinc-400 text-sm md:text-base max-w-[350px] leading-relaxed">
                {feat.desc}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}


const FAKE_REVIEWS = [
  { name: "Ahmed K.", username: "@ahmed_k", text: "The fastest ticket booking experience I've ever had. Literally 2 clicks!", rating: 5 },
  { name: "Sarah M.", username: "@sarah_vibes", text: "I love the exclusive drops. Got front row seats to my favorite band.", rating: 5 },
  { name: "Omar T.", username: "@omart_99", text: "Sleek UI and incredibly reliable. This is the future of ticketing.", rating: 5 },
  { name: "Laila H.", username: "@laila_fest", text: "Finally an app that doesn't crash during major event releases!", rating: 4 },
  { name: "Khaled W.", username: "@khaled_w", text: "The digital tickets are so convenient. No more printing paper.", rating: 5 },
  { name: "Youssef N.", username: "@yn_events", text: "The platform is incredibly robust. Smooth entry at the gates.", rating: 5 },
  { name: "Nour A.", username: "@nour_music", text: "Love the student discounts and the discovery features.", rating: 5 },
  { name: "Hassan S.", username: "@hassan_sport", text: "Very easy to use, even for someone who isn't tech-savvy.", rating: 4 },
  { name: "Dina F.", username: "@dina_tech", text: "Absolutely stunning design. The animations are top-notch.", rating: 5 },
  { name: "Ziad M.", username: "@ziadm_88", text: "Got my derby tickets without any hassle. Highly recommended.", rating: 5 },
  { name: "Mona S.", username: "@mona_art", text: "Discovered so many great local art exhibitions through this.", rating: 5 },
  { name: "Tarek B.", username: "@tarek_b", text: "Customer support is amazing, they helped me transfer a ticket instantly.", rating: 4 },
  { name: "Rana K.", username: "@rana_k", text: "Best platform in the MENA region right now.", rating: 5 },
  { name: "Mostafa C.", username: "@mostafa_c", text: "I check this app every weekend to see what's happening.", rating: 5 },
  { name: "Salma Y.", username: "@salma_y", text: "Clean, fast, and no hidden fees. I respect that.", rating: 5 },
];

const ReviewCard = ({ review }) => (
  <div className="w-[300px] sm:w-[350px] p-6 rounded-3xl bg-[#111214] border border-white/5 flex flex-col gap-4 flex-shrink-0 cursor-default hover:bg-[#16181b] transition-colors shadow-lg">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
        {review.name.charAt(0)}
      </div>
      <div>
        <h4 className="text-white font-bold text-base">{review.name}</h4>
        <p className="text-zinc-500 text-sm">{review.username}</p>
      </div>
    </div>
    <div className="flex items-center gap-1">
      {[...Array(review.rating)].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-teal-400 text-teal-400" />
      ))}
    </div>
    <p className="text-zinc-300 text-sm leading-relaxed">
      "{review.text}"
    </p>
  </div>
);

const Testimonials = () => {
  // Duplicate arrays internally so each set is long enough to span wide screens
  const row1 = [...FAKE_REVIEWS.slice(0, 5), ...FAKE_REVIEWS.slice(0, 5)];
  const row2 = [...FAKE_REVIEWS.slice(5, 10), ...FAKE_REVIEWS.slice(5, 10)];
  const row3 = [...FAKE_REVIEWS.slice(10, 15), ...FAKE_REVIEWS.slice(10, 15)];

  const MarqueeRow = ({ row, animationClass, duration }) => (
    <div className={`flex gap-6 w-max ${animationClass} hover:[animation-play-state:paused]`} style={{ animationDuration: duration }}>
      {/* First Set */}
      <div className="flex gap-6">
        {row.map((review, i) => <ReviewCard key={`set1-${i}`} review={review} />)}
      </div>
      {/* Second Set (identical for seamless looping) */}
      <div className="flex gap-6">
        {row.map((review, i) => <ReviewCard key={`set2-${i}`} review={review} />)}
      </div>
    </div>
  );

  return (
    <div className="py-24 overflow-hidden relative border-t border-white/5 mt-8 w-full max-w-[100vw] -mx-8 md:-mx-10 px-8 md:px-10">
      <div className="text-center mb-16 relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-md">Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">Thousands</span></h2>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto px-4">Don't just take our word for it. Here is what the community is saying.</p>
      </div>

      <div 
        className="flex flex-col gap-6 relative max-w-full"
        style={{ 
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
        }}
      >
        <MarqueeRow row={row1} animationClass="animate-marquee-left" duration="45s" />
        <MarqueeRow row={row2} animationClass="animate-marquee-right" duration="50s" />
        <MarqueeRow row={row3} animationClass="animate-marquee-left" duration="60s" />
      </div>
    </div>
  );
};

const ContactSection = () => {
  return (
    <div className="py-24 mb-16 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 relative z-10 flex flex-col items-center">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <ArrowUpRight className="w-10 h-10 md:w-12 md:h-12 text-white" strokeWidth={3} />
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-md">
            Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">Us</span>
          </h2>
        </div>
        <p className="text-zinc-400 text-center max-w-2xl mb-16 leading-relaxed">
          If you're interested in partnering with us, have a question about an event, or simply want to connect, feel free to reach out through the form below or via the contact information provided.
        </p>

        {/* Form Container */}
        <div className="w-full max-w-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl mb-20">
          <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="text" 
              placeholder="Name" 
              className="w-full bg-white/5 border border-transparent rounded-[1.5rem] px-6 py-5 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500/30 focus:bg-white/10 transition-all font-medium" 
            />
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full bg-white/5 border border-transparent rounded-[1.5rem] px-6 py-5 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500/30 focus:bg-white/10 transition-all font-medium" 
            />
            <textarea 
              rows={4} 
              placeholder="Message" 
              className="w-full bg-white/5 border border-transparent rounded-[1.5rem] px-6 py-5 text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500/30 focus:bg-white/10 transition-all resize-none font-medium"
            ></textarea>
            <button className="w-full bg-gradient-to-r from-[#14B8A6] to-[#0F766E] text-black font-bold text-lg px-8 py-5 rounded-[1.5rem] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] hover:scale-[1.02] transition-all duration-300 mt-2 flex justify-center items-center gap-2">
              Submit <ArrowRight className="w-5 h-5" strokeWidth={3} />
            </button>
          </form>
        </div>

        {/* Contact Pills */}
        <div className="w-full flex flex-col md:flex-row gap-4 justify-center">
          {/* Email */}
          <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-4 flex items-center justify-between group hover:bg-white/[0.06] transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-500 tracking-wider mb-0.5">Email address</div>
                <div className="text-sm text-zinc-300 font-medium line-clamp-1">support@ticket.com</div>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-zinc-600 group-hover:text-teal-400 transition-colors shrink-0 mx-2" />
          </div>

          {/* Phone */}
          <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-4 flex items-center justify-between group hover:bg-white/[0.06] transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-500 tracking-wider mb-0.5">Phone number</div>
                <div className="text-sm text-zinc-300 font-medium line-clamp-1">+20 106035699</div>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-zinc-600 group-hover:text-teal-400 transition-colors shrink-0 mx-2" />
          </div>

          {/* Location */}
          <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-4 flex items-center justify-between group hover:bg-white/[0.06] transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-500 tracking-wider mb-0.5">Location</div>
                <div className="text-sm text-zinc-300 font-medium line-clamp-1">123 Event St, NY</div>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-zinc-600 group-hover:text-teal-400 transition-colors shrink-0 mx-2" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
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
      }, 4500); // 4.5 seconds
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch events for everyone
        const data = await getEvents({ page: 1, pageSize: 6 });
        setEvents(Array.isArray(data) ? data : (data?.items || data?.data || []));

        // Fetch stats if admin
        if (token && isAdmin) {
          await getDashboard(token);
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
        {/* Ambient Concert Lighting */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[5%] left-[-10%] w-[600px] h-[600px] bg-[#0F766E]/15 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute top-[20%] right-[-10%] w-[800px] h-[800px] bg-[#14B8A6]/10 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute top-[45%] left-[5%] w-[900px] h-[900px] bg-[#0F766E]/15 blur-[180px] rounded-full mix-blend-screen" />
          <div className="absolute top-[65%] right-[5%] w-[700px] h-[700px] bg-[#0D9488]/15 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute top-[85%] left-[-5%] w-[800px] h-[800px] bg-[#14B8A6]/10 blur-[150px] rounded-full mix-blend-screen" />
          
          <img
            src={bgImg}
            alt="background glow"
            className="absolute top-[-100px] right-[-160px] w-[750px] md:max-w-none md:top-[-300px] md:right-[-350px] md:w-[1100px] object-cover opacity-100 mix-blend-lighten pointer-events-none z-0"
            style={{ maskImage: 'radial-gradient(circle at 60% center, black 30%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle at 60% center, black 30%, transparent 70%)' }}
          />
        </div>

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
            className="absolute bottom-[110px] right-5 md:bottom-[0px] md:right-[70px] z-30 flex flex-col items-start justify-center rounded-[12px] sm:rounded-[16px] md:rounded-[24px] bg-gradient-to-br from-white/30 to-white/20 backdrop-blur-xl border border-white/20 p-1 sm:p-2.5 md:p-4 min-w-[70px] sm:min-w-[100px] md:min-w-[160px]"
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
                delay={5}
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
          className="mx-auto max-w-6xl space-y-8 pb-1"
        >
          {/* Sponsor Logos Strip */}
          <motion.div variants={itemVariants} className="mt-1">
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

          {/* Active Events */}
          <motion.div variants={itemVariants} className="pt-8 mb-16">
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tighter mb-3">
                  Active <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">Events</span>
                </h2>
                <p className="text-zinc-400 text-lg">
                  Find your next unforgettable experience right now.
                </p>
              </div>
              <Link
                to="/events"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white font-medium"
              >
                Explore all <ArrowRight className="w-4 h-4" />
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

          {/* Stunning Categories - Expanding Gallery */}
          <div className="pt-1 pb-16">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tighter mb-3">
                  Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">Vibe</span>
                </h2>
                <p className="text-zinc-400 text-lg">Explore the hottest events across all categories.</p>
              </div>
              <Link to="/events" className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white font-medium">
                View All Categories <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 h-[600px] md:h-[400px] w-full">
              {[
                { name: "Live Concerts", targetCat: "Music", color: "from-violet-600 via-fuchsia-600 to-pink-600", img: concertBg },
                { name: "Pro Sports", targetCat: "Sports", color: "from-emerald-600 via-green-600 to-teal-600", img: sportsBg },
                { name: "Arts & Theater", targetCat: "Art", color: "from-orange-600 via-red-600 to-rose-600", img: theaterBg },
                { name: "Comedy Shows", targetCat: "Shows", color: "from-blue-600 via-cyan-600 to-teal-600", img: comedyBg },
              ].map((cat, i) => (
                <Link 
                  to="/events"
                  state={{ category: cat.targetCat }}
                  key={i}
                  className={`group relative rounded-[2rem] flex-1 overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:flex-[3] bg-[#111214] border border-white/5 hover:border-white/20`}
                >
                  <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-700" />
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent`} />
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-50 mix-blend-color transition-opacity duration-700`} />
                  
                  <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                    <div>
                      <h3 className="text-xl md:text-3xl font-bold text-white whitespace-nowrap drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                        {cat.name}
                      </h3>
                      <div className="h-0 overflow-hidden opacity-0 group-hover:h-8 group-hover:opacity-100 transition-all duration-500 mt-2">
                        <p className="text-white/90 text-sm whitespace-nowrap font-medium drop-shadow-md">
                          Explore events <ArrowRight className="inline w-4 h-4 ml-1" />
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <FeatureStack />
        </motion.div>

        <Testimonials />
        <ContactSection />

        {/* Floating Action Button */}
        {isAdmin && (
          <Link
            to="/create-event"
            className="z-100 fixed bottom-8 right-8 flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-bold text-black shadow-xl shadow-black/50 transition-transform hover:scale-105 active:scale-95"
          >
            <span className="text-lg leading-none">+</span> New Event
          </Link>
        )}
      </DashboardLayout>
    </>
  );
}
