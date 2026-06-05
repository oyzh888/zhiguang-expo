import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { getScanResult, setScanResult } from '@/stores/scanResultStore';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScanResult } from '@/types';

const COLS = 3;
const GAP = 4;
const SIZE = (Dimensions.get('window').width - GAP * (COLS + 1)) / COLS;

interface PhotoCardProps {
  assetId: string;
  uri: string;
  isRejected: boolean;
  onRemove: () => void;
  onRestore: () => void;
}

function PhotoCard({ uri, isRejected, onRemove, onRestore }: PhotoCardProps) {
  return (
    <View style={[styles.card, isRejected && styles.cardRejected]}>
      <Image source={{ uri }} style={styles.cardImage} resizeMode="cover" />
      {isRejected && (
        <View style={styles.overlay} />
      )}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={isRejected ? onRestore : onRemove}
      >
        <Text style={styles.actionBtnText}>{isRejected ? '↩' : '✕'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ResultsScreen() {
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    setResult(getScanResult());
  }, []);

  if (!result) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyTitle}>没有扫描结果</Text>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.link}>返回首页</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedCount = result.selectedIds.length;

  function handleRemove(assetId: string) {
    const updated = {
      ...result!,
      selectedIds: result!.selectedIds.filter(id => id !== assetId),
      rejectedIds: [...result!.rejectedIds, assetId],
    };
    setScanResult(updated);
    setResult(updated);
  }

  function handleRestore(assetId: string) {
    const updated = {
      ...result!,
      rejectedIds: result!.rejectedIds.filter(id => id !== assetId),
      selectedIds: [...result!.selectedIds, assetId],
    };
    setScanResult(updated);
    setResult(updated);
  }

  function handleSave() {
    router.push({
      pathname: '/save-complete',
      params: { selectedIds: result!.selectedIds.join(',') },
    });
  }

  if (result.allIds.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.stateEmoji}>📭</Text>
        <Text style={styles.emptyTitle}>暂无宝宝照片</Text>
        <Text style={styles.emptySubtitle}>已移除全部推荐照片</Text>
        <PrimaryButton title="重新全量扫描" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <FlatList
        data={result.allIds}
        keyExtractor={id => id}
        numColumns={COLS}
        contentContainerStyle={styles.grid}
        renderItem={({ item: id }) => (
          <PhotoCard
            assetId={id}
            uri={result.uriMap[id] ?? ''}
            isRejected={result.rejectedIds.includes(id)}
            onRemove={() => handleRemove(id)}
            onRestore={() => handleRestore(id)}
          />
        )}
      />
      {selectedCount > 0 && (
        <View style={styles.saveBar}>
          <PrimaryButton
            title={`保存精选 ${selectedCount} 张到相册`}
            onPress={handleSave}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#0d0d1a' },
  container: { flex: 1, backgroundColor: '#0d0d1a', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  grid: { padding: GAP },
  card: { width: SIZE, height: SIZE, margin: GAP / 2, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  cardRejected: { opacity: 0.3 },
  cardImage: { width: SIZE, height: SIZE },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', opacity: 0.4 },
  actionBtn: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12,
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  saveBar: { padding: 16, paddingBottom: 32, width: '100%' },
  stateEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  link: { color: '#6C63FF', fontSize: 14, marginTop: 12 },
});
