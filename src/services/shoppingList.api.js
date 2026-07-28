import { httpClient } from "./http-client";

export const shoppingListApi = {
  list: async (houseId, filters = {}) =>
    (
      await httpClient.get(`/houses/${houseId}/shopping-list`, {
        params: filters,
      })
    ).data,

  autocomplete: async (houseId, q) =>
    (
      await httpClient.get(`/houses/${houseId}/shopping-list/autocomplete`, {
        params: { q },
      })
    ).data,

  create: async (houseId, payload) =>
    (await httpClient.post(`/houses/${houseId}/shopping-list`, payload)).data,

  update: async (houseId, id, payload) =>
    (await httpClient.put(`/houses/${houseId}/shopping-list/${id}`, payload))
      .data,

  remove: async (houseId, id) => {
    await httpClient.delete(`/houses/${houseId}/shopping-list/${id}`);
  },
};
