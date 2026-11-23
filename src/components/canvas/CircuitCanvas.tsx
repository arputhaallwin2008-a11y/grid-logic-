import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  CircuitComponent,
  Wire,
  SignalValue,
  PinDefinition,
  ComponentType,
} from '../../types/circuit';
import { WireDraft } from '../../hooks/useCircuitState';
import { ComponentNode } from './ComponentNode';
import { WireRenderer } from './WireRenderer';
import { useTheme } from '../../context/ThemeContext';

interface CircuitCanvasProps {
  components: CircuitComponent[];
  wires: Wire[];
  selectedComponentIds: string[];
  selectedWireIds: string[];
  wireDraft: WireDraft | null;
  pinValues: Record<string, SignalValue>;
  wireValues: Record<string, SignalValue>;
  pan: { x: number; y: number };
  zoom: number;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onSelectComponent: (id: string, multi: boolean) => void;
  onSelectWire: (id: string, multi: boolean) => void;
  onClearSelection: () => void;
  onUpdateComponentPositions: (
    updates: { id: string; x: number; y: number }[],
    shouldRecord?: boolean
  ) => void;
  onToggleSwitch: (id: string) => void;
  onStartWire: (
    componentId: string,
    pinId: string,
    pinType: 'input' | 'output',
    x: number,
    y: number
  ) => void;
  onUpdateWireDraft: (x: number, y: number) => void;
  onCompleteWire: (
    targetComponentId: string,
    targetPinId: string,
    targetPinType: 'input' | 'output'
  ) => void;
  onCancelWire: () => void;
  onDropComponent: (type: ComponentType, x: number, y: number) => void;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  components,
  wires,
  selectedComponentIds,
  selectedWireIds,
  wireDraft,
  pinValues,
  wireValues,
  pan,
  zoom,
  setPan,
  setZoom,
  onSelectComponent,
  onSelectWire,
  onClearSelection,
  onUpdateComponentPositions,
  onToggleSwitch,
  onStartWire,
  onUpdateWireDraft,
  onCompleteWire,
  onCancelWire,
  onDropComponent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging states
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isDraggingComponents, setIsDraggingComponents] = useState(false);
  const [dragStartMouse, setDragStartMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragInitialPositions, setDragInitialPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Convert screen coordinates to canvas coordinates
  const screenToCanvasCoords = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (screenX - rect.left - pan.x) / zoom;
      const y = (screenY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom]
  );

  // Pin lookup helper: gets absolute canvas coordinates of a pin
  const getPinCanvasCoords = useCallback(
    (componentId: string, pinId: string): { x: number; y: number } => {
      const comp = components.find(c => c.id === componentId);
      if (!comp) return { x: 0, y: 0 };

      const pin =
        comp.inputs.find(p => p.id === pinId) ||
        comp.outputs.find(p => p.id === pinId);
      if (!pin) return { x: comp.x, y: comp.y };

      return {
        x: comp.x + pin.x,
        y: comp.y + pin.y,
      };
    },
    [components]
  );

  // Mouse Wheel (Zoom toward cursor)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const nextZoom = Math.min(Math.max(zoom * zoomFactor, 0.3), 3.0);

    // Maintain cursor position stability during zoom
    const nextPanX = mouseX - (mouseX - pan.x) * (nextZoom / zoom);
    const nextPanY = mouseY - (mouseY - pan.y) * (nextZoom / zoom);

    setZoom(nextZoom);
    setPan({ x: nextPanX, y: nextPanY });
  };

  // Canvas background mouse down
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // If middle click or space held or direct click on canvas background
    if (e.button === 1 || e.button === 0) {
      if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
        onClearSelection();
        if (wireDraft) onCancelWire();

        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  // Global mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // 1. Pan canvas
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
        return;
      }

      // 2. Drag components
      if (isDraggingComponents) {
        const dx = (e.clientX - dragStartMouse.x) / zoom;
        const dy = (e.clientY - dragStartMouse.y) / zoom;

        const updates = Object.entries(dragInitialPositions).map(([id, pos]) => ({
          id,
          x: pos.x + dx,
          y: pos.y + dy,
        }));

        onUpdateComponentPositions(updates, false);
        return;
      }

      // 3. Update wire draft
      if (wireDraft) {
        const coords = screenToCanvasCoords(e.clientX, e.clientY);
        onUpdateWireDraft(coords.x, coords.y);
      }
    },
    [
      isPanning,
      panStart,
      setPan,
      isDraggingComponents,
      dragStartMouse,
      zoom,
      dragInitialPositions,
      onUpdateComponentPositions,
      wireDraft,
      screenToCanvasCoords,
      onUpdateWireDraft,
    ]
  );

  // Global mouse up
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (isDraggingComponents) {
      setIsDraggingComponents(false);
      // Finalize position recording for undo history
      const updates = components
        .filter(c => selectedComponentIds.includes(c.id))
        .map(c => ({ id: c.id, x: c.x, y: c.y }));
      onUpdateComponentPositions(updates, true);
    }
  }, [
    isPanning,
    isDraggingComponents,
    components,
    selectedComponentIds,
    onUpdateComponentPositions,
  ]);

  // Start dragging a component
  const handleStartDragComponent = (compId: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const isAlreadySelected = selectedComponentIds.includes(compId);
    const activeSelected = isAlreadySelected
      ? selectedComponentIds
      : [compId];

    if (!isAlreadySelected) {
      onSelectComponent(compId, e.shiftKey || e.ctrlKey);
    }

    setIsDraggingComponents(true);
    setDragStartMouse({ x: e.clientX, y: e.clientY });

    const initialPositions: Record<string, { x: number; y: number }> = {};
    components.forEach(c => {
      if (activeSelected.includes(c.id)) {
        initialPositions[c.id] = { x: c.x, y: c.y };
      }
    });
    setDragInitialPositions(initialPositions);
  };

  // HTML5 Drag and Drop from Palette
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/gridlogic-type') as ComponentType;
    if (type) {
      const coords = screenToCanvasCoords(e.clientX, e.clientY);
      onDropComponent(type, coords.x, coords.y);
    }
  };

  // Keyboard escape handler for wire draft
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && wireDraft) {
        onCancelWire();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [wireDraft, onCancelWire]);

  const { theme } = useTheme();

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none cursor-default cad-grid-pattern transition-colors duration-200"
      style={{ backgroundColor: theme.bgWorkspace }}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <svg
        className="w-full h-full absolute inset-0 pointer-events-auto"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          {/* Subtle Grid pattern inside SVG for precision */}
          <pattern id="minorGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={theme.svgGridColor} strokeWidth="0.5" strokeOpacity="0.4" />
          </pattern>
        </defs>

        <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#minorGrid)" pointerEvents="none" />

        {/* 1. Render Wires */}
        <g id="wires-layer">
          {wires.map(wire => {
            const start = getPinCanvasCoords(wire.fromComponentId, wire.fromPinId);
            const end = getPinCanvasCoords(wire.toComponentId, wire.toPinId);
            const val = wireValues[wire.id] ?? 0;
            const isSelected = selectedWireIds.includes(wire.id);

            return (
              <WireRenderer
                key={wire.id}
                wire={wire}
                startX={start.x}
                startY={start.y}
                endX={end.x}
                endY={end.y}
                value={val}
                isSelected={isSelected}
                onSelect={e => {
                  e.stopPropagation();
                  onSelectWire(wire.id, e.shiftKey || e.ctrlKey);
                }}
              />
            );
          })}
        </g>

        {/* 2. Render Wire Draft (in-flight wire being drawn) */}
        {wireDraft && (
          <g id="wire-draft-layer" pointerEvents="none">
            {(() => {
              const start = getPinCanvasCoords(wireDraft.fromComponentId, wireDraft.fromPinId);
              const dx = wireDraft.currentX - start.x;
              const curvature = Math.max(36, Math.abs(dx) * 0.55);
              const pathData = `M ${start.x} ${start.y} C ${start.x + curvature} ${start.y}, ${
                wireDraft.currentX - curvature
              } ${wireDraft.currentY}, ${wireDraft.currentX} ${wireDraft.currentY}`;

              return (
                <path
                  d={pathData}
                  fill="none"
                  stroke={theme.signalHigh}
                  strokeWidth={2.5}
                  strokeDasharray="5 4"
                  className="animate-pulse"
                />
              );
            })()}
          </g>
        )}

        {/* 3. Render Components */}
        <g id="components-layer">
          {components.map(comp => (
            <ComponentNode
              key={comp.id}
              component={comp}
              pinValues={pinValues}
              isSelected={selectedComponentIds.includes(comp.id)}
              onSelect={e => {
                e.stopPropagation();
                onSelectComponent(comp.id, e.shiftKey || e.ctrlKey);
              }}
              onStartDrag={e => handleStartDragComponent(comp.id, e)}
              onToggleSwitch={() => onToggleSwitch(comp.id)}
              onPinMouseDown={(pin: PinDefinition, e: React.MouseEvent) => {
                const coords = screenToCanvasCoords(e.clientX, e.clientY);
                onStartWire(comp.id, pin.id, pin.type, coords.x, coords.y);
              }}
              onPinMouseUp={(pin: PinDefinition) => {
                onCompleteWire(comp.id, pin.id, pin.type);
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
