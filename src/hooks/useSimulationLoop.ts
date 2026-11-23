import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CircuitComponent, Wire, SignalValue, SimulationResult, WaveformSample } from '../types/circuit';
import { simulateCircuit } from '../engine/simulation';

const MAX_WAVEFORM_SAMPLES = 100;

export function useSimulationLoop(
  components: CircuitComponent[],
  wires: Wire[],
  updateComponentState: (id: string, partial: Record<string, unknown>) => void
) {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [clockFrequency, setClockFrequency] = useState<number>(1); // 1 Hz default (range 0.2 to 10 Hz)
  const [clockState, setClockState] = useState<SignalValue>(0);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [waveformSamples, setWaveformSamples] = useState<WaveformSample[]>([]);

  // Simulation calculation
  const simulationResult: SimulationResult = useMemo(() => {
    return simulateCircuit(components, wires, { clockValue: clockState });
  }, [components, wires, clockState]);

  // Keep a ref of current components and simulation result for sampling
  const componentsRef = useRef(components);
  componentsRef.current = components;
  const simResultRef = useRef(simulationResult);
  simResultRef.current = simulationResult;

  // Record waveform sample helper
  const recordSample = useCallback((currentCycle: number, clkVal: SignalValue) => {
    const currentComponents = componentsRef.current;
    const currentSim = simResultRef.current;

    const signals: Record<string, SignalValue> = {};

    currentComponents.forEach(comp => {
      // For input switches, clocks, LEDs, flip-flops, record their key states
      if (comp.type === 'SWITCH') {
        signals[comp.id] = (comp.state.value ?? 0) as SignalValue;
      } else if (comp.type === 'CLOCK') {
        signals[comp.id] = clkVal;
      } else if (comp.type === 'LED') {
        signals[comp.id] = (currentSim.componentStates[comp.id]?.value ?? 0) as SignalValue;
      } else if (comp.type === 'SR_FF' || comp.type === 'D_FF') {
        signals[`${comp.id}:Q`] = (currentSim.componentStates[comp.id]?.q ?? 0) as SignalValue;
      }
    });

    const newSample: WaveformSample = {
      timestamp: Date.now(),
      cycle: currentCycle,
      signals,
    };

    setWaveformSamples(prev => {
      const next = [...prev, newSample];
      return next.length > MAX_WAVEFORM_SAMPLES ? next.slice(-MAX_WAVEFORM_SAMPLES) : next;
    });
  }, []);

  // Continuous Clock Generator Loop
  useEffect(() => {
    if (!isRunning) return;

    // Period in milliseconds: half period for HIGH, half period for LOW
    // E.g. at 1 Hz, period is 1000ms -> toggle every 500ms
    const halfPeriodMs = Math.max(50, Math.round(500 / clockFrequency));

    const intervalId = window.setInterval(() => {
      setClockState(prev => {
        const nextVal: SignalValue = prev === 1 ? 0 : 1;

        // If transitioning from 0 to 1, increment cycle count
        if (nextVal === 1) {
          setCycleCount(c => {
            const nextCycle = c + 1;
            recordSample(nextCycle, nextVal);
            return nextCycle;
          });
        } else {
          setCycleCount(c => {
            recordSample(c, nextVal);
            return c;
          });
        }

        // Also update any CLOCK components state
        componentsRef.current.forEach(comp => {
          if (comp.type === 'CLOCK') {
            updateComponentState(comp.id, { value: nextVal });
          }
        });

        return nextVal;
      });
    }, halfPeriodMs);

    return () => clearInterval(intervalId);
  }, [isRunning, clockFrequency, recordSample, updateComponentState]);

  // Manual Clock Pulse / Single Step
  const triggerClockPulse = useCallback(() => {
    setClockState(prev => {
      const nextVal: SignalValue = prev === 1 ? 0 : 1;
      const nextCycle = nextVal === 1 ? cycleCount + 1 : cycleCount;
      if (nextVal === 1) setCycleCount(nextCycle);
      recordSample(nextCycle, nextVal);

      componentsRef.current.forEach(comp => {
        if (comp.type === 'CLOCK') {
          updateComponentState(comp.id, { value: nextVal });
        }
      });
      return nextVal;
    });
  }, [cycleCount, recordSample, updateComponentState]);

  // Clear waveform
  const clearWaveform = useCallback(() => {
    setWaveformSamples([]);
    setCycleCount(0);
  }, []);

  return {
    isRunning,
    setIsRunning,
    clockFrequency,
    setClockFrequency,
    clockState,
    cycleCount,
    simulationResult,
    waveformSamples,
    triggerClockPulse,
    clearWaveform,
  };
}
