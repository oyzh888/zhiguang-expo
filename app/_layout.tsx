import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0d0d1a' },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff', fontWeight: '600' },
          contentStyle: { backgroundColor: '#0d0d1a' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="permission" options={{ title: '', headerBackTitle: '返回' }} />
        <Stack.Screen name="baby-profile" options={{ title: '宝宝资料', headerBackTitle: '返回' }} />
        <Stack.Screen name="scanning" options={{ title: '正在分析', headerBackVisible: false }} />
        <Stack.Screen name="results" options={{ title: '精选结果' }} />
        <Stack.Screen name="save-complete" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
