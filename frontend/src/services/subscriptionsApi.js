import axios from "axios";
import { setupInterceptors } from "./axiosInterceptors";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";

export const subscriptionsClient = axios.create({
  baseURL: `${baseUrl}/api/Subscriptions`,
});

setupInterceptors(subscriptionsClient);

const authConfig = (token) =>
  token
    ? {
        headers: { Authorization: `Bearer ${token}` },
      }
    : undefined;

export const getErrorMessage = (error, fallback = "Subscription action failed.") => {
  const data = error?.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first.length) return first[0];
  }
  return data?.message || data?.title || error?.message || fallback;
};

// POST /api/Subscriptions/upgrade
export const upgradeSubscription = async ({ username, tier, months }, token) => {
  const response = await subscriptionsClient.post(
    "/upgrade",
    { username, tier: Number(tier), months: Number(months) },
    authConfig(token)
  );
  return response.data;
};
