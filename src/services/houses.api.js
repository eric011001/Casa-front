import { httpClient } from "./http-client";

export const housesApi = {
  mine: async () => (await httpClient.get("/houses/mine")).data,

  join: async (code) => (await httpClient.post("/houses/join", { code })).data,

  list: async () => (await httpClient.get("/houses")).data,

  getById: async (id) => (await httpClient.get(`/houses/${id}`)).data,

  create: async (payload) => (await httpClient.post("/houses", payload)).data,

  update: async (id, payload) =>
    (await httpClient.put(`/houses/${id}`, payload)).data,

  remove: async (id) => {
    await httpClient.delete(`/houses/${id}`);
  },

  activate: async (id) =>
    (await httpClient.patch(`/houses/${id}/activate`)).data,

  deactivate: async (id) =>
    (await httpClient.patch(`/houses/${id}/deactivate`)).data,

  generateCode: async (id) =>
    (await httpClient.post(`/houses/${id}/code`)).data,
};
