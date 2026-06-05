import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { saveAssetsToAlbum, SaveResult } from '@/services/AlbumSaver';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ALBUM_NAME } from '@/constants';

type SaveState = 'saving' | 'success' | 'partial' | 'failed';

export default function SaveCompleteScreen() {
  const { selectedIds: selectedIdsParam } = useLocalSearchParams<{ selectedIds: string }>();
  const selectedIds = selectedIdsParam ? selectedIdsParam.split(',').filter(Boolean) : [];

  const [state, setState] = useState<SaveState>('saving');
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);

  useEffect(() => {
    performSave();
  }, []);

  async function performSave() {
    setState('saving');
    const result = await saveAssetsToAlbum(selectedIds);
    setSaveResult(result);
    if (result.succeeded.length > 0 && result.failed.length === 0) setState('success');
    else if (result.succeeded.length > 0) setState('partial');
    else setState('failed');
  }

  if (state === 'saving') {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>⏳</Text>
        <Text style={styles.subtitle}>正在保存精选照片…</Text>
      </View>
    );
  }

  if (state === 'success') {
    return (
      <View style={styles.container}>
        <View style={styles.circle}>
          <Text style={styles.successEmoji}>✨</Text>
        </View>
        <Text style={styles.title}>已保存 {saveResult?.succeeded.length} 张</Text>
        <Text style={styles.subtitle}>精选照片已存入系统相册</Text>
        <View style={styles.albumTag}>
          <Text style={styles.albumTagText}>📸 {ALBUM_NAME}</Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton title="在系统相册查看" onPress={() => Linking.openURL('photos-redirect://')} />
          <View style={styles.row}>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => Alert.alert('分享功能即将上线')}>
              <Text style={styles.outlineBtnText}>分享给家人</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push('/baby-profile')}>
              <Text style={styles.outlineBtnText}>新增宝宝</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.replace('/scanning')}>
            <Text style={styles.link}>重新整理</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (state === 'partial') {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>⚠️</Text>
        <Text style={styles.title}>部分保存失败</Text>
        <Text style={styles.subtitle}>
          {saveResult?.succeeded.length} 张成功 / {saveResult?.failed.length} 张失败
        </Text>
        <View style={styles.actions}>
          <PrimaryButton title={`重试失败的 ${saveResult?.failed.length} 张`} onPress={performSave} />
          <TouchableOpacity onPress={() => Linking.openURL('photos-redirect://')}>
            <Text style={styles.link}>查看已保存的照片</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // failed
  const reason = saveResult?.failureReason;
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>❌</Text>
      <Text style={styles.title}>保存失败</Text>
      <Text style={styles.subtitle}>
        {reason === 'permission' ? '相册写入权限不足' :
         reason === 'storage' ? '手机存储空间已满' : '发生未知错误'}
      </Text>
      <View style={styles.actions}>
        {reason === 'permission' ? (
          <PrimaryButton title="前往设置开启权限" onPress={() => Linking.openSettings()} />
        ) : reason === 'storage' ? (
          <PrimaryButton title="去系统清理存储" onPress={() => Linking.openSettings()} />
        ) : (
          <PrimaryButton title="重试保存" onPress={performSave} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  circle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, borderColor: '#6C63FF',
    alignItems: 'center', justifyContent: 'center',
  },
  successEmoji: { fontSize: 36 },
  emoji: { fontSize: 56 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  albumTag: {
    backgroundColor: 'rgba(108,99,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  albumTagText: { color: '#A78BFA', fontSize: 13, fontWeight: '600' },
  actions: { width: '100%', gap: 10, marginTop: 24 },
  row: { flexDirection: 'row', gap: 10 },
  outlineBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#333', borderRadius: 12,
    paddingVertical: 10, alignItems: 'center',
  },
  outlineBtnText: { color: '#ccc', fontSize: 14, fontWeight: '600' },
  link: { color: '#666', fontSize: 14, textAlign: 'center', paddingVertical: 4 },
});
