import axios from "axios";
import { setupInterceptors } from "./axiosInterceptors";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";

export const waitlistClient = axios.create({
  baseURL: `${baseUrl}/api/Waitlist`,
  headers: { "Content-Type": "application/json" },
});

setupInterceptors(waitlistClient);

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// POST /api/Waitlist/join — { eventId }
export const joinWaitlist = async (eventId, token) => {
  const response = await waitlistClient.post(
    "/join",
    { eventId: Number(eventId) },
    authHeader(token)
  );
  return response.data;
};
