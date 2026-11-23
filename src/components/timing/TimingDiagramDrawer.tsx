import React, { useRef, useEffect, useState } from 'react';
import { WaveformSample, CircuitComponent } from '../../types/circuit';
import { useTheme } from '../../context/ThemeContext';
import { Play, Pause, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';

interface TimingDiagramDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  samples: WaveformSample[];
  components: CircuitComponent[];
  onClear: () => void;
  isRunning: boolean;
  onToggleRunning: () => void;
}

export const TimingDiagramDrawer: React.FC<TimingDiagramDrawerProps> = ({
  isOpen,
  onClose,
  samples,
  components,
  onClear,
  isRunning,
  onToggleRunning,
}) => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pixelsPerSample, setPixelsPerSample] = useState<number>(24);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Channels to track: CLOCKs, SWITCHes, LEDs, and Flip-Flops
  const channels = React.useMemo(() => {
    const list: { key: string; label: string; color: string; type: string }[] = [];

    // Clocks
    components
      .filter(c => c.type === 'CLOCK')
      .forEach(c => list.push({ key: c.id, label: c.label || 'CLK', color: theme.clockColor, type: 'CLOCK' }));

    // Switches
    components
      .filter(c => c.type === 'SWITCH')
      .forEach(c => list.push({ key: c.id, label: c.label || 'SW', color: theme.signalHigh, type: 'SWITCH' }));

    // LEDs
    components
      .filter(c => c.type === 'LED')
      .forEach(c => list.push({ key: c.id, label: c.label || 'OUT', color: theme.accentColor, type: 'LED' }));

    // Flip-flops
    components
      .filter(c => c.type === 'SR_FF' || c.type === 'D_FF')
      .forEach(c =>
        list.push({
          key: `${c.id}:Q`,
          label: `${c.label || c.type} (Q)`,
          color: theme.signalActive,
          type: 'FF',
        })
      );

    return list;
  }, [components, theme]);

  // Render waveforms onto HTML5 Canvas
  useEffect(() => {
    if (!isOpen || isMinimized) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rowHeight = 44;
    const headerWidth = 140;
    const numChannels = Math.max(1, channels.length);
    const totalHeight = numChannels * rowHeight + 30; // 30px for time axis

    // Compute required width
    const minWidth = (containerRef.current?.clientWidth || 800) - 20;
    const waveformWidth = Math.max(minWidth - headerWidth, samples.length * pixelsPerSample + 50);
    const totalWidth = headerWidth + waveformWidth;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // Background
    ctx.fillStyle = theme.bgWorkspace;
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // Grid lines and time markers
    ctx.strokeStyle = theme.borderPanel;
    ctx.lineWidth = 1;

    // Draw time axis along bottom
    const timeAxisY = numChannels * rowHeight;
    ctx.beginPath();
    ctx.moveTo(headerWidth, timeAxisY);
    ctx.lineTo(totalWidth, timeAxisY);
    ctx.stroke();

    ctx.fillStyle = theme.textMuted;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    // Sample vertical gridlines
    samples.forEach((sample, idx) => {
      const x = headerWidth + idx * pixelsPerSample;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, timeAxisY + 5);
      ctx.stroke();

      if (idx % 2 === 0 || pixelsPerSample >= 24) {
        ctx.fillText(`T${sample.cycle}`, x, timeAxisY + 18);
      }
    });

    // Draw each channel
    channels.forEach((channel, cIdx) => {
      const rowY = cIdx * rowHeight;
      const highY = rowY + 10;
      const lowY = rowY + 34;

      // Channel background horizontal divider
      ctx.strokeStyle = theme.borderPanel;
      ctx.beginPath();
      ctx.moveTo(0, rowY + rowHeight);
      ctx.lineTo(totalWidth, rowY + rowHeight);
      ctx.stroke();

      // Channel header
      ctx.fillStyle = theme.bgPanel;
      ctx.fillRect(0, rowY, headerWidth, rowHeight);
      ctx.strokeStyle = theme.borderPanel;
      ctx.strokeRect(0, rowY, headerWidth, rowHeight);

      // Channel indicator badge
      ctx.fillStyle = channel.color;
      ctx.beginPath();
      ctx.arc(14, rowY + 22, 4, 0, Math.PI * 2);
      ctx.fill();

      // Channel label
      ctx.fillStyle = theme.textPrimary;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(channel.label, 26, rowY + 26);

      // Draw digital step waveform
      if (samples.length > 0) {
        ctx.strokeStyle = channel.color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        samples.forEach((sample, sIdx) => {
          const val = sample.signals[channel.key] ?? 0;
          const currentY = val === 1 ? highY : lowY;
          const currentX = headerWidth + sIdx * pixelsPerSample;

          if (sIdx === 0) {
            ctx.moveTo(currentX, currentY);
          } else {
            const prevVal = samples[sIdx - 1].signals[channel.key] ?? 0;
            const prevY = prevVal === 1 ? highY : lowY;

            // Horizontal step to currentX, then vertical transition
            ctx.lineTo(currentX, prevY);
            if (prevY !== currentY) {
              ctx.lineTo(currentX, currentY);
            }
          }
        });

        // Extend last point slightly
        const lastX = headerWidth + (samples.length - 1) * pixelsPerSample;
        const lastVal = samples[samples.length - 1].signals[channel.key] ?? 0;
        ctx.lineTo(lastX + pixelsPerSample * 0.8, lastVal === 1 ? highY : lowY);
        ctx.stroke();
      }
    });

    // Auto-scroll container to rightmost sample
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [isOpen, isMinimized, samples, channels, pixelsPerSample, theme]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-0 left-64 right-64 border-t z-30 shadow-2xl transition-all duration-200 select-none ${
        isMinimized ? 'h-10' : 'h-64'
      }`}
      style={{
        backgroundColor: theme.bgWorkspace,
        borderColor: theme.borderPanel,
      }}
    >
      {/* Header bar */}
      <div
        className="h-10 px-4 border-b flex items-center justify-between transition-colors"
        style={{
          backgroundColor: theme.bgToolbar,
          borderColor: theme.borderPanel,
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textPrimary }}>
            Logic Analyzer Waveform
          </span>
          <span className="text-[11px] font-mono" style={{ color: theme.textMuted }}>
            {samples.length} Samples recorded
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Play / Pause button */}
          <button
            onClick={onToggleRunning}
            title={isRunning ? 'Pause sampling' : 'Resume sampling'}
            className="p-1 rounded transition-colors hover:brightness-125 border"
            style={{ backgroundColor: theme.bgPanelSubtle, borderColor: theme.borderSubtle, color: theme.textPrimary }}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>

          {/* Clear waveform */}
          <button
            onClick={onClear}
            title="Clear Waveforms"
            className="p-1 rounded transition-colors hover:text-red-400 border"
            style={{ backgroundColor: theme.bgPanelSubtle, borderColor: theme.borderSubtle, color: theme.textMuted }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Time scale slider */}
          <div className="flex items-center gap-1.5 ml-2 text-[11px] font-mono" style={{ color: theme.textSecondary }}>
            <span>Scale:</span>
            <input
              type="range"
              min="12"
              max="48"
              step="4"
              value={pixelsPerSample}
              onChange={e => setPixelsPerSample(parseInt(e.target.value, 10))}
              className="w-16 h-1 rounded cursor-pointer"
              style={{ accentColor: theme.signalHigh }}
            />
          </div>

          <div className="h-4 w-px" style={{ backgroundColor: theme.borderPanel }} />

          {/* Minimize / Expand */}
          <button
            onClick={() => setIsMinimized(prev => !prev)}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-slate-100 transition-colors"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Waveform Canvas View */}
      {!isMinimized && (
        <div
          ref={containerRef}
          className="h-[calc(100%-2.5rem)] overflow-auto p-2"
          style={{ backgroundColor: theme.bgWorkspace }}
        >
          {channels.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs" style={{ color: theme.textMuted }}>
              No observable digital signals (add Switches, Clocks, or LEDs).
            </div>
          ) : (
            <canvas ref={canvasRef} className="block" />
          )}
        </div>
      )}
    </div>
  );
};
