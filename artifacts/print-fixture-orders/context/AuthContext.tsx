import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { login, setAuthFailureHandler, setAuthTokenGetter } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

const TOKEN_KEY = 'operator-access-token';
let currentToken: string | null = null;
setAuthTokenGetter(() => currentToken);

type AuthContextValue = {
  token: string | null;
  isReady: boolean;
  loginWithPassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const updateToken = (nextToken: string | null) => {
    currentToken = nextToken;
    setToken(nextToken);
  };

  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(TOKEN_KEY)
      .then((storedToken) => {
        if (active) updateToken(storedToken);
      })
      .catch(() => {
        if (active) updateToken(null);
      })
      .finally(() => {
        if (active) setIsReady(true);
      });
    setAuthFailureHandler(() => {
      void SecureStore.deleteItemAsync(TOKEN_KEY);
      updateToken(null);
    });
    return () => {
      active = false;
      setAuthFailureHandler(null);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    isReady,
    async loginWithPassword(password) {
      const response = await login({ password });
      await SecureStore.setItemAsync(TOKEN_KEY, response.access_token);
      updateToken(response.access_token);
    },
    async logout() {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      updateToken(null);
    },
  }), [isReady, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { isReady, token } = useAuth();
  if (!isReady) return null;
  return token ? <>{children}</> : <LoginScreen />;
}

function LoginScreen() {
  const colors = useColors();
  const { loginWithPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    setIsSubmitting(true);
    try {
      await loginWithPassword(password);
      setPassword('');
    } catch {
      Alert.alert('Не удалось войти', 'Проверьте пароль оператора и попробуйте ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Вход оператора</Text>
      <Text style={[styles.message, { color: colors.mutedForeground }]}>Введите пароль, чтобы открыть заявки и отправить новый заказ.</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        placeholder="Пароль"
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { color: colors.foreground, borderColor: colors.input, backgroundColor: colors.card }]}
        onSubmitEditing={() => void submit()}
      />
      <Pressable disabled={isSubmitting || !password} onPress={() => void submit()} style={[styles.button, { backgroundColor: colors.primary, opacity: isSubmitting || !password ? 0.5 : 1 }]}>
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{isSubmitting ? 'Проверка…' : 'Войти'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 25, marginBottom: 10 },
  message: { maxWidth: 360, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 22 },
  input: { width: '100%', maxWidth: 360, minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 15, fontFamily: 'Inter_400Regular', fontSize: 15 },
  button: { width: '100%', maxWidth: 360, minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  buttonText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
});
