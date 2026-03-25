import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { safeFetch, isIgnorableFetchError, isSigningOutOrUnloading } from "@/lib/fetchUtils";

const API_URL = "https://geo.api.gouv.fr";

export const useLocation = (formData, setFormData) => {
  const [citySearch, setCitySearch] = useState("");
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [activeLocationIndex, setActiveLocationIndex] = useState(null);

  const mountedRef = useRef(true);
  const runIdRef = useRef(0);

  const timeoutIdRef = useRef(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      runIdRef.current += 1;

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      try {
        controllerRef.current?.abort();
      } catch {
        // noop
      }
      controllerRef.current = null;
    };
  }, []);

  const safeSetSuggestions = (list, runId) => {
    if (!mountedRef.current) return;
    if (runId !== runIdRef.current) return;
    setCitySuggestions(list);
  };

  const debouncedFetchCities = useMemo(() => {
    return (search) => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);

      if (isSigningOutOrUnloading()) {
        try {
          controllerRef.current?.abort();
        } catch {
          // noop
        }
        controllerRef.current = null;
        setCitySuggestions([]);
        return;
      }

      timeoutIdRef.current = setTimeout(async () => {
        const runId = ++runIdRef.current;

        if (!search || search.length <= 2) {
          safeSetSuggestions([], runId);
          return;
        }

        try {
          controllerRef.current?.abort();
        } catch {
          // noop
        }
        controllerRef.current = new AbortController();

        try {
          const url = `${API_URL}/communes?nom=${encodeURIComponent(
            search
          )}&fields=nom,code,departement,region&boost=population&limit=10`;

          const response = await safeFetch(url, {
            signal: controllerRef.current.signal,
          });

          if (!response?.ok) {
            throw new Error(
              `Error fetching cities: ${response.status} ${response.statusText || ""}`.trim()
            );
          }

          const data = await response.json();

          if (
            !mountedRef.current ||
            controllerRef.current.signal.aborted ||
            isSigningOutOrUnloading() ||
            runId !== runIdRef.current
          ) {
            return;
          }

          safeSetSuggestions(
            Array.isArray(data)
              ? data.map((c) => ({
                  city: c?.nom,
                  department: c?.departement?.nom,
                  region: c?.region?.nom,
                }))
              : [],
            runId
          );
        } catch (error) {
          if (
            controllerRef.current?.signal?.aborted ||
            isSigningOutOrUnloading() ||
            isIgnorableFetchError(error)
          ) {
            return;
          }

          console.error("[useLocation] Error fetching cities:", error);
          safeSetSuggestions([], runId);
        }
      }, 300);
    };
  }, []);

  const handleLocationInputChange = useCallback(
    (index, field, value) => {
      const currentLocations = Array.isArray(formData?.locations)
        ? formData.locations
        : [];
      const newLocations = [...currentLocations];
      if (!newLocations[index]) newLocations[index] = { id: Date.now() };

      if (field === "city") {
        newLocations[index].city = value;
        setActiveLocationIndex(index);
        setCitySearch(value);
        debouncedFetchCities(value);
      } else {
        newLocations[index][field] = value;
      }

      setFormData((prev) => ({ ...prev, locations: newLocations }));
    },
    [formData?.locations, setFormData, debouncedFetchCities]
  );

  const handleCitySelect = useCallback(
    (index, cityData) => {
      const currentLocations = Array.isArray(formData?.locations)
        ? formData.locations
        : [];
      const newLocations = [...currentLocations];
      if (!newLocations[index]) newLocations[index] = { id: Date.now() };

      newLocations[index] = {
        ...newLocations[index],
        city: cityData.city,
        department: cityData.department,
        region: cityData.region,
      };

      setFormData((prev) => ({ ...prev, locations: newLocations }));
      setCitySuggestions([]);
      setActiveLocationIndex(null);
    },
    [formData?.locations, setFormData]
  );

  return {
    citySearch,
    citySuggestions,
    activeLocationIndex,
    handleLocationInputChange,
    handleCitySelect,
  };
};