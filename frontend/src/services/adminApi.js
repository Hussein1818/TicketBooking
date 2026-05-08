import axios from "axios";
import { setupInterceptors } from "./axiosInterceptors";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";

export const adminClient = axios.create({
  baseURL: `${baseUrl}/api/Admin`,
});

const eventsClient = axios.create({
  baseURL: `${baseUrl}/api/Events`,
});

setupInterceptors(adminClient);
setupInterceptors(eventsClient);

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const getAllUsers = async (token) => {
  const response = await adminClient.get("/users", authHeader(token));
  return response.data;
};

export const getDashboard = async (token) => {
  const response = await adminClient.get("/dashboard", authHeader(token));
  return response.data;
};

export const createAdmin = async (payload, token) => {
  const response = await adminClient.post("/create-admin", payload, authHeader(token));
  return response.data;
};

export const createStaff = async (payload, token) => {
  const response = await adminClient.post("/create-staff", payload, authHeader(token));
  return response.data;
};

export const getEventAnalytics = async (eventId, token) => {
  const response = await eventsClient.get(`/${eventId}/analytics`, authHeader(token));
  return response.data;
};

export const deleteEvent = async (eventId, token) => {
  const response = await eventsClient.delete(`/${eventId}`, authHeader(token));
  return response.data;
};
