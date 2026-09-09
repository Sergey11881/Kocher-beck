import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { GlassSurface } from '@/components/GlassSurface';

export function GlassSection({ children, style, depth = 'standard' }: { children: ReactNode; style?: StyleProp<ViewStyle>; depth?: 'light' | 'standard' | 'deep' }) {
  return <GlassSurface depth={depth} style={style}>{children}</GlassSurface>;
}
