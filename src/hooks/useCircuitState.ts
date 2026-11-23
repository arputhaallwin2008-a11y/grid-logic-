import { useState, useCallback, useRef } from 'react';
import { CircuitComponent, Wire, ComponentType, SignalValue, PresetCircuit } from '../types/circuit';
import { COMPONENT_METADATA } from '../constants/components';
import { PRESET_CIRCUITS } from '../constants/presets';

export interface WireDraft {
  fromComponentId: string;
  fromPinId: string;
  fromPinType: 'input' | 'output';
  currentX: number;
  currentY: number;
}

interface CircuitSnapshot {
  components: CircuitComponent[];
  wires: Wire[];
}

export function useCircuitState(initialPresetId: string = 'half-adder') {
  const initialPreset = PRESET_CIRCUITS.find(p => p.id === initialPresetId) || PRESET_CIRCUITS[0];

  const [components, setComponents] = useState<CircuitComponent[]>(() =>
    JSON.parse(JSON.stringify(initialPreset.components))
  );
  const [wires, setWires] = useState<Wire[]>(() =>
    JSON.parse(JSON.stringify(initialPreset.wires))
  );

  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [selectedWireIds, setSelectedWireIds] = useState<string[]>([]);
  const [wireDraft, setWireDraft] = useState<WireDraft | null>(null);

  // Pan & Zoom
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 60, y: 40 });
  const [zoom, setZoom] = useState<number>(1.0);

  // Undo / Redo History
  const historyRef = useRef<{ past: CircuitSnapshot[]; future: CircuitSnapshot[] }>({
    past: [],
    future: [],
  });

  const recordHistory = useCallback(() => {
    historyRef.current.past.push({
      components: JSON.parse(JSON.stringify(components)),
      wires: JSON.parse(JSON.stringify(wires)),
    });
    // Limit history stack size to 50
    if (historyRef.current.past.length > 50) {
      historyRef.current.past.shift();
    }
    historyRef.current.future = [];
  }, [components, wires]);

  const undo = useCallback(() => {
    if (historyRef.current.past.length === 0) return;
    const previous = historyRef.current.past.pop()!;
    historyRef.current.future.push({
      components: JSON.parse(JSON.stringify(components)),
      wires: JSON.parse(JSON.stringify(wires)),
    });
    setComponents(previous.components);
    setWires(previous.wires);
    setSelectedComponentIds([]);
    setSelectedWireIds([]);
  }, [components, wires]);

  const redo = useCallback(() => {
    if (historyRef.current.future.length === 0) return;
    const next = historyRef.current.future.pop()!;
    historyRef.current.past.push({
      components: JSON.parse(JSON.stringify(components)),
      wires: JSON.parse(JSON.stringify(wires)),
    });
    setComponents(next.components);
    setWires(next.wires);
    setSelectedComponentIds([]);
    setSelectedWireIds([]);
  }, [components, wires]);

  // Add Component
  const addComponent = useCallback(
    (type: ComponentType, x: number, y: number, labelOverride?: string) => {
      recordHistory();
      const meta = COMPONENT_METADATA[type];
      const newId = `${type.toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const newComp: CircuitComponent = {
        id: newId,
        type,
        label: labelOverride || meta.name,
        x: Math.round(x / 16) * 16, // 16px snap
        y: Math.round(y / 16) * 16,
        width: meta.defaultWidth,
        height: meta.defaultHeight,
        inputs: meta.inputs.map((pin, idx) => ({ ...pin, id: `in-${idx}` })),
        outputs: meta.outputs.map((pin, idx) => ({ ...pin, id: `out-${idx}` })),
        state: JSON.parse(JSON.stringify(meta.defaultState)),
      };

      setComponents(prev => [...prev, newComp]);
      setSelectedComponentIds([newId]);
      setSelectedWireIds([]);
      return newComp;
    },
    [recordHistory]
  );

  // Update component positions
  const updateComponentPositions = useCallback(
    (updates: { id: string; x: number; y: number }[], shouldRecord: boolean = false) => {
      if (shouldRecord) recordHistory();
      setComponents(prev =>
        prev.map(c => {
          const u = updates.find(item => item.id === c.id);
          if (u) {
            return {
              ...c,
              x: Math.round(u.x / 8) * 8,
              y: Math.round(u.y / 8) * 8,
            };
          }
          return c;
        })
      );
    },
    [recordHistory]
  );

  // Toggle Switch
  const toggleSwitch = useCallback((id: string) => {
    setComponents(prev =>
      prev.map(c => {
        if (c.id === id && c.type === 'SWITCH') {
          const currentVal = (c.state.value ?? 0) as SignalValue;
          return {
            ...c,
            state: {
              ...c.state,
              value: currentVal === 1 ? 0 : 1,
            },
          };
        }
        return c;
      })
    );
  }, []);

  // Set Component internal state directly
  const updateComponentState = useCallback(
    (id: string, partialState: Record<string, unknown>) => {
      setComponents(prev =>
        prev.map(c => {
          if (c.id === id) {
            return {
              ...c,
              state: {
                ...c.state,
                ...partialState,
              },
            };
          }
          return c;
        })
      );
    },
    []
  );

  // Update component label
  const updateComponentLabel = useCallback(
    (id: string, label: string) => {
      recordHistory();
      setComponents(prev =>
        prev.map(c => (c.id === id ? { ...c, label } : c))
      );
    },
    [recordHistory]
  );

  // Wiring
  const startWire = useCallback(
    (componentId: string, pinId: string, pinType: 'input' | 'output', initialX: number, initialY: number) => {
      setWireDraft({
        fromComponentId: componentId,
        fromPinId: pinId,
        fromPinType: pinType,
        currentX: initialX,
        currentY: initialY,
      });
    },
    []
  );

  const updateWireDraftPosition = useCallback((x: number, y: number) => {
    setWireDraft(prev => (prev ? { ...prev, currentX: x, currentY: y } : null));
  }, []);

  const cancelWire = useCallback(() => {
    setWireDraft(null);
  }, []);

  const completeWire = useCallback(
    (targetComponentId: string, targetPinId: string, targetPinType: 'input' | 'output') => {
      if (!wireDraft) return;

      // Disallow connecting same pin type (must connect output to input)
      if (wireDraft.fromPinType === targetPinType) {
        setWireDraft(null);
        return;
      }

      // Determine true source (output) and target (input)
      const isDraftSource = wireDraft.fromPinType === 'output';
      const sourceCompId = isDraftSource ? wireDraft.fromComponentId : targetComponentId;
      const sourcePinId = isDraftSource ? wireDraft.fromPinId : targetPinId;
      const destCompId = isDraftSource ? targetComponentId : wireDraft.fromComponentId;
      const destPinId = isDraftSource ? targetPinId : wireDraft.fromPinId;

      // Avoid connecting component to itself on the same pin
      if (sourceCompId === destCompId && sourcePinId === destPinId) {
        setWireDraft(null);
        return;
      }

      recordHistory();

      // Check if an existing wire already connects to this destination input pin
      // Standard electronics: only 1 wire per input pin
      setWires(prev => {
        const filtered = prev.filter(
          w => !(w.toComponentId === destCompId && w.toPinId === destPinId)
        );
        const newWire: Wire = {
          id: `w-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          fromComponentId: sourceCompId,
          fromPinId: sourcePinId,
          toComponentId: destCompId,
          toPinId: destPinId,
          value: 0,
        };
        return [...filtered, newWire];
      });

      setWireDraft(null);
    },
    [wireDraft, recordHistory]
  );

  // Selection
  const selectComponent = useCallback((id: string, multi: boolean = false) => {
    setSelectedComponentIds(prev => {
      if (multi) {
        return prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      }
      return [id];
    });
    if (!multi) setSelectedWireIds([]);
  }, []);

  const selectWire = useCallback((id: string, multi: boolean = false) => {
    setSelectedWireIds(prev => {
      if (multi) {
        return prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      }
      return [id];
    });
    if (!multi) setSelectedComponentIds([]);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedComponentIds(components.map(c => c.id));
    setSelectedWireIds(wires.map(w => w.id));
  }, [components, wires]);

  const clearSelection = useCallback(() => {
    setSelectedComponentIds([]);
    setSelectedWireIds([]);
  }, []);

  // Delete
  const deleteSelected = useCallback(() => {
    if (selectedComponentIds.length === 0 && selectedWireIds.length === 0) return;
    recordHistory();

    setComponents(prev => prev.filter(c => !selectedComponentIds.includes(c.id)));
    setWires(prev =>
      prev.filter(
        w =>
          !selectedWireIds.includes(w.id) &&
          !selectedComponentIds.includes(w.fromComponentId) &&
          !selectedComponentIds.includes(w.toComponentId)
      )
    );
    setSelectedComponentIds([]);
    setSelectedWireIds([]);
  }, [selectedComponentIds, selectedWireIds, recordHistory]);

  // Duplicate Selected
  const duplicateSelected = useCallback(() => {
    if (selectedComponentIds.length === 0) return;
    recordHistory();

    const idMap = new Map<string, string>();
    const newComps: CircuitComponent[] = [];

    components
      .filter(c => selectedComponentIds.includes(c.id))
      .forEach(c => {
        const newId = `${c.type.toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        idMap.set(c.id, newId);
        newComps.push({
          ...JSON.parse(JSON.stringify(c)),
          id: newId,
          x: c.x + 32,
          y: c.y + 32,
          label: `${c.label} (Copy)`,
        });
      });

    // Also duplicate internal wires between selected components
    const newWires: Wire[] = [];
    wires.forEach(w => {
      if (idMap.has(w.fromComponentId) && idMap.has(w.toComponentId)) {
        newWires.push({
          id: `w-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          fromComponentId: idMap.get(w.fromComponentId)!,
          fromPinId: w.fromPinId,
          toComponentId: idMap.get(w.toComponentId)!,
          toPinId: w.toPinId,
          value: 0,
        });
      }
    });

    setComponents(prev => [...prev, ...newComps]);
    setWires(prev => [...prev, ...newWires]);
    setSelectedComponentIds(newComps.map(c => c.id));
    setSelectedWireIds(newWires.map(w => w.id));
  }, [components, wires, selectedComponentIds, recordHistory]);

  // Load Preset
  const loadPreset = useCallback(
    (preset: PresetCircuit) => {
      recordHistory();
      setComponents(JSON.parse(JSON.stringify(preset.components)));
      setWires(JSON.parse(JSON.stringify(preset.wires)));
      setSelectedComponentIds([]);
      setSelectedWireIds([]);
      setPan({ x: 60, y: 40 });
      setZoom(1.0);
    },
    [recordHistory]
  );

  // Clear Canvas
  const clearCircuit = useCallback(() => {
    recordHistory();
    setComponents([]);
    setWires([]);
    setSelectedComponentIds([]);
    setSelectedWireIds([]);
  }, [recordHistory]);

  // Export / Import
  const exportCircuitJson = useCallback(() => {
    return JSON.stringify(
      {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        components,
        wires,
      },
      null,
      2
    );
  }, [components, wires]);

  const importCircuitJson = useCallback(
    (jsonStr: string) => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (!Array.isArray(parsed.components) || !Array.isArray(parsed.wires)) {
          throw new Error('Invalid circuit JSON schema: must contain components and wires arrays.');
        }
        recordHistory();
        setComponents(parsed.components);
        setWires(parsed.wires);
        setSelectedComponentIds([]);
        setSelectedWireIds([]);
        return true;
      } catch (err) {
        console.error('Failed to import circuit:', err);
        return false;
      }
    },
    [recordHistory]
  );

  return {
    components,
    wires,
    selectedComponentIds,
    selectedWireIds,
    wireDraft,
    pan,
    zoom,
    setPan,
    setZoom,
    addComponent,
    updateComponentPositions,
    toggleSwitch,
    updateComponentState,
    updateComponentLabel,
    startWire,
    updateWireDraftPosition,
    cancelWire,
    completeWire,
    selectComponent,
    selectWire,
    selectAll,
    clearSelection,
    deleteSelected,
    duplicateSelected,
    loadPreset,
    clearCircuit,
    exportCircuitJson,
    importCircuitJson,
    undo,
    redo,
    canUndo: historyRef.current.past.length > 0,
    canRedo: historyRef.current.future.length > 0,
  };
}
