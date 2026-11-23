import { ComponentType, ComponentCategory, PinDefinition } from '../types/circuit';

export interface ComponentMetadata {
  type: ComponentType;
  name: string;
  category: ComponentCategory;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  inputs: Omit<PinDefinition, 'id'>[];
  outputs: Omit<PinDefinition, 'id'>[];
  defaultState: Record<string, unknown>;
}

export const COMPONENT_METADATA: Record<ComponentType, ComponentMetadata> = {
  SWITCH: {
    type: 'SWITCH',
    name: 'Input Switch',
    category: 'io',
    description: 'Toggleable logic input (0 or 1). Click on the switch to toggle.',
    defaultWidth: 80,
    defaultHeight: 50,
    inputs: [],
    outputs: [{ name: 'OUT', type: 'output', x: 80, y: 25, label: 'Q' }],
    defaultState: { value: 0 },
  },
  CLOCK: {
    type: 'CLOCK',
    name: 'Clock Pulse',
    category: 'io',
    description: 'Oscillating square-wave clock generator.',
    defaultWidth: 80,
    defaultHeight: 50,
    inputs: [],
    outputs: [{ name: 'CLK', type: 'output', x: 80, y: 25, label: 'CLK' }],
    defaultState: { value: 0 },
  },
  VCC: {
    type: 'VCC',
    name: 'Constant HIGH (1)',
    category: 'constants',
    description: 'Constant logic level 1 (+VCC).',
    defaultWidth: 64,
    defaultHeight: 44,
    inputs: [],
    outputs: [{ name: 'VCC', type: 'output', x: 64, y: 22, label: '1' }],
    defaultState: { value: 1 },
  },
  GND: {
    type: 'GND',
    name: 'Constant LOW (0)',
    category: 'constants',
    description: 'Constant logic level 0 (GND).',
    defaultWidth: 64,
    defaultHeight: 44,
    inputs: [],
    outputs: [{ name: 'GND', type: 'output', x: 64, y: 22, label: '0' }],
    defaultState: { value: 0 },
  },
  LED: {
    type: 'LED',
    name: 'Output LED',
    category: 'io',
    description: 'Displays signal status. Glows bright when input is HIGH (1).',
    defaultWidth: 80,
    defaultHeight: 50,
    inputs: [{ name: 'IN', type: 'input', x: 0, y: 25, label: 'IN' }],
    outputs: [],
    defaultState: { value: 0, customColor: '#10b981' },
  },
  AND: {
    type: 'AND',
    name: 'AND Gate',
    category: 'gates',
    description: 'Output is 1 if and only if all inputs are 1.',
    defaultWidth: 90,
    defaultHeight: 60,
    inputs: [
      { name: 'A', type: 'input', x: 0, y: 18, label: 'A' },
      { name: 'B', type: 'input', x: 0, y: 42, label: 'B' },
    ],
    outputs: [{ name: 'OUT', type: 'output', x: 90, y: 30, label: 'Q' }],
    defaultState: {},
  },
  OR: {
    type: 'OR',
    name: 'OR Gate',
    category: 'gates',
    description: 'Output is 1 if at least one input is 1.',
    defaultWidth: 90,
    defaultHeight: 60,
    inputs: [
      { name: 'A', type: 'input', x: 0, y: 18, label: 'A' },
      { name: 'B', type: 'input', x: 0, y: 42, label: 'B' },
    ],
    outputs: [{ name: 'OUT', type: 'output', x: 90, y: 30, label: 'Q' }],
    defaultState: {},
  },
  NOT: {
    type: 'NOT',
    name: 'NOT Gate (Inverter)',
    category: 'gates',
    description: 'Inverts the binary input (0 -> 1, 1 -> 0).',
    defaultWidth: 80,
    defaultHeight: 50,
    inputs: [{ name: 'IN', type: 'input', x: 0, y: 25, label: 'A' }],
    outputs: [{ name: 'OUT', type: 'output', x: 80, y: 25, label: 'Q\'' }],
    defaultState: {},
  },
  XOR: {
    type: 'XOR',
    name: 'XOR Gate',
    category: 'gates',
    description: 'Exclusive-OR: output is 1 if inputs are strictly different.',
    defaultWidth: 90,
    defaultHeight: 60,
    inputs: [
      { name: 'A', type: 'input', x: 0, y: 18, label: 'A' },
      { name: 'B', type: 'input', x: 0, y: 42, label: 'B' },
    ],
    outputs: [{ name: 'OUT', type: 'output', x: 90, y: 30, label: 'Q' }],
    defaultState: {},
  },
  NAND: {
    type: 'NAND',
    name: 'NAND Gate',
    category: 'gates',
    description: 'NOT-AND: output is 0 only when all inputs are 1.',
    defaultWidth: 95,
    defaultHeight: 60,
    inputs: [
      { name: 'A', type: 'input', x: 0, y: 18, label: 'A' },
      { name: 'B', type: 'input', x: 0, y: 42, label: 'B' },
    ],
    outputs: [{ name: 'OUT', type: 'output', x: 95, y: 30, label: 'Q' }],
    defaultState: {},
  },
  NOR: {
    type: 'NOR',
    name: 'NOR Gate',
    category: 'gates',
    description: 'NOT-OR: output is 1 only when all inputs are 0.',
    defaultWidth: 95,
    defaultHeight: 60,
    inputs: [
      { name: 'A', type: 'input', x: 0, y: 18, label: 'A' },
      { name: 'B', type: 'input', x: 0, y: 42, label: 'B' },
    ],
    outputs: [{ name: 'OUT', type: 'output', x: 95, y: 30, label: 'Q' }],
    defaultState: {},
  },
  SR_FF: {
    type: 'SR_FF',
    name: 'SR Flip-Flop',
    category: 'sequential',
    description: 'Bistable multivibrator with Set (S) and Reset (R) inputs.',
    defaultWidth: 100,
    defaultHeight: 80,
    inputs: [
      { name: 'S', type: 'input', x: 0, y: 24, label: 'S' },
      { name: 'R', type: 'input', x: 0, y: 56, label: 'R' },
    ],
    outputs: [
      { name: 'Q', type: 'output', x: 100, y: 24, label: 'Q' },
      { name: 'QBAR', type: 'output', x: 100, y: 56, label: 'Q\'' },
    ],
    defaultState: { q: 0, qBar: 1 },
  },
  D_FF: {
    type: 'D_FF',
    name: 'D Flip-Flop',
    category: 'sequential',
    description: 'Data latch that captures D on the rising clock edge (CLK 0->1).',
    defaultWidth: 100,
    defaultHeight: 80,
    inputs: [
      { name: 'D', type: 'input', x: 0, y: 24, label: 'D' },
      { name: 'CLK', type: 'input', x: 0, y: 56, label: '>' },
    ],
    outputs: [
      { name: 'Q', type: 'output', x: 100, y: 24, label: 'Q' },
      { name: 'QBAR', type: 'output', x: 100, y: 56, label: 'Q\'' },
    ],
    defaultState: { q: 0, qBar: 1, prevClock: 0 },
  },
  MUX_2_1: {
    type: 'MUX_2_1',
    name: '2:1 Multiplexer',
    category: 'gates',
    description: 'Selects between D0 (when S=0) and D1 (when S=1).',
    defaultWidth: 90,
    defaultHeight: 80,
    inputs: [
      { name: 'D0', type: 'input', x: 0, y: 20, label: 'D0' },
      { name: 'D1', type: 'input', x: 0, y: 44, label: 'D1' },
      { name: 'S', type: 'input', x: 45, y: 80, label: 'S' },
    ],
    outputs: [{ name: 'Y', type: 'output', x: 90, y: 32, label: 'Y' }],
    defaultState: {},
  },
};
