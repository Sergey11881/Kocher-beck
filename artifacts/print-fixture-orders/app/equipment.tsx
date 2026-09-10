import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { equipmentCatalog } from '@/config/equipment';
import { useColors } from '@/hooks/useColors';
import { GlassSection } from '@/components/GlassSection';

export default function EquipmentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Feather name="arrow-left" size={20} color={colors.foreground} /><Text style={[styles.backText, { color: colors.foreground }]}>Назад</Text></Pressable>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>KOCHER+BECK</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Типы оснастки</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>Выберите тип, чтобы понять назначение оснастки перед заполнением заявки.</Text>
        {equipmentCatalog.map((item) => (
          <GlassSection key={item.type} style={styles.card}>
            <Image source={item.image} style={styles.image} resizeMode="contain" accessibilityLabel={item.title} />
            <View style={styles.copy}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.cardText, { color: colors.mutedForeground }]}>{item.description}</Text>
              {item.isPlaceholder ? <Text style={[styles.placeholder, { color: colors.mutedForeground }]}>Иллюстрация-заполнитель · реальные фото уточняются</Text> : null}
            </View>
          </GlassSection>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  back: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backText: { fontSize: 13, fontWeight: '700' },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8 },
  title: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  description: { fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 18 },
  card: { borderRadius: 18, padding: 14, marginBottom: 12, flexDirection: 'row', gap: 14 },
  image: { width: 72, height: 72, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)' },
  copy: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardText: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  placeholder: { fontSize: 10, lineHeight: 15, marginTop: 6 },
});
