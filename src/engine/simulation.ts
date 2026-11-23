import { CircuitComponent, Wire, SignalValue, SimulationResult } from '../types/circuit';
import { evaluateComponent } from './evaluators';

export const MAX_PROPAGATION_ITERATIONS = 50;

/**
 * Propagates logic signals through components and wires iteratively until stable.
 * Protects against infinite oscillations (e.g., feedback inverters or ring oscillators).
 */
export function simulateCircuit(
  components: CircuitComponent[],
  wires: Wire[],
  options?: {
    maxIterations?: number;
    forceClockTick?: boolean;
    clockValue?: SignalValue;
  }
): SimulationResult {
  const maxIterations = options?.maxIterations ?? MAX_PROPAGATION_ITERATIONS;

  // Build lookup maps
  const componentMap = new Map<string, CircuitComponent>();
  components.forEach(c => componentMap.set(c.id, c));

  // Input pin to wire lookup: key is `${targetComponentId}:${targetPinId}`
  const inputToWireMap = new Map<string, Wire>();
  wires.forEach(w => {
    inputToWireMap.set(`${w.toComponentId}:${w.toPinId}`, w);
  });

  // Track state and pin values
  const currentStates: Record<string, CircuitComponent['state']> = {};
  components.forEach(c => {
    currentStates[c.id] = { ...c.state };
  });

  // Override clock state if clockValue is explicitly supplied
  if (options?.clockValue !== undefined) {
    components.forEach(c => {
      if (c.type === 'CLOCK') {
        currentStates[c.id] = { ...currentStates[c.id], value: options.clockValue };
      }
    });
  }

  // Pin values map: `${componentId}:${pinId}` -> SignalValue
  const pinValues: Record<string, SignalValue> = {};
  const wireValues: Record<string, SignalValue> = {};

  // Initialize output pins from current component states / constants
  components.forEach(comp => {
    comp.outputs.forEach(pin => {
      const key = `${comp.id}:${pin.id}`;
      if (comp.type === 'VCC') {
        pinValues[key] = 1;
      } else if (comp.type === 'GND') {
        pinValues[key] = 0;
      } else if (comp.type === 'SWITCH' || comp.type === 'CLOCK') {
        pinValues[key] = (currentStates[comp.id]?.value ?? 0) as SignalValue;
      } else if (comp.type === 'SR_FF' || comp.type === 'D_FF') {
        if (pin.id === 'Q' || pin.name === 'Q') {
          pinValues[key] = (currentStates[comp.id]?.q ?? 0) as SignalValue;
        } else if (pin.id === 'QBAR' || pin.name === 'QBAR' || pin.name === "Q'") {
          pinValues[key] = (currentStates[comp.id]?.qBar ?? 1) as SignalValue;
        } else {
          pinValues[key] = 0;
        }
      } else {
        pinValues[key] = 0;
      }
    });
  });

  let iterations = 0;
  let hasChanged = true;
  let isOscillating = false;

  while (hasChanged && iterations < maxIterations) {
    iterations++;
    hasChanged = false;

    // 1. Propagate output pin values onto wires and target input pins
    wires.forEach(wire => {
      const sourceKey = `${wire.fromComponentId}:${wire.fromPinId}`;
      const srcVal: SignalValue = pinValues[sourceKey] ?? 0;
      wireValues[wire.id] = srcVal;

      const targetKey = `${wire.toComponentId}:${wire.toPinId}`;
      if (pinValues[targetKey] !== srcVal) {
        pinValues[targetKey] = srcVal;
        hasChanged = true;
      }
    });

    // 2. Evaluate each component based on current input values
    for (const comp of components) {
      // Gather inputs for this component
      const inputVals: Record<string, SignalValue> = {};
      comp.inputs.forEach(pin => {
        const pinKey = `${comp.id}:${pin.id}`;
        // If wire connected, read pin value; otherwise default to 0
        const val: SignalValue = pinValues[pinKey] ?? 0;
        inputVals[pin.id] = val;
        inputVals[pin.name] = val;
      });

      const currentCompWithState: CircuitComponent = {
        ...comp,
        state: currentStates[comp.id],
      };

      const evalResult = evaluateComponent(currentCompWithState, inputVals);

      // Check if state changed (e.g., LED or Flip-Flop)
      if (evalResult.nextState) {
        currentStates[comp.id] = evalResult.nextState;
      }

      // Check if outputs changed
      comp.outputs.forEach(pin => {
        const pinKey = `${comp.id}:${pin.id}`;
        const prevVal = pinValues[pinKey];
        const nextVal = (evalResult.outputs[pin.id] ?? evalResult.outputs[pin.name] ?? 0) as SignalValue;

        if (prevVal !== nextVal) {
          pinValues[pinKey] = nextVal;
          hasChanged = true;
        }
      });
    }
  }

  if (iterations >= maxIterations) {
    isOscillating = true;
  }

  // Update wire values after final pass
  wires.forEach(wire => {
    const sourceKey = `${wire.fromComponentId}:${wire.fromPinId}`;
    wireValues[wire.id] = pinValues[sourceKey] ?? 0;
  });

  return {
    pinValues,
    wireValues,
    componentStates: currentStates,
    isOscillating,
    iterationCount: iterations,
  };
}
