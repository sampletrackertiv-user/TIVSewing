
import { OperationData, ProductVariant, MaterialInfo, OperationConfig } from '../types';

const splitCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
};

const parseExportedSummary = (lines: string[][]): ProductVariant[] => {
  const variantsMap: Record<string, ProductVariant> = {};

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length < 8) continue;

    const [opId, vId, section, color, desc, machine, matName, techSpecs, sizesStr, mod, wage] = row;
    const sizes = sizesStr.split(/\s+/).filter(s => s.length > 0);

    if (!variantsMap[color]) {
      variantsMap[color] = {
        id: `import-${color}-${Date.now()}`,
        fileName: `imported-${color}.csv`,
        color: color,
        operations: [],
        uniqueSizes: []
      };
    }

    const variant = variantsMap[color];
    let operation = variant.operations.find(o => o.stt === opId);
    if (!operation) {
      operation = {
        stt: opId, description: desc, section, configs: [], materials: [], allSizes: []
      };
      variant.operations.push(operation);
    }

    let config = operation.configs.find(c => c.variantId === vId);
    if (!config) {
      const nType = techSpecs.match(/Type:\s*([^|]+)/)?.[1] || "";
      const nSize = techSpecs.match(/N\.Size:\s*([^|]+)/)?.[1] || "";
      const seam = techSpecs.match(/Seam:\s*([^|]+)/)?.[1] || "";
      const st = techSpecs.match(/Stitch:\s*([^|]+)/)?.[1] || "";
      const th = techSpecs.match(/Throw:\s*([^|]+)/)?.[1] || "";

      config = {
        variantId: vId, machine, attachments: [], applicableSizes: sizes,
        needleType: nType.trim(), needleSize: nSize.trim(), seam: seam.trim(),
        stitchCm: st.trim(), needleThrow: th.trim(), modLevel: mod, wageGroup: wage,
        detailGeneral: "", detailSKU: ""
      };
      operation.configs.push(config);
    }

    if (!operation.materials.some(m => m.name === matName)) {
      operation.materials.push({ code: matName.split(/\s+/)[0], name: matName, sizes });
    }

    variant.uniqueSizes = Array.from(new Set([...variant.uniqueSizes, ...sizes])).sort();
    operation.allSizes = Array.from(new Set([...operation.allSizes, ...sizes])).sort();
  }
  return Object.values(variantsMap);
};

export const parseGarmentCSV = (csvContent: string, fileName: string): ProductVariant[] => {
  const cleanContent = csvContent.replace(/^\uFEFF/, '');
  const lines = cleanContent.split(/\r?\n/).filter(l => l.trim().length > 0).map(splitCSVLine);

  if (lines[0] && (lines[0][0] === "OP" || lines[0][0] === "STT")) {
    return parseExportedSummary(lines);
  }

  let detectedColor = "";
  for (const row of lines) {
    const rowString = row.join(' ');
    const colorMatch = rowString.match(/R\d{6,10}\s+([A-Z0-9]{3,6})\s+/i);
    if (colorMatch && colorMatch[1]) {
      const potential = colorMatch[1].toUpperCase();
      if (!/^\d{3}[A-Z]$/.test(potential)) {
        detectedColor = potential;
        break;
      }
    }
  }

  if (!detectedColor) {
    const parts = fileName.replace(/\.[^/.]+$/, "").split(/[-_ ]/);
    detectedColor = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "STD";
  }

  const operations: OperationData[] = [];
  let currentOp: OperationData | null = null;
  let currentConfig: OperationConfig | null = null;
  let inMaterialSection = false;
  let currentSection = "SEWING";

  const getVal = (row: string[], cell0: string) => {
    if (row[1]) return row[1].trim();
    if (cell0.includes(':')) return cell0.split(':')[1].trim();
    return "";
  };

  const extractSizes = (text: string): string[] => {
    if (!text) return [];
    return text.split(/[\s,;]+/)
      .map(s => s.trim().toUpperCase().replace(/^"|"$/g, ''))
      .filter(s => s.length > 0 && !['VARIANT', 'SIZE', 'RANGE', 'NOTE', 'DEPARTMENT', 'SECTION'].includes(s));
  };

  for (let i = 0; i < lines.length; i++) {
    const row = lines[i];
    const cell0 = (row[0] || "").trim();
    const cell0L = cell0.toLowerCase();

    if (cell0L.includes('production section')) {
      currentSection = getVal(row, cell0) || currentSection;
      if (currentOp) currentOp.section = currentSection;
      continue;
    }

    if (/^\d{3}$/.test(cell0)) {
      currentOp = {
        stt: cell0, description: row[2] || row[1] || "N/A", section: currentSection,
        configs: [], materials: [], allSizes: []
      };
      operations.push(currentOp);
      inMaterialSection = false;
      currentConfig = null;
      continue;
    }

    if (!currentOp) continue;

    if (cell0L.includes('variant:')) {
      const match = cell0.match(/variant:\s*(\d+)/i);
      const vId = match ? match[1].padStart(3, '0') : "000";
      const vSizes = extractSizes(row[1] || row[2] || "");
      currentConfig = {
        variantId: vId, machine: "", attachments: [], applicableSizes: vSizes,
        needleType: "", needleSize: "", seam: "", detailGeneral: "", detailSKU: ""
      };
      currentOp.configs.push(currentConfig);
      currentOp.allSizes = Array.from(new Set([...currentOp.allSizes, ...vSizes]));
      continue;
    }

    if (currentConfig) {
      if (cell0L.includes('machine :')) currentConfig.machine = getVal(row, cell0);
      else if (cell0L.includes('needle type :')) currentConfig.needleType = getVal(row, cell0);
      else if (cell0L.includes('needle size :')) {
        currentConfig.needleSize = getVal(row, cell0);
        const stMatch = row.join(',').match(/stitch\s*\/\s*cm\s*:\s*([\d.]+)/i);
        const thMatch = row.join(',').match(/needle\s*throw\s*\/\s*mm\s*:\s*([\d.]+)/i);
        if (stMatch) currentConfig.stitchCm = stMatch[1];
        if (thMatch) currentConfig.needleThrow = thMatch[1];
      }
      else if (cell0L.includes('description seam :')) {
        currentConfig.seam = getVal(row, cell0);
        const edgeMatch = currentConfig.seam.match(/edge\/mm\s*([\d.]+)/i);
        if (edgeMatch) currentConfig.edge = edgeMatch[1];
      }
      else if (cell0L.includes('modification level')) currentConfig.modLevel = getVal(row, cell0);
      else if (cell0L.includes('wage group')) currentConfig.wageGroup = getVal(row, cell0);
      else if (cell0L.includes('description detail general')) currentConfig.detailGeneral = getVal(row, cell0);
      else if (cell0L.includes('description detail sku')) currentConfig.detailSKU = getVal(row, cell0);
      else if (cell0L.includes('attachments :')) {
        const at = getVal(row, cell0);
        if (at) currentConfig.attachments.push(at);
      }
    }

    if (cell0L === 'material :') { inMaterialSection = true; continue; }
    if (inMaterialSection && row[0] && !row[0].toLowerCase().includes('inteos')) {
      const matName = row[0].trim();
      const matSizes = extractSizes(row[1] || "");
      const finalSizes = matSizes.length > 0 ? matSizes : (currentConfig?.applicableSizes || currentOp.allSizes);
      if (matName.length > 5) {
        currentOp.materials.push({ code: matName.split(/\s+/)[0], name: matName, sizes: finalSizes });
      }
    }
  }

  operations.forEach(op => {
    if (op.allSizes.length === 0) op.allSizes = Array.from(new Set(op.materials.flatMap(m => m.sizes)));
    op.configs.forEach(cfg => { if (cfg.applicableSizes.length === 0) cfg.applicableSizes = op.allSizes; });
    op.materials.forEach(mat => { if (mat.sizes.length === 0) mat.sizes = op.allSizes; });
  });

  return [{
    id: fileName + "-" + Date.now(),
    fileName, color: detectedColor, operations,
    uniqueSizes: Array.from(new Set(operations.flatMap(op => op.allSizes))).sort()
  }];
};
