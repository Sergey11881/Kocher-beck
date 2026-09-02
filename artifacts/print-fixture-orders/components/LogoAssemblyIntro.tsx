import { Animated, Image, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { useColors } from '@/hooks/useColors';

const GRID_SIZE = 6;
const TILE_COUNT = GRID_SIZE * GRID_SIZE;
const LOGO_ASPECT_RATIO = 1024 / 299;

function getStartingOffset(index: number) {
  const row = Math.floor(index / GRID_SIZE);
  const column = index % GRID_SIZE;
  const variation = (index % 3) * 24;

  if (index % 4 === 0) return { x: -230 - variation, y: (row - 2.5) * 55 };
  if (index % 4 === 1) return { x: 230 + variation, y: (row - 2.5) * 55 };
  if (index % 4 === 2) return { x: (column - 2.5) * 55, y: -230 - variation };
  return { x: (column - 2.5) * 55, y: 230 + variation };
}

export function LogoAssemblyIntro({ onComplete }: { onComplete: () => void }) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 48, 320);
  const tileSize = size / GRID_SIZE;
  const logoHeight = size / LOGO_ASPECT_RATIO;
  const logoTop = (size - logoHeight) / 2;
  const progresses = useRef(
    Array.from({ length: TILE_COUNT }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const animation = Animated.parallel(
      progresses.map((progress, index) => {
        const from = getStartingOffset(index);
        return Animated.timing(progress, {
          toValue: 1,
          duration: 620,
          delay: index * 24,
          useNativeDriver: Platform.OS !== 'web',
        });
      }),
    );

    animation.start(({ finished }) => {
      if (finished) timeout = setTimeout(onComplete, 420);
    });

    return () => {
      animation.stop();
      if (timeout) clearTimeout(timeout);
    };
  }, [onComplete, progresses]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.logoStage, { width: size, height: size }]}>
        {progresses.map((progress, index) => {
          const row = Math.floor(index / GRID_SIZE);
          const column = index % GRID_SIZE;
          const from = getStartingOffset(index);
          const rotate = index % 2 === 0 ? '-16deg' : '16deg';

          return (
            <Animated.View
              key={`logo-tile-${index}`}
              style={[
                styles.tile,
                {
                  backgroundColor: colors.background,
                  width: tileSize,
                  height: tileSize,
                  left: column * tileSize,
                  top: row * tileSize,
                  opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] }),
                  transform: [
                    { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [from.x, 0] }) },
                    { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [from.y, 0] }) },
                    { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }) },
                    { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: [rotate, '0deg'] }) },
                  ],
                },
              ]}
            >
              <Image
                source={require('@/assets/images/company-logo.png')}
                resizeMode="stretch"
                style={{
                  position: 'absolute',
                  width: size,
                  height: logoHeight,
                  left: -column * tileSize,
                  top: logoTop - row * tileSize,
                }}
              />
            </Animated.View>
          );
        })}
      </View>
      <Text style={[styles.caption, { color: colors.mutedForeground }]}>Kocher + Beck</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', justifyContent: 'center' },
  logoStage: { position: 'relative' },
  tile: { position: 'absolute', overflow: 'hidden' },
  caption: { fontSize: 11, letterSpacing: 1.1, fontFamily: 'Inter_500Medium', marginTop: 22, opacity: 0.7 },
});