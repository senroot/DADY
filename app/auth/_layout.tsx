import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated && user) {
    if (user.accountType === 'Parent') return <Redirect href="/parent-dashboard" />;
    if (user.accountType === 'Student') return <Redirect href="/" />;
    if (user.accountType === 'Admin') return <Redirect href="/auth/admin" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="student" />
      <Stack.Screen name="parent" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}