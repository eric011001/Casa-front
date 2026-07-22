import { httpClient } from "./http-client";

export const usersApi = {
  list: async () => (await httpClient.get("/users")).data,

  getById: async (id) => (await httpClient.get(`/users/${id}`)).data,

  create: async (payload) => (await httpClient.post("/users", payload)).data,

  update: async (id, payload) => (await httpClient.put(`/users/${id}`, payload)).data,

  resetPassword: async (id) =>
    (await httpClient.post(`/users/${id}/reset-password`)).data,

  remove: async (id) => {
    await httpClient.delete(`/users/${id}`);
  },
};
