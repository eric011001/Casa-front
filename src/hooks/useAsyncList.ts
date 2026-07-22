"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/http-error";

export function useAsyncList<T>(fetcher: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => {
        if (!cancelled) {
          setItems(data);
          setError("");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(getErrorMessage(err, "No se pudo cargar la información."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    setError("");
    fetcher()
      .then((data) => {
        setItems(data);
        setError("");
      })
      .catch((err: unknown) => {
        setError(getErrorMessage(err, "No se pudo cargar la información."));
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, setItems, loading, error, reload };
}
