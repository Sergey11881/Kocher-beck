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

  const isIOS = Platform.OS === "ios";

  return (
    <View style={styles.layout}>
      <Tabs
        screenOptions={{
          headerShown: true,

          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarActiveBackgroundColor: colors.accent,

          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            height: 78,
            paddingBottom: 10,
            paddingTop: 8,
            marginHorizontal: 16,
            marginBottom: 12,
            borderRadius: 28,
          },

          tabBarBackground: () =>
            <View style={[StyleSheet.absoluteFill, styles.tabGlass, { borderColor: colors.glassBorder }]}>
              <BlurView intensity={42} tint={colorScheme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, styles.tabOverlay, { backgroundColor: colors.glassHighlight }]} />
              <View style={[StyleSheet.absoluteFill, styles.tabShade, { backgroundColor: colors.glassShadow }]} />
              <View style={[StyleSheet.absoluteFill, styles.tabInnerEdge, { borderColor: colors.glassHighlight }]} />
              <View style={[styles.tabHighlight, { backgroundColor: colors.glassBorder }]} />
            </View>
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
            tabBarItemStyle: styles.tabItem,
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
            tabBarItemStyle: styles.tabItem,
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
            tabBarItemStyle: styles.tabItem,
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
  tabGlass: {
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
  },
  tabOverlay: {
    opacity: 0.28,
  },
  tabShade: {
    top: "58%",
    opacity: 0.5,
  },
  tabInnerEdge: {
    borderWidth: 1,
    borderRadius: 27,
    margin: 1,
    opacity: 0.2,
  },
  tabHighlight: {
    position: "absolute",
    top: 0,
    left: 28,
    right: 28,
    height: 1,
    opacity: 0.8,
  },
  tabItem: {
    borderRadius: 18,
    marginHorizontal: 4,
    marginVertical: 5,
  },
});
