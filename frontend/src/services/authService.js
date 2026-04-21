import api from "./api";

const authService = {

  async login(email, password) {
    // api.js interceptor unwraps ApiResponseDTO and returns res = { success, data, message, statusCode }
    // res.data is { accessToken, refreshToken, user, expiresIn }
    const res = await api.post("/auth/login", { email, password });

    // api.js interceptor unwraps response.data, so `res` may be:
    //   { data: { accessToken, refreshToken, user } }  (wrapped ApiResponseDTO)
    //   { accessToken, refreshToken, user }             (flat response)
    const payload = res?.data ?? res;
    const { accessToken, refreshToken, user } = payload;

    if (!accessToken) throw new Error("Login failed: no token received");
    if (!user)        throw new Error("Login failed: no user data received");

    localStorage.setItem("accessToken",  accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));

    return user;
  },

  async logout() {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  },

  async forgotPassword(email) {
    return api.post("/auth/forgot-password", { email });
  },

  async resetPassword(token, newPassword) {
    return api.post("/auth/reset-password", { token, newPassword });
  },

  getStoredUser() {
    try { return JSON.parse(localStorage.getItem("user")) || null; }
    catch { return null; }
  },

  isAuthenticated() {
    const token = localStorage.getItem("accessToken");
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },
};

export default authService;
