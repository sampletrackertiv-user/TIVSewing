
import React, { useState, useCallback } from 'react';
import { ProductVariant } from './types';
import { parseGarmentCSV } from './services/parserService';
import MatrixTable from './components/MatrixTable';
import { Upload, Trash2, Plus, Info, FileStack, LayoutGrid } from 'lucide-react';

const App: React.FC = () => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let files: FileList | null = null;
    if ('dataTransfer' in event) {
      event.preventDefault();
      files = event.dataTransfer.files;
      setIsDragging(false);
    } else {
      files = event.target.files;
    }
    if (!files || files.length === 0) return;
    
    setError(null);
    let updatedVariants = [...variants];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) continue;
      try {
        const content = await file.text();
        const parsedResults = parseGarmentCSV(content, file.name);
        
        parsedResults.forEach(parsed => {
          const exists = updatedVariants.findIndex(v => v.color === parsed.color);
          if (exists >= 0) {
            updatedVariants[exists] = parsed;
          } else {
            updatedVariants.push(parsed);
          }
        });
      } catch (err) {
        setError(`Error: Could not parse ${file.name}`);
      }
    }
    setVariants(updatedVariants);
  }, [variants]);

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Modern Slim Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-8 sticky top-0 z-[110] no-print">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
              <LayoutGrid className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">
                TIV<span className="text-blue-600">Sewing</span>
              </h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Matrix Studio</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {variants.length > 0 && (
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Database Status</span>
                  <span className="text-[11px] font-bold text-emerald-500 uppercase flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    {variants.length} Colors Synchronized
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-100"></div>
                <button 
                  onClick={() => setVariants([])} 
                  className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  title="Clear All"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-8 md:p-12">
        {variants.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileUpload}
              className={`
                w-full max-w-2xl p-24 border-2 border-dashed rounded-[3.5rem] transition-all relative group
                ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-slate-200 bg-white hover:border-slate-300'}
              `}
            >
              <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="flex flex-col items-center text-center gap-8">
                <div className="w-28 h-28 bg-slate-50 rounded-[2.5rem] flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  <Upload className={`w-12 h-12 transition-all ${isDragging ? 'text-blue-500 scale-110' : 'text-slate-300'}`} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sync Production Files</h2>
                  <p className="text-slate-400 mt-3 text-base font-medium max-w-sm mx-auto">Drop your CSV files here to generate the master operation matrix.</p>
                </div>
              </div>
            </div>
            <div className="mt-12 flex items-center gap-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
               <div className="flex items-center gap-2"><FileStack size={14}/> Support Multiple CSV</div>
               <div className="flex items-center gap-2"><LayoutGrid size={14}/> Auto-Grouping OP</div>
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end no-print">
              <div>
                <span className="text-[11px] font-black text-blue-500 uppercase tracking-[0.3em]">Management Console</span>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter mt-1">Operation Summary</h2>
              </div>
              <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-[1.5rem] text-[13px] font-bold transition-all flex items-center gap-3 shadow-xl shadow-slate-200 active:scale-95 group">
                <Plus size={20} className="group-hover:rotate-90 transition-transform" /> 
                Add More Colors
                <input type="file" multiple onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-center gap-4 text-rose-700 text-sm font-bold animate-in bounce-in">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm shadow-rose-100">
                  <Info size={20} />
                </div>
                {error}
              </div>
            )}

            <MatrixTable variants={variants} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
