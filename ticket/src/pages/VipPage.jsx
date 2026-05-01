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
        username,
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
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl lg:text-[40px] font-bold tracking-tight text-white mb-4 uppercase flex items-center justify-center sm:justify-start gap-3">
            <Star className="w-8 h-8 text-[#e8cd51]" fill="currentColor" />
            VIP Perks & Subscriptions
          </h1>
          <p className="text-zinc-400 max-w-2xl text-sm leading-relaxed mx-auto sm:mx-0">
            Elevate your event experience with Obsidian Velocity's premium subscription tiers. Gain exclusive access, enhanced security, and unmatched privileges.
          </p>
        </div>

        {error && <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-500 font-medium">{error}</div>}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-teal-500/50 bg-teal-500/10 p-4 text-sm text-teal-400 font-medium">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}

        {/* Tiers Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const isSelected = selectedTier === tier.id;
            const Icon = tier.icon;
            
            return (
              <div 
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`relative rounded-2xl border-2 transition-all cursor-pointer overflow-hidden group ${
                  isSelected 
                    ? `${tier.border} ${tier.bg} shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-105 z-10` 
                    : `border-white/5 bg-[#16171a] hover:border-white/20`
                }`}
              >
                {/* Popular Badge */}
                {tier.id === 2 && (
                  <div className="absolute top-0 right-0 bg-teal-400 text-black text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg">
                    Recommended
                  </div>
                )}
                
                <div className="p-8">
                  <Icon className={`w-10 h-10 ${tier.color} mb-6`} />
                  <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-bold text-white">EGP {tier.price}</span>
                    <span className="text-xs text-zinc-500 font-medium uppercase">/ month</span>
                  </div>
                  
                  <ul className="space-y-4">
                    {tier.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className={`w-4 h-4 mt-0.5 ${tier.color}`} />
                        <span className="text-sm text-zinc-300 leading-tight">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Upgrade Form */}
        <div className="rounded-xl border border-white/5 bg-[#111214] p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-8 mt-10">
          <div className="flex-1 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-400" />
              Configure Subscription
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">
              Choose the duration for your VIP status. The total amount will be deducted directly from your secure wallet.
            </p>
          </div>
          
          <div className="w-full md:w-[400px] bg-[#16171a] border border-white/5 p-6 rounded-xl flex flex-col gap-6">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wide">Duration (Months)</label>
              <input 
                type="number" 
                min="1" 
                max="12" 
                value={months}
                onChange={(e) => setMonths(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3 text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
            
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Total Cost</span>
              <span className="text-2xl font-bold text-white">EGP {(tiers.find(t => t.id === selectedTier)?.price || 0) * months}</span>
            </div>
            
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className={`w-full rounded-lg py-3.5 text-sm font-bold uppercase tracking-widest text-black transition-all ${
                loading ? "opacity-50 cursor-not-allowed bg-zinc-500" : "bg-teal-400 hover:bg-teal-300 shadow-[0_0_15px_rgba(48,216,192,0.2)]"
              } flex items-center justify-center gap-2`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Upgrade"}
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
