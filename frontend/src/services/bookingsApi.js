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
    return "مش معاك فلوس كفاية";
  }
  let rawMsg = "";
  if (typeof data === "string" && data.trim()) {
    rawMsg = data;
  } else if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first.length) rawMsg = first[0];
  } else {
    rawMsg = toMessage(data, fallback) || error?.message || fallback;
  }

  const lower = String(rawMsg).toLowerCase();
  if (
    lower.includes("insufficient") ||
    lower.includes("balance") ||
    lower.includes("fund") ||
    lower.includes("money") ||
    lower.includes("not enough") ||
    lower.includes("رصيد") ||
    lower.includes("فلوس") ||
    lower.includes("action failed")
  ) {
    return "مش معاك فلوس كفاية";
  }

  return rawMsg;
};

const authConfig = (token) =>
  token
    ? {
        headers: { Authorization: `Bearer ${token}` },
      }
    : undefined;

// POST /api/Bookings — { seatId }
export const createBooking = async ({ seatId }, token) => {
  const response = await bookingsClient.post("", { seatId: Number(seatId) }, authConfig(token));
  return response.data;
};

// POST /api/Bookings/checkout-wallet — { bookingIds, promoCode }
export const checkoutWallet = async ({ bookingIds, promoCode }, token) => {
  const payload = {
    bookingIds: bookingIds.map(id => Number(id)),
    promoCode: promoCode && promoCode.trim() !== "" ? promoCode : null
  };
  const config = {
    ...(authConfig(token) || {}),
    responseType: "blob"
  };
  try {
    const response = await bookingsClient.post("/checkout-wallet", payload, config);
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
        // failed to read blob text
      }
    }
    throw error;
  }
};

// POST /api/Bookings/checkout-paymob — { bookingIds, promoCode, targetCurrency }
export const checkoutPaymob = async ({ bookingIds, promoCode, targetCurrency }, token) => {
  const payload = {
    bookingIds: bookingIds.map(id => Number(id)),
    promoCode: promoCode && promoCode.trim() !== "" ? promoCode : null,
    targetCurrency: targetCurrency || null,
  };
  const response = await bookingsClient.post("/checkout-paymob", payload, authConfig(token));
  return response.data;
};

// POST /api/Bookings/checkout-mock — no body
export const checkoutMock = async (token) => {
  const response = await bookingsClient.post("/checkout-mock", {}, authConfig(token));
  return response.data;
};

// POST /api/Bookings/confirm — { seatId, promoCode, targetCurrency }
export const confirmBooking = async ({ seatId, promoCode, targetCurrency }, token) => {
  const payload = {
    seatId: Number(seatId),
    promoCode: promoCode && promoCode.trim() !== "" ? promoCode : null,
    targetCurrency: targetCurrency || null,
  };
  const response = await bookingsClient.post("/confirm", payload, authConfig(token));
  return response.data;
};

// POST /api/Bookings/validate — { qrData }
export const validateQr = async (qrData, token) => {
  const response = await bookingsClient.post("/validate", { qrData }, authConfig(token));
  return response.data;
};

// POST /api/Bookings/scan — { qrData }
export const scanQr = async (qrData, token) => {
  const response = await bookingsClient.post("/scan", { qrData }, authConfig(token));
  return response.data;
};

// GET /api/Bookings/my-tickets
// Returns: [{ bookingId, seatId, seatNumber, eventName, eventDate, amountPaid, qrData }]
export const getMyTickets = async (token) => {
  const response = await bookingsClient.get("/my-tickets", authConfig(token));
  return response.data;
};

// DELETE /api/Bookings/cancel/{bookingId}
export const cancelBooking = async (bookingId, token) => {
  const response = await bookingsClient.delete(`/cancel/${bookingId}`, authConfig(token));
  return response.data;
};

// POST /api/Bookings/transfer — { bookingId, toUsername }
export const transferBooking = async ({ bookingId, toUsername }, token) => {
  const response = await bookingsClient.post(
    "/transfer",
    { bookingId: Number(bookingId), toUsername },
    authConfig(token),
  );
  return response.data;
};
