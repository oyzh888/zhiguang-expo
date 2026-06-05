import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function PermissionBanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.text}>当前仅获取部分相册，照片筛选结果可能不完整</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 200, 0, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#FFD600',
  },
  icon: { fontSize: 13 },
  text: { color: '#FFD600', fontSize: 12, flex: 1 },
});
