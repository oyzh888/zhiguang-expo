import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { createProfile, saveProfile, loadDraft, clearDraft } from '@/stores/babyProfileStore';

type Gender = 'boy' | 'girl' | undefined;

export default function BabyProfileScreen() {
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<Gender>(undefined);
  const [nicknameError, setNicknameError] = useState(false);

  useEffect(() => {
    loadDraft().then(d => {
      if (d?.nickname) setNickname(d.nickname);
      if (d?.gender) setGender(d.gender as Gender);
    });
  }, []);

  async function handleNext() {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameError(true);
      return;
    }
    const profile = createProfile(trimmed, undefined, gender);
    await saveProfile(profile);
    await clearDraft();
    router.push({ pathname: '/scanning', params: { babyId: profile.id } });
  }

  async function handleSkip() {
    const trimmed = nickname.trim();
    const nick = trimmed || '我的宝宝';
    const profile = createProfile(nick, undefined, gender);
    await saveProfile(profile);
    await clearDraft();
    router.push({ pathname: '/scanning', params: { babyId: profile.id } });
  }

  const genderOptions: { value: Gender; label: string }[] = [
    { value: undefined, label: '暂不填' },
    { value: 'boy', label: '👦 男宝' },
    { value: 'girl', label: '👧 女宝' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>填写宝宝信息，帮助 AI 更准确地识别照片</Text>

      {/* Nickname */}
      <View style={styles.field}>
        <Text style={styles.label}>宝宝昵称 *</Text>
        <View style={[styles.inputWrap, nicknameError && styles.inputError]}>
          <TextInput
            style={styles.input}
            placeholder="请输入昵称"
            placeholderTextColor="#555"
            value={nickname}
            onChangeText={t => { setNickname(t); if (t) setNicknameError(false); }}
          />
          {nickname.length > 0 && <Text style={styles.checkmark}>✅</Text>}
        </View>
        {nicknameError && <Text style={styles.errorText}>请填写宝宝昵称，用于照片分组</Text>}
      </View>

      {/* Gender */}
      <View style={styles.field}>
        <Text style={styles.label}>性别</Text>
        <View style={styles.genderRow}>
          {genderOptions.map(opt => (
            <TouchableOpacity
              key={String(opt.value)}
              style={[styles.genderBtn, gender === opt.value && styles.genderBtnActive]}
              onPress={() => setGender(opt.value)}
            >
              <Text style={[styles.genderBtnText, gender === opt.value && styles.genderBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buttons}>
        <PrimaryButton title="下一步，开始扫描" onPress={handleNext} />
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipLink}>跳过，直接扫描</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  content: { padding: 24, gap: 20 },
  hint: { fontSize: 13, color: '#888', marginBottom: 4 },
  field: { gap: 8 },
  label: { fontSize: 11, color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 12,
  },
  inputError: { borderColor: '#f44336' },
  input: { flex: 1, paddingVertical: 12, color: '#fff', fontSize: 16 },
  checkmark: { fontSize: 16 },
  errorText: { color: '#f44336', fontSize: 12 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genderBtnActive: { backgroundColor: 'rgba(108,99,255,0.3)', borderColor: '#6C63FF' },
  genderBtnText: { color: '#888', fontSize: 14 },
  genderBtnTextActive: { color: '#fff' },
  buttons: { gap: 10, marginTop: 16 },
  skipLink: { color: '#666', fontSize: 13, textAlign: 'center', paddingVertical: 6 },
});
