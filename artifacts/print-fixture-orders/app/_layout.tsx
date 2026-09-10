import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setBaseUrl } from '@workspace/api-client-react';
import { OrdersProvider } from '@/context/OrdersContext';
import { getApiConfiguration } from '@/config/api';

const queryClient = new QueryClient();
const apiConfiguration = getApiConfiguration();
setBaseUrl(apiConfiguration.baseUrl);

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <OrdersProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: {
              backgroundColor: '#08090C',
            },
          }}
        />
      </OrdersProvider>
    </QueryClientProvider>
  );
}
