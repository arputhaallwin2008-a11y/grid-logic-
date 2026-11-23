import React, { useRef } from 'react';
import { PresetCircuit } from '../../types/circuit';
import { PRESET_CIRCUITS } from '../../constants/presets';
import { useTheme } from '../../context/ThemeContext';
import {
  Play,
  Pause,
  RotateCw,
  Table,
  LineChart,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  AlertTriangle,
  FolderOpen,
  Palette,
} from 'lucide-react';

interface ToolbarProps {
  isRunning: boolean;
  onToggleRunning: () => void;
  onTriggerClockPulse: () => void;
  clockFrequency: number;
  onSetClockFrequency: (hz: number) => void;
  isOscillating: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onLoadPreset: (preset: PresetCircuit) => void;
  onExportJson: () => void;
  onImportJson: (json: string) => void;
  onToggleTruthTable: () => void;
  isTruthTableOpen: boolean;
  onToggleTimingDiagram: () => void;
  isTimingDiagramOpen: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  isRunning,
  onToggleRunning,
  onTriggerClockPulse,
  clockFrequency,
  onSetClockFrequency,
  isOscillating,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onLoadPreset,
  onExportJson,
  onImportJson,
  onToggleTruthTable,
  isTruthTableOpen,
  onToggleTimingDiagram,
  isTimingDiagramOpen,
}) => {
  const { theme, themeId, setThemeId, availableThemes } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (content) {
        onImportJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header
      className="h-14 border-b flex items-center justify-between px-4 z-20 select-none shadow-md transition-colors duration-200"
      style={{
        backgroundColor: theme.bgToolbar,
        borderColor: theme.borderPanel,
      }}
    >
      {/* Hidden file input for importing */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Left: Presets, Theme Selector & History */}
      <div className="flex items-center gap-3">
        {/* Preset Selector */}
        <div
          className="flex items-center gap-1.5 border rounded-md px-2 py-1"
          style={{
            backgroundColor: theme.bgPanelSubtle,
            borderColor: theme.borderSubtle,
          }}
        >
          <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
          <select
            defaultValue=""
            onChange={e => {
              const selected = PRESET_CIRCUITS.find(p => p.id === e.target.value);
              if (selected) onLoadPreset(selected);
              e.target.value = '';
            }}
            className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            style={{ color: theme.textPrimary }}
          >
            <option value="" disabled className="bg-slate-900 text-slate-400">
              Load Preset Circuit...
            </option>
            {PRESET_CIRCUITS.map(p => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Theme / Color Switcher with Quick Swatches */}
        <div
          className="flex items-center gap-1.5 border rounded-md px-2 py-1"
          style={{
            backgroundColor: theme.bgPanelSubtle,
            borderColor: theme.borderSubtle,
          }}
        >
          <Palette className="w-3.5 h-3.5" style={{ color: theme.signalHigh }} />
          <div className="flex items-center gap-1 mx-0.5">
            {availableThemes.map(t => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                title={`Switch to ${t.name}`}
                className="w-3.5 h-3.5 rounded-full border transition-all hover:scale-125"
                style={{
                  backgroundColor: t.badgeColor,
                  borderColor: themeId === t.id ? '#ffffff' : 'rgba(255,255,255,0.2)',
                  transform: themeId === t.id ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: themeId === t.id ? `0 0 6px ${t.badgeColor}` : 'none',
                }}
              />
            ))}
          </div>
          <select
            value={themeId}
            onChange={e => setThemeId(e.target.value)}
            className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            style={{ color: theme.textPrimary }}
          >
            {availableThemes.map(t => (
              <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="h-5 w-px" style={{ backgroundColor: theme.borderPanel }} />

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-white/5 text-slate-300 disabled:opacity-30 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-white/5 text-slate-300 disabled:opacity-30 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Clock & Simulation Engine Controls */}
      <div
        className="flex items-center gap-3 border px-3 py-1 rounded-lg"
        style={{
          backgroundColor: theme.bgPanelSubtle,
          borderColor: theme.borderSubtle,
        }}
      >
        {/* Play / Pause Clock */}
        <button
          onClick={onToggleRunning}
          title={isRunning ? 'Pause Clock Generator' : 'Run Clock Generator'}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all border"
          style={
            isRunning
              ? {
                  backgroundColor: theme.signalHighFill,
                  color: theme.signalHigh,
                  borderColor: theme.signalHigh,
                }
              : {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: theme.textSecondary,
                  borderColor: 'transparent',
                }
          }
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isRunning ? 'RUNNING' : 'PAUSED'}</span>
        </button>

        {/* Single Step Pulse */}
        <button
          onClick={onTriggerClockPulse}
          title="Single Step Clock Pulse"
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors hover:brightness-125"
          style={{
            backgroundColor: theme.bgPanelHover,
            color: theme.textPrimary,
          }}
        >
          <RotateCw className="w-3 h-3" />
          <span>Step</span>
        </button>

        <div className="h-4 w-px opacity-30" style={{ backgroundColor: theme.borderSubtle }} />

        {/* Clock Frequency Slider */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-mono" style={{ color: theme.textMuted }}>
            CLK:
          </span>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            value={clockFrequency}
            onChange={e => onSetClockFrequency(parseFloat(e.target.value))}
            className="w-20 h-1.5 rounded-lg cursor-pointer accent-amber-400"
            style={{ accentColor: theme.clockColor }}
          />
          <span
            className="font-mono font-bold min-w-[36px] text-[11px]"
            style={{ color: theme.clockColor }}
          >
            {clockFrequency}Hz
          </span>
        </div>

        {/* Oscillation Warning Badge */}
        {isOscillating && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] font-semibold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>LOOP</span>
          </div>
        )}
      </div>

      {/* Right: Truth Table, Timing, Persistence & Zoom */}
      <div className="flex items-center gap-2">
        {/* Auto Truth Table Toggle */}
        <button
          onClick={onToggleTruthTable}
          title="Generate Truth Table"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border"
          style={
            isTruthTableOpen
              ? {
                  backgroundColor: theme.signalHighFill,
                  color: theme.signalHigh,
                  borderColor: theme.signalHigh,
                }
              : {
                  backgroundColor: theme.bgPanelSubtle,
                  borderColor: theme.borderSubtle,
                  color: theme.textSecondary,
                }
          }
        >
          <Table className="w-3.5 h-3.5" />
          <span>Truth Table</span>
        </button>

        {/* Timing Diagram / Waveform Toggle */}
        <button
          onClick={onToggleTimingDiagram}
          title="Toggle Timing Waveform Diagram"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border"
          style={
            isTimingDiagramOpen
              ? {
                  backgroundColor: theme.signalHighFill,
                  color: theme.signalHigh,
                  borderColor: theme.signalHigh,
                }
              : {
                  backgroundColor: theme.bgPanelSubtle,
                  borderColor: theme.borderSubtle,
                  color: theme.textSecondary,
                }
          }
        >
          <LineChart className="w-3.5 h-3.5" />
          <span>Waveforms</span>
        </button>

        <div className="h-5 w-px" style={{ backgroundColor: theme.borderPanel }} />

        {/* JSON Export / Import */}
        <button
          onClick={onExportJson}
          title="Export Circuit JSON"
          className="p-1.5 rounded border transition-colors hover:brightness-125"
          style={{
            backgroundColor: theme.bgPanelSubtle,
            borderColor: theme.borderSubtle,
            color: theme.textSecondary,
          }}
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import Circuit JSON"
          className="p-1.5 rounded border transition-colors hover:brightness-125"
          style={{
            backgroundColor: theme.bgPanelSubtle,
            borderColor: theme.borderSubtle,
            color: theme.textSecondary,
          }}
        >
          <Upload className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-px" style={{ backgroundColor: theme.borderPanel }} />

        {/* Zoom Controls */}
        <div
          className="flex items-center gap-1 border rounded-md p-0.5"
          style={{
            backgroundColor: theme.bgPanelSubtle,
            borderColor: theme.borderSubtle,
          }}
        >
          <button
            onClick={onZoomOut}
            title="Zoom Out"
            className="p-1 rounded text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            title="Reset Zoom (100%)"
            className="px-1.5 py-0.5 text-[11px] font-mono hover:bg-white/5 rounded transition-colors"
            style={{ color: theme.textPrimary }}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            title="Zoom In"
            className="p-1 rounded text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
