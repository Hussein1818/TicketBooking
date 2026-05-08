import { useState } from "react";
import { CheckCircle, Loader2, Megaphone } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import { blastCampaign, getErrorMessage } from "../../services/authApi";

export default function BlastCampaignPage() {
  const [formData, setFormData] = useState({
    eventId: "",
    subject: "",
    message: "",
    currentUserId: "",
    isAdmin: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const result = await blastCampaign(formData);
      setSuccess(result);
    } catch (errorObject) {
      setError(getErrorMessage(errorObject, "Failed to send blast campaign."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md rounded-2xl bg-[#1e1e20] p-8 shadow-2xl ring-1 ring-white/5">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-medium text-white">
          <Megaphone className="h-5 w-5 text-teal-400" />
          Blast Campaign
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-teal-500/50 bg-teal-500/10 p-3 text-sm text-teal-400">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}
          <input
            type="number"
            value={formData.eventId}
            onChange={(e) => setFormData((prev) => ({ ...prev, eventId: e.target.value }))}
            placeholder="Event ID"
            className="w-full rounded-lg border border-white/5 bg-[#2a2a2b] p-3 text-sm text-white focus:border-teal-400/50 focus:outline-none"
            required
          />
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
            placeholder="Subject"
            className="w-full rounded-lg border border-white/5 bg-[#2a2a2b] p-3 text-sm text-white focus:border-teal-400/50 focus:outline-none"
            required
          />
          <textarea
            value={formData.message}
            onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
            placeholder="Campaign message"
            className="min-h-28 w-full rounded-lg border border-white/5 bg-[#2a2a2b] p-3 text-sm text-white focus:border-teal-400/50 focus:outline-none"
            required
          />
          <input
            type="text"
            value={formData.currentUserId}
            onChange={(e) => setFormData((prev) => ({ ...prev, currentUserId: e.target.value }))}
            placeholder="Current User ID"
            className="w-full rounded-lg border border-white/5 bg-[#2a2a2b] p-3 text-sm text-white focus:border-teal-400/50 focus:outline-none"
            required
          />
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={formData.isAdmin}
              onChange={(e) => setFormData((prev) => ({ ...prev, isAdmin: e.target.checked }))}
            />
            Is Admin
          </label>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-400 py-3 text-sm font-bold text-black transition-all hover:bg-teal-300 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Campaign"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
