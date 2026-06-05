import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import * as MediaLibrary from 'expo-media-library/legacy';
import { PrimaryButton } from '@/components/PrimaryButton';

const COMMITMENTS = [
  '所有分析在设备本地完成',
  '照片不会自动上传到服务器',
  '不会删除您的任何照片',
];

export default function PermissionScreen() {
  const [isRequesting, setIsRequesting] = useState(false);

  async function requestPermission() {
    setIsRequesting(true);
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setIsRequesting(false);

    if (status === 'granted' || (status as string) === 'limited') {
      router.push('/baby-profile');
    } else {
      Alert.alert(
        '相册权限未开启',
        '缺少相册权限无法自动扫描。可去设置开启。',
        [
          { text: '前往系统设置', onPress: () => Linking.openSettings() },
          { text: '取消', style: 'cancel' },
        ]
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.emoji}>📂</Text>
        <Text style={styles.title}>需要访问您的相册</Text>
        <Text style={styles.subtitle}>稚光需要读取您的照片，在本地识别并筛选宝宝照片</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>我们承诺</Text>
        {COMMITMENTS.map(c => (
          <View key={c} style={styles.commitmentRow}>
            <Text style={styles.checkIcon}>✅</Text>
            <Text style={styles.commitmentText}>{c}</Text>
          </View>
        ))}
      </View>

      <View style={styles.bottom}>
        <PrimaryButton title="授权访问相册" onPress={requestPermission} isLoading={isRequesting} />
        <TouchableOpacity>
          <Text style={styles.link}>查看完整隐私政策</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a', paddingHorizontal: 24 },
  top: { alignItems: 'center', gap: 12, paddingTop: 48 },
  emoji: { fontSize: 56 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 16, marginTop: 24, gap: 10 },
  cardLabel: { fontSize: 11, color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  commitmentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkIcon: { fontSize: 14 },
  commitmentText: { fontSize: 14, color: '#ccc' },
  bottom: { position: 'absolute', bottom: 48, left: 24, right: 24, gap: 10 },
  link: { color: '#888', fontSize: 13, textAlign: 'center', paddingVertical: 4 },
});
