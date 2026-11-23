export type SignalValue = 0 | 1;

export type ComponentCategory = 'io' | 'gates' | 'sequential' | 'constants';

export type ComponentType =
  | 'SWITCH'
  | 'CLOCK'
  | 'LED'
  | 'VCC'
  | 'GND'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'XOR'
  | 'NAND'
  | 'NOR'
  | 'SR_FF'
  | 'D_FF'
  | 'MUX_2_1';

export type PinType = 'input' | 'output';

export interface PinDefinition {
  id: string;
  name: string;
  type: PinType;
  /** Relative offset (x, y) from component top-left */
  x: number;
  y: number;
  label?: string;
}

export interface PinState {
  id: string;
  value: SignalValue;
}

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  inputs: PinDefinition[];
  outputs: PinDefinition[];
  /** Internal component state, e.g., switch toggle 0/1, flip-flop Q state */
  state: {
    value?: SignalValue;        // For switch, clock, LED
    q?: SignalValue;            // For flip-flops
    qBar?: SignalValue;         // For flip-flops
    prevClock?: SignalValue;    // For D-FF edge detection
    customColor?: string;       // For LED color customization
    [key: string]: unknown;
  };
}

export interface Wire {
  id: string;
  fromComponentId: string;
  fromPinId: string;
  toComponentId: string;
  toPinId: string;
  value?: SignalValue;
}

export interface CircuitState {
  components: CircuitComponent[];
  wires: Wire[];
  selectedComponentIds: string[];
  selectedWireIds: string[];
}

export interface SimulationResult {
  pinValues: Record<string, SignalValue>; // key: `${componentId}:${pinId}`
  wireValues: Record<string, SignalValue>; // key: wireId
  componentStates: Record<string, CircuitComponent['state']>; // key: componentId
  isOscillating: boolean;
  iterationCount: number;
}

export interface WaveformSample {
  timestamp: number;
  cycle: number;
  signals: Record<string, SignalValue>; // key: componentId (for IO) or `${componentId}:${pinId}`
}

export interface PresetCircuit {
  id: string;
  name: string;
  description: string;
  components: CircuitComponent[];
  wires: Wire[];
}
