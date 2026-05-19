import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://talksy-voh9.onrender.com/api",
  withCredentials: true,
});