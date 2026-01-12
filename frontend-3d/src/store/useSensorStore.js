import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

/**
 * Transient state for high-frequency sensor updates.
 * This is mutated directly in useFrame callbacks to avoid React re-renders.
 *
 * Structure matches sensor_readings table columns:
 * - rpm: double precision (0-5000)
 * - temperature: double precision (60-100°F)
 * - vibration: double precision (0-10 mm/s)
 * - pressure: double precision (0-200 PSI)
 * - bearing_temp: integer (0-200°F)
 * - anomalyScore: float (0-1, from ML pipeline)
 */
const transientState = {
  rigs: {
    A: {
      rpm: 2500,
      temperature: 72,
      vibration: 1.5,
      pressure: 100,
      bearing_temp: 120,
      anomalyScore: 0,
      isRunning: true
    },
    B: {
      rpm: 2200,
      temperature: 75,
      vibration: 2.0,
      pressure: 95,
      bearing_temp: 125,
      anomalyScore: 0,
      isRunning: true
    },
    C: {
      rpm: 2800,
      temperature: 70,
      vibration: 1.2,
      pressure: 105,
      bearing_temp: 118,
      anomalyScore: 0,
      isRunning: true
    }
  }
}

/**
 * Direct access to transient state for useFrame callbacks.
 * Use this in animation loops to avoid triggering React re-renders.
 *
 * @example
 * useFrame((state, delta) => {
 *   const data = getTransientState().rigs['A']
 *   meshRef.current.rotation.y += (data.rpm / 5000) * 10 * delta
 * })
 */
export const getTransientState = () => transientState

/**
 * Update transient rig data directly.
 * Called from Socket.IO event handlers.
 */
export const updateTransientRig = (rigId, data) => {
  if (transientState.rigs[rigId]) {
    Object.assign(transientState.rigs[rigId], data)
  }
}

/**
 * Main Zustand store for UI state that DOES trigger re-renders.
 * Use this for:
 * - Connection status
 * - Alert notifications
 * - Selected rig (for HUD focus)
 * - System settings
 */
export const useSensorStore = create(
  subscribeWithSelector((set, get) => ({
    // Connection state
    connected: false,
    connectionError: null,
    lastUpdate: null,

    // UI state
    selectedRig: null,
    showDebug: false,
    isPaused: false,

    // Alerts (triggers HUD re-render)
    alerts: [],
    maxAlerts: 10,

    // System info
    systemStatus: {
      kafka: 'unknown',
      database: 'unknown',
      ml: 'unknown'
    },

    // Actions
    setConnected: (connected) => set({ connected, connectionError: null }),
    setConnectionError: (error) => set({ connectionError: error, connected: false }),
    setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),

    setSelectedRig: (rigId) => set({ selectedRig: rigId }),
    clearSelectedRig: () => set({ selectedRig: null }),

    toggleDebug: () => set((state) => ({ showDebug: !state.showDebug })),
    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

    addAlert: (alert) => set((state) => ({
      alerts: [
        {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          ...alert
        },
        ...state.alerts
      ].slice(0, state.maxAlerts)
    })),

    clearAlerts: () => set({ alerts: [] }),

    dismissAlert: (alertId) => set((state) => ({
      alerts: state.alerts.filter(a => a.id !== alertId)
    })),

    setSystemStatus: (status) => set((state) => ({
      systemStatus: { ...state.systemStatus, ...status }
    })),

    // Computed getters
    getAlertCount: () => get().alerts.length,
    hasActiveAlerts: () => get().alerts.some(a => a.severity === 'critical'),
  }))
)

export default useSensorStore
