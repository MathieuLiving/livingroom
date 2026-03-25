import { useState, useEffect, useCallback, useRef } from "react";
import { safeFetch, isIgnorableFetchError, isSigningOutOrUnloading } from "@/lib/fetchUtils";

export const useLocationData = () => {
  const [regions, setRegions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  const runIdRef = useRef(0);

  const regionsCtrlRef = useRef(null);
  const deptsCtrlRef = useRef(null);
  const citiesCtrlRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      runIdRef.current += 1;

      try {
        regionsCtrlRef.current?.abort();
      } catch {}
      try {
        deptsCtrlRef.current?.abort();
      } catch {}
      try {
        citiesCtrlRef.current?.abort();
      } catch {}
    };
  }, []);

  const safeSet = (setter, value, runId) => {
    if (!mountedRef.current) return;
    if (runId !== runIdRef.current) return;
    setter(value);
  };

  const setLoadingSafe = (value, runId) => safeSet(setLoading, value, runId);

  const fetchRegions = useCallback(async () => {
    const runId = ++runIdRef.current;

    if (isSigningOutOrUnloading()) {
      safeSet(setRegions, [], runId);
      safeSet(setDepartments, [], runId);
      safeSet(setCities, [], runId);
      setLoadingSafe(false, runId);
      return;
    }

    try {
      regionsCtrlRef.current?.abort();
    } catch {}
    const controller = new AbortController();
    regionsCtrlRef.current = controller;

    setLoadingSafe(true, runId);

    try {
      const response = await safeFetch("https://geo.api.gouv.fr/regions", {
        signal: controller.signal,
      });

      if (!response?.ok) throw new Error("Failed to fetch regions");

      const data = await response.json();

      if (
        !mountedRef.current ||
        controller.signal.aborted ||
        isSigningOutOrUnloading() ||
        runId !== runIdRef.current
      ) {
        return;
      }

      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) =>
            String(a?.nom || "").localeCompare(String(b?.nom || ""))
          )
        : [];

      safeSet(setRegions, sorted, runId);
    } catch (error) {
      if (
        controller.signal.aborted ||
        isSigningOutOrUnloading() ||
        isIgnorableFetchError(error)
      ) {
        return;
      }
      console.error("[useLocationData] Error fetching regions:", error);
      safeSet(setRegions, [], runId);
    } finally {
      if (
        !mountedRef.current ||
        controller.signal.aborted ||
        isSigningOutOrUnloading() ||
        runId !== runIdRef.current
      ) {
        return;
      }
      setLoadingSafe(false, runId);
    }
  }, []);

  const fetchDepartments = useCallback(async (regionCode) => {
    const runId = ++runIdRef.current;

    if (!regionCode) {
      safeSet(setDepartments, [], runId);
      safeSet(setCities, [], runId);
      setLoadingSafe(false, runId);
      return;
    }

    if (isSigningOutOrUnloading()) {
      safeSet(setDepartments, [], runId);
      safeSet(setCities, [], runId);
      setLoadingSafe(false, runId);
      return;
    }

    try {
      deptsCtrlRef.current?.abort();
    } catch {}
    const controller = new AbortController();
    deptsCtrlRef.current = controller;

    safeSet(setCities, [], runId);
    setLoadingSafe(true, runId);

    try {
      const response = await safeFetch(
        `https://geo.api.gouv.fr/regions/${encodeURIComponent(
          regionCode
        )}/departements`,
        { signal: controller.signal }
      );

      if (!response?.ok) throw new Error("Failed to fetch departments");

      const data = await response.json();

      if (
        !mountedRef.current ||
        controller.signal.aborted ||
        isSigningOutOrUnloading() ||
        runId !== runIdRef.current
      ) {
        return;
      }

      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) =>
            String(a?.nom || "").localeCompare(String(b?.nom || ""))
          )
        : [];

      safeSet(setDepartments, sorted, runId);
    } catch (error) {
      if (
        controller.signal.aborted ||
        isSigningOutOrUnloading() ||
        isIgnorableFetchError(error)
      ) {
        return;
      }
      console.error("[useLocationData] Error fetching departments:", error);
      safeSet(setDepartments, [], runId);
    } finally {
      if (
        !mountedRef.current ||
        controller.signal.aborted ||
        isSigningOutOrUnloading() ||
        runId !== runIdRef.current
      ) {
        return;
      }
      setLoadingSafe(false, runId);
    }
  }, []);

  const fetchCities = useCallback(async (departmentCode) => {
    const runId = ++runIdRef.current;

    if (!departmentCode) {
      safeSet(setCities, [], runId);
      setLoadingSafe(false, runId);
      return;
    }

    if (isSigningOutOrUnloading()) {
      safeSet(setCities, [], runId);
      setLoadingSafe(false, runId);
      return;
    }

    try {
      citiesCtrlRef.current?.abort();
    } catch {}
    const controller = new AbortController();
    citiesCtrlRef.current = controller;

    setLoadingSafe(true, runId);

    try {
      const response = await safeFetch(
        `https://geo.api.gouv.fr/departements/${encodeURIComponent(
          departmentCode
        )}/communes?fields=nom,code&format=json&geometry=centre`,
        { signal: controller.signal }
      );

      if (!response?.ok) throw new Error("Failed to fetch cities");

      const data = await response.json();

      if (
        !mountedRef.current ||
        controller.signal.aborted ||
        isSigningOutOrUnloading() ||
        runId !== runIdRef.current
      ) {
        return;
      }

      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) =>
            String(a?.nom || "").localeCompare(String(b?.nom || ""))
          )
        : [];

      safeSet(setCities, sorted, runId);
    } catch (error) {
      if (
        controller.signal.aborted ||
        isSigningOutOrUnloading() ||
        isIgnorableFetchError(error)
      ) {
        return;
      }
      console.error("[useLocationData] Error fetching cities:", error);
      safeSet(setCities, [], runId);
    } finally {
      if (
        !mountedRef.current ||
        controller.signal.aborted ||
        isSigningOutOrUnloading() ||
        runId !== runIdRef.current
      ) {
        return;
      }
      setLoadingSafe(false, runId);
    }
  }, []);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  return {
    regions,
    departments,
    cities,
    loading,
    fetchDepartments,
    fetchCities,
  };
};