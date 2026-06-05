import * as MediaLibrary from 'expo-media-library/legacy';
import FaceDetection from '@react-native-ml-kit/face-detection';

const MAX_PHOTOS = 1000;
const CANDIDATES = 60; // 只对质量 Top60 跑人脸检测
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

// 人脸评分：-2 ~ +4
// 大脸 = 宝宝近景；无脸 = 风景/食物
function faceScore(
  faces: Array<{ frame: { width: number; height: number } }>,
  imgW: number,
  imgH: number
): number {
  if (!faces || faces.length === 0) return -2;
  const imgArea = (imgW || 1) * (imgH || 1);
  let maxRatio = 0;
  for (const f of faces) {
    const fa = (f.frame.width || 0) * (f.frame.height || 0);
    const ratio = fa / imgArea;
    if (ratio > maxRatio) maxRatio = ratio;
  }
  if (maxRatio > 0.20) return 4; // 脸占 >20%：大头近景
  if (maxRatio > 0.10) return 3; // >10%：人像
  if (maxRatio > 0.04) return 2; // >4%：中景
  return 1;                       // 有脸但很小
}

export type ScanResult = {
  photos: (MediaLibrary.Asset & { _score: number; _fScore: number })[];
  totalScanned: number;
  faceDetectionWorked: boolean;
};

export async function scanPhotos(
  onProgress?: (p: number) => void
): Promise<ScanResult> {
  // Phase 1：加载全部照片，快速质量评分（进度 0→50%）
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

  const quickScored = assets.map((a, i) => {
    if (onProgress) onProgress(((i + 1) / total) * 0.5);
    return { ...a, _score: qualityScore(a), _fScore: 0 };
  });

  // 取质量 Top60 做人脸检测
  const candidates = [...quickScored]
    .sort((a, b) => b._score - a._score)
    .slice(0, CANDIDATES);

  // Phase 2：对 Top60 跑人脸检测（进度 50→100%）
  let faceDetectionWorked = false;
  for (let i = 0; i < candidates.length; i++) {
    if (onProgress) onProgress(0.5 + ((i + 1) / candidates.length) * 0.5);
    const c = candidates[i];
    try {
      const info = await MediaLibrary.getAssetInfoAsync(c.id);
      const uri = info.localUri || info.uri;
      if (uri) {
        const faces = await FaceDetection.detect(uri, {
          performanceMode: 'fast',
          landmarkMode: 'none',
          classificationMode: 'none',
        });
        c._fScore = faceScore(faces, c.width, c.height);
        faceDetectionWorked = true;
      }
    } catch {
      // 单张失败不影响整体
    }
  }

  // 最终得分：质量 60% + 人脸 40%（仅当人脸检测成功时）
  const finalScored = candidates.map(c => ({
    ...c,
    _score: faceDetectionWorked
      ? c._score * 0.6 + c._fScore * (6.5 / 4) * 0.4
      : c._score,
  }));

  const photos = finalScored
    .sort((a, b) => b._score - a._score)
    .slice(0, TOP_N) as unknown as (MediaLibrary.Asset & { _score: number; _fScore: number })[];

  return { photos, totalScanned: total, faceDetectionWorked };
}
