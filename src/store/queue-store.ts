import { create } from "zustand";
import type { QueueStatusData } from "@/types";

interface QueueState {
  queueStatuses: Record<string, QueueStatusData>;
  pollingCodes: Set<string>;
  lastUpdated: Record<string, number>;
  isPolling: boolean;

  // Global alert state — drives the persistent modal shown across all pages
  alertStatus: QueueStatusData | null;
  alertMuted: boolean;
  /** Set of "queueCode:status" keys the user has already acknowledged — never re-alert these */
  acknowledgedAlerts: Set<string>;
  setAlert: (status: QueueStatusData) => void;
  clearAlert: () => void;
  setAlertMuted: (muted: boolean) => void;
  acknowledgeAlert: (queueCode: string, status: string) => void;
  isAlertAcknowledged: (queueCode: string, status: string) => boolean;

  setQueueStatus: (code: string, status: QueueStatusData) => void;
  addPollingCode: (code: string) => void;
  removePollingCode: (code: string) => void;
  clearQueueStatus: (code: string) => void;
  setPolling: (polling: boolean) => void;
  getQueueStatus: (code: string) => QueueStatusData | undefined;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queueStatuses: {},
  pollingCodes: new Set(),
  lastUpdated: {},
  isPolling: false,

  alertStatus: null,
  alertMuted: false,
  acknowledgedAlerts: new Set<string>(),
  setAlert: (status) => set({ alertStatus: status }),
  clearAlert: () => set({ alertStatus: null }),
  setAlertMuted: (muted) => set({ alertMuted: muted }),
  acknowledgeAlert: (queueCode, status) =>
    set((state) => ({
      acknowledgedAlerts: new Set([...state.acknowledgedAlerts, `${queueCode}:${status}`]),
      alertStatus: null,
    })),
  isAlertAcknowledged: (queueCode, status) =>
    get().acknowledgedAlerts.has(`${queueCode}:${status}`),

  setQueueStatus: (code, status) => {
    set((state) => ({
      queueStatuses: { ...state.queueStatuses, [code]: status },
      lastUpdated: { ...state.lastUpdated, [code]: Date.now() },
    }));
  },

  addPollingCode: (code) => {
    set((state) => ({
      pollingCodes: new Set([...state.pollingCodes, code]),
    }));
  },

  removePollingCode: (code) => {
    set((state) => {
      const newCodes = new Set(state.pollingCodes);
      newCodes.delete(code);
      return { pollingCodes: newCodes };
    });
  },

  clearQueueStatus: (code) => {
    set((state) => {
      const newStatuses = { ...state.queueStatuses };
      const newUpdated = { ...state.lastUpdated };
      delete newStatuses[code];
      delete newUpdated[code];
      return { queueStatuses: newStatuses, lastUpdated: newUpdated };
    });
  },

  setPolling: (isPolling) => {
    set({ isPolling });
  },

  getQueueStatus: (code) => {
    return get().queueStatuses[code];
  },
}));
