import axios from "axios";
import { setupInterceptors } from "./axiosInterceptors";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";

export const eventsClient = axios.create({
  baseURL: `${baseUrl}/api/Events`,
  headers: { "Content-Type": "application/json" },
});

setupInterceptors(eventsClient);

const authHeader = (token) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

// GET /api/Events?page=&pageSize=&category=
export const getEvents = async ({ page = 1, pageSize = 20, category } = {}) => {
  const params = { page, pageSize };
  if (category && category !== "ALL CATEGORIES") params.category = category;
  const response = await eventsClient.get("", { params });
  return response.data;
};

// GET /api/Events/{eventId}
export const getEventById = async (eventId) => {
  const response = await eventsClient.get(`/${eventId}`);
  return response.data;
};

// GET /api/Seats/event/{eventId} — delegates to seatsApi (preferred endpoint)
export { getSeatsByEvent as getEventSeats } from "./seatsApi";

// GET /api/Events/{eventId}/analytics
export const getEventAnalytics = async (eventId, token) => {
  const response = await eventsClient.get(`/${eventId}/analytics`, authHeader(token));
  return response.data;
};

// POST /api/Events — multipart/form-data (organizer flow)
export const createEvent = async (formData, token) => {
  const response = await eventsClient.post("", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return response.data;
};

// PUT /api/Events/{eventId} — multipart/form-data (organizer flow)
export const updateEvent = async (eventId, formData, token) => {
  const response = await eventsClient.put(`/${eventId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return response.data;
};

// DELETE /api/Events/{eventId}
export const deleteEvent = async (eventId, token) => {
  const response = await eventsClient.delete(`/${eventId}`, authHeader(token));
  return response.data;
};
