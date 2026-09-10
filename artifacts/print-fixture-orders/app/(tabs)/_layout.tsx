import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';

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
          ? 'rgba(227,6,19,0.16)'
          : 'transparent',
      }}
    >
      <Text
        style={{
          color: focused ? '#FFFFFF' : '#777C87',
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
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#777C87',
        tabBarStyle: {
          backgroundColor: '#111318',
          borderTopColor: 'rgba(255,255,255,0.08)',
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
