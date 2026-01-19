
import React, { useState, useMemo } from 'react';
import { ProductVariant } from '../types';
import { 
  Download, Printer, Filter, Palette, Layers, Search, X, 
  CheckSquare, Square, ChevronDown, Monitor, Scissors, Settings2, 
  Cpu, Hash, Ruler, Tag, FileText, Box, HardDrive, Zap, Eye, EyeOff
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

  // Logic to filter OPs based on search query
  const visibleStts = useMemo(() => {
    if (!opSearchQuery.trim()) return allStts;
    const query = opSearchQuery.toLowerCase();
    return allStts.filter(stt => {
      // Check if any variant has this OP and it matches description
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
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Color Filter */}
            <div className="relative">
              <button 
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[13px] font-bold transition-all shadow-sm ${
                  showFilter ? 'bg-slate-900 text-white shadow-slate-200' : 'bg-white text-slate-700 hover:border-slate-300 border border-slate-200'
                }`}
              >
                <Filter size={16} /> 
                Colors
                <div className="bg-blue-500 text-white min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px]">
                  {selectedColors.length}
                </div>
              </button>
              
              {showFilter && (
                <div className="absolute top-full left-0 mt-3 w-80 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-[100] p-6 animate-in fade-in slide-in-from-top-4">
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Select Color Codes</span>
                    <button onClick={() => setShowFilter(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="relative mb-5">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="text"
                      placeholder="Search code..."
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 mb-5">
                    <button onClick={selectAll} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-bold hover:bg-slate-200 transition-colors">Select All</button>
                    <button onClick={selectNone} className="flex-1 py-2 bg-slate-50 text-slate-400 rounded-xl text-[11px] font-bold hover:bg-slate-100 transition-colors">Clear</button>
                  </div>

                  <div className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                    {filteredColorOptions.map(color => (
                      <label key={color} className="flex items-center justify-between p-3 hover:bg-blue-50/50 rounded-2xl cursor-pointer transition-all group">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={selectedColors.includes(color)}
                            onChange={() => toggleColor(color)}
                            className="w-5 h-5 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500/20"
                          />
                          <span className={`text-sm font-semibold transition-colors ${selectedColors.includes(color) ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>
                            {color}
                          </span>
                        </div>
                        {selectedColors.includes(color) && <CheckSquare size={14} className="text-blue-500" />}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* OP Search */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={16} />
              </div>
              <input 
                type="text"
                placeholder="Search OP/Description..."
                className="pl-11 pr-4 py-3 w-[220px] bg-white border border-slate-200 rounded-2xl text-[13px] font-semibold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
                value={opSearchQuery}
                onChange={(e) => setOpSearchQuery(e.target.value)}
              />
              {opSearchQuery && (
                <button 
                  onClick={() => setOpSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Compact Toggle */}
            <button 
              onClick={() => setIsCompactMode(!isCompactMode)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[13px] font-bold transition-all border ${
                isCompactMode 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Zap size={16} className={isCompactMode ? "fill-blue-200" : ""} />
              {isCompactMode ? "Compact Active" : "Paper Saver"}
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={exportCSV} className="flex items-center gap-2.5 px-6 py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-2xl text-[13px] font-bold transition-all hover:shadow-sm">
              <Download size={18} className="text-slate-400" /> Export CSV
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2.5 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[13px] font-bold shadow-lg shadow-slate-200 transition-all active:scale-95">
              <Printer size={18} /> Print Report
            </button>
          </div>
        </div>

        {/* Selected Chips */}
        {selectedColors.length > 0 && selectedColors.length < allColors.length && (
          <div className="flex items-center gap-2 px-1 overflow-x-auto custom-scrollbar pb-1">
            <Tag size={12} className="text-slate-300 flex-shrink-0" />
            <div className="flex gap-2">
              {selectedColors.map(color => (
                <button 
                  key={color}
                  onClick={() => toggleColor(color)}
                  className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[11px] font-bold hover:bg-blue-100 transition-colors whitespace-nowrap"
                >
                  {color} <X size={12} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modern Table Container */}
      <div className={`bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden print-container ${isCompactMode ? 'compact-mode' : ''}`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className={`pl-8 pr-4 py-6 w-[80px] text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ${isCompactMode ? '!py-3' : ''}`}>OP</th>
                <th className={`px-4 py-6 w-[100px] text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ${isCompactMode ? '!py-3' : ''}`}>Color</th>
                <th className={`px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ${isCompactMode ? '!py-3' : ''}`}>Process Description</th>
                <th className={`px-4 py-6 w-[400px] text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ${isCompactMode ? '!py-3' : ''}`}>Production Details</th>
                <th className={`px-4 py-6 w-[320px] text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ${isCompactMode ? '!py-3' : ''}`}>Tech Specifications</th>
                <th className={`pr-8 pl-4 py-6 w-[200px] text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ${isCompactMode ? '!py-3' : ''}`}>Sizes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleStts.length > 0 ? (
                visibleStts.map((stt, sttIdx) => {
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
                    <tr key={`${stt}-${row.v.id}-${rowIdx}`} className={`group hover:bg-slate-50/50 transition-colors ${rowIdx === 0 && sttIdx !== 0 ? 'border-t-2 border-slate-100' : ''}`}>
                      {/* OP Number */}
                      <td className={`pl-8 pr-4 align-top ${isCompactMode ? 'py-2' : 'py-6'}`}>
                        {rowIdx === 0 ? (
                          <div className="flex flex-col">
                            <span className={`${isCompactMode ? 'text-sm' : 'text-xl'} font-black text-slate-900 leading-none`}>{stt}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">VAR {row.cfg.variantId}</span>
                          </div>
                        ) : (
                          <div className={`w-1 bg-slate-100 rounded-full ml-2 ${isCompactMode ? 'h-2' : 'h-4'}`}></div>
                        )}
                      </td>

                      {/* Color Code */}
                      <td className={`px-4 align-top ${isCompactMode ? 'py-2' : 'py-6'}`}>
                        <div className={`inline-flex items-center px-3 py-1 bg-slate-900 text-white rounded-lg font-black shadow-sm ${isCompactMode ? 'text-[10px]' : 'text-xs'}`}>
                          {row.v.color}
                        </div>
                      </td>

                      {/* Description */}
                      <td className={`px-4 align-top ${isCompactMode ? 'py-2' : 'py-6'}`}>
                        <div className="flex flex-col gap-1 pr-4">
                          <h4 className={`${isCompactMode ? 'text-[11px]' : 'text-[13px]'} font-bold text-slate-800 uppercase tracking-tight leading-tight group-hover:text-blue-600 transition-colors`}>
                            {row.op.description}
                          </h4>
                          {!isCompactMode && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-md flex items-center gap-1.5 border border-slate-200/50">
                                <Layers size={10} className="text-slate-400"/> {row.op.section}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Production Details */}
                      <td className={`px-4 align-top ${isCompactMode ? 'py-2' : 'py-6'}`}>
                        <div className={`flex flex-col ${isCompactMode ? 'gap-1.5' : 'gap-3'}`}>
                          {/* Machine Section */}
                          <div className={`flex items-center bg-indigo-50/30 border border-indigo-100/50 ${isCompactMode ? 'gap-2 p-1.5 rounded-lg' : 'gap-3 p-3 rounded-2xl'}`}>
                            <div className={`${isCompactMode ? 'w-5 h-5' : 'w-8 h-8 rounded-xl'} bg-white shadow-sm flex items-center justify-center text-indigo-500 rounded-md`}>
                              <Monitor size={isCompactMode ? 10 : 16} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              {!isCompactMode && <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Machine Category</span>}
                              <span className={`${isCompactMode ? 'text-[10px]' : 'text-[12px]'} font-bold text-slate-700 truncate`}>{row.cfg.machine || 'Manual'}</span>
                            </div>
                          </div>

                          {/* Material Section */}
                          <div className={`flex items-start bg-amber-50/30 border border-amber-100/50 ${isCompactMode ? 'gap-2 p-1.5 rounded-lg' : 'gap-3 p-3 rounded-2xl'}`}>
                            <div className={`${isCompactMode ? 'w-5 h-5' : 'w-8 h-8 rounded-xl'} bg-white shadow-sm flex items-center justify-center text-amber-500 mt-0.5 shrink-0 rounded-md`}>
                              <Box size={isCompactMode ? 10 : 16} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              {!isCompactMode && <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Material Unit / Code</span>}
                              <span className={`${isCompactMode ? 'text-[10px]' : 'text-[11px]'} font-bold text-slate-700 leading-normal mt-0.5 break-words`}>
                                {row.mat.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tech Specs */}
                      <td className={`px-4 align-top ${isCompactMode ? 'py-2' : 'py-6'}`}>
                        <div className={`grid grid-cols-2 bg-slate-50/80 border border-slate-200/50 ${isCompactMode ? 'gap-1.5 p-2 rounded-xl' : 'gap-3 p-4 rounded-2xl'}`}>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-wider"><Scissors size={10}/> {isCompactMode ? 'Ndl' : 'Needle'}</div>
                            <span className="text-[11px] font-bold text-blue-600 truncate">{row.cfg.needleType || '-'}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-wider"><Hash size={10}/> Sz</div>
                            <span className="text-[11px] font-bold text-slate-800">{row.cfg.needleSize || '-'}</span>
                          </div>
                          <div className={`flex flex-col gap-0.5 col-span-2 border-slate-100 ${isCompactMode ? 'mt-0' : 'mt-1 pt-2 border-t'}`}>
                            {!isCompactMode && <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-wider"><Ruler size={10}/> Seam</div>}
                            <span className="text-[10px] font-semibold text-slate-600 italic leading-snug">{row.cfg.seam || 'Standard'}</span>
                          </div>
                          {row.cfg.stitchCm && (
                            <div className="flex items-center justify-between col-span-2 mt-1 px-2 py-0.5 bg-emerald-50 rounded-lg">
                               <span className="text-[8px] font-black text-emerald-600 uppercase">Stitch</span>
                               <span className="text-[10px] font-black text-emerald-700">{row.cfg.stitchCm}/cm</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Sizes */}
                      <td className={`pr-8 pl-4 align-top ${isCompactMode ? 'py-2' : 'py-6'}`}>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {row.mat.sizes.map((sz, i) => (
                            <span key={i} className={`bg-white border border-slate-200 text-slate-600 font-black rounded shadow-sm hover:border-blue-300 transition-colors cursor-default ${isCompactMode ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]'}`}>
                              {sz}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ));
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <Search size={48} strokeWidth={1} />
                      <p className="text-sm font-bold uppercase tracking-widest">No matching operations found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Modern Footer Info */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center no-print">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Palette size={16} className="text-blue-500" />
              <span className="text-[11px] font-black text-slate-400 uppercase">Colors: <span className="text-slate-900 ml-1">{filteredVariants.length}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-blue-500" />
              <span className="text-[11px] font-black text-slate-400 uppercase">Steps: <span className="text-slate-900 ml-1">{visibleStts.length}</span></span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] flex items-center gap-2">
            <HardDrive size={12}/> TIVSEWING DATA ENGINE V2.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatrixTable;
