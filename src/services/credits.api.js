import { httpClient } from "./http-client";

export const creditsApi = {
  list: async () => (await httpClient.get("/credits")).data,

  getById: async (id) => (await httpClient.get(`/credits/${id}`)).data,

  create: async (payload) => (await httpClient.post("/credits", payload)).data,

  update: async (id, payload) =>
    (await httpClient.put(`/credits/${id}`, payload)).data,

  remove: async (id) => {
    await httpClient.delete(`/credits/${id}`);
  },

  applyExpense: async (id, expenseId) =>
    (await httpClient.post(`/credits/${id}/apply-expense`, { expenseId })).data,
};
