import { useState, useMemo } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { Star, Zap, Crown, Loader2, CheckCircle, Shield } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import { upgradeSubscription, getErrorMessage } from "../services/subscriptionsApi";

export default function VipPage() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  
  const username = useMemo(
    () => user?.username || user?.userName || user?.email || "",
    [user]
  );

  const [selectedTier, setSelectedTier] = useState(1);
  const [months, setMonths] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const tiers = [
    {
      id: 1,
      name: "Gold Member",
      icon: Star,
      color: "text-[#e8cd51]",
      bg: "bg-[#e8cd51]/10",
      border: "border-[#e8cd51]",
      price: 50,
      perks: ["Early Access to Events", "Dedicated Support Line", "5% Discount on Merchandise"]
    },
    {
      id: 2,
      name: "Platinum VIP",
      icon: Zap,
      color: "text-teal-400",
      bg: "bg-teal-400/10",
      border: "border-teal-400",
      price: 100,
      perks: ["All Gold Perks", "Backstage Passes (Select Events)", "15% Discount on Merchandise", "Free Seat Upgrades"]
    },
    {
      id: 3,
      name: "Obsidian Elite",
      icon: Crown,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500",
      price: 250,
      perks: ["All Platinum Perks", "Exclusive Private Events", "Personal Concierge", "Lifetime Fan ID Status"]
    }
  ];

  const handleUpgrade = async () => {
    if (!username) {
      setError("You must be logged in to upgrade.");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await upgradeSubscription({
        tier: selectedTier,
        months: Number(months)
      }, token);
      
      setSuccess(typeof response === "string" ? response : "Subscription upgraded successfully!");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upgrade subscription. Check your wallet balance."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Ambient VIP Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] bg-[#0F766E]/15 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[50%] right-[-10%] w-[800px] h-[800px] bg-[#14B8A6]/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[10%] w-[700px] h-[700px] bg-[#0F766E]/15 blur-[180px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tighter text-white mb-4 flex items-center justify-center sm:justify-start gap-4 drop-shadow-md">
            <Star className="w-10 h-10 text-[#e8cd51] drop-shadow-[0_0_15px_rgba(232,205,81,0.5)]" fill="currentColor" />
            VIP <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0F766E] ml-2">Perks</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl text-lg leading-relaxed text-center sm:text-left">
            Elevate your event experience with premium subscription tiers. Gain exclusive access, enhanced security, and unmatched privileges.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-[1.5rem] flex items-center gap-3 backdrop-blur-sm shadow-xl">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-[#14B8A6]/10 border border-[#14B8A6]/20 text-[#14B8A6] p-4 rounded-[1.5rem] flex items-center gap-3 backdrop-blur-sm shadow-xl">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}

        {/* Tiers Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => {
            const isSelected = selectedTier === tier.id;
            const Icon = tier.icon;
            
            return (
              <div 
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`relative rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer flex flex-col group overflow-hidden ${
                  isSelected 
                    ? `${tier.border} bg-white/[0.04] shadow-[0_0_40px_rgba(0,0,0,0.3)] scale-105 z-20 backdrop-blur-3xl` 
                    : `border-white/5 bg-white/[0.02] hover:bg-white/[0.03] hover:border-white/20 backdrop-blur-xl hover:-translate-y-2`
                }`}
                style={{
                  WebkitMaskImage: 'radial-gradient(circle at 0% 50%, transparent 16px, black 17px), radial-gradient(circle at 100% 50%, transparent 16px, black 17px)',
                  WebkitMaskSize: '51% 100%',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'left top, right top',
                  maskImage: 'radial-gradient(circle at 0% 50%, transparent 16px, black 17px), radial-gradient(circle at 100% 50%, transparent 16px, black 17px)',
                  maskSize: '51% 100%',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'left top, right top',
                }}
              >
                {/* Subtle Tier Background Glow */}
                {isSelected && (
                   <div className={`absolute -top-32 -right-32 w-64 h-64 ${tier.bg} blur-[80px] rounded-full pointer-events-none opacity-50`}></div>
                )}

                {/* Popular Badge */}
                {tier.id === 2 && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-[#14B8A6] to-[#0F766E] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-bl-2xl z-20 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                    Recommended
                  </div>
                )}
                
                {/* TOP SECTION (Header & Price) */}
                <div className="p-10 pb-8 relative z-10">
                  <div className={`w-16 h-16 rounded-2xl ${tier.bg} border ${tier.border} flex items-center justify-center mb-8 shadow-inner`}>
                    <Icon className={`w-8 h-8 ${tier.color} drop-shadow-[0_0_10px_currentColor]`} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tighter">EGP {tier.price}</span>
                    <span className="text-sm text-zinc-500 font-bold uppercase">/ mo</span>
                  </div>
                </div>
                
                {/* TICKET DIVIDER */}
                <div className="relative flex items-center justify-center w-full h-8 opacity-40">
                   <div className={`w-full mx-8 border-t-[2px] border-dashed ${isSelected ? tier.border : 'border-white/20'}`} />
                </div>
                
                {/* BOTTOM SECTION (Perks) */}
                <div className="p-10 pt-4 flex-1 relative z-10">
                  <ul className="space-y-5">
                    {tier.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-start gap-4">
                        <CheckCircle className={`w-5 h-5 mt-0.5 ${tier.color} drop-shadow-[0_0_5px_currentColor] shrink-0`} />
                        <span className="text-sm text-zinc-300 font-medium leading-relaxed">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Upgrade Form */}
        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-12 mt-16 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-bl from-white/[0.03] to-transparent pointer-events-none group-hover:opacity-100 opacity-50 transition-opacity" />
          
          <div className="flex-1 space-y-6 relative z-10">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-[#14B8A6] drop-shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
              Secure Activation
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed max-w-xl">
              Choose the duration for your VIP status. The total amount will be deducted directly from your secure wallet instantly.
            </p>
          </div>
          
          <div className="w-full lg:w-[450px] bg-black/40 border border-white/5 p-8 rounded-[2rem] flex flex-col gap-8 relative z-10 shadow-inner">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-4 uppercase tracking-widest">Duration (Months)</label>
              <input 
                type="number" 
                min="1" 
                max="12" 
                value={months}
                onChange={(e) => setMonths(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                className="w-full rounded-[1.5rem] border border-transparent bg-white/5 px-6 py-4 text-white font-medium focus:border-[#14B8A6]/50 focus:bg-white/10 focus:outline-none transition-all"
              />
            </div>
            
            <div className="flex items-center justify-between border-t border-white/5 pt-6">
              <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Total Cost</span>
              <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                EGP {(tiers.find(t => t.id === selectedTier)?.price || 0) * months}
              </span>
            </div>
            
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className={`w-full rounded-[1.5rem] py-5 text-base font-bold uppercase tracking-widest text-black transition-all duration-300 ${
                loading ? "opacity-50 cursor-not-allowed bg-zinc-500" : "bg-gradient-to-r from-[#14B8A6] to-[#0F766E] hover:shadow-[0_0_30px_rgba(20,184,166,0.3)] hover:scale-[1.02]"
              } flex items-center justify-center gap-3`}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirm Upgrade"}
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
