import React from 'react';
import { CircuitComponent, Wire, SignalValue } from '../../types/circuit';
import { COMPONENT_METADATA } from '../../constants/components';
import { useTheme } from '../../context/ThemeContext';
import { Trash2, Copy, Power, Layers, AlertTriangle } from 'lucide-react';

interface InspectorPanelProps {
  selectedComponents: CircuitComponent[];
  selectedWires: Wire[];
  pinValues: Record<string, SignalValue>;
  wireValues: Record<string, SignalValue>;
  totalComponents: number;
  totalWires: number;
  isOscillating: boolean;
  onUpdateLabel: (id: string, label: string) => void;
  onToggleSwitch: (id: string) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onClearCircuit: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedComponents,
  selectedWires,
  pinValues,
  wireValues,
  totalComponents,
  totalWires,
  isOscillating,
  onUpdateLabel,
  onToggleSwitch,
  onDeleteSelected,
  onDuplicateSelected,
  onClearCircuit,
}) => {
  const { theme } = useTheme();
  const singleComp = selectedComponents.length === 1 ? selectedComponents[0] : null;
  const singleWire = selectedWires.length === 1 ? selectedWires[0] : null;

  return (
    <aside
      className="w-64 h-full border-l flex flex-col z-10 select-none shadow-xl transition-colors duration-200"
      style={{
        backgroundColor: theme.bgPanel,
        borderColor: theme.borderPanel,
      }}
    >
      {/* Panel Header */}
      <div className="p-3.5 border-b flex items-center justify-between" style={{ borderColor: theme.borderPanel }}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" style={{ color: theme.signalHigh }} />
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textPrimary }}>
            Inspector
          </h2>
        </div>

        {(selectedComponents.length > 0 || selectedWires.length > 0) && (
          <div className="flex items-center gap-1">
            {selectedComponents.length > 0 && (
              <button
                onClick={onDuplicateSelected}
                title="Duplicate (Ctrl+D)"
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onDeleteSelected}
              title="Delete (Del / Backspace)"
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Inspector Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
        {/* Warning if oscillating */}
        {isOscillating && (
          <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold block">Oscillation Detected</span>
              Signal loop exceeded limit. Protected from crash.
            </div>
          </div>
        )}

        {/* 1. Single Component Selected */}
        {singleComp && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider" style={{ color: theme.textMuted }}>
                {COMPONENT_METADATA[singleComp.type].name}
              </span>
              <input
                type="text"
                value={singleComp.label}
                onChange={e => onUpdateLabel(singleComp.id, e.target.value)}
                className="mt-1 w-full border rounded px-2.5 py-1 font-medium focus:outline-none"
                style={{
                  backgroundColor: theme.bgPanelSubtle,
                  borderColor: theme.borderSubtle,
                  color: theme.textPrimary,
                }}
              />
            </div>

            {/* Position */}
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]" style={{ color: theme.textSecondary }}>
              <div
                className="p-2 rounded border"
                style={{ backgroundColor: theme.bgPanelSubtle, borderColor: theme.borderPanel }}
              >
                X: <span className="font-semibold" style={{ color: theme.textPrimary }}>{Math.round(singleComp.x)}</span> px
              </div>
              <div
                className="p-2 rounded border"
                style={{ backgroundColor: theme.bgPanelSubtle, borderColor: theme.borderPanel }}
              >
                Y: <span className="font-semibold" style={{ color: theme.textPrimary }}>{Math.round(singleComp.y)}</span> px
              </div>
            </div>

            {/* Switch Control */}
            {singleComp.type === 'SWITCH' && (
              <div
                className="p-3 rounded-md border space-y-2"
                style={{ backgroundColor: theme.bgPanelSubtle, borderColor: theme.borderPanel }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: theme.textPrimary }}>Switch State:</span>
                  <span
                    className="font-mono font-bold px-2 py-0.5 rounded text-xs border"
                    style={
                      singleComp.state.value === 1
                        ? {
                            backgroundColor: theme.signalHighFill,
                            color: theme.signalHigh,
                            borderColor: theme.signalHigh,
                          }
                        : {
                            backgroundColor: theme.bgWorkspace,
                            color: theme.textMuted,
                            borderColor: theme.borderSubtle,
                          }
                    }
                  >
                    {singleComp.state.value === 1 ? '1 (HIGH)' : '0 (LOW)'}
                  </span>
                </div>
                <button
                  onClick={() => onToggleSwitch(singleComp.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: theme.signalHighFill, color: theme.signalHigh, border: `1px solid ${theme.signalHigh}` }}
                >
                  <Power className="w-3.5 h-3.5" />
                  Toggle Switch
                </button>
              </div>
            )}

            {/* Pins Readout */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: theme.textSecondary }}>
                Pin Signals
              </span>

              {singleComp.inputs.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px]" style={{ color: theme.textMuted }}>Inputs:</span>
                  {singleComp.inputs.map(pin => {
                    const key = `${singleComp.id}:${pin.id}`;
                    const val = pinValues[key] ?? 0;
                    return (
                      <div
                        key={pin.id}
                        className="flex items-center justify-between px-2 py-1 rounded border"
                        style={{ backgroundColor: theme.bgPanelSubtle, borderColor: theme.borderPanel }}
                      >
                        <span className="font-mono" style={{ color: theme.textSecondary }}>{pin.label || pin.name}</span>
                        <span
                          className="font-mono font-bold text-xs"
                          style={{ color: val === 1 ? theme.signalHigh : theme.textMuted }}
                        >
                          {val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {singleComp.outputs.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px]" style={{ color: theme.textMuted }}>Outputs:</span>
                  {singleComp.outputs.map(pin => {
                    const key = `${singleComp.id}:${pin.id}`;
                    const val = pinValues[key] ?? 0;
                    return (
                      <div
                        key={pin.id}
                        className="flex items-center justify-between px-2 py-1 rounded border"
                        style={{ backgroundColor: theme.bgPanelSubtle, borderColor: theme.borderPanel }}
                      >
                        <span className="font-mono" style={{ color: theme.textSecondary }}>{pin.label || pin.name}</span>
                        <span
                          className="font-mono font-bold text-xs"
                          style={{ color: val === 1 ? theme.signalHigh : theme.textMuted }}
                        >
                          {val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Single Wire Selected */}
        {singleWire && !singleComp && (
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-wider" style={{ color: theme.textMuted }}>
              Selected Connection Wire
            </span>

            <div
              className="p-3 rounded-md border space-y-2"
              style={{ backgroundColor: theme.bgPanelSubtle, borderColor: theme.borderPanel }}
            >
              <div className="flex items-center justify-between">
                <span style={{ color: theme.textPrimary }}>Live Signal:</span>
                <span
                  className="font-mono font-bold px-2 py-0.5 rounded text-xs border"
                  style={
                    wireValues[singleWire.id] === 1
                      ? {
                          backgroundColor: theme.signalHighFill,
                          color: theme.signalHigh,
                          borderColor: theme.signalHigh,
                        }
                      : {
                          backgroundColor: theme.bgWorkspace,
                          color: theme.textMuted,
                          borderColor: theme.borderSubtle,
                        }
                  }
                >
                  {wireValues[singleWire.id] === 1 ? '1 (HIGH)' : '0 (LOW)'}
                </span>
              </div>
              <div className="text-[11px] space-y-1 font-mono" style={{ color: theme.textMuted }}>
                <div>From: {singleWire.fromComponentId} ({singleWire.fromPinId})</div>
                <div>To: {singleWire.toComponentId} ({singleWire.toPinId})</div>
              </div>
            </div>

            <button
              onClick={onDeleteSelected}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-red-600/80 hover:bg-red-500 text-white font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Wire
            </button>
          </div>
        )}

        {/* 3. Multiple Items Selected */}
        {selectedComponents.length > 1 && (
          <div className="space-y-3">
            <div
              className="p-3 rounded-md border"
              style={{ backgroundColor: theme.bgPanelSubtle, borderColor: theme.borderPanel }}
            >
              <span className="font-semibold block mb-1" style={{ color: theme.textPrimary }}>Multiple Selection</span>
              <span className="text-[11px]" style={{ color: theme.textSecondary }}>
                {selectedComponents.length} components selected
              </span>
            </div>
          </div>
        )}

        {/* 4. No Selection: Circuit Overview */}
        {!singleComp && !singleWire && selectedComponents.length === 0 && (
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider block mb-2" style={{ color: theme.textSecondary }}>
                Circuit Statistics
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div
                  className="p-2.5 rounded border"
                  style={{ backgroundColor: theme.bgPanelSubtle, borderColor: theme.borderPanel }}
                >
                  <span className="block text-[10px]" style={{ color: theme.textMuted }}>COMPONENTS</span>
                  <span className="text-base font-bold" style={{ color: theme.textPrimary }}>{totalComponents}</span>
                </div>
                <div
                  className="p-2.5 rounded border"
                  style={{ backgroundColor: theme.bgPanelSubtle, borderColor: theme.borderPanel }}
                >
                  <span className="block text-[10px]" style={{ color: theme.textMuted }}>WIRES</span>
                  <span className="text-base font-bold" style={{ color: theme.textPrimary }}>{totalWires}</span>
                </div>
              </div>
            </div>

            <div
              className="p-3 rounded-md border space-y-2"
              style={{ backgroundColor: theme.bgPanelSubtle, borderColor: theme.borderPanel }}
            >
              <span className="text-[11px] font-semibold block" style={{ color: theme.textPrimary }}>Workspace Shortcuts</span>
              <ul className="text-[11px] space-y-1 font-mono" style={{ color: theme.textSecondary }}>
                <li><kbd className="px-1 py-0.5 rounded border" style={{ backgroundColor: theme.bgWorkspace, borderColor: theme.borderSubtle, color: theme.textPrimary }}>Del</kbd> : Delete selected</li>
                <li><kbd className="px-1 py-0.5 rounded border" style={{ backgroundColor: theme.bgWorkspace, borderColor: theme.borderSubtle, color: theme.textPrimary }}>Esc</kbd> : Cancel wire draft</li>
                <li><kbd className="px-1 py-0.5 rounded border" style={{ backgroundColor: theme.bgWorkspace, borderColor: theme.borderSubtle, color: theme.textPrimary }}>Scroll</kbd> : Zoom canvas</li>
                <li><kbd className="px-1 py-0.5 rounded border" style={{ backgroundColor: theme.bgWorkspace, borderColor: theme.borderSubtle, color: theme.textPrimary }}>Drag</kbd> : Pan workspace</li>
              </ul>
            </div>

            {totalComponents > 0 && (
              <button
                onClick={onClearCircuit}
                className="w-full py-1.5 px-3 rounded text-xs font-medium border transition-colors hover:bg-red-900/60 hover:text-red-300"
                style={{
                  backgroundColor: theme.bgPanelSubtle,
                  borderColor: theme.borderSubtle,
                  color: theme.textSecondary,
                }}
              >
                Clear Entire Canvas
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
