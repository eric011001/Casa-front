import { httpClient } from "./http-client";

export const authApi = {
  login: async (correo, password) => {
    const { data } = await httpClient.post("/auth/login", { correo, password });
    return data;
  },

  resetPassword: async (correo, oldPassword, newPassword) => {
    const { data } = await httpClient.post("/auth/reset-password", {
      correo,
      oldPassword,
      newPassword,
    });
    return data;
  },

  me: async () => {
    const { data } = await httpClient.get("/auth/me");
    return data;
  },
};
