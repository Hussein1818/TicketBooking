import axios from "axios";
import useAuthStore from "../store/useAuthStore";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setupInterceptors = (client) => {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Do not intercept refresh token or login/register requests
      if (originalRequest.url?.includes("/refresh-token") || originalRequest.url?.includes("/login") || originalRequest.url?.includes("/register")) {
        return Promise.reject(error);
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers["Authorization"] = "Bearer " + token;
              return client(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const authState = useAuthStore.getState();
        const oldToken = authState.token;
        const refreshTokenValue = authState.refreshToken;

        if (!oldToken || !refreshTokenValue) {
          isRefreshing = false;
          authState.logout();
          return Promise.reject(error);
        }

        try {
          // Attempt to refresh using a clean axios request to prevent loops
          const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://ticketok.runasp.net";
          const response = await axios.post(`${baseUrl}/api/Auth/refresh-token`, {
            token: oldToken,
            accessToken: oldToken,
            refreshToken: refreshTokenValue
          }, { withCredentials: true });
          const data = response.data;
          
          const newToken = data?.accessToken || data?.token;

          if (newToken) {
            authState.login(
              newToken,
              data.user || authState.user,
              data.refreshToken || refreshTokenValue
            );
            
            originalRequest.headers["Authorization"] = "Bearer " + newToken;
            processQueue(null, newToken);
            return client(originalRequest);
          } else {
            throw new Error("No token returned from refresh endpoint.");
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          authState.logout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};
