import axios from "axios";
import { setupInterceptors } from "./axiosInterceptors";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";

export const seatsClient = axios.create({
  baseURL: `${baseUrl}/api/Seats`,
  headers: { "Content-Type": "application/json" },
});

setupInterceptors(seatsClient);

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// GET /api/Seats/event/{eventId}
export const getSeatsByEvent = async (eventId) => {
  const response = await seatsClient.get(`/event/${eventId}`);
  return response.data;
};

// POST /api/Seats — { eventId, regularSeatsCount, vipSeatsCount, pricePerSeat }
export const createSeats = async ({ eventId, regularSeatsCount, vipSeatsCount, pricePerSeat }, token) => {
  const response = await seatsClient.post(
    "",
    {
      eventId: Number(eventId),
      regularSeatsCount: Number(regularSeatsCount),
      vipSeatsCount: Number(vipSeatsCount),
      pricePerSeat: Number(pricePerSeat),
    },
    authHeader(token)
  );
  return response.data;
};
