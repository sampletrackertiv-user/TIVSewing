
import React, { useState, useMemo } from 'react';
import { ProductVariant } from '../types';
import { 
  Download, Printer, Filter, Palette, Layers, Search, X, 
  CheckSquare, Square, ChevronDown, Monitor, Scissors, Settings2, 
  Cpu, Hash, Ruler, Tag, FileText, Box, HardDrive, Zap
} from 'lucide-react';

interface MatrixTableProps {
  variants: ProductVariant[];
}

const MatrixTable: React.FC<MatrixTableProps> = ({ variants }) => {
  const [selectedColors, setSelectedColors] = useState<string[]>(variants.map(v => v.color));
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [opSearchQuery, setOpSearchQuery] = useState('');
  const [isCompactMode, setIsCompactMode] = useState(false);

  const allColors = useMemo(() => 
    Array.from(new Set<string>(variants.map(v => v.color))).sort(),
    [variants]
  );

  const allStts = useMemo(() => 
    Array.from(new Set<string>(variants.flatMap(v => v.operations.map(op => op.stt))))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [variants]
  );

  const filteredColorOptions = allColors.filter(color => 
    color.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const selectAll = () => setSelectedColors(allColors);
  const selectNone = () => setSelectedColors([]);

  const handlePrint = () => window.print();

  const exportCSV = () => {
    let csv = "\ufeffOP,Variant,Section,Color Code,Description,Machine,Material,Technical Specs,Sizes,Mod,Wage\n";
    allStts.forEach(stt => {
      variants.forEach(v => {
        if (!selectedColors.includes(v.color)) return;
        const op = v.operations.find(o => o.stt === stt);
        if (!op) return;
        op.configs.forEach(cfg => {
          const items = op.materials.filter(m => m.sizes.some(s => cfg.applicableSizes.includes(s)));
          const displayItems = items.length > 0 ? items : [{ name: 'N/A', sizes: cfg.applicableSizes }];
          displayItems.forEach(item => {
            const tech = `Type: ${cfg.needleType} | N.Size: ${cfg.needleSize} | Seam: ${cfg.seam} | Stitch: ${cfg.stitchCm || ''} | Throw: ${cfg.needleThrow || ''}`;
            csv += `"${stt}","${cfg.variantId}","${op.section}","${v.color}","${op.description}","${cfg.machine}","${item.name}","${tech}","${item.sizes.join(' ')}","${cfg.modLevel || ''}","${cfg.wageGroup || ''}"\n`;
          });
        });
      });
    });
    
    const colorsString = selectedColors.length > 0 ? selectedColors.join('_') : 'No_Colors';
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `TIV_Ops_${colorsString}_${dateStr}.csv`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const filteredVariants = variants.filter(v => selectedColors.includes(v.color));

  const visibleStts = useMemo(() => {
    if (!opSearchQuery.trim()) return allStts;
    const query = opSearchQuery.toLowerCase();
    return allStts.filter(stt => {
      const opMatches = variants.some(v => {
        const op = v.operations.find(o => o.stt === stt);
        return op && (op.description.toLowerCase().includes(query) || op.stt.toLowerCase().includes(query));
      });
      return opMatches;
    });
  }, [allStts, opSearchQuery, variants]);

  return (
    <div className="space-y-6">
      {/* Dynamic Action Bar */}
      <div className="no-print space-y-4">
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Color Filter */}
            <div className="relative">
              <button 
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-bold transition-all shadow-sm ${
                  showFilter ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <Filter size={14} /> 
                Colors
                <span className="bg-blue-500 text-white min-w-[18px] px-1 rounded-full text-[9px]">{selectedColors.length}</span>
              </button>
              {showFilter && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-100 rounded-3xl shadow-2xl z-[150] p-5">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Select Colors</span>
                    <button onClick={() => setShowFilter(false)}><X size={16}/></button>
                  </div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input 
                      type="text" placeholder="Search..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border-0 rounded-xl text-sm outline-none"
                      value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 mb-4">
                    <button onClick={selectAll} className="flex-1 py-1.5 bg-slate-100 text-[10px] font-bold rounded-lg">All</button>
                    <button onClick={selectNone} className="flex-1 py-1.5 bg-slate-50 text-[10px] font-bold rounded-lg text-slate-400">Clear</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                    {filteredColorOptions.map(color => (
                      <label key={color} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer">
                        <input type="checkbox" checked={selectedColors.includes(color)} onChange={() => toggleColor(color)} className="rounded text-blue-600" />
                        <span className="text-sm font-semibold">{color}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* OP Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" placeholder="Find OP step..."
                className="pl-9 pr-3 py-2.5 w-[200px] bg-white border border-slate-200 rounded-2xl text-[12px] font-semibold outline-none focus:border-blue-400"
                value={opSearchQuery} onChange={(e) => setOpSearchQuery(e.target.value)}
              />
            </div>

            {/* Compact Toggle */}
            <button 
              onClick={() => setIsCompactMode(!isCompactMode)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-bold transition-all border ${
                isCompactMode ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              <Zap size={14} />
              {isCompactMode ? "Super Compact" : "Standard View"}
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={exportCSV} className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50">
              <Download size={18} />
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[12px] font-bold">
              <Printer size={16} /> Print (A4 Landscape)
            </button>
          </div>
        </div>
      </div>

      {/* Modern Table Container */}
      <div className={`bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print-container ${isCompactMode ? 'is-compact' : ''}`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className={`pl-6 pr-2 w-[60px] ${isCompactMode ? 'py-2' : 'py-5'}`}>STT</th>
                <th className={`px-2 w-[70px] ${isCompactMode ? 'py-2' : 'py-5'}`}>COLOR</th>
                <th className={`px-2 ${isCompactMode ? 'py-2' : 'py-5'}`}>DESCRIPTION</th>
                <th className={`px-2 w-[35%] ${isCompactMode ? 'py-2' : 'py-5'}`}>PRODUCTION DETAILS</th>
                <th className={`px-2 w-[220px] ${isCompactMode ? 'py-2' : 'py-5'}`}>TECH SPECS</th>
                <th className={`pr-6 pl-2 w-[160px] ${isCompactMode ? 'py-2' : 'py-5'}`}>SIZES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleStts.map((stt, sttIdx) => {
                const rowsForStt = filteredVariants.flatMap(v => {
                  const op = v.operations.find(o => o.stt === stt);
                  if (!op) return [];
                  return op.configs.flatMap(cfg => {
                    const mats = op.materials.filter(m => m.sizes.some(s => cfg.applicableSizes.includes(s)));
                    return (mats.length > 0 ? mats : [{ name: 'N/A', sizes: cfg.applicableSizes }]).map(mat => ({
                      op, v, cfg, mat
                    }));
                  });
                });

                if (rowsForStt.length === 0) return null;

                return rowsForStt.map((row, rowIdx) => (
                  <tr key={`${stt}-${row.v.id}-${rowIdx}`} className={`${rowIdx === 0 && sttIdx !== 0 ? 'border-t-2 border-slate-200' : ''}`}>
                    <td className={`pl-6 pr-2 font-black text-slate-900 ${isCompactMode ? 'py-1.5 text-xs' : 'py-4 text-lg'}`}>
                      {rowIdx === 0 ? stt : <span className="text-slate-200">·</span>}
                    </td>

                    <td className={`px-2 ${isCompactMode ? 'py-1.5' : 'py-4'}`}>
                      <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded font-black text-[10px]">
                        {row.v.color}
                      </span>
                    </td>

                    <td className={`px-2 ${isCompactMode ? 'py-1.5' : 'py-4'}`}>
                      <div className="flex flex-col">
                        <span className={`font-bold uppercase leading-tight ${isCompactMode ? 'text-[10px]' : 'text-[12px]'}`}>
                          {row.op.description}
                        </span>
                        {!isCompactMode && <span className="text-[8px] font-bold text-slate-400 mt-1">{row.op.section}</span>}
                      </div>
                    </td>

                    <td className={`px-2 ${isCompactMode ? 'py-1.5' : 'py-4'}`}>
                      <div className={`grid ${isCompactMode ? 'grid-cols-1 gap-1' : 'grid-cols-1 gap-2'}`}>
                        {/* Machine */}
                        <div className={`flex items-center gap-2 rounded border border-indigo-100/50 ${isCompactMode ? 'p-1 bg-transparent' : 'p-2 bg-indigo-50/20'}`}>
                          <Monitor size={10} className="text-indigo-400 print-hide-icon" />
                          <span className={`font-bold text-slate-700 ${isCompactMode ? 'text-[9px]' : 'text-[11px]'}`}>
                            {row.cfg.machine || 'Manual'}
                          </span>
                        </div>
                        {/* Material */}
                        <div className={`flex items-start gap-2 rounded border border-amber-100/50 ${isCompactMode ? 'p-1 bg-transparent' : 'p-2 bg-amber-50/20'}`}>
                          <Box size={10} className="text-amber-500 mt-0.5 print-hide-icon" />
                          <span className={`font-semibold text-slate-600 italic leading-tight ${isCompactMode ? 'text-[9px]' : 'text-[10.5px]'}`}>
                            {row.mat.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className={`px-2 ${isCompactMode ? 'py-1.5' : 'py-4'}`}>
                      <div className={`grid grid-cols-2 gap-x-2 gap-y-0.5 border border-slate-100 rounded ${isCompactMode ? 'p-1' : 'p-2'}`}>
                        <div className="text-[8px] text-slate-400 font-bold uppercase">Ndl</div>
                        <div className="text-[8px] text-slate-400 font-bold uppercase">Sz</div>
                        <div className="text-[10px] font-bold text-blue-600 truncate">{row.cfg.needleType || '-'}</div>
                        <div className="text-[10px] font-bold text-slate-800">{row.cfg.needleSize || '-'}</div>
                        <div className="col-span-2 pt-1 mt-1 border-t border-slate-50 text-[9px] text-slate-500 truncate">
                          {row.cfg.seam || 'Standard'}
                        </div>
                        {row.cfg.stitchCm && (
                          <div className="col-span-2 text-[9px] font-black text-emerald-600">
                             {row.cfg.stitchCm} st/cm
                          </div>
                        )}
                      </div>
                    </td>

                    <td className={`pr-6 pl-2 ${isCompactMode ? 'py-1.5' : 'py-4'}`}>
                      <div className="flex flex-wrap gap-0.5">
                        {row.mat.sizes.map((sz, i) => (
                          <span key={i} className="px-1 border border-slate-200 text-slate-500 font-bold rounded text-[8.5px]">
                            {sz}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center no-print">
          <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase">
            <span>Colors: <b className="text-slate-900">{filteredVariants.length}</b></span>
            <span>Total OP: <b className="text-slate-900">{visibleStts.length}</b></span>
          </div>
          <div className="text-[9px] font-bold text-slate-300">TIVSEWING ENGINE V2.1 • A4 LANDSCAPE OPTIMIZED</div>
        </div>
      </div>
    </div>
  );
};

export default MatrixTable;
