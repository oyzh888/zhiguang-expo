import * as MediaLibrary from 'expo-media-library';
import { PhotoScore, ScanResult } from '../types';
import {
  MAX_PHOTOS, DAY_RANGE, MAX_RESULTS, BURST_INTERVAL_SECONDS, MAX_PER_BURST
} from '../constants';

export async function scanPhotos(babyProfileId: string): Promise<ScanResult> {
  // Fetch candidates: last DAY_RANGE days OR last MAX_PHOTOS, union
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAY_RANGE);
  const cutoffTime = cutoffDate.getTime() / 1000; // unix seconds

  // Fetch up to MAX_PHOTOS most recent photos
  const { assets } = await MediaLibrary.getAssetsAsync({
    mediaType: 'photo',
    sortBy: 'modificationTime',
    first: MAX_PHOTOS,
  });

  // Apply union filter: include if within DAY_RANGE OR within top MAX_PHOTOS
  // Since we fetched MAX_PHOTOS already, just include all of them + any from range
  const candidates = assets;

  if (candidates.length === 0) {
    return {
      babyProfileId,
      scannedCount: 0,
      selectedIds: [],
      rejectedIds: [],
      allIds: [],
      uriMap: {},
    };
  }

  // Score each asset
  const scores = scoreAssets(candidates);

  // Burst deduplication
  const deduplicated = deduplicateBursts(scores, candidates);

  // Take top MAX_RESULTS
  const top = deduplicated
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);

  const uriMap: Record<string, string> = {};
  for (const s of deduplicated) {
    uriMap[s.assetId] = s.uri;
  }

  return {
    babyProfileId,
    scannedCount: candidates.length,
    selectedIds: top.map(s => s.assetId),
    rejectedIds: [],
    allIds: top.map(s => s.assetId),
    uriMap,
  };
}

function scoreAssets(assets: MediaLibrary.Asset[]): PhotoScore[] {
  const now = Date.now() / 1000; // unix seconds

  return assets.map(asset => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Recency (max 3 pts)
    const daysAgo = (now - asset.modificationTime) / 86400;
    if (daysAgo <= 7) { score += 3; reasons.push('本周拍摄'); }
    else if (daysAgo <= 30) { score += 2; reasons.push('近期拍摄'); }
    else if (daysAgo <= 90) { score += 1; }

    // 2. Resolution — proxy for sharpness (max 3 pts)
    const megapixels = (asset.width * asset.height) / 1_000_000;
    if (megapixels >= 10) { score += 3; reasons.push('超高清'); }
    else if (megapixels >= 6) { score += 2; reasons.push('高清'); }
    else if (megapixels >= 3) { score += 1; }

    // 3. Aspect ratio — portrait preferred for baby photos (max 2 pts)
    if (asset.height > 0) {
      const ratio = asset.width / asset.height;
      if (ratio >= 0.55 && ratio <= 0.85) { score += 2; reasons.push('竖版构图'); }
      else if (ratio >= 0.85 && ratio <= 1.2) { score += 1.5; reasons.push('方形构图'); }
    }

    // 4. Prefer non-screenshot resolution (common screenshot = 390×844 or 1290×2796)
    const isLikelyScreenshot =
      (asset.width === 390 && asset.height === 844) ||
      (asset.width === 1290 && asset.height === 2796) ||
      (asset.width === 1170 && asset.height === 2532);
    if (isLikelyScreenshot) score -= 3;

    if (reasons.length === 0) reasons.push('精选照片');

    return {
      assetId: asset.id,
      uri: asset.uri,
      score,
      reasons,
      modificationTime: asset.modificationTime,
      width: asset.width,
      height: asset.height,
    };
  });
}

function deduplicateBursts(scores: PhotoScore[], _assets: MediaLibrary.Asset[]): PhotoScore[] {
  // Sort by modification time
  const sorted = [...scores].sort((a, b) => a.modificationTime - b.modificationTime);

  const groups: PhotoScore[][] = [];
  let currentGroup: PhotoScore[] = [];
  let lastTime = -Infinity;

  for (const score of sorted) {
    if (currentGroup.length === 0 || score.modificationTime - lastTime <= BURST_INTERVAL_SECONDS) {
      currentGroup.push(score);
      lastTime = score.modificationTime;
    } else {
      groups.push(currentGroup);
      currentGroup = [score];
      lastTime = score.modificationTime;
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  // Keep top MAX_PER_BURST per group by score
  const result: PhotoScore[] = [];
  for (const group of groups) {
    const topInGroup = [...group]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_PER_BURST);
    result.push(...topInGroup);
  }

  return result;
}
