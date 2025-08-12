import { router } from 'expo-router';

/**
 * Safe navigation utilities that handle potential navigation errors
 */
export const safeRedirect = {
  /**
   * Safely redirect to authentication screen
   */
  toAuth: () => {
    try {
      router.replace('/auth/parent');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      router.push('/auth/parent');
    }
  },

  /**
   * Safely redirect to parent dashboard
   */
  toParentDashboard: () => {
    try {
      router.replace('/parent-dashboard');
    } catch (error) {
      console.error('Navigation error:', error);
      router.push('/parent-dashboard');
    }
  },

  /**
   * Safely redirect to main app
   */
  toMain: () => {
    try {
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Navigation error:', error);
      router.push('/(tabs)');
    }
  },

  /**
   * Safe navigation back
   */
  goBack: () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      router.replace('/');
    }
  }
};
