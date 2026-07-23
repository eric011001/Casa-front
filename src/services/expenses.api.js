import { httpClient } from "./http-client";

export const expensesApi = {
  list: async (houseId, filters = {}) =>
    (
      await httpClient.get(`/houses/${houseId}/expenses`, {
        params: filters,
      })
    ).data,

  getById: async (houseId, id) =>
    (await httpClient.get(`/houses/${houseId}/expenses/${id}`)).data,

  create: async (houseId, payload) =>
    (await httpClient.post(`/houses/${houseId}/expenses`, payload)).data,

  update: async (houseId, id, payload) =>
    (await httpClient.put(`/houses/${houseId}/expenses/${id}`, payload)).data,

  remove: async (houseId, id) => {
    await httpClient.delete(`/houses/${houseId}/expenses/${id}`);
  },

  pay: async (houseId, id, paidAt) =>
    (
      await httpClient.patch(
        `/houses/${houseId}/expenses/${id}/pay`,
        paidAt ? { paidAt } : {}
      )
    ).data,

  unpay: async (houseId, id) =>
    (await httpClient.patch(`/houses/${houseId}/expenses/${id}/unpay`)).data,

  period: async (houseId, params = {}) =>
    (await httpClient.get(`/houses/${houseId}/expenses/period`, { params }))
      .data,

  stats: async (houseId) =>
    (await httpClient.get(`/houses/${houseId}/expenses/stats`)).data,
};
