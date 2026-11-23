import { CircuitComponent, SignalValue } from '../types/circuit';

export interface ComponentEvaluationResult {
  outputs: Record<string, SignalValue>; // pinName -> value
  nextState?: Record<string, unknown>;
}

/**
 * Pure evaluator for a single component.
 * @param component The component definition and state
 * @param inputValues Pin name to incoming signal value (defaults to 0 if unconnected)
 */
export function evaluateComponent(
  component: CircuitComponent,
  inputValues: Record<string, SignalValue>
): ComponentEvaluationResult {
  const getIn = (name: string, fallback: SignalValue = 0): SignalValue => {
    return inputValues[name] !== undefined ? inputValues[name] : fallback;
  };

  switch (component.type) {
    case 'SWITCH': {
      const val = (component.state.value ?? 0) as SignalValue;
      return {
        outputs: { OUT: val },
        nextState: { ...component.state, value: val },
      };
    }

    case 'CLOCK': {
      const val = (component.state.value ?? 0) as SignalValue;
      return {
        outputs: { CLK: val },
        nextState: { ...component.state, value: val },
      };
    }

    case 'VCC': {
      return {
        outputs: { VCC: 1 },
      };
    }

    case 'GND': {
      return {
        outputs: { GND: 0 },
      };
    }

    case 'LED': {
      const val = getIn('IN', 0);
      return {
        outputs: {},
        nextState: { ...component.state, value: val },
      };
    }

    case 'AND': {
      const a = getIn('A');
      const b = getIn('B');
      const out: SignalValue = a === 1 && b === 1 ? 1 : 0;
      return { outputs: { OUT: out } };
    }

    case 'OR': {
      const a = getIn('A');
      const b = getIn('B');
      const out: SignalValue = a === 1 || b === 1 ? 1 : 0;
      return { outputs: { OUT: out } };
    }

    case 'NOT': {
      const inVal = getIn('IN');
      const out: SignalValue = inVal === 1 ? 0 : 1;
      return { outputs: { OUT: out } };
    }

    case 'XOR': {
      const a = getIn('A');
      const b = getIn('B');
      const out: SignalValue = a !== b ? 1 : 0;
      return { outputs: { OUT: out } };
    }

    case 'NAND': {
      const a = getIn('A');
      const b = getIn('B');
      const out: SignalValue = a === 1 && b === 1 ? 0 : 1;
      return { outputs: { OUT: out } };
    }

    case 'NOR': {
      const a = getIn('A');
      const b = getIn('B');
      const out: SignalValue = a === 0 && b === 0 ? 1 : 0;
      return { outputs: { OUT: out } };
    }

    case 'SR_FF': {
      const s = getIn('S');
      const r = getIn('R');
      const currentQ = (component.state.q ?? 0) as SignalValue;
      let nextQ: SignalValue = currentQ;
      let nextQBar: SignalValue = ((component.state.qBar ?? (currentQ === 1 ? 0 : 1)) as SignalValue);

      if (s === 1 && r === 0) {
        // Set
        nextQ = 1;
        nextQBar = 0;
      } else if (s === 0 && r === 1) {
        // Reset
        nextQ = 0;
        nextQBar = 1;
      } else if (s === 1 && r === 1) {
        // Invalid condition
        nextQ = 0;
        nextQBar = 0;
      } else {
        // S=0, R=0: hold state
        nextQBar = nextQ === 1 ? 0 : 1;
      }

      return {
        outputs: { Q: nextQ, QBAR: nextQBar },
        nextState: { ...component.state, q: nextQ, qBar: nextQBar },
      };
    }

    case 'D_FF': {
      const d = getIn('D');
      const clk = getIn('CLK');
      const prevClock = (component.state.prevClock ?? 0) as SignalValue;
      let currentQ = (component.state.q ?? 0) as SignalValue;
      let currentQBar = (component.state.qBar ?? (currentQ === 1 ? 0 : 1)) as SignalValue;

      // Positive edge detection: CLK transition from 0 to 1
      if (prevClock === 0 && clk === 1) {
        currentQ = d;
        currentQBar = d === 1 ? 0 : 1;
      }

      return {
        outputs: { Q: currentQ, QBAR: currentQBar },
        nextState: { ...component.state, q: currentQ, qBar: currentQBar, prevClock: clk },
      };
    }

    case 'MUX_2_1': {
      const d0 = getIn('D0');
      const d1 = getIn('D1');
      const s = getIn('S');
      const out: SignalValue = s === 1 ? d1 : d0;
      return { outputs: { Y: out } };
    }

    default:
      return { outputs: {} };
  }
}
