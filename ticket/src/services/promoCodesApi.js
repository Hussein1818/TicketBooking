import axios from "axios";
import { setupInterceptors } from "./axiosInterceptors";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";

export const promoCodesClient = axios.create({
  baseURL: `${baseUrl}/api/PromoCodes`,
});

setupInterceptors(promoCodesClient);

const authConfig = (token) =>
  token
    ? {
        headers: { Authorization: `Bearer ${token}` },
      }
    : undefined;

export const getErrorMessage = (error, fallback = "Promo code action failed.") => {
  const data = error?.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first.length) return first[0];
  }
  return data?.message || data?.title || error?.message || fallback;
};

// POST /api/PromoCodes
export const createPromoCode = async ({ code, discountPercentage, maxUsage, expirationDate }, token) => {
  const response = await promoCodesClient.post(
    "",
    { code, discountPercentage: Number(discountPercentage), maxUsage: Number(maxUsage), expirationDate },
    authConfig(token)
  );
  return response.data;
};

// GET /api/PromoCodes/validate/{code}
export const validatePromoCode = async (code, token) => {
  const response = await promoCodesClient.get(`/validate/${code}`, authConfig(token));
  return response.data;
};
