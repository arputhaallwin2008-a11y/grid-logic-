import { PresetCircuit, CircuitComponent, Wire } from '../types/circuit';
import { COMPONENT_METADATA } from './components';

function createComponentHelper(
  id: string,
  type: keyof typeof COMPONENT_METADATA,
  label: string,
  x: number,
  y: number,
  stateOverride?: Record<string, unknown>
): CircuitComponent {
  const meta = COMPONENT_METADATA[type];
  return {
    id,
    type,
    label,
    x,
    y,
    width: meta.defaultWidth,
    height: meta.defaultHeight,
    inputs: meta.inputs.map((pin, idx) => ({ ...pin, id: `in-${idx}` })),
    outputs: meta.outputs.map((pin, idx) => ({ ...pin, id: `out-${idx}` })),
    state: { ...meta.defaultState, ...(stateOverride || {}) },
  };
}

// 1. Half Adder
const halfAdderComponents: CircuitComponent[] = [
  createComponentHelper('ha-sw-a', 'SWITCH', 'Input A', 80, 100, { value: 1 }),
  createComponentHelper('ha-sw-b', 'SWITCH', 'Input B', 80, 220, { value: 0 }),
  createComponentHelper('ha-xor', 'XOR', 'XOR (Sum)', 280, 90),
  createComponentHelper('ha-and', 'AND', 'AND (Carry)', 280, 210),
  createComponentHelper('ha-led-sum', 'LED', 'Sum (S)', 480, 95, { customColor: '#10b981' }),
  createComponentHelper('ha-led-carry', 'LED', 'Carry (C)', 480, 215, { customColor: '#38bdf8' }),
];

const halfAdderWires: Wire[] = [
  // Wire A to XOR input A and AND input A
  { id: 'w-ha-1', fromComponentId: 'ha-sw-a', fromPinId: 'out-0', toComponentId: 'ha-xor', toPinId: 'in-0' },
  { id: 'w-ha-2', fromComponentId: 'ha-sw-a', fromPinId: 'out-0', toComponentId: 'ha-and', toPinId: 'in-0' },
  // Wire B to XOR input B and AND input B
  { id: 'w-ha-3', fromComponentId: 'ha-sw-b', fromPinId: 'out-0', toComponentId: 'ha-xor', toPinId: 'in-1' },
  { id: 'w-ha-4', fromComponentId: 'ha-sw-b', fromPinId: 'out-0', toComponentId: 'ha-and', toPinId: 'in-1' },
  // XOR output to Sum LED
  { id: 'w-ha-5', fromComponentId: 'ha-xor', fromPinId: 'out-0', toComponentId: 'ha-led-sum', toPinId: 'in-0' },
  // AND output to Carry LED
  { id: 'w-ha-6', fromComponentId: 'ha-and', fromPinId: 'out-0', toComponentId: 'ha-led-carry', toPinId: 'in-0' },
];

// 2. Full Adder
const fullAdderComponents: CircuitComponent[] = [
  createComponentHelper('fa-sw-a', 'SWITCH', 'Input A', 60, 60, { value: 1 }),
  createComponentHelper('fa-sw-b', 'SWITCH', 'Input B', 60, 160, { value: 1 }),
  createComponentHelper('fa-sw-cin', 'SWITCH', 'Carry In (Cin)', 60, 280, { value: 0 }),

  createComponentHelper('fa-xor-1', 'XOR', 'XOR 1', 230, 80),
  createComponentHelper('fa-xor-2', 'XOR', 'XOR 2 (Sum)', 420, 100),
  createComponentHelper('fa-and-1', 'AND', 'AND 1', 230, 200),
  createComponentHelper('fa-and-2', 'AND', 'AND 2', 420, 220),
  createComponentHelper('fa-or', 'OR', 'OR (Cout)', 590, 240),

  createComponentHelper('fa-led-sum', 'LED', 'Sum (S)', 620, 105, { customColor: '#10b981' }),
  createComponentHelper('fa-led-cout', 'LED', 'Carry Out (Cout)', 750, 245, { customColor: '#f59e0b' }),
];

const fullAdderWires: Wire[] = [
  // A & B to XOR1
  { id: 'w-fa-1', fromComponentId: 'fa-sw-a', fromPinId: 'out-0', toComponentId: 'fa-xor-1', toPinId: 'in-0' },
  { id: 'w-fa-2', fromComponentId: 'fa-sw-b', fromPinId: 'out-0', toComponentId: 'fa-xor-1', toPinId: 'in-1' },
  // A & B to AND1
  { id: 'w-fa-3', fromComponentId: 'fa-sw-a', fromPinId: 'out-0', toComponentId: 'fa-and-1', toPinId: 'in-0' },
  { id: 'w-fa-4', fromComponentId: 'fa-sw-b', fromPinId: 'out-0', toComponentId: 'fa-and-1', toPinId: 'in-1' },
  // XOR1 out to XOR2 input A and AND2 input A
  { id: 'w-fa-5', fromComponentId: 'fa-xor-1', fromPinId: 'out-0', toComponentId: 'fa-xor-2', toPinId: 'in-0' },
  { id: 'w-fa-6', fromComponentId: 'fa-xor-1', fromPinId: 'out-0', toComponentId: 'fa-and-2', toPinId: 'in-0' },
  // Cin to XOR2 input B and AND2 input B
  { id: 'w-fa-7', fromComponentId: 'fa-sw-cin', fromPinId: 'out-0', toComponentId: 'fa-xor-2', toPinId: 'in-1' },
  { id: 'w-fa-8', fromComponentId: 'fa-sw-cin', fromPinId: 'out-0', toComponentId: 'fa-and-2', toPinId: 'in-1' },
  // XOR2 out to Sum LED
  { id: 'w-fa-9', fromComponentId: 'fa-xor-2', fromPinId: 'out-0', toComponentId: 'fa-led-sum', toPinId: 'in-0' },
  // AND1 and AND2 to OR
  { id: 'w-fa-10', fromComponentId: 'fa-and-1', fromPinId: 'out-0', toComponentId: 'fa-or', toPinId: 'in-0' },
  { id: 'w-fa-11', fromComponentId: 'fa-and-2', fromPinId: 'out-0', toComponentId: 'fa-or', toPinId: 'in-1' },
  // OR out to Cout LED
  { id: 'w-fa-12', fromComponentId: 'fa-or', fromPinId: 'out-0', toComponentId: 'fa-led-cout', toPinId: 'in-0' },
];

// 3. SR Latch
const srLatchComponents: CircuitComponent[] = [
  createComponentHelper('sr-sw-s', 'SWITCH', 'Set (S)', 80, 100, { value: 0 }),
  createComponentHelper('sr-sw-r', 'SWITCH', 'Reset (R)', 80, 220, { value: 0 }),
  createComponentHelper('sr-ff', 'SR_FF', 'SR Flip-Flop', 280, 130),
  createComponentHelper('sr-led-q', 'LED', 'Output Q', 480, 130, { customColor: '#10b981' }),
  createComponentHelper('sr-led-qbar', 'LED', "Output Q'", 480, 190, { customColor: '#ef4444' }),
];

const srLatchWires: Wire[] = [
  { id: 'w-sr-1', fromComponentId: 'sr-sw-s', fromPinId: 'out-0', toComponentId: 'sr-ff', toPinId: 'in-0' },
  { id: 'w-sr-2', fromComponentId: 'sr-sw-r', fromPinId: 'out-0', toComponentId: 'sr-ff', toPinId: 'in-1' },
  { id: 'w-sr-3', fromComponentId: 'sr-ff', fromPinId: 'out-0', toComponentId: 'sr-led-q', toPinId: 'in-0' },
  { id: 'w-sr-4', fromComponentId: 'sr-ff', fromPinId: 'out-1', toComponentId: 'sr-led-qbar', toPinId: 'in-0' },
];

// 4. 2:1 Multiplexer Demo
const muxComponents: CircuitComponent[] = [
  createComponentHelper('mux-sw-d0', 'SWITCH', 'Data 0 (D0)', 80, 70, { value: 1 }),
  createComponentHelper('mux-sw-d1', 'SWITCH', 'Data 1 (D1)', 80, 170, { value: 0 }),
  createComponentHelper('mux-sw-s', 'SWITCH', 'Select (S)', 80, 280, { value: 0 }),
  createComponentHelper('mux-unit', 'MUX_2_1', '2:1 MUX', 290, 110),
  createComponentHelper('mux-led-out', 'LED', 'Selected Output Y', 480, 120, { customColor: '#38bdf8' }),
];

const muxWires: Wire[] = [
  { id: 'w-mux-1', fromComponentId: 'mux-sw-d0', fromPinId: 'out-0', toComponentId: 'mux-unit', toPinId: 'in-0' },
  { id: 'w-mux-2', fromComponentId: 'mux-sw-d1', fromPinId: 'out-0', toComponentId: 'mux-unit', toPinId: 'in-1' },
  { id: 'w-mux-3', fromComponentId: 'mux-sw-s', fromPinId: 'out-0', toComponentId: 'mux-unit', toPinId: 'in-2' },
  { id: 'w-mux-4', fromComponentId: 'mux-unit', fromPinId: 'out-0', toComponentId: 'mux-led-out', toPinId: 'in-0' },
];

// 5. D Flip-Flop Clock Divider / Counter
const clockDividerComponents: CircuitComponent[] = [
  createComponentHelper('cd-clk', 'CLOCK', 'Clock Source', 80, 150, { value: 0 }),
  createComponentHelper('cd-dff', 'D_FF', 'D Flip-Flop', 280, 120),
  createComponentHelper('cd-led-clk', 'LED', 'Clock Monitor', 280, 260, { customColor: '#f59e0b' }),
  createComponentHelper('cd-led-q', 'LED', 'Q (Half-Clock)', 500, 120, { customColor: '#10b981' }),
];

const clockDividerWires: Wire[] = [
  // Clock to D-FF CLK and Clock LED
  { id: 'w-cd-1', fromComponentId: 'cd-clk', fromPinId: 'out-0', toComponentId: 'cd-dff', toPinId: 'in-1' },
  { id: 'w-cd-2', fromComponentId: 'cd-clk', fromPinId: 'out-0', toComponentId: 'cd-led-clk', toPinId: 'in-0' },
  // Q' connected back to D input to toggle on every clock pulse
  { id: 'w-cd-3', fromComponentId: 'cd-dff', fromPinId: 'out-1', toComponentId: 'cd-dff', toPinId: 'in-0' },
  // Q to Output LED
  { id: 'w-cd-4', fromComponentId: 'cd-dff', fromPinId: 'out-0', toComponentId: 'cd-led-q', toPinId: 'in-0' },
];

export const PRESET_CIRCUITS: PresetCircuit[] = [
  {
    id: 'half-adder',
    name: 'Half Adder',
    description: 'Computes sum and carry of 2 binary bits using XOR and AND gates.',
    components: halfAdderComponents,
    wires: halfAdderWires,
  },
  {
    id: 'full-adder',
    name: 'Full Adder (1-Bit)',
    description: 'Cascaded 1-bit binary adder with Carry In and Carry Out.',
    components: fullAdderComponents,
    wires: fullAdderWires,
  },
  {
    id: 'sr-latch',
    name: 'SR Latch / Flip-Flop',
    description: 'Fundamental bistable 1-bit memory element with Set and Reset control.',
    components: srLatchComponents,
    wires: srLatchWires,
  },
  {
    id: 'mux-demo',
    name: '2:1 Multiplexer Demo',
    description: 'Digital data selector switching between D0 and D1 based on Select line S.',
    components: muxComponents,
    wires: muxWires,
  },
  {
    id: 'clock-divider',
    name: 'D Flip-Flop Frequency Divider',
    description: 'Connects inverted output Q\' back to D input to divide clock frequency by 2.',
    components: clockDividerComponents,
    wires: clockDividerWires,
  },
];
