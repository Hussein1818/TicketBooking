import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { Plus, Send, Star, ShieldCheck, Zap, HelpCircle, CheckCircle2, Loader2, Activity } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import { addFunds, getBalance, getErrorMessage, transferWallet } from "../services/walletApi";

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
      const data = await addFunds({ amount: topupAmount }, token);
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
        { toUsername: transferTo, amount: transferAmount },
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


  return (
    <DashboardLayout>
      {/* Ambient Wallet Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[0%] left-[-10%] w-[500px] h-[500px] bg-[#0F766E]/15 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-[#14B8A6]/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-[#0F766E]/15 blur-[180px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 pb-12 font-sans tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700 px-4">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 pt-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3 drop-shadow-md">
              Vault <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">Command</span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-md leading-relaxed">
              Manage your digital velocity assets and monitor tier progression in real-time.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             {error}
          </div>
        )}
        {success && (
          <div className="bg-[#14B8A6]/10 border border-[#14B8A6]/20 text-[#14B8A6] p-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
             <CheckCircle2 className="w-5 h-5" />
             {success}
          </div>
        )}

        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Total Balance Card (spans 2) */}
          <div className="lg:col-span-2 rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-10 flex flex-col justify-between min-h-[300px] relative overflow-hidden shadow-2xl group hover:bg-white/[0.03] transition-colors">
            {/* Background subtle gradient */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-bl from-[#14B8A6]/20 to-transparent blur-[80px] rounded-full pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Total Balance</p>
              <div className="flex items-baseline gap-4 mb-2">
                 <h2 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tighter drop-shadow-lg">
                   {loadingBalance ? "..." : Number(balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </h2>
                 <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E]">EGP</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-12 bg-white/[0.02] border border-white/5 p-6 rounded-[1.5rem]">
              <div>
                 <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Wallet Owner</p>
                 <p className="text-base font-bold text-white line-clamp-1">{username || "Unknown"}</p>
              </div>
              <div>
                 <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Security</p>
                 <p className="text-base font-bold text-white flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4 text-[#14B8A6]" /> Secured
                 </p>
              </div>
              <div className="col-span-2 md:col-span-1">
                 <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Status</p>
                 <div className="h-2 w-full max-w-[200px] flex rounded-full overflow-hidden bg-black/40 border border-white/5 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-[#14B8A6] to-[#0F766E] shadow-[0_0_10px_#14B8A6]" style={{ width: "100%" }} />
                 </div>
              </div>
            </div>
          </div>

          {/* Loyalty & Top-up Card */}
          <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-[#e8cd51]/5 to-transparent pointer-events-none" />
             
             <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5 shadow-inner backdrop-blur-md">
                   <Star className="h-6 w-6 text-[#e8cd51] drop-shadow-[0_0_10px_rgba(232,205,81,0.5)]" />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-[#e8cd51] border border-[#e8cd51]/30 bg-[#e8cd51]/10 px-3 py-1 rounded-full uppercase shadow-[0_0_15px_rgba(232,205,81,0.2)]">Loyalty</span>
             </div>
             
             <div className="space-y-4 relative z-10">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Top-up Amount (EGP)</p>
                <input
                  type="number"
                  min="1"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full rounded-[1.5rem] border border-transparent bg-white/5 focus:bg-white/10 px-5 py-4 text-white focus:outline-none focus:border-[#14B8A6]/50 transition-all font-medium placeholder-zinc-600"
                  placeholder="0.00"
                />
                <button
                  type="button"
                  disabled={actionLoading === "topup" || !topupAmount}
                  onClick={handleTopUp}
                  className="w-full flex items-center justify-center gap-2 rounded-[1.5rem] bg-gradient-to-r from-[#14B8A6] to-[#0F766E] py-4 text-base font-bold text-black disabled:opacity-50 hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:scale-[1.02] transition-all duration-300 mt-2"
                >
                  {actionLoading === "topup" ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      <Plus className="w-5 h-5" strokeWidth={3} /> Add Funds
                    </>
                  )}
                </button>
             </div>
          </div>
        </div>

        {/* Middle Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Wallet Transfer */}
          <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl flex flex-col shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none group-hover:opacity-100 opacity-50 transition-opacity" />
             <div className="p-10 relative z-10 flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Send className="w-5 h-5 text-[#14B8A6]" /> Send Funds
                  </h3>
                  <p className="text-zinc-500 text-sm mb-8">Transfer instantly to any user on the platform.</p>
                </div>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    placeholder="Username or Email"
                    className="w-full rounded-[1.5rem] border border-transparent bg-white/5 focus:bg-white/10 px-5 py-4 text-white focus:outline-none focus:border-[#14B8A6]/50 transition-all font-medium placeholder-zinc-600"
                  />
                  <input
                    type="number"
                    min="1"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Amount (EGP)"
                    className="w-full rounded-[1.5rem] border border-transparent bg-white/5 focus:bg-white/10 px-5 py-4 text-white focus:outline-none focus:border-[#14B8A6]/50 transition-all font-medium placeholder-zinc-600"
                  />
                  <button
                    type="button"
                    disabled={actionLoading === "transfer" || !transferTo || !transferAmount}
                    onClick={handleTransfer}
                    className="w-full rounded-[1.5rem] bg-white text-black font-bold py-4 hover:scale-[1.02] hover:bg-zinc-200 transition-all duration-300 disabled:opacity-50 mt-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  >
                    {actionLoading === "transfer" ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Confirm Transfer"}
                  </button>
                </div>
             </div>
          </div>

          {/* Activity (spans 2) */}
          <div className="lg:col-span-2 rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl flex flex-col p-10 shadow-2xl">
             <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Recent Activity</h3>
                  <p className="text-sm text-zinc-500">Track your latest transactions.</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-zinc-400">
                  <Activity className="w-5 h-5" />
                </div>
             </div>

             <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[320px]">
               {activity.length === 0 && (
                 <div className="h-full w-full flex flex-col items-center justify-center text-zinc-500 py-10">
                   <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                     <Zap className="w-6 h-6 opacity-50" />
                   </div>
                   <p className="text-sm font-medium">No wallet operations yet.</p>
                   <p className="text-xs mt-1 opacity-70">Top up your wallet to get started.</p>
                 </div>
               )}
               {activity.map((item) => (
                 <div key={item.id} className="flex items-center justify-between rounded-[1.5rem] border border-white/5 bg-white/[0.02] px-6 py-4 hover:bg-white/[0.04] transition-colors group">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-[#14B8A6] border border-white/5 shadow-inner">
                       {item.message.toLowerCase().includes("top-up") ? <Plus className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                     </div>
                     <div>
                       <p className="text-sm font-bold text-white group-hover:text-[#14B8A6] transition-colors">{item.message}</p>
                       <p className="text-[11px] text-zinc-500 mt-0.5">{item.time}</p>
                     </div>
                   </div>
                   <p className="text-sm font-bold text-white bg-white/5 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                     <span className={item.amount.startsWith("+") ? "text-[#14B8A6]" : "text-zinc-400"}>{item.amount}</span>
                   </p>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Footer Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
           <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6 flex items-center gap-5 group cursor-default hover:bg-white/[0.04] transition-colors">
              <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center shadow-inner border border-white/5">
                <ShieldCheck className="h-6 w-6 text-[#14B8A6] group-hover:scale-110 transition-transform" />
              </div>
              <div>
                 <p className="text-[13px] font-bold text-white mb-0.5">Shield Active</p>
                 <p className="text-[11px] text-zinc-500">End-to-end encryption enabled</p>
              </div>
           </div>

           <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6 flex items-center gap-5 group cursor-default hover:bg-white/[0.04] transition-colors">
              <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center shadow-inner border border-white/5">
                <Zap className="h-6 w-6 text-[#e8cd51] group-hover:scale-110 transition-transform" />
              </div>
              <div>
                 <p className="text-[13px] font-bold text-white mb-0.5">Instant Settled</p>
                 <p className="text-[11px] text-zinc-500">Average speed: 1.2s per tx</p>
              </div>
           </div>

           <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-6 flex items-center gap-5 group cursor-default hover:bg-white/[0.04] transition-colors">
              <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center shadow-inner border border-white/5">
                <HelpCircle className="h-6 w-6 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                 <p className="text-[13px] font-bold text-white mb-0.5">Concierge Support</p>
                 <p className="text-[11px] text-zinc-500">24/7 dedicated assistance</p>
              </div>
           </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
