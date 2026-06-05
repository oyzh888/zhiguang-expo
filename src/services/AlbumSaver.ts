import * as MediaLibrary from 'expo-media-library';
import { ALBUM_NAME } from '../constants';

export interface SaveResult {
  succeeded: string[];
  failed: string[];
  failureReason?: 'permission' | 'storage' | 'unknown';
}

export async function saveAssetsToAlbum(assetIds: string[]): Promise<SaveResult> {
  try {
    // Get MediaLibrary permission for write
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    if (status !== 'granted') {
      return { succeeded: [], failed: assetIds, failureReason: 'permission' };
    }

    // Fetch asset objects for the selected IDs
    const assetObjects: MediaLibrary.Asset[] = [];
    for (const id of assetIds) {
      try {
        const info = await MediaLibrary.getAssetInfoAsync(id);
        if (info) assetObjects.push(info);
      } catch {
        // skip individual failures
      }
    }

    if (assetObjects.length === 0) {
      return { succeeded: [], failed: assetIds, failureReason: 'unknown' };
    }

    // Find or create the album
    let album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);

    if (!album) {
      // Create album with first asset
      album = await MediaLibrary.createAlbumAsync(ALBUM_NAME, assetObjects[0], false);
      const remaining = assetObjects.slice(1);
      if (remaining.length > 0) {
        await MediaLibrary.addAssetsToAlbumAsync(remaining, album, false);
      }
    } else {
      await MediaLibrary.addAssetsToAlbumAsync(assetObjects, album, false);
    }

    return {
      succeeded: assetIds,
      failed: [],
    };
  } catch (error: unknown) {
    const msg = (error instanceof Error) ? error.message : '';
    const reason: SaveResult['failureReason'] =
      msg.includes('permission') ? 'permission' :
      msg.includes('storage') || msg.includes('space') ? 'storage' : 'unknown';
    return { succeeded: [], failed: assetIds, failureReason: reason };
  }
}
