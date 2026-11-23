import React, { useState } from 'react';
import { ComponentType, ComponentCategory } from '../../types/circuit';
import { COMPONENT_METADATA } from '../../constants/components';
import { useTheme } from '../../context/ThemeContext';
import { Search, Plus, Cpu, ToggleLeft, Activity, Radio, Zap } from 'lucide-react';

interface ComponentPaletteProps {
  onAddComponent: (type: ComponentType) => void;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent }) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const allTypes = Object.keys(COMPONENT_METADATA) as ComponentType[];

  const filteredTypes = allTypes.filter(type => {
    const meta = COMPONENT_METADATA[type];
    const q = searchQuery.toLowerCase();
    return (
      meta.name.toLowerCase().includes(q) ||
      meta.description.toLowerCase().includes(q) ||
      type.toLowerCase().includes(q)
    );
  });

  const categories: ComponentCategory[] = ['io', 'gates', 'sequential', 'constants'];

  const categoryInfo: Record<ComponentCategory, { label: string; icon: React.ReactNode }> = {
    io: { label: 'Inputs & Outputs', icon: <ToggleLeft className="w-4 h-4" style={{ color: theme.signalHigh }} /> },
    gates: { label: 'Logic Gates', icon: <Cpu className="w-4 h-4" style={{ color: theme.accentColor }} /> },
    sequential: { label: 'Sequential ICs', icon: <Activity className="w-4 h-4" style={{ color: theme.clockColor }} /> },
    constants: { label: 'Constant Rails', icon: <Zap className="w-4 h-4" style={{ color: theme.signalActive }} /> },
  };

  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('application/gridlogic-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside
      className="w-64 h-full border-r flex flex-col z-10 select-none shadow-xl transition-colors duration-200"
      style={{
        backgroundColor: theme.bgPanel,
        borderColor: theme.borderPanel,
      }}
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: theme.borderPanel }}>
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-7 h-7 rounded-lg border flex items-center justify-center"
            style={{
              backgroundColor: theme.signalHighFill,
              borderColor: theme.signalHigh,
            }}
          >
            <Radio className="w-4 h-4 animate-pulse" style={{ color: theme.signalHigh }} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider" style={{ color: theme.textPrimary }}>
              GRIDLOGIC
            </h1>
            <p
              className="text-[10px] font-mono tracking-widest font-semibold uppercase"
              style={{ color: theme.signalHigh }}
            >
              LIVE SIMULATOR
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-md py-1.5 pl-8 pr-3 text-xs placeholder-slate-500 focus:outline-none transition-colors border"
            style={{
              backgroundColor: theme.bgPanelSubtle,
              borderColor: theme.borderSubtle,
              color: theme.textPrimary,
            }}
          />
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {categories.map(category => {
          const itemsInCategory = filteredTypes.filter(
            type => COMPONENT_METADATA[type].category === category
          );

          if (itemsInCategory.length === 0) return null;

          const catInfo = categoryInfo[category];

          return (
            <div key={category}>
              <div
                className="flex items-center gap-1.5 px-1 mb-2 text-xs font-semibold tracking-wide uppercase"
                style={{ color: theme.textSecondary }}
              >
                {catInfo.icon}
                <span>{catInfo.label}</span>
              </div>

              <div className="space-y-1.5">
                {itemsInCategory.map(type => {
                  const meta = COMPONENT_METADATA[type];
                  return (
                    <div
                      key={type}
                      draggable
                      onDragStart={e => handleDragStart(e, type)}
                      onClick={() => onAddComponent(type)}
                      className="group relative flex items-center justify-between p-2 rounded-md border transition-all cursor-grab active:cursor-grabbing hover:brightness-110"
                      style={{
                        backgroundColor: theme.bgPanelSubtle,
                        borderColor: theme.borderPanel,
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-medium" style={{ color: theme.textPrimary }}>
                          {meta.name}
                        </span>
                        <span className="text-[10px] line-clamp-1" style={{ color: theme.textMuted }}>
                          {meta.description}
                        </span>
                      </div>

                      <button
                        title="Add to canvas"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all ml-1 text-white"
                        style={{ backgroundColor: theme.signalHighFill, color: theme.signalHigh }}
                        onClick={e => {
                          e.stopPropagation();
                          onAddComponent(type);
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredTypes.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-500">
            No components match &quot;{searchQuery}&quot;
          </div>
        )}
      </div>

      {/* Quick Legend / Hint */}
      <div
        className="p-3 border-t text-[11px] transition-colors"
        style={{
          backgroundColor: theme.bgToolbar,
          borderColor: theme.borderPanel,
          color: theme.textSecondary,
        }}
      >
        <p className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: theme.signalHigh }}
          />
          <span>Drag or click + to place</span>
        </p>
      </div>
    </aside>
  );
};
