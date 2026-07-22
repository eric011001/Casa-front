import { httpClient } from "./http-client";

export const permissionsApi = {
  list: async () => (await httpClient.get("/permissions")).data,

  getById: async (id) => (await httpClient.get(`/permissions/${id}`)).data,

  create: async (payload) => (await httpClient.post("/permissions", payload)).data,

  update: async (id, payload) =>
    (await httpClient.put(`/permissions/${id}`, payload)).data,

  remove: async (id) => {
    await httpClient.delete(`/permissions/${id}`);
  },
};
