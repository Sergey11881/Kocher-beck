import React from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { CreatorCredit } from "@/components/CreatorCredit";

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();

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
            <View style={[StyleSheet.absoluteFill, styles.tabGlass, { borderColor: colors.glassBorder, shadowColor: colors.shadow }]}>
              <BlurView intensity={58} tint={colorScheme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, styles.tabBase, { backgroundColor: colors.glass }]} />
              <LinearGradient
                colors={[colors.glassHighlight, "transparent", colors.glassShadow]}
                locations={[0, 0.42, 1]}
                start={{ x: 0.08, y: 0 }}
                end={{ x: 0.88, y: 1 }}
                style={[StyleSheet.absoluteFill, styles.tabOverlay]}
              />
              <LinearGradient
                colors={["transparent", colors.glassHighlight, "transparent"]}
                locations={[0.12, 0.46, 0.82]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.7 }}
                style={[StyleSheet.absoluteFill, styles.tabSpecular]}
              />
              <View style={[StyleSheet.absoluteFill, styles.tabShade, { backgroundColor: colors.glassShadow }]} />
              <View style={[StyleSheet.absoluteFill, styles.tabInnerEdge, { borderColor: colors.glassHighlight }]} />
              <View style={[styles.tabHighlight, { backgroundColor: colors.glassHighlight }]} />
              <View style={[styles.tabBottomEdge, { backgroundColor: colors.glassShadow }]} />
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
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.26,
    shadowRadius: 30,
    elevation: 8,
  },
  tabOverlay: {
    opacity: 0.72,
  },
  tabBase: {
    opacity: 0.9,
  },
  tabSpecular: {
    opacity: 0.4,
  },
  tabShade: {
    top: "58%",
    opacity: 0.12,
  },
  tabInnerEdge: {
    borderWidth: 1,
    borderRadius: 27,
    margin: 1,
    opacity: 0.34,
  },
  tabHighlight: {
    position: "absolute",
    top: 0,
    left: 28,
    right: 28,
    height: 2,
    borderRadius: 2,
    opacity: 0.72,
  },
  tabBottomEdge: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 1,
    height: 2,
    borderRadius: 2,
    opacity: 0.26,
  },
  tabItem: {
    borderRadius: 18,
    marginHorizontal: 4,
    marginVertical: 5,
  },
});
