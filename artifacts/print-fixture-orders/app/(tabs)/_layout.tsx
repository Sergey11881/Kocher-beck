import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { colors } from '@/constants/design';

function TabIcon({
  symbol,
  focused,
}: {
  symbol: string;
  focused: boolean;
}) {
  return (
    <View
      style={{
        width: 42,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        backgroundColor: focused
          ? colors.accentSoft
          : 'transparent',
      }}
    >
      <Text
        style={{
          color: focused ? colors.accent : colors.textMuted,
          fontSize: 18,
          fontWeight: '700',
        }}
      >
        {symbol}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 78,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="⌂" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Заявки',
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="▤" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="●" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
