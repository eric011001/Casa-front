"use client";

import { useEffect, useState } from "react";
import { useAsyncList } from "./useAsyncList";
import { housesApi } from "@/services/houses.api";
import { getSelectedHouseId, setSelectedHouseId } from "@/lib/house-storage";
import type { House } from "@/types/models";

export function useMyHouses() {
  const { items: houses, loading, error, reload } = useAsyncList<House>(
    housesApi.mine
  );
  const [manualSelectedId, setManualSelectedId] = useState<string | null>(() =>
    getSelectedHouseId()
  );

  const selectedId = houses.some((house) => house._id === manualSelectedId)
    ? manualSelectedId
    : (houses[0]?._id ?? null);

  const selectedHouse =
    houses.find((house) => house._id === selectedId) ?? null;

  useEffect(() => {
    setSelectedHouseId(selectedId);
  }, [selectedId]);

  const selectHouse = (id: string) => {
    setManualSelectedId(id);
  };

  return {
    houses,
    loading,
    error,
    reload,
    selectedHouse,
    selectedId,
    selectHouse,
  };
}
