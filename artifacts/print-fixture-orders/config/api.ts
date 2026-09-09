export type ApiConfiguration = {
  baseUrl: string | null;
  error: string | null;
};

function normalizeUrl(value: string, variableName: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
    throw new Error(`${variableName} is empty.`);
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  const url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${variableName} must use http:// or https://.`);
  }
  if (!url.hostname || url.username || url.password) {
    throw new Error(`${variableName} must contain a valid host without credentials.`);
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${variableName} must contain only a domain and optional port.`);
  }

  return url.origin;
}

export function getApiConfiguration(
  environment: Record<string, string | undefined> = process.env,
): ApiConfiguration {
  const explicitUrl = environment.EXPO_PUBLIC_API_URL?.trim();
  const domain = environment.EXPO_PUBLIC_DOMAIN?.trim();

  if (!explicitUrl && !domain) {
    return {
      baseUrl: null,
      error:
        'API URL is not configured. Set EXPO_PUBLIC_API_URL or EXPO_PUBLIC_DOMAIN and restart Expo.',
    };
  }

  const variableName = explicitUrl ? 'EXPO_PUBLIC_API_URL' : 'EXPO_PUBLIC_DOMAIN';
  try {
    return {
      baseUrl: normalizeUrl(explicitUrl || domain || '', variableName),
      error: null,
    };
  } catch (error) {
    return {
      baseUrl: null,
      error: `Invalid ${variableName}: ${error instanceof Error ? error.message : 'unknown value'}`,
    };
  }
}
