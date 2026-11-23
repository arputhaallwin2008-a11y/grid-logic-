import React, { useMemo } from 'react';
import { CircuitComponent, Wire } from '../../types/circuit';
import { generateTruthTable } from '../../engine/truthTable';
import { useTheme } from '../../context/ThemeContext';
import { X, Download, Copy, Check, Info } from 'lucide-react';

interface TruthTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  components: CircuitComponent[];
  wires: Wire[];
}

export const TruthTableModal: React.FC<TruthTableModalProps> = ({
  isOpen,
  onClose,
  components,
  wires,
}) => {
  const { theme } = useTheme();
  const [copied, setCopied] = React.useState(false);

  // Generate dynamic truth table data
  const data = useMemo(() => {
    if (!isOpen) return null;
    return generateTruthTable(components, wires, 7); // Max 7 inputs = 128 rows
  }, [isOpen, components, wires]);

  if (!isOpen || !data) return null;

  const { inputColumns, outputColumns, rows, isTooLarge, totalCombinations } = data;

  const copyAsMarkdown = () => {
    if (rows.length === 0) return;
    const inHeaders = inputColumns.map(c => c.label).join(' | ');
    const outHeaders = outputColumns.map(c => c.label).join(' | ');
    const headerLine = `| ${inHeaders} || ${outHeaders} |`;
    const sepLine = `| ${inputColumns.map(() => '---').join(' | ')} || ${outputColumns.map(() => '---').join(' | ')} |`;

    const rowLines = rows.map(r => {
      const inVals = inputColumns.map(c => r.inputs[c.componentId]).join(' | ');
      const outVals = outputColumns.map(c => r.outputs[c.componentId]).join(' | ');
      return `| ${inVals} || ${outVals} |`;
    });

    const markdown = [headerLine, sepLine, ...rowLines].join('\n');
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportAsCsv = () => {
    if (rows.length === 0) return;
    const inHeaders = inputColumns.map(c => `"${c.label}"`).join(',');
    const outHeaders = outputColumns.map(c => `"${c.label}"`).join(',');
    const headerLine = `${inHeaders},${outHeaders}`;

    const rowLines = rows.map(r => {
      const inVals = inputColumns.map(c => r.inputs[c.componentId]).join(',');
      const outVals = outputColumns.map(c => r.outputs[c.componentId]).join(',');
      return `${inVals},${outVals}`;
    });

    const csvContent = [headerLine, ...rowLines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'truth_table.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div
        className="rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border transition-colors"
        style={{
          backgroundColor: theme.bgPanel,
          borderColor: theme.borderPanel,
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: theme.borderPanel }}>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: theme.textPrimary }}>
              <span>Dynamic Circuit Truth Table</span>
              {rows.length > 0 && (
                <span
                  className="text-[11px] font-normal px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: theme.signalHighFill,
                    color: theme.signalHigh,
                    borderColor: theme.signalHigh,
                  }}
                >
                  {rows.length} Combinations
                </span>
              )}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
              Exhaustive simulation of all input switch states and observed LED outputs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {rows.length > 0 && (
              <>
                <button
                  onClick={copyAsMarkdown}
                  title="Copy as Markdown Table"
                  className="p-1.5 rounded transition-colors hover:brightness-125 border"
                  style={{ backgroundColor: theme.bgPanelSubtle, borderColor: theme.borderSubtle, color: theme.textPrimary }}
                >
                  {copied ? <Check className="w-4 h-4" style={{ color: theme.signalHigh }} /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={exportAsCsv}
                  title="Download CSV"
                  className="p-1.5 rounded transition-colors hover:brightness-125 border"
                  style={{ backgroundColor: theme.bgPanelSubtle, borderColor: theme.borderSubtle, color: theme.textPrimary }}
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-5">
          {/* No inputs or outputs notice */}
          {rows.length === 0 && !isTooLarge && (
            <div className="py-12 px-4 text-center space-y-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: theme.bgPanelSubtle, color: theme.textMuted }}
              >
                <Info className="w-6 h-6" />
              </div>
              <div className="font-medium text-sm" style={{ color: theme.textPrimary }}>
                Insufficient Circuit Elements
              </div>
              <p className="text-xs max-w-sm mx-auto" style={{ color: theme.textSecondary }}>
                To generate a complete Truth Table, ensure your canvas has at least{' '}
                <strong style={{ color: theme.signalHigh }}>1 Input Switch</strong> and at least{' '}
                <strong style={{ color: theme.signalActive }}>1 Output LED</strong> connected.
              </p>
            </div>
          )}

          {/* Too large notice */}
          {isTooLarge && (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="text-amber-400 font-semibold text-sm">
                Combinatorial Limit Exceeded
              </div>
              <p className="text-xs max-w-sm mx-auto" style={{ color: theme.textSecondary }}>
                Circuit contains {inputColumns.length} Input Switches ({totalCombinations} rows), exceeding the interactive preview limit.
              </p>
            </div>
          )}

          {/* Table display */}
          {rows.length > 0 && (
            <div className="border rounded-lg overflow-hidden shadow" style={{ borderColor: theme.borderPanel }}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    className="border-b font-mono text-[11px]"
                    style={{ backgroundColor: theme.bgPanelSubtle, borderColor: theme.borderPanel }}
                  >
                    {/* Input Columns */}
                    {inputColumns.map(col => (
                      <th
                        key={col.id}
                        className="py-2.5 px-3 font-semibold border-r text-center"
                        style={{ color: theme.signalHigh, borderColor: theme.borderPanel }}
                      >
                        {col.label}
                      </th>
                    ))}

                    <th
                      className="py-2.5 px-2 border-r text-center opacity-60"
                      style={{ backgroundColor: theme.bgWorkspace, borderColor: theme.borderPanel, color: theme.textMuted }}
                    >
                      →
                    </th>

                    {/* Output Columns */}
                    {outputColumns.map(col => (
                      <th
                        key={col.id}
                        className="py-2.5 px-3 font-semibold border-r last:border-r-0 text-center"
                        style={{ color: theme.signalActive, borderColor: theme.borderPanel }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y font-mono" style={{ borderColor: theme.borderPanel }}>
                  {rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className="transition-colors"
                      style={
                        row.isCurrent
                          ? {
                              backgroundColor: theme.signalHighFill,
                              borderLeft: `4px solid ${theme.signalHigh}`,
                            }
                          : {
                              backgroundColor: idx % 2 === 0 ? theme.bgPanel : theme.bgPanelSubtle,
                            }
                      }
                    >
                      {inputColumns.map(col => (
                        <td
                          key={col.id}
                          className="py-2 px-3 text-center border-r"
                          style={{ borderColor: theme.borderPanel }}
                        >
                          <span
                            className="font-bold"
                            style={{
                              color: row.inputs[col.componentId] === 1 ? theme.signalHigh : theme.textMuted,
                            }}
                          >
                            {row.inputs[col.componentId]}
                          </span>
                        </td>
                      ))}

                      <td
                        className="py-2 px-2 text-center border-r text-[10px]"
                        style={{ borderColor: theme.borderPanel, color: theme.textMuted }}
                      >
                        {row.isCurrent && (
                          <span
                            className="text-[9px] font-bold uppercase tracking-tighter"
                            style={{ color: theme.signalHigh }}
                          >
                            LIVE
                          </span>
                        )}
                      </td>

                      {outputColumns.map(col => (
                        <td
                          key={col.id}
                          className="py-2 px-3 text-center border-r last:border-r-0"
                          style={{ borderColor: theme.borderPanel }}
                        >
                          <span
                            className="font-bold"
                            style={{
                              color: row.outputs[col.componentId] === 1 ? theme.signalActive : theme.textMuted,
                            }}
                          >
                            {row.outputs[col.componentId]}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 border-t flex items-center justify-between text-xs"
          style={{
            backgroundColor: theme.bgToolbar,
            borderColor: theme.borderPanel,
            color: theme.textSecondary,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-sm inline-block"
              style={{ backgroundColor: theme.signalHigh }}
            />
            <span>Highlighted row indicates current live switch configuration</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded transition-colors hover:brightness-125 border"
            style={{
              backgroundColor: theme.bgPanelSubtle,
              borderColor: theme.borderSubtle,
              color: theme.textPrimary,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
