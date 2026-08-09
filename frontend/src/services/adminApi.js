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

export const assignOrganizer = async (userId, token) => {
  const response = await adminClient.post(`/users/${userId}/assign-organizer`, {}, authHeader(token));
  return response.data;
};

export const revokeOrganizer = async (userId, token) => {
  const response = await adminClient.post(`/users/${userId}/revoke-organizer`, {}, authHeader(token));
  return response.data;
};

export const assignAdmin = async (userId, token) => {
  const response = await adminClient.post(`/users/${userId}/assign-admin`, {}, authHeader(token));
  return response.data;
};

export const revokeAdmin = async (userId, token) => {
  const response = await adminClient.post(`/users/${userId}/revoke-admin`, {}, authHeader(token));
  return response.data;
};

export const deleteUser = async (userId, token) => {
  const response = await adminClient.delete(`/users/${userId}`, authHeader(token));
  return response.data;
};

export const changeUserRole = async (userId, role, token) => {
  const roleLower = (role || "").toLowerCase();
  if (roleLower === "admin") {
    return await assignAdmin(userId, token);
  } else if (roleLower === "organizer") {
    return await assignOrganizer(userId, token);
  } else {
    try {
      await revokeAdmin(userId, token);
    } catch {
      // ignore
    }
    return await revokeOrganizer(userId, token);
  }
};

// Re-exported from eventsApi to maintain backward compatibility
export { getEventAnalytics, deleteEvent } from "./eventsApi";
