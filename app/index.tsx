import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { loadProfiles } from '@/stores/babyProfileStore';
import { getScanResult } from '@/stores/scanResultStore';
import * as MediaLibrary from 'expo-media-library/legacy';

const BULLETS: { icon: string; text: string }[] = [
  { icon: '📷', text: '自动扫描最近相册，无需手动挑选' },
  { icon: '🧠', text: 'AI 评分识别宝宝照片，过滤模糊和重复' },
  { icon: '🔒', text: '所有处理在设备本地完成，不上传' },
  { icon: '💾', text: '一键保存到「稚光精选」相册' },
];

export default function OnboardingScreen() {
  useEffect(() => {
    // Returning user fast-path
    (async () => {
      const perm = await MediaLibrary.getPermissionsAsync();
      const canProceed = perm.status === 'granted' || perm.accessPrivileges === 'limited';
      const profiles = await loadProfiles();
      const result = getScanResult();
      if (canProceed && profiles.length > 0 && result) {
        router.replace('/results');
      }
    })();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🌟</Text>
        <Text style={styles.heroTitle}>{'从几千张照片里\n挑出宝宝最值得留的 20 张'}</Text>
        <Text style={styles.heroSubtitle}>本地分析，照片不会默认上传</Text>
      </View>

      <View style={styles.bullets}>
        {BULLETS.map(b => (
          <View key={b.text} style={styles.bulletRow}>
            <Text style={styles.bulletIcon}>{b.icon}</Text>
            <Text style={styles.bulletText}>{b.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cta}>
        <PrimaryButton title="开始整理" onPress={() => router.push('/permission')} />
        <TouchableOpacity>
          <Text style={styles.privacyLink}>查看隐私说明</Text>
        </TouchableOpacity>
        <Text style={styles.privacyNote}>所有图片仅本地设备处理，不上传云端</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  content: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 80, paddingBottom: 48 },
  hero: { alignItems: 'center', gap: 12 },
  heroEmoji: { fontSize: 64 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 32 },
  heroSubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  bullets: { gap: 14, marginTop: 32 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  bulletIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  bulletText: { fontSize: 14, color: '#ccc', flex: 1, lineHeight: 20 },
  cta: { gap: 10, marginTop: 40 },
  privacyLink: { color: '#888', fontSize: 13, textAlign: 'center', paddingVertical: 4 },
  privacyNote: { color: '#555', fontSize: 11, textAlign: 'center' },
});
