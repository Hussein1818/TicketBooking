import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Mail, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import { confirmEmail, getErrorMessage } from "../../services/authApi";

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  
  // Extract userId and token from query params
  const userId = searchParams.get("userId") || searchParams.get("id") || "";
  const token = searchParams.get("token") || searchParams.get("code") || "";

  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!userId || !token) {
      setStatus("no-params");
      return;
    }

    let isMounted = true;

    const handleConfirm = async () => {
      setStatus("loading");
      setMessage("");
      try {
        const resMessage = await confirmEmail(userId, token);
        if (isMounted) {
          setMessage(resMessage || "Your email address has been confirmed successfully!");
          setStatus("success");
        }
      } catch (err) {
        if (isMounted) {
          setMessage(getErrorMessage(err, "Failed to confirm email. The link may be expired or invalid."));
          setStatus("error");
        }
      }
    };

    handleConfirm();

    return () => {
      isMounted = false;
    };
  }, [userId, token]);

  const handleRetry = async () => {
    if (!userId || !token) return;
    setStatus("loading");
    setMessage("");
    try {
      const resMessage = await confirmEmail(userId, token);
      setMessage(resMessage || "Your email address has been confirmed successfully!");
      setStatus("success");
    } catch (err) {
      setMessage(getErrorMessage(err, "Failed to confirm email. The link may be expired or invalid."));
      setStatus("error");
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md rounded-2xl bg-[#1e1e20] p-8 md:p-10 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl animate-in fade-in duration-500">
        
        {/* State 1: Loading */}
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white">Confirming Your Email</h2>
            <p className="text-sm text-zinc-400 max-w-xs">
              Please wait a moment while we verify your confirmation token...
            </p>
          </div>
        )}

        {/* State 2: Success */}
        {status === "success" && (
          <div className="flex flex-col items-center justify-center text-center py-4 space-y-5 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-400 shadow-[0_0_30px_rgba(20,184,166,0.3)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Email Confirmed! 🎉</h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {message}
              </p>
            </div>

            <p className="text-xs text-zinc-400 pt-2">
              Your account is fully activated. You can now log in and book your tickets!
            </p>

            <Link
              to="/signin"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-teal-500 py-3.5 text-sm font-bold text-black shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)]"
            >
              Sign In to Your Account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* State 3: Error */}
        {status === "error" && (
          <div className="flex flex-col items-center justify-center text-center py-4 space-y-5 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Confirmation Failed</h2>
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {message}
              </p>
            </div>

            <div className="flex flex-col w-full gap-3 pt-2">
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-white/10 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <Link
                to="/resend-confirmation"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-teal-400 to-teal-500 py-3.5 text-sm font-bold text-black transition-all hover:scale-[1.02]"
              >
                Resend Confirmation Email
              </Link>
            </div>
          </div>
        )}

        {/* State 4: Direct Visit without link params */}
        {status === "no-params" && (
          <div className="flex flex-col items-center justify-center text-center py-4 space-y-5">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-teal-500/10 border border-teal-400/30 text-teal-400">
              <Mail className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Check Your Inbox</h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                We sent a confirmation link to your registered email address. Please click the link in the email to activate your account.
              </p>
            </div>

            <div className="w-full space-y-3 pt-4">
              <Link
                to="/resend-confirmation"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-teal-500 py-3.5 text-sm font-bold text-black transition-all hover:scale-[1.02]"
              >
                Resend Confirmation Link
              </Link>

              <Link
                to="/signin"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 py-3 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )}

      </div>
    </AuthLayout>
  );
}
