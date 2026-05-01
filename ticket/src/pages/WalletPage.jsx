import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { Plus, Send, Star, ShieldCheck, Zap, HelpCircle, CheckCircle2, Loader2 } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import { addFunds, getBalance, getErrorMessage, transferWallet, walletPay } from "../services/walletApi";

const isTokenUsable = (token) => {
  if (!token) return false;
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return false;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized));
    if (!payload?.exp) return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export default function WalletPage() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const username = useMemo(() => user?.username || user?.userName || user?.email || "", [user]);

  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [activity, setActivity] = useState([]);

  const [topupAmount, setTopupAmount] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [payBookingIds, setPayBookingIds] = useState("");
  const [payPromoCode, setPayPromoCode] = useState("");

  useEffect(() => {
    const fetchBalance = async () => {
      if (!isTokenUsable(token)) {
        setLoadingBalance(false);
        setError(token ? "Session expired. Please sign in again." : "");
        return;
      }
      setLoadingBalance(true);
      try {
        const data = await getBalance(token);
        const value =
          typeof data === "number"
            ? data
            : Number(data?.balance ?? data?.amount ?? data?.walletBalance ?? 0);
        setBalance(Number.isFinite(value) ? value : 0);
      } catch (fetchError) {
        setError(getErrorMessage(fetchError, "Failed to load wallet balance."));
      } finally {
        setLoadingBalance(false);
      }
    };
    fetchBalance();
  }, [token]);

  const addActivity = (message, amount) => {
    setActivity((prev) => [
      {
        id: Date.now(),
        message,
        amount,
        time: new Date().toLocaleString(),
      },
      ...prev.slice(0, 7),
    ]);
  };

  const handleTopUp = async () => {
    if (!isTokenUsable(token)) {
      setError("Session expired. Please sign in again.");
      return;
    }
    setError("");
    setSuccess("");
    setActionLoading("topup");
    try {
      const data = await addFunds({ username, amount: topupAmount }, token);
      const amountNumber = Number(topupAmount || 0);
      setBalance((prev) => prev + amountNumber);
      addActivity("Wallet top-up", `+ EGP ${amountNumber.toFixed(2)}`);
      setSuccess(typeof data === "string" ? data : "Funds added successfully.");
      setTopupAmount("");
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Failed to add funds."));
    } finally {
      setActionLoading("");
    }
  };

  const handleTransfer = async () => {
    if (!isTokenUsable(token)) {
      setError("Session expired. Please sign in again.");
      return;
    }
    setError("");
    setSuccess("");
    setActionLoading("transfer");
    try {
      const data = await transferWallet(
        { fromUsername: username, toUsername: transferTo, amount: transferAmount },
        token,
      );
      const amountNumber = Number(transferAmount || 0);
      setBalance((prev) => prev - amountNumber);
      addActivity(`Transfer to @${transferTo}`, `- EGP ${amountNumber.toFixed(2)}`);
      setSuccess(typeof data === "string" ? data : "Transfer completed successfully.");
      setTransferTo("");
      setTransferAmount("");
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Failed to transfer."));
    } finally {
      setActionLoading("");
    }
  };

  const handleWalletPay = async () => {
    if (!isTokenUsable(token)) {
      setError("Session expired. Please sign in again.");
      return;
    }
    setError("");
    setSuccess("");
    setActionLoading("pay");
    try {
      const bookingIds = payBookingIds
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .map(Number);
      const data = await walletPay({ bookingIds, username, promoCode: payPromoCode }, token);
      addActivity("Wallet payment for bookings", `Bookings: ${bookingIds.join(", ")}`);
      setSuccess(typeof data === "string" ? data : "Wallet payment successful.");
      setPayBookingIds("");
      setPayPromoCode("");
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Failed to pay with wallet."));
    } finally {
      setActionLoading("");
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 pb-12 font-sans tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Vault Command</h1>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              Manage your digital velocity assets and monitor tier progression in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded bg-white px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-zinc-200">
              <Plus className="h-4 w-4" strokeWidth={3} />
              Top-up
            </button>
            <button className="flex items-center gap-2 rounded bg-[#1a1c21] border border-white/5 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10">
              <Send className="h-4 w-4" />
              Transfer
            </button>
          </div>
        </div>

        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Total Balance Card (spans 2) */}
          <div className="lg:col-span-2 rounded-xl border border-white/5 bg-[#16171a] p-8 flex flex-col justify-between min-h-[260px] relative overflow-hidden">
            {/* Background subtle gradient */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-teal-500/5 to-transparent pointer-events-none"></div>

            <div>
              <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-3">Total Balance</p>
              <div className="flex items-baseline gap-3 mb-1">
                 <h2 className="text-5xl font-bold text-white tracking-tighter">
                   {loadingBalance ? "..." : Number(balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </h2>
                 <span className="text-lg font-bold text-teal-400">EGP</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-8">
              <div>
                 <p className="text-[11px] text-zinc-500 mb-1">Wallet Owner</p>
                 <p className="text-sm font-bold text-teal-400">{username || "Unknown"}</p>
              </div>
              <div>
                 <p className="text-[11px] text-zinc-500 mb-1">Requests</p>
                 <p className="text-sm font-bold text-white">Wallet APIs Connected</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                 <p className="text-[11px] text-zinc-500 mb-2">Status</p>
                 <div className="h-1.5 w-full max-w-[200px] flex rounded-full overflow-hidden bg-[#272b30]">
                    <div className="h-full bg-teal-400" style={{ width: "100%" }} />
                 </div>
              </div>
            </div>
          </div>

          {/* Loyalty Points Card */}
          <div className="rounded-xl border border-white/5 bg-[#1e1f23] p-8 flex flex-col justify-between">
             <div className="flex justify-between items-start mb-6">
                <div className="h-10 w-10 rounded bg-[#16171a] flex items-center justify-center border border-white/5 shadow-inner">
                   <Star className="h-5 w-5 text-[#e8cd51]" />
                </div>
                <span className="text-[9px] font-bold tracking-widest text-[#a88832] border border-[#a88832]/30 bg-[#a88832]/10 px-2 py-0.5 rounded uppercase">Loyalty</span>
             </div>
             
             <div className="space-y-3">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Top-up Amount</p>
                <input
                  type="number"
                  min="1"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full rounded border border-white/10 bg-[#16171a] px-3 py-2 text-sm text-white"
                  placeholder="Amount"
                />
                <button
                  type="button"
                  disabled={actionLoading === "topup" || !topupAmount}
                  onClick={handleTopUp}
                  className="w-full rounded bg-teal-400 py-2 text-sm font-bold text-black disabled:opacity-60"
                >
                  {actionLoading === "topup" ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Add Funds"}
                </button>
             </div>
          </div>
        </div>

        {/* Middle Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Wallet Transfer */}
          <div className="rounded-xl border border-white/5 bg-[#1e1f23] flex flex-col">
             <div className="p-8 pb-6">
                <p className="text-xs font-bold text-white mb-6">Wallet Transfer</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    placeholder="toUsername"
                    className="w-full rounded border border-white/10 bg-[#16171a] px-3 py-2 text-sm text-white"
                  />
                  <input
                    type="number"
                    min="1"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="amount"
                    className="w-full rounded border border-white/10 bg-[#16171a] px-3 py-2 text-sm text-white"
                  />
                  <button
                    type="button"
                    disabled={actionLoading === "transfer" || !transferTo || !transferAmount}
                    onClick={handleTransfer}
                    className="w-full rounded bg-white py-2 text-sm font-bold text-black disabled:opacity-60"
                  >
                    {actionLoading === "transfer" ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Transfer"}
                  </button>
                </div>
             </div>
          </div>

          {/* Wallet Pay + Activity (spans 2) */}
          <div className="lg:col-span-2 rounded-xl border border-white/5 bg-[#16171a] flex flex-col p-8">
             <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                <h3 className="text-sm font-bold text-white">Wallet Pay + Recent Activity</h3>
             </div>

             <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
               <input
                 type="text"
                 value={payBookingIds}
                 onChange={(e) => setPayBookingIds(e.target.value)}
                 placeholder="bookingIds (e.g. 1,2,3)"
                 className="rounded border border-white/10 bg-[#1e1f23] px-3 py-2 text-sm text-white"
               />
               <input
                 type="text"
                 value={payPromoCode}
                 onChange={(e) => setPayPromoCode(e.target.value)}
                 placeholder="promoCode (optional)"
                 className="rounded border border-white/10 bg-[#1e1f23] px-3 py-2 text-sm text-white"
               />
               <button
                 type="button"
                 onClick={handleWalletPay}
                 disabled={actionLoading === "pay" || !payBookingIds}
                 className="rounded bg-teal-400 px-3 py-2 text-sm font-bold text-black disabled:opacity-60"
               >
                 {actionLoading === "pay" ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Pay Bookings"}
               </button>
             </div>

             {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
             {success && <p className="mb-3 text-sm text-teal-400">{success}</p>}

             <div className="flex-1 space-y-4">
               {activity.length === 0 && (
                 <p className="text-sm text-zinc-500">No wallet operations yet.</p>
               )}
               {activity.map((item) => (
                 <div key={item.id} className="flex items-center justify-between rounded border border-white/5 bg-[#1e1f23] px-4 py-3">
                   <div>
                     <p className="text-sm font-bold text-white">{item.message}</p>
                     <p className="text-[11px] text-zinc-500">{item.time}</p>
                   </div>
                   <p className="text-xs font-bold text-teal-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{item.amount}</p>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Footer Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
           
           <div className="rounded-xl border border-white/5 bg-[#16171a] p-5 flex items-center gap-4 group cursor-default">
              <ShieldCheck className="h-5 w-5 text-teal-400 group-hover:scale-110 transition-transform" />
              <div>
                 <p className="text-[11px] font-bold text-white mb-0.5">Shield Active</p>
                 <p className="text-[10px] text-zinc-500">End-to-end encryption enabled</p>
              </div>
           </div>

           <div className="rounded-xl border border-white/5 bg-[#16171a] p-5 flex items-center gap-4 group cursor-default">
              <Zap className="h-5 w-5 text-[#e8cd51] group-hover:scale-110 transition-transform" />
              <div>
                 <p className="text-[11px] font-bold text-white mb-0.5">Instant Settled</p>
                 <p className="text-[10px] text-zinc-500">Average speed: 1.2s per tx</p>
              </div>
           </div>

           <div className="rounded-xl border border-white/5 bg-[#16171a] p-5 flex items-center gap-4 group cursor-default">
              <HelpCircle className="h-5 w-5 text-zinc-400 group-hover:scale-110 transition-transform" />
              <div>
                 <p className="text-[11px] font-bold text-white mb-0.5">Concierge Support</p>
                 <p className="text-[10px] text-zinc-500">24/7 dedicated assistance</p>
              </div>
           </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
