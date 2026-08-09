import { Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import axios from "axios";
import { setupInterceptors } from "./services/axiosInterceptors";

setupInterceptors(axios);
// Pages
import HomePage from "./pages/HomePage";
import DiscoverPage from "./pages/DiscoverPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import EventBookingPage from "./pages/EventBookingPage";
import WalletPage from "./pages/WalletPage";
import SettingsPage from "./pages/SettingsPage";
import VipPage from "./pages/VipPage";

// Auth Pages
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ResendConfirmationPage from "./pages/auth/ResendConfirmationPage";
import ConfirmEmailPage from "./pages/auth/ConfirmEmailPage";
import ChangePasswordPage from "./pages/auth/ChangePasswordPage";
import SessionPage from "./pages/auth/SessionPage";
import BlastCampaignPage from "./pages/auth/BlastCampaignPage";

// Admin Pages
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import AdminPage from "./pages/admin/AdminPage";
import AdminLogsPage from "./pages/admin/AdminLogsPage";
import CreateEventPage from "./pages/admin/CreateEventPage";
import EditEventsPage from "./pages/admin/EditEventsPage";
import StaffPage from "./pages/admin/StaffPage";
import UsersManagementPage from "./pages/admin/UsersManagementPage";

// Booking Pages
import ValidateTicketPage from "./pages/bookings/ValidateTicketPage";
import ScanTicketPage from "./pages/bookings/ScanTicketPage";
import BookingCallbackPage from "./pages/bookings/BookingCallbackPage";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

import TicketAlert from "./components/TicketAlert";

// ─────────────────────────────────────────────

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <>
      <TicketAlert />
      <Routes>
      {/* ── Public Routes ── */}
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/resend-confirmation" element={<ResendConfirmationPage />} />
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      <Route path="/session" element={<SessionPage />} />
      <Route path="/booking/validate" element={<ValidateTicketPage />} />
      <Route path="/booking/scan" element={<ScanTicketPage />} />
      <Route path="/booking/callback" element={<BookingCallbackPage />} />
      <Route path="/" element={<HomePage />} />

      {/* ── Protected Routes ── */}
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <DiscoverPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking/:id"
        element={
          <ProtectedRoute>
            <EventBookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets"
        element={
          <ProtectedRoute>
            <MyTicketsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <WalletPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vip"
        element={
          <ProtectedRoute>
            <VipPage />
          </ProtectedRoute>
        }
      />

      {/* ── Admin Routes ── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <AdminLogsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-event"
        element={
          <ProtectedRoute>
            <CreateEventPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-events"
        element={
          <ProtectedRoute>
            <EditEventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute>
            <StaffPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blast-campaign"
        element={
          <ProtectedRoute>
            <BlastCampaignPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users-management"
        element={
          <ProtectedRoute>
            <UsersManagementPage />
          </ProtectedRoute>
        }
      />

      {/* ── Fallback ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
