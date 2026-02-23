import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9049",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        window.location.href = "/";
        return;
      }

      try {
        const res = await axios.post(
          "http://localhost:9049/auth/refresh",
          { refreshToken }
        );

        sessionStorage.setItem("accessToken", res.data.data.accessToken);

        originalRequest.headers.Authorization =
          `Bearer ${res.data.data.accessToken}`;

        return API(originalRequest);
      } catch {
        sessionStorage.clear();
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default API;
