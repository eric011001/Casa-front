"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { HouseSelector } from "@/components/houses/HouseSelector";
import { StatsPanel } from "@/components/home/StatsPanel";
import { ExpenseCalendar } from "@/components/home/ExpenseCalendar";
import { useMyHouses } from "@/hooks/useMyHouses";
import type { House } from "@/types/models";

function HomeContent() {
  const {
    houses,
    loading,
    error,
    reload,
    selectedHouse,
    selectedId,
    selectHouse,
  } = useMyHouses();

  const handleJoined = (house: House) => {
    reload();
    selectHouse(house._id);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 sm:p-10">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Bienvenido
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Resumen de gastos de tu casa. Usa el menú de la izquierda para
          administrar usuarios, roles, permisos y gastos.
        </p>
      </div>

      <HouseSelector
        houses={houses}
        selectedId={selectedId}
        onSelect={selectHouse}
        onJoined={handleJoined}
      />

      {loading ? (
        <LoadingBar />
      ) : error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : !selectedHouse ? (
        <p className="rounded-lg border border-black/[.08] px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/[.145] dark:text-zinc-400">
          Aún no perteneces a ninguna casa. Pide un código de acceso a un
          administrador y únete con el botón de arriba para ver sus
          estadísticas.
        </p>
      ) : (
        <>
          <ExpenseCalendar key={`${selectedHouse._id}-calendar`} houseId={selectedHouse._id} />
          <StatsPanel key={selectedHouse._id} houseId={selectedHouse._id} />
        </>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
