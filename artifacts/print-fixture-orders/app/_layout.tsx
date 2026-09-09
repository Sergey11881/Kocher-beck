import React, { useCallback, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { OrdersProvider } from '@/context/OrdersContext';
import { setBaseUrl } from '@workspace/api-client-react';
import { LogoAssemblyIntro } from '@/components/LogoAssemblyIntro';
import { ApiConfigurationError } from '@/components/ApiConfigurationError';
import { getApiConfiguration } from '@/config/api';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
const apiConfiguration = getApiConfiguration();
setBaseUrl(apiConfiguration.baseUrl);

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [showIntro, setShowIntro] = useState(true);
  const finishIntro = useCallback(() => setShowIntro(false), []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        {apiConfiguration.error ? (
          <ApiConfigurationError message={apiConfiguration.error} />
        ) : (
          <QueryClientProvider client={queryClient}>
            <OrdersProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                  {showIntro ? <LogoAssemblyIntro onComplete={finishIntro} /> : null}
                </KeyboardProvider>
              </GestureHandlerRootView>
            </OrdersProvider>
          </QueryClientProvider>
        )}
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
