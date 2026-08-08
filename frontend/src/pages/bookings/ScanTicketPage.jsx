import { useState } from "react";
import { CheckCircle, Loader2, ScanLine } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuthStore from "../../store/useAuthStore";
import { getErrorMessage, scanQr } from "../../services/bookingsApi";

export default function ScanTicketPage() {
  const token = useAuthStore((state) => state.token);

  const [qrData, setQrData] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");
    try {
      const data = await scanQr(qrData, token);
      setResult(typeof data === "string" ? data : JSON.stringify(data));
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Scan failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl rounded-xl border border-white/5 bg-[#16171a] p-8">
        <h1 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white"><ScanLine className="h-6 w-6 text-teal-400" />Scan Ticket</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={qrData}
            onChange={(e) => setQrData(e.target.value)}
            placeholder="Paste qrData..."
            className="min-h-32 w-full rounded-lg border border-white/10 bg-[#0f1013] p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500/50"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-teal-400 py-3 text-sm font-bold text-black hover:bg-teal-300 disabled:opacity-60"
          >
            {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Scan"}
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {result && <p className="mt-4 flex items-center gap-2 text-sm text-teal-400"><CheckCircle className="h-4 w-4" />{result}</p>}
      </div>
    </DashboardLayout>
  );
}
