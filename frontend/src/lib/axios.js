import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

export const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
});

// Attach JWT token from localStorage to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});