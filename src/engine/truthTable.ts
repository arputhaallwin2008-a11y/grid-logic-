import { CircuitComponent, Wire, SignalValue } from '../types/circuit';
import { simulateCircuit } from './simulation';

export interface TruthTableColumn {
  id: string;
  label: string;
  type: 'input' | 'output';
  componentId: string;
}

export interface TruthTableRow {
  id: string;
  inputs: Record<string, SignalValue>;   // componentId -> value
  outputs: Record<string, SignalValue>;  // componentId -> value
  isCurrent: boolean;                    // Matches current live state of circuit
}

export interface TruthTableData {
  inputColumns: TruthTableColumn[];
  outputColumns: TruthTableColumn[];
  rows: TruthTableRow[];
  isTooLarge: boolean;
  totalCombinations: number;
}

/**
 * Generates an exhaustive truth table for all Input Switches and Output LEDs.
 */
export function generateTruthTable(
  components: CircuitComponent[],
  wires: Wire[],
  maxInputsLimit: number = 8
): TruthTableData {
  const switchComponents = components.filter(c => c.type === 'SWITCH');
  const ledComponents = components.filter(c => c.type === 'LED');

  const inputColumns: TruthTableColumn[] = switchComponents.map((c, idx) => ({
    id: c.id,
    label: c.label || `In ${idx + 1}`,
    type: 'input',
    componentId: c.id,
  }));

  const outputColumns: TruthTableColumn[] = ledComponents.map((c, idx) => ({
    id: c.id,
    label: c.label || `Out ${idx + 1}`,
    type: 'output',
    componentId: c.id,
  }));

  const n = switchComponents.length;
  const totalCombinations = Math.pow(2, n);

  if (n === 0 || ledComponents.length === 0) {
    return {
      inputColumns,
      outputColumns,
      rows: [],
      isTooLarge: false,
      totalCombinations: 0,
    };
  }

  if (n > maxInputsLimit) {
    return {
      inputColumns,
      outputColumns,
      rows: [],
      isTooLarge: true,
      totalCombinations,
    };
  }

  // Get current active live values to flag the active row
  const currentSwitchValues: Record<string, SignalValue> = {};
  switchComponents.forEach(c => {
    currentSwitchValues[c.id] = (c.state.value ?? 0) as SignalValue;
  });

  const rows: TruthTableRow[] = [];

  for (let i = 0; i < totalCombinations; i++) {
    // Generate binary string padded to length n
    const binaryStr = i.toString(2).padStart(n, '0');
    const inputPermutation: Record<string, SignalValue> = {};

    let isMatchCurrent = true;
    switchComponents.forEach((sw, idx) => {
      const bit = parseInt(binaryStr[idx], 10) as SignalValue;
      inputPermutation[sw.id] = bit;
      if (bit !== currentSwitchValues[sw.id]) {
        isMatchCurrent = false;
      }
    });

    // Create cloned components with overridden switch values
    const clonedComponents: CircuitComponent[] = components.map(c => {
      if (c.type === 'SWITCH') {
        return {
          ...c,
          state: {
            ...c.state,
            value: inputPermutation[c.id],
          },
        };
      }
      return {
        ...c,
        state: { ...c.state },
      };
    });

    // Simulate for this combination
    const simResult = simulateCircuit(clonedComponents, wires);

    // Extract LED outputs
    const outputResults: Record<string, SignalValue> = {};
    ledComponents.forEach(led => {
      const ledState = simResult.componentStates[led.id];
      outputResults[led.id] = (ledState?.value ?? 0) as SignalValue;
    });

    rows.push({
      id: `row-${i}`,
      inputs: inputPermutation,
      outputs: outputResults,
      isCurrent: isMatchCurrent,
    });
  }

  return {
    inputColumns,
    outputColumns,
    rows,
    isTooLarge: false,
    totalCombinations,
  };
}
