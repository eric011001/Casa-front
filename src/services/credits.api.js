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

  adjustDebt: async (id, payload) =>
    (await httpClient.post(`/credits/${id}/adjust-debt`, payload)).data,

  share: async (id, email) =>
    (await httpClient.post(`/credits/${id}/share`, { email })).data,

  unshare: async (id, userId) =>
    (await httpClient.delete(`/credits/${id}/share/${userId}`)).data,

  stats: async () => (await httpClient.get("/credits/stats")).data,

  getPlan: async (id) => (await httpClient.get(`/credits/${id}/plan`)).data,

  getPlans: async (id) => (await httpClient.get(`/credits/${id}/plans`)).data,

  createPlan: async (id, payload) =>
    (await httpClient.post(`/credits/${id}/plan`, payload)).data,

  cancelPlan: async (id) =>
    (await httpClient.patch(`/credits/${id}/plan/cancel`)).data,

  applyInterest: async (id, payload) =>
    (await httpClient.post(`/credits/${id}/plan/interest`, payload)).data,

  payInstallment: async (id, number, options = {}) =>
    (
      await httpClient.post(
        `/credits/${id}/plan/installments/${number}/pay`,
        options
      )
    ).data,

  unpayInstallment: async (id, number) =>
    (
      await httpClient.post(
        `/credits/${id}/plan/installments/${number}/unpay`
      )
    ).data,
};
