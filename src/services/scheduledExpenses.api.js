import { httpClient } from "./http-client";

export const scheduledExpensesApi = {
  list: async (houseId, filters = {}) =>
    (
      await httpClient.get(`/houses/${houseId}/scheduled-expenses`, {
        params: filters,
      })
    ).data,

  getById: async (houseId, id) =>
    (await httpClient.get(`/houses/${houseId}/scheduled-expenses/${id}`)).data,

  occurrences: async (houseId, id) =>
    (
      await httpClient.get(
        `/houses/${houseId}/scheduled-expenses/${id}/expenses`
      )
    ).data,

  create: async (houseId, payload) =>
    (await httpClient.post(`/houses/${houseId}/scheduled-expenses`, payload))
      .data,

  update: async (houseId, id, payload) =>
    (
      await httpClient.put(
        `/houses/${houseId}/scheduled-expenses/${id}`,
        payload
      )
    ).data,

  remove: async (houseId, id) => {
    await httpClient.delete(`/houses/${houseId}/scheduled-expenses/${id}`);
  },

  activate: async (houseId, id) =>
    (
      await httpClient.patch(
        `/houses/${houseId}/scheduled-expenses/${id}/activate`
      )
    ).data,

  deactivate: async (houseId, id) =>
    (
      await httpClient.patch(
        `/houses/${houseId}/scheduled-expenses/${id}/deactivate`
      )
    ).data,
};
