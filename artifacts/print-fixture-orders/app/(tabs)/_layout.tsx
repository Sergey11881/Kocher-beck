import React from "react";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useColors } from "@/hooks/useColors";
import { CreatorCredit } from "@/components/CreatorCredit";

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();

  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <View style={styles.layout}>
      <Tabs
        screenOptions={{
          headerShown: true,

          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,

          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS || isWeb ? "transparent" : colors.glassStrong,
            borderTopWidth: 0,
            elevation: 0,
            height: 78,
            paddingBottom: 10,
            paddingTop: 8,
            marginHorizontal: 16,
            marginBottom: 12,
            borderRadius: 24,
          },

          tabBarBackground: () =>
            isIOS || isWeb ? (
              <BlurView
                intensity={70}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: colors.glassStrong, borderRadius: 24, borderWidth: 1, borderColor: colors.glassBorder },
                ]}
              />
            ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Главная",
            tabBarLabel: "Главная",
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" size={size || 24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="orders"
          options={{
            title: "Заявки",
            tabBarLabel: "Заявки",
            tabBarIcon: ({ color, size }) => (
              <Feather name="file-text" size={size || 24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Профиль",
            tabBarLabel: "Профиль",
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" size={size || 24} color={color} />
            ),
          }}
        />
      </Tabs>

      <CreatorCredit floating />
    </View>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
  },
});
