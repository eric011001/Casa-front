import { httpClient } from "./http-client";

export const shoppingSessionsApi = {
  list: async (houseId, filters = {}) =>
    (
      await httpClient.get(`/houses/${houseId}/shopping-sessions`, {
        params: filters,
      })
    ).data,

  getById: async (houseId, id) =>
    (await httpClient.get(`/houses/${houseId}/shopping-sessions/${id}`)).data,

  create: async (houseId, payload) =>
    (await httpClient.post(`/houses/${houseId}/shopping-sessions`, payload))
      .data,

  addItem: async (houseId, sessionId, itemId) =>
    (
      await httpClient.post(
        `/houses/${houseId}/shopping-sessions/${sessionId}/items/${itemId}`
      )
    ).data,

  removeItem: async (houseId, sessionId, itemId) =>
    (
      await httpClient.delete(
        `/houses/${houseId}/shopping-sessions/${sessionId}/items/${itemId}`
      )
    ).data,

  close: async (houseId, id, payload) =>
    (
      await httpClient.patch(
        `/houses/${houseId}/shopping-sessions/${id}/close`,
        payload
      )
    ).data,

  cancel: async (houseId, id) =>
    (
      await httpClient.patch(
        `/houses/${houseId}/shopping-sessions/${id}/cancel`
      )
    ).data,
};
