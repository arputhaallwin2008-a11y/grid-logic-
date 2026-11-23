import React from 'react';
import { CircuitComponent, SignalValue, PinDefinition } from '../../types/circuit';
import { useTheme } from '../../context/ThemeContext';

interface ComponentNodeProps {
  component: CircuitComponent;
  pinValues: Record<string, SignalValue>;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onStartDrag: (e: React.MouseEvent) => void;
  onToggleSwitch?: () => void;
  onPinMouseDown: (pin: PinDefinition, e: React.MouseEvent) => void;
  onPinMouseUp: (pin: PinDefinition, e: React.MouseEvent) => void;
}

export const ComponentNode: React.FC<ComponentNodeProps> = ({
  component,
  pinValues,
  isSelected,
  onSelect,
  onStartDrag,
  onToggleSwitch,
  onPinMouseDown,
  onPinMouseUp,
}) => {
  const { theme } = useTheme();
  const { id, type, label, x, y, width, height, inputs, outputs, state } = component;

  const gateBorder = isSelected ? theme.gateBorderSelected : theme.gateBorder;
  const gateFill = theme.gateBody;

  // Render gate schematic shapes
  const renderGateGraphic = () => {
    switch (type) {
      case 'AND':
        return (
          <path
            d="M 20 12 L 48 12 A 18 18 0 0 1 48 48 L 20 48 Z"
            fill={gateFill}
            stroke={gateBorder}
            strokeWidth={2}
          />
        );

      case 'OR':
        return (
          <path
            d="M 18 12 Q 32 30 18 48 Q 45 46 72 30 Q 45 14 18 12 Z"
            fill={gateFill}
            stroke={gateBorder}
            strokeWidth={2}
          />
        );

      case 'NOT':
        return (
          <g>
            <path
              d="M 20 12 L 58 25 L 20 38 Z"
              fill={gateFill}
              stroke={gateBorder}
              strokeWidth={2}
            />
            <circle
              cx={63}
              cy={25}
              r={4}
              fill={theme.bgWorkspace}
              stroke={gateBorder}
              strokeWidth={1.8}
            />
          </g>
        );

      case 'XOR':
        return (
          <g>
            <path
              d="M 14 12 Q 28 30 14 48"
              fill="none"
              stroke={gateBorder}
              strokeWidth={2}
            />
            <path
              d="M 22 12 Q 34 30 22 48 Q 47 46 74 30 Q 47 14 22 12 Z"
              fill={gateFill}
              stroke={gateBorder}
              strokeWidth={2}
            />
          </g>
        );

      case 'NAND':
        return (
          <g>
            <path
              d="M 18 12 L 48 12 A 18 18 0 0 1 48 48 L 18 48 Z"
              fill={gateFill}
              stroke={gateBorder}
              strokeWidth={2}
            />
            <circle
              cx={71}
              cy={30}
              r={4}
              fill={theme.bgWorkspace}
              stroke={gateBorder}
              strokeWidth={1.8}
            />
          </g>
        );

      case 'NOR':
        return (
          <g>
            <path
              d="M 16 12 Q 30 30 16 48 Q 43 46 70 30 Q 43 14 16 12 Z"
              fill={gateFill}
              stroke={gateBorder}
              strokeWidth={2}
            />
            <circle
              cx={75}
              cy={30}
              r={4}
              fill={theme.bgWorkspace}
              stroke={gateBorder}
              strokeWidth={1.8}
            />
          </g>
        );

      case 'SWITCH': {
        const val = state.value ?? 0;
        return (
          <g
            className="cursor-pointer"
            onClick={e => {
              e.stopPropagation();
              onToggleSwitch?.();
            }}
          >
            {/* Switch housing */}
            <rect
              x={6}
              y={6}
              width={54}
              height={38}
              rx={6}
              fill={val === 1 ? theme.signalHighFill : theme.bgPanelSubtle}
              stroke={val === 1 ? theme.signalHigh : isSelected ? theme.gateBorderSelected : theme.borderPanel}
              strokeWidth={val === 1 ? 2 : 1.5}
            />
            {/* Toggle lever */}
            <rect
              x={val === 1 ? 34 : 10}
              y={10}
              width={22}
              height={30}
              rx={4}
              fill={val === 1 ? theme.signalHigh : theme.signalLow}
              className="transition-all duration-150"
            />
            <text
              x={val === 1 ? 45 : 21}
              y={29}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="12"
              fontWeight="bold"
              fontFamily="monospace"
              pointerEvents="none"
            >
              {val}
            </text>
          </g>
        );
      }

      case 'CLOCK': {
        const val = state.value ?? 0;
        return (
          <g>
            <rect
              x={6}
              y={6}
              width={54}
              height={38}
              rx={6}
              fill={theme.bgPanelSubtle}
              stroke={val === 1 ? theme.clockColor : isSelected ? theme.gateBorderSelected : theme.borderPanel}
              strokeWidth={1.5}
            />
            {/* Clock square wave icon */}
            <path
              d="M 16 32 L 24 32 L 24 18 L 36 18 L 36 32 L 48 32"
              fill="none"
              stroke={val === 1 ? theme.clockColor : theme.signalLow}
              strokeWidth={2}
            />
            {/* Status dot */}
            <circle
              cx={52}
              cy={12}
              r={3.5}
              fill={val === 1 ? theme.clockColor : theme.bgWorkspace}
              stroke={val === 1 ? '#ffffff' : theme.signalLow}
              strokeWidth={1}
            />
          </g>
        );
      }

      case 'LED': {
        const val = state.value ?? 0;
        const color = (state.customColor as string) || theme.signalHigh;
        return (
          <g>
            {/* LED Bezel */}
            <circle
              cx={46}
              cy={25}
              r={18}
              fill={theme.bgPanel}
              stroke={isSelected ? theme.gateBorderSelected : theme.borderPanel}
              strokeWidth={2}
            />
            {/* Glowing Diode Lens */}
            <circle
              cx={46}
              cy={25}
              r={14}
              fill={val === 1 ? color : theme.bgPanelSubtle}
              style={{
                filter: val === 1 ? `drop-shadow(0 0 10px ${color})` : 'none',
              }}
              stroke={val === 1 ? '#ffffff' : theme.borderPanel}
              strokeWidth={1}
            />
            {/* Lens Reflection highlight */}
            <ellipse
              cx={43}
              cy={21}
              rx={6}
              ry={3}
              fill={val === 1 ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.15)'}
            />
            {/* Logic value display */}
            <text
              x={46}
              y={29}
              textAnchor="middle"
              fill={val === 1 ? '#ffffff' : theme.textMuted}
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
              pointerEvents="none"
            >
              {val}
            </text>
          </g>
        );
      }

      case 'VCC': {
        return (
          <g>
            <rect
              x={4}
              y={4}
              width={50}
              height={34}
              rx={4}
              fill={theme.bgPanelSubtle}
              stroke={isSelected ? theme.gateBorderSelected : '#ef4444'}
              strokeWidth={1.5}
            />
            <text
              x={29}
              y={24}
              textAnchor="middle"
              fill="#f87171"
              fontSize="12"
              fontWeight="bold"
              fontFamily="monospace"
            >
              +1 (VCC)
            </text>
          </g>
        );
      }

      case 'GND': {
        return (
          <g>
            <rect
              x={4}
              y={4}
              width={50}
              height={34}
              rx={4}
              fill={theme.bgPanelSubtle}
              stroke={isSelected ? theme.gateBorderSelected : theme.borderPanel}
              strokeWidth={1.5}
            />
            <path
              d="M 16 16 L 42 16 M 21 22 L 37 22 M 26 28 L 32 28"
              stroke={theme.textSecondary}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        );
      }

      case 'SR_FF':
      case 'D_FF': {
        const isD = type === 'D_FF';
        return (
          <g>
            <rect
              x={10}
              y={8}
              width={width - 20}
              height={height - 16}
              rx={6}
              fill={gateFill}
              stroke={gateBorder}
              strokeWidth={2}
            />
            {/* Clock triangle if D flip flop */}
            {isD && (
              <path
                d="M 12 50 L 22 56 L 12 62"
                fill="none"
                stroke={theme.textSecondary}
                strokeWidth={1.8}
              />
            )}
            {/* Center label */}
            <text
              x={width / 2}
              y={height / 2 + 3}
              textAnchor="middle"
              fill={theme.textSecondary}
              fontSize="11"
              fontWeight="600"
              fontFamily="monospace"
            >
              {isD ? 'D-FF' : 'SR-FF'}
            </text>
          </g>
        );
      }

      case 'MUX_2_1': {
        return (
          <g>
            {/* Trapezoid MUX symbol */}
            <path
              d={`M 14 10 L ${width - 14} 20 L ${width - 14} ${height - 20} L 14 ${height - 10} Z`}
              fill={gateFill}
              stroke={gateBorder}
              strokeWidth={2}
            />
            <text
              x={width / 2}
              y={height / 2 + 2}
              textAnchor="middle"
              fill={theme.textSecondary}
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
            >
              MUX
            </text>
          </g>
        );
      }

      default:
        return (
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={4}
            fill={gateFill}
            stroke={gateBorder}
          />
        );
    }
  };

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-move select-none"
      onClick={onSelect}
      onMouseDown={onStartDrag}
    >
      {/* Component Title / Label */}
      <text
        x={width / 2}
        y={-6}
        textAnchor="middle"
        fill={theme.textSecondary}
        fontSize="11"
        fontWeight="500"
        fontFamily="sans-serif"
        className="pointer-events-none"
      >
        {label}
      </text>

      {/* Selection outline */}
      {isSelected && (
        <rect
          x={-5}
          y={-5}
          width={width + 10}
          height={height + 10}
          rx={8}
          fill="none"
          stroke={theme.signalActive}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          pointerEvents="none"
        />
      )}

      {/* Render the gate visual */}
      {renderGateGraphic()}

      {/* Render Input Pins */}
      {inputs.map(pin => {
        const pinKey = `${id}:${pin.id}`;
        const val: SignalValue = pinValues[pinKey] ?? 0;
        const isHigh = val === 1;

        return (
          <g
            key={pin.id}
            transform={`translate(${pin.x}, ${pin.y})`}
            className="cursor-crosshair group"
            onMouseDown={e => {
              e.stopPropagation();
              onPinMouseDown(pin, e);
            }}
            onMouseUp={e => {
              e.stopPropagation();
              onPinMouseUp(pin, e);
            }}
          >
            {/* Terminal stub line */}
            <line
              x1={0}
              y1={0}
              x2={type === 'MUX_2_1' && pin.id === 'in-2' ? 0 : 8}
              y2={type === 'MUX_2_1' && pin.id === 'in-2' ? -8 : 0}
              stroke={isHigh ? theme.signalHigh : theme.signalLow}
              strokeWidth={2}
            />

            {/* Hit area */}
            <circle r={9} fill="transparent" />

            {/* Pin terminal connector circle */}
            <circle
              r={4}
              fill={isHigh ? theme.signalHigh : theme.bgWorkspace}
              stroke={isHigh ? theme.signalHigh : theme.borderSubtle}
              strokeWidth={1.5}
              style={{
                filter: isHigh ? `drop-shadow(0 0 4px ${theme.signalHigh})` : 'none',
              }}
              className="group-hover:scale-125 transition-transform"
            />

            {/* Pin label */}
            {pin.label && (
              <text
                x={type === 'MUX_2_1' && pin.id === 'in-2' ? 0 : 10}
                y={type === 'MUX_2_1' && pin.id === 'in-2' ? -12 : 3}
                textAnchor={type === 'MUX_2_1' && pin.id === 'in-2' ? 'middle' : 'start'}
                fill={theme.textSecondary}
                fontSize="9"
                fontFamily="monospace"
                fontWeight="600"
                pointerEvents="none"
              >
                {pin.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Render Output Pins */}
      {outputs.map(pin => {
        const pinKey = `${id}:${pin.id}`;
        const val: SignalValue = pinValues[pinKey] ?? 0;
        const isHigh = val === 1;

        return (
          <g
            key={pin.id}
            transform={`translate(${pin.x}, ${pin.y})`}
            className="cursor-crosshair group"
            onMouseDown={e => {
              e.stopPropagation();
              onPinMouseDown(pin, e);
            }}
            onMouseUp={e => {
              e.stopPropagation();
              onPinMouseUp(pin, e);
            }}
          >
            {/* Terminal stub line */}
            <line
              x1={0}
              y1={0}
              x2={-8}
              y2={0}
              stroke={isHigh ? theme.signalHigh : theme.signalLow}
              strokeWidth={2}
            />

            {/* Hit area */}
            <circle r={9} fill="transparent" />

            {/* Pin terminal connector circle */}
            <circle
              r={4}
              fill={isHigh ? theme.signalHigh : theme.bgWorkspace}
              stroke={isHigh ? theme.signalHigh : theme.borderSubtle}
              strokeWidth={1.5}
              style={{
                filter: isHigh ? `drop-shadow(0 0 4px ${theme.signalHigh})` : 'none',
              }}
              className="group-hover:scale-125 transition-transform"
            />

            {/* Pin label */}
            {pin.label && (
              <text
                x={-10}
                y={3}
                textAnchor="end"
                fill={theme.textSecondary}
                fontSize="9"
                fontFamily="monospace"
                fontWeight="600"
                pointerEvents="none"
              >
                {pin.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};
