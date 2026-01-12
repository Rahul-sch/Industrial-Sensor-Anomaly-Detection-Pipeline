import { useSensorStore, getTransientState } from '../store/useSensorStore'
import { useEffect, useState } from 'react'

/**
 * Heads-Up Display overlay for the 3D Digital Twin.
 *
 * Features:
 * - Connection status indicator
 * - Crosshair reticle
 * - Alert notifications panel
 * - Quick stats for each rig
 * - Controls hint
 */
export function HUD() {
  const connected = useSensorStore((s) => s.connected)
  const connectionError = useSensorStore((s) => s.connectionError)
  const alerts = useSensorStore((s) => s.alerts)
  const selectedRig = useSensorStore((s) => s.selectedRig)
  const dismissAlert = useSensorStore((s) => s.dismissAlert)

  return (
    <div className="fixed inset-0 pointer-events-none font-mono z-50">
      {/* Top-left: Connection Status */}
      <ConnectionStatus connected={connected} error={connectionError} />

      {/* Top-right: Alerts Panel */}
      <AlertsPanel alerts={alerts} onDismiss={dismissAlert} />

      {/* Center: Crosshair */}
      <Crosshair />

      {/* Bottom-left: Quick Stats */}
      <QuickStats />

      {/* Bottom-right: Controls & Branding */}
      <ControlsHint />

      {/* Selected Rig Info (when looking at a rig) */}
      {selectedRig && <RigInfoPanel rigId={selectedRig} />}
    </div>
  )
}

/**
 * Connection status indicator
 */
function ConnectionStatus({ connected, error }) {
  return (
    <div className="absolute top-4 left-4">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded
        ${connected
          ? 'bg-black/70 border border-rig-green/50'
          : 'bg-black/70 border border-rig-red/50'
        }
      `}>
        <div className={`
          w-2 h-2 rounded-full
          ${connected ? 'bg-rig-green animate-pulse' : 'bg-rig-red'}
        `} />
        <span className={`text-xs ${connected ? 'text-rig-green' : 'text-rig-red'}`}>
          {connected ? 'LIVE' : error || 'DISCONNECTED'}
        </span>
      </div>

      {/* Data stream indicator */}
      {connected && (
        <div className="mt-2 text-xs text-gray-500">
          <span className="text-rig-cyan">●</span> Streaming @ 10 Hz
        </div>
      )}
    </div>
  )
}

/**
 * Alerts notification panel
 */
function AlertsPanel({ alerts, onDismiss }) {
  if (alerts.length === 0) return null

  return (
    <div className="absolute top-4 right-4 w-80 pointer-events-auto">
      <div className="hud-panel-danger p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-rig-red text-sm font-semibold flex items-center gap-2">
            <span className="animate-pulse">⚠</span>
            ALERTS ({alerts.length})
          </h4>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto hud-scroll">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`
                text-xs p-2 rounded border-l-2
                ${alert.severity === 'critical'
                  ? 'bg-red-900/30 border-rig-red text-red-200'
                  : 'bg-yellow-900/30 border-rig-yellow text-yellow-200'
                }
              `}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold">[RIG {alert.machine_id}]</span>
                  <span className="ml-2">{alert.message}</span>
                </div>
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="text-gray-400 hover:text-white ml-2"
                >
                  ×
                </button>
              </div>
              <div className="text-gray-400 mt-1">
                Score: {(alert.score * 100).toFixed(0)}% |
                Method: {alert.method?.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Center crosshair reticle
 */
function Crosshair() {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      {/* Outer ring */}
      <div className="w-6 h-6 border border-rig-cyan/40 rounded-full" />
      {/* Inner dot */}
      <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-rig-cyan rounded-full transform -translate-x-1/2 -translate-y-1/2" />
      {/* Cross lines */}
      <div className="absolute top-1/2 left-0 w-1.5 h-px bg-rig-cyan/40 transform -translate-y-1/2 -translate-x-2" />
      <div className="absolute top-1/2 right-0 w-1.5 h-px bg-rig-cyan/40 transform -translate-y-1/2 translate-x-2" />
      <div className="absolute left-1/2 top-0 w-px h-1.5 bg-rig-cyan/40 transform -translate-x-1/2 -translate-y-2" />
      <div className="absolute left-1/2 bottom-0 w-px h-1.5 bg-rig-cyan/40 transform -translate-x-1/2 translate-y-2" />
    </div>
  )
}

/**
 * Quick stats panel showing all rig data
 */
function QuickStats() {
  const [stats, setStats] = useState({ A: {}, B: {}, C: {} })

  // Update stats at 2 Hz (less frequent than data stream)
  useEffect(() => {
    const interval = setInterval(() => {
      const transient = getTransientState()
      setStats({
        A: { ...transient.rigs.A },
        B: { ...transient.rigs.B },
        C: { ...transient.rigs.C }
      })
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute bottom-16 left-4">
      <div className="hud-panel p-3 text-xs">
        <h4 className="text-rig-cyan text-sm mb-2 font-semibold">RIG STATUS</h4>
        <div className="space-y-2">
          {['A', 'B', 'C'].map((rigId) => (
            <RigStatRow key={rigId} rigId={rigId} data={stats[rigId]} />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Single rig stat row
 */
function RigStatRow({ rigId, data }) {
  const hasAnomaly = (data?.anomalyScore || 0) > 0.5
  const tempColor = (data?.temperature || 70) > 85 ? 'text-rig-red' : 'text-rig-green'
  const vibColor = (data?.vibration || 0) > 4.5 ? 'text-rig-yellow' : 'text-rig-green'

  return (
    <div className={`flex items-center gap-3 ${hasAnomaly ? 'text-rig-red' : 'text-gray-300'}`}>
      <span className="font-bold w-4">{rigId}</span>
      <div className="flex gap-4 text-[10px]">
        <span>
          RPM: <span className="text-rig-cyan">{(data?.rpm || 0).toFixed(0)}</span>
        </span>
        <span>
          TEMP: <span className={tempColor}>{(data?.temperature || 0).toFixed(1)}°F</span>
        </span>
        <span>
          VIB: <span className={vibColor}>{(data?.vibration || 0).toFixed(2)}</span>
        </span>
        {hasAnomaly && (
          <span className="text-rig-red animate-pulse">⚠ ANOMALY</span>
        )}
      </div>
    </div>
  )
}

/**
 * Controls hint at bottom
 */
function ControlsHint() {
  return (
    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
      <div className="text-gray-500 text-xs">
        <span className="text-gray-400">WASD</span> Move |
        <span className="text-gray-400"> MOUSE</span> Look |
        <span className="text-gray-400"> SPACE</span> Jump |
        <span className="text-gray-400"> SHIFT</span> Sprint |
        <span className="text-gray-400"> ESC</span> Release cursor
      </div>
      <div className="text-rig-cyan/40 text-xs">
        RIG ALPHA DIGITAL TWIN v2.0
      </div>
    </div>
  )
}

/**
 * Detailed rig info panel (when selected)
 */
function RigInfoPanel({ rigId }) {
  const [data, setData] = useState({})

  useEffect(() => {
    const interval = setInterval(() => {
      setData({ ...getTransientState().rigs[rigId] })
    }, 100)
    return () => clearInterval(interval)
  }, [rigId])

  return (
    <div className="absolute top-1/2 right-4 transform -translate-y-1/2 pointer-events-auto">
      <div className="hud-panel p-4 w-64">
        <h3 className="text-rig-cyan text-lg font-bold mb-3">
          RIG {rigId} <span className="text-xs text-gray-400">INSPECTION</span>
        </h3>

        <div className="space-y-3 text-sm">
          <DataRow label="RPM" value={data.rpm?.toFixed(0)} unit="" normal={true} />
          <DataRow
            label="Temperature"
            value={data.temperature?.toFixed(1)}
            unit="°F"
            normal={(data.temperature || 70) < 85}
          />
          <DataRow
            label="Vibration"
            value={data.vibration?.toFixed(2)}
            unit="mm/s"
            normal={(data.vibration || 0) < 4.5}
          />
          <DataRow
            label="Pressure"
            value={data.pressure?.toFixed(0)}
            unit="PSI"
            normal={true}
          />
          <DataRow
            label="Bearing Temp"
            value={data.bearing_temp?.toFixed(0)}
            unit="°F"
            normal={(data.bearing_temp || 120) < 160}
          />

          <div className="border-t border-gray-700 pt-2 mt-2">
            <DataRow
              label="Anomaly Score"
              value={((data.anomalyScore || 0) * 100).toFixed(0)}
              unit="%"
              normal={(data.anomalyScore || 0) < 0.5}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Data row helper
 */
function DataRow({ label, value, unit, normal }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}</span>
      <span className={normal ? 'text-rig-green' : 'text-rig-red'}>
        {value || '—'} {unit}
      </span>
    </div>
  )
}

export default HUD
