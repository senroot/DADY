import { Stack } from 'expo-router';

export default function ParentDashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="student-details" />
      <Stack.Screen name="payment-method" />
      <Stack.Screen name="payment-summary" />
      <Stack.Screen name="payment-success" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="forum" />
    </Stack>
  );
}
