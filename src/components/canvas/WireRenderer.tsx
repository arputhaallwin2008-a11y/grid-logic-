import React from 'react';
import { Wire, SignalValue } from '../../types/circuit';
import { useTheme } from '../../context/ThemeContext';

interface WireRendererProps {
  wire: Wire;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  value: SignalValue;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
}

export const WireRenderer: React.FC<WireRendererProps> = ({
  startX,
  startY,
  endX,
  endY,
  value,
  isSelected,
  onSelect,
}) => {
  const { theme } = useTheme();

  // Compute smooth cubic Bezier path
  const dx = endX - startX;
  const curvature = Math.max(36, Math.abs(dx) * 0.55);

  const cp1X = startX + curvature;
  const cp1Y = startY;
  const cp2X = endX - curvature;
  const cp2Y = endY;

  const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

  // Middle point for label or indicator if needed
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  const isHigh = value === 1;

  return (
    <g className="cursor-pointer group">
      {/* Invisible fat hit area for easy clicking */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        onClick={onSelect}
      />

      {/* Outer halo when selected or high */}
      {isSelected && (
        <path
          d={pathData}
          fill="none"
          stroke={theme.signalActive}
          strokeWidth={6}
          strokeOpacity={0.4}
        />
      )}

      {isHigh && (
        <path
          d={pathData}
          fill="none"
          stroke={theme.signalHigh}
          strokeWidth={6}
          strokeOpacity={0.3}
          style={{ filter: `drop-shadow(0 0 6px ${theme.signalHigh})` }}
        />
      )}

      {/* Core wire path */}
      <path
        d={pathData}
        fill="none"
        stroke={isSelected ? theme.signalActive : isHigh ? theme.signalHigh : theme.signalLow}
        strokeWidth={isSelected ? 3 : isHigh ? 2.5 : 2}
        strokeLinecap="round"
        onClick={onSelect}
      />

      {/* Signal flow animation when logic 1 */}
      {isHigh && (
        <path
          d={pathData}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.5}
          className="wire-animated-flow opacity-70"
          pointerEvents="none"
        />
      )}

      {/* Center signal badge on hover or selection */}
      {isSelected && (
        <g transform={`translate(${midX}, ${midY})`} pointerEvents="none">
          <circle r={9} fill={theme.bgPanel} stroke={theme.signalActive} strokeWidth={1.5} />
          <text
            y={3}
            textAnchor="middle"
            fill={theme.signalActive}
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {value}
          </text>
        </g>
      )}
    </g>
  );
};
