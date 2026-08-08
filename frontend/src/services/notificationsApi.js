import axios from "axios";
import { setupInterceptors } from "./axiosInterceptors";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";

export const notificationsClient = axios.create({
  baseURL: `${baseUrl}/api/Notifications`,
  headers: { "Content-Type": "application/json" },
});

setupInterceptors(notificationsClient);

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// GET /api/Notifications
export const getNotifications = async (token) => {
  const response = await notificationsClient.get("", authHeader(token));
  return response.data;
};

// PUT /api/Notifications/{id}/read
export const markNotificationRead = async (id, token) => {
  const response = await notificationsClient.put(`/${id}/read`, {}, authHeader(token));
  return response.data;
};
