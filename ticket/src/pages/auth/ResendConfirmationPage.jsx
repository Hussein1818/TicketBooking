import { useState } from "react";
import { CheckCircle, Loader2, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import { getErrorMessage, resendConfirmation } from "../../services/authApi";

export default function ResendConfirmationPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const clientURI = `${window.location.origin}/confirm-email`;
      const message = await resendConfirmation(email, clientURI);
      setSuccess(message);
    } catch (errorObject) {
      setError(getErrorMessage(errorObject, "Failed to resend confirmation email."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md rounded-2xl bg-[#1e1e20] p-8 shadow-2xl ring-1 ring-white/5">
        <h2 className="mb-6 text-2xl font-medium text-white">Resend Confirmation</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-teal-500/50 bg-teal-500/10 p-3 text-sm text-teal-400">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Email</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/5 bg-[#2a2a2b] pl-10 pr-4 py-3 text-sm text-white focus:border-teal-400/50 focus:outline-none"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-400 py-3 text-sm font-bold text-black transition-all hover:bg-teal-300 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend Email"}
          </button>
          <p className="text-center text-xs text-zinc-400">
            Back to{" "}
            <Link to="/signin" className="text-teal-400 hover:text-teal-300">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}
