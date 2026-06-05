export interface BabyProfile {
  id: string;
  nickname: string;
  birthday?: string; // ISO date string
  gender?: 'boy' | 'girl';
  createdAt: string;
}

export interface PhotoScore {
  assetId: string;
  uri: string;
  score: number;
  reasons: string[];
  modificationTime: number;
  width: number;
  height: number;
}

export interface ScanResult {
  babyProfileId: string;
  scannedCount: number;
  selectedIds: string[];
  rejectedIds: string[];
  allIds: string[];
  uriMap: Record<string, string>; // assetId -> uri
}
