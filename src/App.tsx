import React, { useState, useEffect, useCallback } from 'react';
import { useCircuitState } from './hooks/useCircuitState';
import { useSimulationLoop } from './hooks/useSimulationLoop';
import { ComponentType, PresetCircuit } from './types/circuit';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ComponentPalette } from './components/palette/ComponentPalette';
import { CircuitCanvas } from './components/canvas/CircuitCanvas';
import { InspectorPanel } from './components/inspector/InspectorPanel';
import { Toolbar } from './components/toolbar/Toolbar';
import { TruthTableModal } from './components/truthTable/TruthTableModal';
import { TimingDiagramDrawer } from './components/timing/TimingDiagramDrawer';

const AppContent: React.FC = () => {
  const { theme } = useTheme();

  const {
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
    canUndo,
    canRedo,
  } = useCircuitState('half-adder');

  // Simulation loop and clock
  const {
    isRunning,
    setIsRunning,
    clockFrequency,
    setClockFrequency,
    waveformSamples,
    simulationResult,
    triggerClockPulse,
    clearWaveform,
  } = useSimulationLoop(components, wires, updateComponentState);

  // Modals and panels
  const [isTruthTableOpen, setIsTruthTableOpen] = useState(false);
  const [isTimingDiagramOpen, setIsTimingDiagramOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === 'Escape') {
        cancelWire();
        clearSelection();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, cancelWire, clearSelection, undo, redo, duplicateSelected, selectAll]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 3.0));
  }, [setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev * 0.8, 0.3));
  }, [setZoom]);

  const handleResetZoom = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 60, y: 40 });
  }, [setZoom, setPan]);

  // Export JSON helper
  const handleExportJson = useCallback(() => {
    const json = exportCircuitJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gridlogic-circuit-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [exportCircuitJson]);

  // Add component placed in the center of current viewport
  const handleAddFromPalette = useCallback(
    (type: ComponentType) => {
      const canvasWidth = window.innerWidth - 512; // 256px palette + 256px inspector
      const canvasHeight = window.innerHeight - 56; // 56px toolbar
      const centerX = (canvasWidth / 2 - pan.x) / zoom;
      const centerY = (canvasHeight / 2 - pan.y) / zoom;
      addComponent(type, centerX, centerY);
    },
    [pan, zoom, addComponent]
  );

  const selectedComponents = components.filter(c =>
    selectedComponentIds.includes(c.id)
  );
  const selectedWires = wires.filter(w => selectedWireIds.includes(w.id));

  return (
    <div
      className="w-screen h-screen flex flex-col overflow-hidden select-none transition-colors duration-200"
      style={{ backgroundColor: theme.bgWorkspace, color: theme.textPrimary }}
    >
      {/* Top Application Toolbar */}
      <Toolbar
        isRunning={isRunning}
        onToggleRunning={() => setIsRunning(prev => !prev)}
        onTriggerClockPulse={triggerClockPulse}
        clockFrequency={clockFrequency}
        onSetClockFrequency={setClockFrequency}
        isOscillating={simulationResult.isOscillating}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onLoadPreset={(preset: PresetCircuit) => {
          loadPreset(preset);
          clearWaveform();
        }}
        onExportJson={handleExportJson}
        onImportJson={importCircuitJson}
        onToggleTruthTable={() => setIsTruthTableOpen(prev => !prev)}
        isTruthTableOpen={isTruthTableOpen}
        onToggleTimingDiagram={() => setIsTimingDiagramOpen(prev => !prev)}
        isTimingDiagramOpen={isTimingDiagramOpen}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Palette */}
        <ComponentPalette onAddComponent={handleAddFromPalette} />

        {/* Center Circuit Canvas */}
        <main className="flex-1 h-full relative">
          <CircuitCanvas
            components={components}
            wires={wires}
            selectedComponentIds={selectedComponentIds}
            selectedWireIds={selectedWireIds}
            wireDraft={wireDraft}
            pinValues={simulationResult.pinValues}
            wireValues={simulationResult.wireValues}
            pan={pan}
            zoom={zoom}
            setPan={setPan}
            setZoom={setZoom}
            onSelectComponent={selectComponent}
            onSelectWire={selectWire}
            onClearSelection={clearSelection}
            onUpdateComponentPositions={updateComponentPositions}
            onToggleSwitch={toggleSwitch}
            onStartWire={startWire}
            onUpdateWireDraft={updateWireDraftPosition}
            onCompleteWire={completeWire}
            onCancelWire={cancelWire}
            onDropComponent={(type, x, y) => addComponent(type, x, y)}
          />
        </main>

        {/* Right Inspector */}
        <InspectorPanel
          selectedComponents={selectedComponents}
          selectedWires={selectedWires}
          pinValues={simulationResult.pinValues}
          wireValues={simulationResult.wireValues}
          totalComponents={components.length}
          totalWires={wires.length}
          isOscillating={simulationResult.isOscillating}
          onUpdateLabel={updateComponentLabel}
          onToggleSwitch={toggleSwitch}
          onDeleteSelected={deleteSelected}
          onDuplicateSelected={duplicateSelected}
          onClearCircuit={clearCircuit}
        />
      </div>

      {/* Dynamic Truth Table Modal */}
      <TruthTableModal
        isOpen={isTruthTableOpen}
        onClose={() => setIsTruthTableOpen(false)}
        components={components}
        wires={wires}
      />

      {/* Logic Analyzer Timing Diagram Waveform Drawer */}
      <TimingDiagramDrawer
        isOpen={isTimingDiagramOpen}
        onClose={() => setIsTimingDiagramOpen(false)}
        samples={waveformSamples}
        components={components}
        onClear={clearWaveform}
        isRunning={isRunning}
        onToggleRunning={() => setIsRunning(prev => !prev)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};
