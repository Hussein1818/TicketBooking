import axios from "axios";
import { setupInterceptors } from "./axiosInterceptors";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";

export const bookingsClient = axios.create({
  baseURL: `${baseUrl}/api/Bookings`,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json"
  }
});

setupInterceptors(bookingsClient);

const toMessage = (payload, fallback) => {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload?.message) return payload.message;
  if (payload?.title) return payload.title;
  return fallback;
};

export const getErrorMessage = (error, fallback = "Something went wrong.") => {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    return "Action failed. Please check your inputs or try again.";
  }
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first.length) return first[0];
  }
  return toMessage(data, fallback) || error?.message || fallback;
};

const authConfig = (token) =>
  token
    ? {
        headers: { Authorization: `Bearer ${token}` },
      }
    : undefined;

export const createBooking = async ({ seatId, userId }, token) => {
  const response = await bookingsClient.post("", { seatId: Number(seatId), userId: String(userId) }, authConfig(token));
  return response.data;
};

export const checkoutWallet = async ({ bookingIds, username, promoCode }, token) => {
  const payload = { 
    bookingIds: bookingIds.map(id => Number(id)), 
    username,
    promoCode: promoCode && promoCode.trim() !== "" ? promoCode : null
  };
  const config = {
    ...(authConfig(token) || {}),
    responseType: "blob"
  };
  const response = await bookingsClient.post(
    "/checkout-wallet",
    payload,
    config,
  );
  return response.data;
};

export const checkoutMock = async (token) => {
  const response = await bookingsClient.post("/checkout-mock", {}, authConfig(token));
  return response.data;
};

export const validateQr = async (qrData, token) => {
  const response = await bookingsClient.post("/validate", { qrData }, authConfig(token));
  return response.data;
};

export const scanQr = async ({ qrData, scannedByUsername }, token) => {
  const response = await bookingsClient.post("/scan", { qrData, scannedByUsername }, authConfig(token));
  return response.data;
};

export const getMyTickets = async (token) => {
  const response = await bookingsClient.get("/my-tickets", authConfig(token));
  return response.data;
};

export const cancelBooking = async (bookingId, token) => {
  const response = await bookingsClient.delete(`/cancel/${bookingId}`, authConfig(token));
  return response.data;
};

export const transferBooking = async ({ bookingId, fromUsername, toUsername }, token) => {
  const response = await bookingsClient.post(
    "/transfer",
    { bookingId: Number(bookingId), fromUsername, toUsername },
    authConfig(token),
  );
  return response.data;
};
