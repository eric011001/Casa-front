import { httpClient } from "./http-client";

export const rolesApi = {
  list: async () => (await httpClient.get("/roles")).data,

  getById: async (id) => (await httpClient.get(`/roles/${id}`)).data,

  create: async (payload) => (await httpClient.post("/roles", payload)).data,

  update: async (id, payload) => (await httpClient.put(`/roles/${id}`, payload)).data,

  remove: async (id) => {
    await httpClient.delete(`/roles/${id}`);
  },
};
