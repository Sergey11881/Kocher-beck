import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = '@print-fixture-orders/settings';

export interface AppSettings {
  notificationsEnabled: boolean;
  notificationStatuses: string[];
}

const defaultSettings: AppSettings = {
  notificationsEnabled: true,
  notificationStatuses: ['Получен', 'В производстве', 'Готов', 'Отправлен'],
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) return;
        const parsed = JSON.parse(value) as Partial<AppSettings>;
        setSettings({
          notificationsEnabled: parsed.notificationsEnabled ?? defaultSettings.notificationsEnabled,
          notificationStatuses: Array.isArray(parsed.notificationStatuses) ? parsed.notificationStatuses : defaultSettings.notificationStatuses,
        });
      })
      .catch((loadError: unknown) => {
        console.error('Failed to load app settings:', loadError);
        setError('Не удалось загрузить настройки.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const updateSettings = useCallback(async (next: AppSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSettings(next);
      setError(null);
    } catch (saveError: unknown) {
      console.error('Failed to save app settings:', saveError);
      setError('Не удалось сохранить настройку.');
      throw saveError;
    }
  }, []);

  const setNotificationsEnabled = useCallback(
    (enabled: boolean) => updateSettings({ ...settings, notificationsEnabled: enabled }),
    [settings, updateSettings],
  );

  return { settings, isLoading, error, setNotificationsEnabled };
}
