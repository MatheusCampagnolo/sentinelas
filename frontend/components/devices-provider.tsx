"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Device, fetchDevices } from "@/lib/devices";

type DevicesContextValue = {
  devices: Device[];
  loading: boolean;
  error: string | null;
  updatedAt: Date | null;
  refresh: () => Promise<void>;
};

const DevicesContext = createContext<DevicesContextValue | null>(null);

export function DevicesProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const latest = await fetchDevices();
      setDevices(latest);
      setUpdatedAt(new Date());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao consultar a API.");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), 5_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [refresh]);

  return (
    <DevicesContext.Provider value={{ devices, loading, error, updatedAt, refresh }}>
      {children}
    </DevicesContext.Provider>
  );
}

export function useDevices() {
  const context = useContext(DevicesContext);
  if (!context) throw new Error("useDevices precisa estar dentro de DevicesProvider.");
  return context;
}
