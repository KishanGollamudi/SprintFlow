import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import sprintService from "@/services/sprintService";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { unwrapList } from "@/utils/apiResponse";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const SprintContext = createContext();

export const SprintProvider = ({ children }) => {
  const { user } = useAuth();
  const appData = useAppData() ?? {};

  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch directly from API ───────────────────────────────
  const fetchSprints = useCallback(async () => {
    if (USE_MOCK || !user) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res =
        user.role?.toLowerCase() === "trainer" && user.id
          ? await sprintService.getByTrainer(user.id)
          : await sprintService.getAll();
      const list = unwrapList(res);
      // dedupe by id in case backend or local sync introduced duplicates
      const seen = new Set();
      const unique = list.filter((s) => {
        if (!s || !s.id) return true;
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
      setSprints(unique);
    } catch (err) {
      if (!err.message?.includes("403")) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ── Initial fetch on mount / user change ─────────────────
  useEffect(() => {
    if (USE_MOCK) {
      // In mock mode use AppDataContext sprints
      if (Array.isArray(appData.sprints) && appData.sprints.length > 0) {
        setSprints(appData.sprints);
      }
      return;
    }
    fetchSprints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Mutations ─────────────────────────────────────────────

  const addSprint = async (data) => {
    const payload = {
      ...data,
      cohorts: data.cohorts?.length
        ? data.cohorts
        : [{ technology: data.technology || "", cohort: data.cohort || "" }],
      cohort: data.cohorts?.[0]?.cohort || data.cohort || "",
      timeSlot: `${data.sprintStart || ""} - ${data.sprintEnd || ""}`,
    };
    if (USE_MOCK) {
      const mock = { ...payload, id: crypto.randomUUID(), status: "Scheduled" };
      setSprints((p) => {
        const next = [...p, mock];
        const seen = new Set();
        return next.filter((s) => {
          if (!s || !s.id) return true;
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
      });
      return;
    }
    const res = await sprintService.create(payload);
    const created = res?.data ?? res;
    setSprints((p) => {
      const next = [...p, created];
      const seen = new Set();
      return next.filter((s) => {
        if (!s || !s.id) return true;
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
    });
    // Sync AppDataContext WITHOUT calling the API again — pass a marker
    // so AppDataContext only updates local state (avoids duplicate create).
    if (appData.addSprint) {
      try {
        appData.addSprint({ ...created, _skipApi: true });
      } catch {
        /* ignore */
      }
    }
  };

  const updateStatus = async (id, status) => {
    if (USE_MOCK) {
      setSprints((p) => p.map((s) => (s.id === id ? { ...s, status } : s)));
      // also sync to AppData so manager view updates
      if (appData.patchSprintStatus) appData.patchSprintStatus(id, status);
      if (appData.updateSprint)
        appData.updateSprint(id, { status }).catch(() => {});
      return;
    }
    // optimistic update locally
    setSprints((p) => p.map((s) => (s.id === id ? { ...s, status } : s)));
    if (appData.patchSprintStatus) appData.patchSprintStatus(id, status);
    try {
      await sprintService.updateStatus(id, status);
      // fetch the full updated sprint from server to sync other fields
      try {
        const res = await sprintService.getById(id);
        const updated = res?.data ?? res;
        if (updated) {
          setSprints((p) =>
            p.map((s) => (s.id === id ? { ...s, ...updated } : s)),
          );
          if (appData.updateSprint)
            appData.updateSprint(id, updated).catch(() => {});
        }
      } catch (e) {
        // ignore getById failure — local optimistic state is still valid
      }
    } catch (err) {
      // revert by refetching from server
      fetchSprints();
      throw err;
    }
  };

  const updateSprint = async (id, data) => {
    if (USE_MOCK) {
      setSprints((p) => p.map((s) => (s.id === id ? { ...s, ...data } : s)));
      return;
    }
    // Call API — backend resolves trainer name from DB
    const res = await sprintService.update(id, data);
    // api.js interceptor returns ApiResponseDTO; .data is the SprintDTO
    const updated = res?.data ?? res;
    // Update local state with server-resolved data (correct trainer name)
    setSprints((p) => p.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    // Sync AppDataContext independently (don't await — avoid overwrite race)
    if (appData.updateSprint) appData.updateSprint(id, data).catch(() => {});
  };

  const deleteSprint = async (id) => {
    if (USE_MOCK) {
      setSprints((p) => p.filter((s) => s.id !== id));
      return;
    }
    await sprintService.delete(id);
    setSprints((p) => p.filter((s) => s.id !== id));
    if (appData.deleteSprint) appData.deleteSprint(id).catch(() => {});
  };

  return (
    <SprintContext.Provider
      value={{
        sprints,
        loading,
        error,
        addSprint,
        updateStatus,
        updateSprint,
        deleteSprint,
        refetch: fetchSprints,
      }}
    >
      {children}
    </SprintContext.Provider>
  );
};

export const useSprints = () => useContext(SprintContext);
