
import React, { useState, useMemo } from 'react';
import { ProductVariant } from '../types';
import { 
  Download, Printer, Filter, Palette, Layers, Search, X, 
  CheckSquare, Square, ChevronDown, Monitor, Scissors, Settings2, 
  Cpu, Hash, Ruler, Tag, FileText 
} from 'lucide-react';

interface MatrixTableProps {
  variants: ProductVariant[];
}

const MatrixTable: React.FC<MatrixTableProps> = ({ variants }) => {
  const [selectedColors, setSelectedColors] = useState<string[]>(variants.map(v => v.color));
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');

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

  return (
    <div className="space-y-6">
      {/* Dynamic Action Bar */}
      <div className="no-print space-y-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[13px] font-bold transition-all shadow-sm ${
                  showFilter ? 'bg-slate-900 text-white shadow-slate-200' : 'bg-white text-slate-700 hover:border-slate-300 border border-slate-200'
                }`}
              >
                <Filter size={16} /> 
                Filter Colors
                <div className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
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
            
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full text-[11px] font-bold text-slate-400 border border-slate-100">
              <Monitor size={12} />
              Viewing {filteredVariants.length} of {allColors.length} colors
            </div>
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
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden print-container">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="pl-8 pr-4 py-6 w-[100px] text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">OP Step</th>
                <th className="px-4 py-6 w-[120px] text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Color</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Process Description</th>
                <th className="px-4 py-6 w-[200px] text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Production Details</th>
                <th className="px-4 py-6 w-[280px] text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tech Specifications</th>
                <th className="pr-8 pl-4 py-6 w-[220px] text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Garment Sizes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allStts.map((stt, sttIdx) => {
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
                    {/* OP Number - Primary */}
                    <td className="pl-8 pr-4 py-6 align-top">
                      {rowIdx === 0 ? (
                        <div className="flex flex-col">
                          <span className="text-xl font-black text-slate-900">{stt}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">ID-{row.cfg.variantId}</span>
                        </div>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 ml-3"></div>
                      )}
                    </td>

                    {/* Color Code - Primary */}
                    <td className="px-4 py-6 align-top">
                      <div className="inline-flex items-center px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-black shadow-sm">
                        {row.v.color}
                      </div>
                    </td>

                    {/* Description - Primary */}
                    <td className="px-4 py-6 align-top">
                      <div className="flex flex-col gap-1 max-w-md">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                          {row.op.description}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Layers size={10} /> {row.op.section}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Machine & Material - Secondary */}
                    <td className="px-4 py-6 align-top">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <Monitor size={14} className="text-slate-300 mt-0.5" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Machine Type</span>
                            <span className="text-[11px] font-bold text-slate-700">{row.cfg.machine || 'Manual'}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Settings2 size={14} className="text-slate-300 mt-0.5" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Material Unit</span>
                            <span className="text-[11px] font-bold text-slate-600 line-clamp-2">{row.mat.name}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Tech Specs - Detailed */}
                    <td className="px-4 py-6 align-top">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase"><Scissors size={10}/> Needle</div>
                          <span className="text-[11px] font-bold text-blue-600">{row.cfg.needleType || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase"><Hash size={10}/> N.Size</div>
                          <span className="text-[11px] font-bold text-slate-800">{row.cfg.needleSize || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase"><Ruler size={10}/> Seam</div>
                          <span className="text-[11px] font-bold text-slate-600 truncate" title={row.cfg.seam}>{row.cfg.seam || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase"><Settings2 size={10}/> Stitch</div>
                          <span className="text-[11px] font-bold text-emerald-600">{row.cfg.stitchCm ? `${row.cfg.stitchCm}/cm` : '-'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Sizes - Secondary */}
                    <td className="pr-8 pl-4 py-6 align-top">
                      <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                        {row.mat.sizes.map((sz, i) => (
                          <span key={i} className="px-2 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-black rounded-lg shadow-sm">
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
        
        {/* Modern Footer Info */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center no-print">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Palette size={16} className="text-blue-500" />
              <span className="text-[11px] font-black text-slate-400 uppercase">Colors: <span className="text-slate-900 ml-1">{filteredVariants.length}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-blue-500" />
              <span className="text-[11px] font-black text-slate-400 uppercase">Process Steps: <span className="text-slate-900 ml-1">{allStts.length}</span></span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} TIVSewing System
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatrixTable;
