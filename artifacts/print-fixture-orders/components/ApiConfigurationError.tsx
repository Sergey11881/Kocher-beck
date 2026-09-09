import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type ApiConfigurationErrorProps = {
  message: string;
};

export function ApiConfigurationError({ message }: ApiConfigurationErrorProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Сервер не настроен
      </Text>
      <Text style={[styles.message, { color: colors.mutedForeground }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 520,
    textAlign: 'center',
  },
});
