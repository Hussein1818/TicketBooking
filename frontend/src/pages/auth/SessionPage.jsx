import { useState } from "react";
import { CheckCircle, Loader2, ShieldX } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import useAuthStore from "../../store/useAuthStore";
import { getErrorMessage, revokeToken } from "../../services/authApi";

export default function SessionPage() {
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const [loadingRevoke, setLoadingRevoke] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRevoke = async () => {
    setError("");
    setSuccess("");
    setLoadingRevoke(true);

    try {
      await revokeToken(token);
      logout();
      setSuccess("Token revoked and local session cleared.");
    } catch (errorObject) {
      setError(getErrorMessage(errorObject, "Failed to revoke token."));
    } finally {
      setLoadingRevoke(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md rounded-2xl bg-[#1e1e20] p-8 shadow-2xl ring-1 ring-white/5">
        <h2 className="mb-6 text-2xl font-medium text-white">Session Management</h2>
        <p className="mb-5 text-sm text-zinc-400">
          Refresh token now runs automatically in the background. You only need revoke when you want to logout from the server session.
        </p>
        <div className="space-y-5">
          {error && <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-teal-500/50 bg-teal-500/10 p-3 text-sm text-teal-400">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}
          <button
            type="button"
            onClick={handleRevoke}
            disabled={loadingRevoke || !token}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 py-3 text-sm font-bold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-60"
          >
            {loadingRevoke ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4" />}
            Revoke Token
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
