
export interface MaterialInfo {
  code: string;
  name: string;
  sizes: string[];
}

export interface OperationConfig {
  variantId: string;
  machine: string;
  attachments: string[];
  applicableSizes: string[];
  needleType: string;
  needleSize: string;
  seam: string;
  stitchCm?: string;
  needleThrow?: string;
  edge?: string;
  modLevel?: string;
  wageGroup?: string;
  detailGeneral: string;
  detailSKU: string;
}

export interface OperationData {
  stt: string;
  description: string;
  section: string;
  configs: OperationConfig[];
  materials: MaterialInfo[];
  allSizes: string[];
}

export interface ProductVariant {
  id: string;
  fileName: string;
  color: string;
  operations: OperationData[];
  uniqueSizes: string[];
}
