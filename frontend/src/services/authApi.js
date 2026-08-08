import axios from "axios";
import { setupInterceptors } from "./axiosInterceptors";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";

export const authClient = axios.create({
  baseURL: `${baseUrl}/api/Auth`,
  withCredentials: true,
});

setupInterceptors(authClient);

const toMessage = (payload, fallback) => {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload?.detail) return payload.detail;
  if (payload?.message) return payload.message;
  if (payload?.title) return payload.title;
  return fallback;
};

const getErrorMessage = (error, fallback) =>
  toMessage(error?.response?.data, fallback) || error?.message || fallback;

export const login = async (usernameOrEmail, password) => {
  const response = await authClient.post("/login", {
    usernameOrEmail,
    password,
  });
  return response.data;
};

export const register = async (userData) => {
  const response = await authClient.post("/register", userData);
  return response.data;
};

export const resendConfirmation = async (email) => {
  const response = await authClient.post("/resend-confirmation", { email });
  return toMessage(response.data, "Confirmation email sent.");
};

export const refreshToken = async (accessToken, refreshTokenValue) => {
  const response = await authClient.post("/refresh-token", {
    token: accessToken,
    accessToken,
    refreshToken: refreshTokenValue,
  });
  return response.data;
};

export const revokeToken = async (token) => {
  const config = token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : undefined;

  const response = await authClient.post("/revoke-token", null, config);
  return toMessage(response.data, "Token revoked successfully.");
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await authClient.post("/change-password", {
    currentPassword,
    newPassword,
  });
  return toMessage(response.data, "Password updated successfully.");
};

export const forgotPassword = async (email) => {
  const response = await authClient.post("/forgot-password", { email });
  return toMessage(response.data, "Password reset email sent.");
};

export const resetPassword = async (email, token, newPassword) => {
  const response = await authClient.post("/reset-password", {
    email,
    token,
    newPassword,
  });
  return toMessage(response.data, "Password has been reset.");
};

export const blastCampaign = async ({ eventId, subject, message, currentUserId, isAdmin }) => {
  const response = await authClient.post("/blast-campaign", {
    eventId: Number(eventId),
    subject,
    message,
    currentUserId,
    isAdmin,
  });
  return toMessage(response.data, "Campaign sent successfully.");
};

export const assignOrganizer = async (userId) => {
  const response = await authClient.post(`/${userId}/assign-organizer`);
  return toMessage(response.data, "Organizer role assigned successfully.");
};

export const revokeOrganizer = async (userId) => {
  const response = await authClient.post(`/${userId}/revoke-organizer`);
  return toMessage(response.data, "Organizer role revoked successfully.");
};

export { getErrorMessage };
