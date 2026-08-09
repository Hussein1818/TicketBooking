import axios from "axios";
import { setupInterceptors } from "./axiosInterceptors";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";

export const usersClient = axios.create({
  baseURL: `${baseUrl}/api/Users`,
});

setupInterceptors(usersClient);

const authConfig = (token) =>
  token
    ? {
        headers: { Authorization: `Bearer ${token}` },
      }
    : undefined;

export const getErrorMessage = (error, fallback = "Action failed.") => {
  const data = error?.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first.length) return first[0];
  }
  return data?.message || data?.title || error?.message || fallback;
};

// GET /api/Users/profile
export const getProfile = async (token) => {
  const response = await usersClient.get("/profile", authConfig(token));
  return response.data;
};

// PUT /api/Users/profile
export const updateProfile = async (formData, token) => {
  const response = await usersClient.put("/profile", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const downloadFanId = async (token) => {
  try {
    const response = await usersClient.get("/fan-id/download", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    if (error?.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        try {
          error.response.data = JSON.parse(text);
        } catch {
          error.response.data = text;
        }
      } catch {
        // ignore
      }
    }
    throw error;
  }
};
