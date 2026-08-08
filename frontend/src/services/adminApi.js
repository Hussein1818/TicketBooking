import axios from "axios";
import { setupInterceptors } from "./axiosInterceptors";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";

export const adminClient = axios.create({
  baseURL: `${baseUrl}/api/Admin`,
});

setupInterceptors(adminClient);

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

export const manageEvent = async (formData, token) => {
  const response = await adminClient.post("/manage-event", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getLogs = async (page = 1, pageSize = 50, token) => {
  const response = await adminClient.get("/logs", {
    params: { page, pageSize },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Re-exported from eventsApi to maintain backward compatibility
export { getEventAnalytics, deleteEvent } from "./eventsApi";
