import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, ""); // Remove trailing slashes

export const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true, // VERY IMPORTANT
});