import axios from "axios";
import { setupInterceptors } from "./axiosInterceptors";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";

export const walletClient = axios.create({
  baseURL: `${baseUrl}/api/Wallet`,
});

setupInterceptors(walletClient);

const authConfig = (token) =>
  token
    ? {
        headers: { Authorization: `Bearer ${token}` },
      }
    : undefined;

export const getErrorMessage = (error, fallback = "Wallet request failed.") => {
  const data = error?.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first.length) return first[0];
  }
  return data?.message || data?.title || error?.message || fallback;
};

export const getBalance = async (token) => {
  const response = await walletClient.get("/balance", authConfig(token));
  return response.data;
};

export const addFunds = async ({ amount }, token) => {
  const response = await walletClient.post("/add-funds", { amount: Number(amount) }, authConfig(token));
  return response.data;
};

export const transferWallet = async ({ toUsername, amount }, token) => {
  const response = await walletClient.post(
    "/transfer",
    { toUsername, amount: Number(amount) },
    authConfig(token),
  );
  return response.data;
};
