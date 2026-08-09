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

export const confirmEmail = async (userId, token) => {
  try {
    const response = await authClient.post(
      `/confirm-email?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`,
      { userId, token, code: token }
    );
    return toMessage(response.data, "Email confirmed successfully!");
  } catch (error) {
    if (error?.response?.status === 405 || error?.response?.status === 404) {
      const getRes = await authClient.get(
        `/confirm-email?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`
      );
      return toMessage(getRes.data, "Email confirmed successfully!");
    }
    throw error;
  }
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
  const token = localStorage.getItem("token");
  const response = await authClient.post(`/Admin/users/${userId}/assign-organizer`, {}, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return toMessage(response.data, "Organizer role assigned successfully.");
};

export const revokeOrganizer = async (userId) => {
  const token = localStorage.getItem("token");
  const response = await authClient.post(`/Admin/users/${userId}/revoke-organizer`, {}, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return toMessage(response.data, "Organizer role revoked successfully.");
};

export { getErrorMessage };
