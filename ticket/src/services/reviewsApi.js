import axios from "axios";
import { setupInterceptors } from "./axiosInterceptors";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";

export const reviewsClient = axios.create({
  baseURL: `${baseUrl}/api/Reviews`,
});

setupInterceptors(reviewsClient);

const authConfig = (token) =>
  token
    ? {
        headers: { Authorization: `Bearer ${token}` },
      }
    : undefined;

export const getErrorMessage = (error, fallback = "Review action failed.") => {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first.length) return first[0];
  }
  return data?.message || data?.title || error?.message || fallback;
};

export const getEventReviews = async (eventId) => {
  // GET /api/Reviews/{eventId}
  const response = await reviewsClient.get(`/${eventId}`);
  return response.data;
};

export const createReview = async ({ eventId, username, rating, comment }, token) => {
  // POST /api/Reviews
  const response = await reviewsClient.post(
    "",
    { eventId: Number(eventId), username, rating: Number(rating), comment },
    authConfig(token)
  );
  return response.data;
};
