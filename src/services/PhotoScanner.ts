import * as MediaLibrary from 'expo-media-library/legacy';

const MAX_PHOTOS = 1000;
const TOP_N = 20;

function toMs(t: number): number {
  // 兼容秒级（iOS旧版）和毫秒级时间戳
  return t && t < 1e10 ? t * 1000 : t || 0;
}

function qualityScore(a: MediaLibrary.Asset): number {
  let s = 0;

  // 新鲜度（max 3pts）
  const ageDays = (Date.now() - toMs(a.modificationTime)) / 86400000;
  if (ageDays <= 7) s += 3;
  else if (ageDays <= 30) s += 2;
  else if (ageDays <= 90) s += 1;

  // 分辨率（max 3pts）
  const mp = ((a.width || 0) * (a.height || 0)) / 1e6;
  if (mp >= 10) s += 3;
  else if (mp >= 6) s += 2;
  else if (mp >= 3) s += 1;
  else if (mp > 0) s += 0.5;

  // 竖构图加分（max 2pts）
  if (a.width > 0 && a.height > 0) {
    const p = Math.min(a.width / a.height, a.height / a.width);
    if (p >= 0.55 && p <= 0.85) s += 2;
    else if (p >= 0.85 && p <= 1.2) s += 1.5;
  }

  // 截图惩罚
  const isShot =
    (a.width === 1170 && a.height === 2532) ||
    (a.width === 1179 && a.height === 2556) ||
    (a.width === 1290 && a.height === 2796) ||
    (a.width === 1080 && a.height === 1920) ||
    (a.width === 828 && a.height === 1792);
  if (isShot) s -= 3;

  return s;
}

export type ScanResult = {
  photos: (MediaLibrary.Asset & { _score: number; _fScore: number })[];
  totalScanned: number;
  faceDetectionWorked: boolean;
};

export async function scanPhotos(
  onProgress?: (p: number) => void
): Promise<ScanResult> {
  const page = await MediaLibrary.getAssetsAsync({
    mediaType: 'photo',
    sortBy: [['modificationTime', false]],
    first: MAX_PHOTOS,
  });

  const assets = page.assets;
  const total = assets.length;
  if (total === 0) {
    return { photos: [], totalScanned: 0, faceDetectionWorked: false };
  }

  const scored = assets.map((a, i) => {
    if (onProgress) onProgress((i + 1) / total);
    return { ...a, _score: qualityScore(a), _fScore: 0 };
  });

  const photos = [...scored]
    .sort((a, b) => b._score - a._score)
    .slice(0, TOP_N) as unknown as (MediaLibrary.Asset & { _score: number; _fScore: number })[];

  return { photos, totalScanned: total, faceDetectionWorked: false };
}
