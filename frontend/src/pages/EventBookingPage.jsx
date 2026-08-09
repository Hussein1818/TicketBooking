import { Calendar, MapPin, Clock, Loader2, X, Wallet } from "lucide-react";

import DashboardLayout from "../layouts/DashboardLayout";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import useAuthStore from "../store/useAuthStore";
import { createBooking, cancelBooking, checkoutWallet, checkoutMock, getErrorMessage } from "../services/bookingsApi";
import { validatePromoCode } from "../services/promoCodesApi";
import { getEventById, getEventSeats, getEvents } from "../services/eventsApi";
import EventCard from "../components/EventCard";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ticketok.runasp.net';
const resolveImg = (url) => !url ? null : url.startsWith('http') ? url : `${BASE_URL}${url}`;

const COL_LETTERS = ["A","B","C","D","E","F","G","H","J","K","L","M"];
const COLS = 6;

// ── Seat map helpers ──────────────────────────────────────────────
function toRows(list, cols = COLS) {
  const rows = [];
  for (let i = 0; i < list.length; i += cols) rows.push(list.slice(i, i + cols));
  return rows;
}

function SeatBtn({ seat, rowIdx, selectedIds, toggleSeat, isUnavailable, seatLoading, globalColIdx }) {
  const loading = seatLoading?.[seat.id];
  const unavailable = isUnavailable(seat);
  const selected    = selectedIds.includes(seat.id);
  const isVip       = seat.isVip || seat.seatType === "VIP" || seat.type === "VIP" || String(seat.seatNumber || "").toUpperCase().includes("VIP") || String(seat.id || "").toUpperCase().includes("VIP");
  const colLetter   = COL_LETTERS[globalColIdx] ?? String(globalColIdx);
  const label       = unavailable ? "x" : (seat.seatNumber != null ? String(seat.seatNumber) : `${colLetter}${rowIdx + 1}`);

  let btnCls = "bg-[#161a1a] text-zinc-300 hover:bg-[#1f2525]";
  if (isVip && !unavailable && !selected) { btnCls = "bg-yellow-900/30 text-yellow-500 hover:bg-yellow-900/50"; }
  if (unavailable && !selected) { btnCls = "bg-[#111314] text-zinc-700 cursor-not-allowed opacity-80"; }
  if (selected) { btnCls = "bg-[#14B8A6] text-[#0a0a0c] font-black shadow-[0_0_15px_rgba(20,184,166,0.5)] scale-105"; }

  return (
    <button
      type="button"
      onClick={() => toggleSeat(seat)}
      disabled={unavailable && !selected}
      title={`${label}${isVip ? " — VIP" : ""}`}
      className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${btnCls}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : label}
    </button>
  );
}

function SeatSection({ title, seatList, selectedIds, toggleSeat, isUnavailable, seatLoading, startIndex = 0 }) {
  if (!seatList.length) return null;
  const rows = toRows(seatList, COLS);
  
  return (
    <div className="mb-12 w-full flex flex-col items-center">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#14B8A6]/10 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#14B8A6]">
            <path d="M4 18v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            <path d="M4 14v4h16v-4" />
            <path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
            <path d="M12 14v4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2 tracking-wide">Select Seat</h2>
        <p className="text-xs text-zinc-400 font-medium">Choose Seat(s) For {title}</p>
      </div>

      <div className="relative px-4 py-4 flex flex-col items-center">
        {/* Top Letters Row */}
        <div className="flex items-center gap-4 mb-4 pl-8">
          <div className="flex gap-2 w-[88px] justify-between">
            {COL_LETTERS.slice(0, 2).map(l => (
               <span key={l} className="w-10 text-center text-[10px] font-bold text-zinc-500">{l}</span>
            ))}
          </div>
          <div className="w-6" />
          <div className="flex gap-2 w-[88px] justify-between">
            {COL_LETTERS.slice(2, 4).map(l => (
               <span key={l} className="w-10 text-center text-[10px] font-bold text-zinc-500">{l}</span>
            ))}
          </div>
          <div className="w-6" />
          <div className="flex gap-2 w-[88px] justify-between">
            {COL_LETTERS.slice(4, 6).map(l => (
               <span key={l} className="w-10 text-center text-[10px] font-bold text-zinc-500">{l}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          {rows.map((row, ri) => {
            const actualRowIdx = startIndex + ri;
            const leftSeats = row.slice(0, 2);
            const centerSeats = row.slice(2, 4);
            const rightSeats = row.slice(4, 6);
            
            return (
              <div key={ri} className="flex items-center gap-4">
                <div className="w-8 flex justify-center">
                  <span className="text-[10px] font-bold text-zinc-500">{actualRowIdx + 1}</span>
                </div>

                <div className="flex gap-2 w-[88px]">
                  {leftSeats.map((seat, ci) => (
                    <SeatBtn
                      key={seat.id ?? `${ri}-${ci}`}
                      seat={seat} rowIdx={actualRowIdx} globalColIdx={ci}
                      selectedIds={selectedIds} toggleSeat={toggleSeat} isUnavailable={isUnavailable}
                      seatLoading={seatLoading}
                    />
                  ))}
                  {Array.from({ length: 2 - leftSeats.length }).map((_, i) => <div key={`empty-l-${i}`} className="w-10 h-10" />)}
                </div>

                <div className="w-6" />

                <div className="flex gap-2 w-[88px]">
                  {centerSeats.map((seat, ci) => (
                    <SeatBtn
                      key={seat.id ?? `${ri}-${ci+2}`}
                      seat={seat} rowIdx={actualRowIdx} globalColIdx={ci+2}
                      selectedIds={selectedIds} toggleSeat={toggleSeat} isUnavailable={isUnavailable}
                      seatLoading={seatLoading}
                    />
                  ))}
                  {Array.from({ length: 2 - centerSeats.length }).map((_, i) => <div key={`empty-c-${i}`} className="w-10 h-10" />)}
                </div>

                <div className="w-6" />

                <div className="flex gap-2 w-[88px]">
                  {rightSeats.map((seat, ci) => (
                    <SeatBtn
                      key={seat.id ?? `${ri}-${ci+4}`}
                      seat={seat} rowIdx={actualRowIdx} globalColIdx={ci+4}
                      selectedIds={selectedIds} toggleSeat={toggleSeat} isUnavailable={isUnavailable}
                      seatLoading={seatLoading}
                    />
                  ))}
                  {Array.from({ length: 2 - rightSeats.length }).map((_, i) => <div key={`empty-r-${i}`} className="w-10 h-10" />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CartTimer({ isActive, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(300);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive, onExpire]);

  if (!isActive || timeLeft === 300) return null;

  const m = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const s = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <div className="absolute top-6 right-6 md:top-10 md:right-10 z-20 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md px-6 py-4 min-w-[140px] shadow-2xl">
      <span className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase mb-1">Cart Timer</span>
      <div className={`flex items-center gap-2 ${timeLeft <= 60 && timeLeft > 0 ? "text-red-400 animate-pulse" : "text-[#14B8A6]"}`}>
        <Clock className="w-5 h-5" /><span className="text-2xl font-bold tracking-tight">{m}:{s}</span>
      </div>
    </div>
  );
}

export default function EventBookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  const [seats, setSeats]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [lockedBookings, setLockedBookings]   = useState({});
  const [seatLoading, setSeatLoading]         = useState({});
  const [promoCode, setPromoCode]       = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);

  const [eventDetails, setEventDetails]       = useState(null);
  const [suggestedEvents, setSuggestedEvents] = useState([]);
  
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutType, setCheckoutType]               = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const data = await getEventById(id || 1);
        setEventDetails(data);
      } catch {
        // silent fallback
      }
    };
    const fetchSeats = async () => {
      try {
        const data = await getEventSeats(id || 1);
        const list = Array.isArray(data) ? data : (data?.items || data?.data || []);
        setSeats(list);
      } catch (e) {
        setError(getErrorMessage(e, "Failed to load seats."));
      } finally {
        setLoading(false);
      }
    };
    const fetchSuggested = async () => {
      try {
        const data = await getEvents({ page: 1, pageSize: 20 });
        const list = Array.isArray(data) ? data : (data?.items || data?.data || []);
        const filtered = list.filter(e => String(e.id) !== String(id));
        const randomized = [...filtered].sort(() => 0.5 - Math.random()).slice(0, 3);
        setSuggestedEvents(randomized);
      } catch {
        // silent fallback
      }
    };
    fetchEventDetails();
    fetchSeats();
    fetchSuggested();
  }, [id]);

  const handleCartExpire = useCallback(() => {
    setSelectedSeatIds([]);
    setLockedBookings({});
    setError("Cart expired! Seats have been released.");
  }, []);

  const isUnavailable = (seat) =>
    seat.status === "Booked" || seat.status === "Locked" || seat.isAvailable === false || seat.isBooked;

  const toggleSeat = async (seat) => {
    if (isUnavailable(seat) && !selectedSeatIds.includes(seat.id)) return;
    if (!seat.id) return;
    if (!token) { setError("You need to sign in first."); return; }

    const isSelected = selectedSeatIds.includes(seat.id);
    
    setSeatLoading(prev => ({ ...prev, [seat.id]: true }));
    setError("");

    try {
      if (isSelected) {
        const bookingId = lockedBookings[seat.id];
        if (bookingId) {
          await cancelBooking(bookingId, token);
        }
        setSelectedSeatIds(prev => prev.filter(id => id !== seat.id));
        setLockedBookings(prev => {
          const newObj = { ...prev };
          delete newObj[seat.id];
          return newObj;
        });
      } else {
        const booking = await createBooking({ seatId: seat.id }, token);
        const bookingId = booking?.bookingId || booking?.id || booking;
        
        setSelectedSeatIds(prev => [...prev, seat.id]);
        if (bookingId && typeof bookingId !== "object") {
           setLockedBookings(prev => ({ ...prev, [seat.id]: bookingId }));
        }
      }
    } catch (e) {
      setError(getErrorMessage(e, isSelected ? "Failed to unselect seat." : "Failed to lock seat. It might be taken."));
    } finally {
      setSeatLoading(prev => ({ ...prev, [seat.id]: false }));
    }
  };

  const handleCheckout = async () => {
    if (!selectedSeatIds.length) { setError("Select at least one seat."); return; }
    if (!token)                  { setError("You need to sign in first."); return; }
    if (!checkoutType)           return;

    setError(""); setSuccess(""); setActionLoading(true);
    try {
      const bookingIds = selectedSeatIds.map(id => lockedBookings[id]).filter(Boolean);

      if (checkoutType === "mock") {
        await checkoutMock(token);
        setSuccess("Mock checkout completed.");
        setTimeout(() => {
          setSelectedSeatIds([]); setLockedBookings({}); setPromoCode("");
          setIsCheckoutModalOpen(false);
          navigate("/tickets");
        }, 1500);
      } else if (checkoutType === "wallet") {
        if (!bookingIds.length) throw new Error("No locked bookings found to checkout.");
        const r = await checkoutWallet({ bookingIds, promoCode: promoCode || "" }, token);
        
        if (r instanceof Blob) {
          const url = window.URL.createObjectURL(r);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `Tickets-${Date.now()}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
          setTimeout(() => window.URL.revokeObjectURL(url), 1000);
          setSuccess("Wallet checkout completed. Tickets downloaded!");
        } else {
          setSuccess(typeof r === "string" ? r : "Wallet checkout completed.");
        }
        
        setTimeout(() => {
          setSelectedSeatIds([]); setLockedBookings({}); setPromoCode("");
          setIsCheckoutModalOpen(false);
          navigate("/tickets");
        }, 1500);
      }
    } catch (e) {
      const parsedError = getErrorMessage(e, "Checkout failed.");
      if (
        checkoutType === "wallet" &&
        (parsedError === "Checkout failed." ||
         parsedError.includes("Action failed") ||
         parsedError.toLowerCase().includes("insufficient") ||
         parsedError.toLowerCase().includes("balance") ||
         e?.response?.status === 400 ||
         e?.response?.status === 402)
      ) {
        setError("مش معاك فلوس كفاية");
      } else {
        setError(parsedError);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const openCheckoutModal = (type) => {
    setCheckoutType(type);
    setIsCheckoutModalOpen(true);
    setError("");
    setSuccess("");
  };

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setPromoMessage("");
    try {
      const data = await validatePromoCode(promoCode, token);
      setPromoMessage(typeof data === "string" ? data : "Promo code applied!");
      if (typeof data === "number" || (data && data.discountPercentage)) {
        setPromoDiscount(typeof data === "number" ? data : data.discountPercentage);
      }
    } catch {
      setPromoMessage("Invalid promo code.");
      setPromoDiscount(0);
    }
  };

  // split seats by type
  const isVipSeatCheck = (s) => s.isVip || s.seatType === "VIP" || s.type === "VIP" || String(s.seatNumber || "").toUpperCase().includes("VIP") || String(s.id || "").toUpperCase().includes("VIP");
  const vipSeats     = seats.filter(isVipSeatCheck);
  const regularSeats = seats.filter(s => !isVipSeatCheck(s));

  // total price
  const selectedSeats = seats.filter(s => selectedSeatIds.includes(s.id));
  const totalPrice    = selectedSeats.reduce((sum, s) => sum + (s.price ?? s.pricePerSeat ?? 0), 0);
  const finalPrice    = totalPrice - (totalPrice * promoDiscount) / 100;

  const eventImage = resolveImg(eventDetails?.imageUrl || eventDetails?.coverImage || eventDetails?.image) || "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=2000";

  return (
    <DashboardLayout>
      {/* Immersive Hero Header */}
      <div className="relative -mx-4 md:-mx-8 -mt-6 md:-mt-10 h-[50vh] min-h-[400px] bg-[#111214] mb-8">
        <div className="absolute inset-0 z-0">
          <img 
            src={eventImage} 
            alt={eventDetails?.name || "Event"} 
            className="w-full h-full object-cover opacity-80"
            style={{ maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)', WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)' }}
          />
        </div>
        
        {/* Overlay Event Details */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 md:p-12 pb-16">
          <div className="max-w-4xl mx-auto w-full">
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-lg mb-4 leading-none">
              {eventDetails?.name || eventDetails?.title || "Seat Selection"}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm md:text-base font-bold text-zinc-300 uppercase tracking-widest drop-shadow-md">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#14B8A6]" />
                {eventDetails?.eventDate ? new Date(eventDetails.eventDate).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric" }) : "Live Selection"}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#14B8A6]" />
                {eventDetails?.venue || eventDetails?.location || "Interactive Map"}
              </span>
            </div>
          </div>
        </div>

        {/* Floating Cart Timer */}
        <CartTimer isActive={selectedSeatIds.length > 0} onExpire={handleCartExpire} />
      </div>

      <div className="relative z-10 flex flex-col items-center mx-auto max-w-5xl px-4 animate-in fade-in duration-700 pb-32">
        {/* Seat map card */}
        <div className="w-full flex flex-col min-h-[500px] mt-4">
          <div className="flex flex-col h-full w-full">
              {/* Stage bar */}
              <div className="w-full max-w-xl mx-auto mb-10">
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-transparent via-[#14B8A6]/50 to-transparent blur-[2px]" />
                <p className="mt-3 text-center text-[10px] font-bold tracking-[0.4em] text-zinc-500 uppercase">Front of Arena — Stage</p>
              </div>

              {/* Legend */}
            <div className="flex justify-center gap-6 mb-8 flex-wrap">
              {[
                { cls: "bg-[#161a1a] border border-white/5",  label: "Available" },
                { cls: "bg-yellow-900/40 border border-yellow-500/20", label: "VIP" },
                { cls: "bg-[#14B8A6] shadow-[0_0_10px_rgba(20,184,166,0.5)]", label: "Selected" },
                { cls: "bg-[#111314] opacity-80", label: "Taken" },
              ].map(({ cls, label }) => (
                <span key={label} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <span className={`inline-block h-4 w-4 rounded-md ${cls}`} /> {label}
                </span>
              ))}
            </div>

            {/* Seats */}
            {loading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#14B8A6] animate-spin" />
              </div>
            ) : seats.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">No seats available for this event.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center flex-1 gap-8 w-full max-w-3xl mx-auto overflow-x-auto pb-8">
                <SeatSection
                  title="⭐ VIP Section"
                  seatList={vipSeats}
                  selectedIds={selectedSeatIds} toggleSeat={toggleSeat} isUnavailable={isUnavailable}
                  seatLoading={seatLoading}
                  startIndex={0}
                />
                {/* divider between sections */}
                {vipSeats.length > 0 && regularSeats.length > 0 && (
                  <div className="w-full max-w-md border-t border-dashed border-white/10 my-4" />
                )}
                <SeatSection
                  title="Regular Section"
                  seatList={regularSeats}
                  selectedIds={selectedSeatIds} toggleSeat={toggleSeat} isUnavailable={isUnavailable}
                  seatLoading={seatLoading}
                  startIndex={toRows(vipSeats, COLS).length}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Events Section */}
      {suggestedEvents.length > 0 && (
        <div className="relative z-10 mx-auto max-w-5xl px-4 pb-32 animate-in fade-in duration-700">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              You Might Also <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">Like</span>
            </h2>
            <Link to="/discover" className="text-sm font-bold text-[#14B8A6] hover:text-teal-300 transition-colors">
              View All &rsaquo;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {suggestedEvents.map((event) => (
              <Link to={`/booking/${event.id}`} key={event.id} onClick={() => window.scrollTo(0, 0)} className="block transition-transform hover:-translate-y-2 duration-300">
                <EventCard 
                  image={resolveImg(event.imageUrl || event.coverImage)}
                  location={event.venue || event.location || "TBA"}
                  date={event.eventDate ? new Date(event.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBA"}
                  status={event.isClosed ? 'CLOSED' : (event.category ? event.category.toUpperCase() : "AVAILABLE")}
                  title={event.name || event.title || "Unnamed Event"}
                  price={event.ticketPrice ? `EGP ${event.ticketPrice}` : "Free"}
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Persistent Floating Checkout Bar */}
      {selectedSeatIds.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 md:left-[84px] z-[100] flex justify-center pointer-events-none px-4">
          <div className="flex items-center gap-3 pointer-events-auto w-full md:w-[80%] max-w-5xl">
            {/* Main Info Pill */}
            <div className="flex flex-1 items-center justify-between gap-4 sm:gap-6 rounded-full bg-[#161a1a]/95 border border-white/10 backdrop-blur-2xl px-6 sm:px-8 py-3 sm:py-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 fade-in duration-300">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 whitespace-nowrap">
                  {selectedSeatIds.length} Seat{selectedSeatIds.length > 1 ? 's' : ''}
                </span>
                <span className="text-lg font-black text-white leading-none whitespace-nowrap">EGP {totalPrice.toLocaleString()}</span>
              </div>
              
              <div className="w-[1px] h-8 bg-white/10 mx-1 sm:mx-2" />
              
              <button
                onClick={() => openCheckoutModal("mock")}
                className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-white transition-colors whitespace-nowrap"
              >
                Mock Checkout
              </button>
            </div>

            {/* Primary Action Button (Wallet) */}
            <button
              onClick={() => openCheckoutModal("wallet")}
              title="Wallet Checkout"
              className="w-14 h-14 flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#14B8A6] to-[#0F766E] text-white shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:scale-110 transition-all animate-in slide-in-from-bottom-10 fade-in duration-300 delay-75"
            >
              <Wallet className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#111214] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsCheckoutModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-tight">Order Summary</h2>

            <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-2 mb-6 space-y-3">
              {selectedSeats.map((s) => {
                const isVip = s.isVip || s.seatType === "VIP" || s.type === "VIP";
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${isVip ? "bg-[#e8cd51]" : "bg-[#14B8A6]"}`} />
                      <span className="text-sm font-medium text-white">
                        Seat {s.seatNumber ?? s.id} {isVip && <span className="text-[10px] font-bold text-yellow-400 ml-2">VIP</span>}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-zinc-300">
                      {(s.price ?? s.pricePerSeat) ? `EGP ${Number(s.price ?? s.pricePerSeat).toLocaleString()}` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 border-t border-white/10 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Subtotal</span>
                <span className="text-sm font-bold text-white">EGP {totalPrice.toLocaleString()}</span>
              </div>
              
              {promoDiscount > 0 && (
                <div className="flex justify-between items-center text-[#14B8A6]">
                  <span className="text-xs font-bold uppercase tracking-widest">Discount ({promoDiscount}%)</span>
                  <span className="text-sm font-bold">- EGP {((totalPrice * promoDiscount) / 100).toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold uppercase tracking-widest text-white">Total</span>
                <span className="text-2xl font-black text-[#14B8A6]">EGP {finalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 mb-2">
              <input type="text" placeholder="Promo code" value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#14B8A6]/50 transition-all" />
              <button type="button" onClick={handleApplyPromo} className="rounded-xl bg-white/10 px-6 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/20 transition-colors">
                Apply
              </button>
            </div>
            {promoMessage && <p className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${promoMessage.toLowerCase().includes('invalid') ? 'text-red-400' : 'text-[#14B8A6]'}`}>{promoMessage}</p>}
            {!promoMessage && <div className="h-4 mb-6" />}

            {error && <p className="mb-4 text-sm font-medium text-red-400 text-center">{error}</p>}
            {success && <p className="mb-4 text-sm font-medium text-[#14B8A6] text-center">{success}</p>}

            <button 
              type="button" 
              onClick={handleCheckout}
              disabled={actionLoading}
              className="w-full flex justify-center items-center rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#0F766E] py-4 text-sm font-bold tracking-widest text-white uppercase transition-all hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Confirm & Pay EGP ${finalPrice.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
