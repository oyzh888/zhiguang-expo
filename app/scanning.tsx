import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { scanPhotos } from '@/services/PhotoScanner';
import { setScanResult } from '@/stores/scanResultStore';
import { ScanResult } from '@/types';

type Phase = 'scanning' | 'noBaby' | 'empty' | 'done' | 'error';

export default function ScanningScreen() {
  const { babyId } = useLocalSearchParams<{ babyId: string }>();
  const [phase, setPhase] = useState<Phase>('scanning');
  const [count, setCount] = useState(0);
  const [stage, setStage] = useState('读取照片…');
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startScan();
  }, []);

  async function startScan() {
    setPhase('scanning');
    setStage('读取照片…');

    const animate = (to: number, duration: number) =>
      Animated.timing(progressAnim, { toValue: to, duration, useNativeDriver: false }).start();

    animate(0.15, 500);

    try {
      const result = await scanPhotos((progress) => {
        if (progress < 0.5) {
          setStage('分析照片质量…');
        } else {
          setStage('人脸识别中…');
        }
        animate(progress * 0.9, 300);
      });

      setCount(result.totalScanned);
      animate(0.95, 500);
      setStage('生成精选结果…');
      await new Promise(r => setTimeout(r, 600));
      animate(1.0, 300);

      // Convert PhotoScanner.ScanResult → src/types.ScanResult
      const selectedIds = result.photos.map(p => p.id);
      const uriMap: Record<string, string> = {};
      for (const p of result.photos) {
        uriMap[p.id] = p.uri;
      }
      const scanResult: ScanResult = {
        babyProfileId: babyId ?? '',
        scannedCount: result.totalScanned,
        selectedIds,
        rejectedIds: [],
        allIds: selectedIds,
        uriMap,
      };
      setScanResult(scanResult);

      if (result.totalScanned === 0) {
        setPhase('empty');
      } else if (selectedIds.length === 0) {
        setPhase('noBaby');
      } else {
        setPhase('done');
        await new Promise(r => setTimeout(r, 400));
        router.replace('/results');
      }
    } catch (_e) {
      setPhase('error');
    }
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (phase === 'scanning') {
    return (
      <View style={styles.container}>
        <Text style={styles.countNum}>{count}</Text>
        <Text style={styles.countLabel}>已扫描</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
        <Text style={styles.stage}>{stage}</Text>
        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>🔒 所有分析在设备本地完成，照片不会上传</Text>
        </View>
      </View>
    );
  }

  if (phase === 'noBaby') {
    return (
      <View style={styles.container}>
        <Text style={styles.stateEmoji}>😶</Text>
        <Text style={styles.stateTitle}>未发现宝宝照片</Text>
        <Text style={styles.stateSubtitle}>在扫描范围内没有找到宝宝的清晰照片</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.borderedBtn} onPress={startScan}>
            <Text style={styles.borderedBtnText}>全量扩容扫描</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.ghostLink}>返回上次结果</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (phase === 'empty') {
    return (
      <View style={styles.container}>
        <Text style={styles.stateEmoji}>📭</Text>
        <Text style={styles.stateTitle}>相册为空</Text>
        <Text style={styles.stateSubtitle}>暂无系统照片，前往相册添加图片后再试</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.ghostLink}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.stateEmoji}>❌</Text>
        <Text style={styles.stateTitle}>扫描失败</Text>
        <TouchableOpacity style={styles.borderedBtn} onPress={startScan}>
          <Text style={styles.borderedBtnText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  countNum: { fontSize: 64, fontWeight: '900', color: '#fff' },
  countLabel: { fontSize: 12, color: '#888' },
  progressTrack: { width: '100%', height: 4, backgroundColor: '#1a1a2e', borderRadius: 2, overflow: 'hidden', marginTop: 8 },
  progressBar: { height: 4, backgroundColor: '#6C63FF', borderRadius: 2 },
  stage: { fontSize: 12, color: '#888', marginTop: 4 },
  privacyNote: { backgroundColor: 'rgba(108,99,255,0.1)', borderRadius: 10, padding: 12, marginTop: 24 },
  privacyText: { fontSize: 12, color: '#6C63FF', textAlign: 'center' },
  stateEmoji: { fontSize: 64 },
  stateTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  stateSubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  actions: { gap: 12, marginTop: 16, width: '100%' },
  borderedBtn: { borderWidth: 1.5, borderColor: '#444', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  borderedBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  ghostLink: { color: '#666', fontSize: 14, textAlign: 'center', paddingVertical: 6 },
});
