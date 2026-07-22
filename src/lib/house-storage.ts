const SELECTED_HOUSE_KEY = "selectedHouseId";

export function getSelectedHouseId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SELECTED_HOUSE_KEY);
}

export function setSelectedHouseId(id: string | null) {
  if (id) {
    localStorage.setItem(SELECTED_HOUSE_KEY, id);
  } else {
    localStorage.removeItem(SELECTED_HOUSE_KEY);
  }
}
