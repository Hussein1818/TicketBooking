import { Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";

export default function BookingCallbackPage() {
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success");
  const merchantOrderId = searchParams.get("merchant_order_id");
  const isSuccess = success === "true" || success === "1";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl rounded-xl border border-white/5 bg-[#16171a] p-8 text-center">
        <h1 className="mb-3 text-2xl font-bold text-white">Payment Callback</h1>
        <p className={`mb-4 text-sm ${isSuccess ? "text-teal-400" : "text-red-400"}`}>
          {isSuccess ? "Payment completed successfully." : "Payment failed or pending."}
        </p>
        <p className="mb-6 text-xs text-zinc-400">merchant_order_id: {merchantOrderId || "N/A"}</p>
        <div className="flex justify-center gap-3">
          <Link to="/tickets" className="rounded bg-teal-400 px-5 py-2 text-sm font-bold text-black">My Tickets</Link>
          <Link to="/events" className="rounded border border-white/20 px-5 py-2 text-sm font-bold text-white">Back to Events</Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
