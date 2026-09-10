import MaskedView from '@react-native-masked-view/masked-view';
import { Animated, Image, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { useColors } from '@/hooks/useColors';

const GRID_SIZE = 6;
const SAFETY_TIMEOUT = 5500;
const TILE_COUNT = GRID_SIZE * GRID_SIZE;
const LOGO_ASPECT_RATIO = 1024 / 299;
const SLOGAN = "The future start`s now";

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
  const completionGuard = useRef(false);

    const finalLogoOpacity = useRef(new Animated.Value(0)).current;
  const sloganOpacity = useRef(new Animated.Value(0)).current;
  const shineProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let safetyCompletionTimer: ReturnType<typeof setTimeout> | null = null;

    const safelyComplete = () => {
      if (completionGuard.current) return;
      completionGuard.current = true;
      if (safetyCompletionTimer) {
        clearTimeout(safetyCompletionTimer);
        safetyCompletionTimer = null;
      }
      onComplete();
    };

    safetyCompletionTimer = setTimeout(safelyComplete, SAFETY_TIMEOUT);

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const driver = Platform.OS !== 'web';
    const tileAnimation = Animated.parallel(
      progresses.map((progress, index) => {
        const from = getStartingOffset(index);
        return Animated.timing(progress, {
          toValue: 1,
          duration: 620,
          delay: index * 24,
          useNativeDriver: driver,
        });
      }),
    );

    const completeIntro = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(safelyComplete, 200);
    };

    tileAnimation.start(({ finished }) => {
      if (!finished) {
        completeIntro();
        return;
      }

      Animated.sequence([
        Animated.timing(finalLogoOpacity, { toValue: 1, duration: 300, useNativeDriver: driver }),
        Animated.timing(sloganOpacity, { toValue: 1, duration: 620, useNativeDriver: driver }),
        Animated.sequence([
          Animated.timing(shineProgress, { toValue: 1, duration: 900, useNativeDriver: driver }),
          Animated.timing(shineProgress, { toValue: 0, duration: 900, useNativeDriver: driver }),
        ]),
        Animated.delay(240),
      ]).start(({ finished: sequenceFinished }) => {
        if (sequenceFinished) {
          completeIntro();
        } else {
          completeIntro();
        }
      });
    });

    return () => {
      tileAnimation.stop();
      finalLogoOpacity.stopAnimation();
      sloganOpacity.stopAnimation();
      shineProgress.stopAnimation();
      if (timeout) clearTimeout(timeout);
    };
  }, [finalLogoOpacity, onComplete, progresses, shineProgress, sloganOpacity]);

  const shineX = shineProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-size, size],
  });

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.logoStage, { width: size, height: size }]}>
        <Animated.Image
          source={require('@/assets/images/company-logo.png')}
          resizeMode="stretch"
          style={[styles.finalLogo, { width: size, height: logoHeight, top: logoTop, opacity: finalLogoOpacity }]}
        />
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

      <Animated.View style={[styles.slogan, { opacity: sloganOpacity }]}>
        <MaskedView maskElement={<Text style={styles.sloganMask}>{SLOGAN}</Text>}>
          <View style={styles.sloganGradient}>
            <LinearGradient
              colors={[colors.metalDark, colors.metalLight, colors.metalMid, colors.metalHighlight, colors.metalDark]}
              locations={[0, 0.28, 0.52, 0.7, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <Animated.View style={[styles.shine, { transform: [{ translateX: shineX }] }]}>
              <LinearGradient
                colors={['transparent', colors.metalHighlight, 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        </MaskedView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', justifyContent: 'center' },
  logoStage: { position: 'relative' },
  finalLogo: { position: 'absolute', left: 0 },
  tile: { position: 'absolute', overflow: 'hidden' },
  slogan: { width: '100%', minHeight: 38, alignItems: 'center', marginTop: 22, paddingHorizontal: 24 },
  sloganMask: { color: 'black', fontSize: 20, letterSpacing: 1.2, textAlign: 'center', fontFamily: 'Inter_700Bold' },
  sloganGradient: { width: '100%', height: 38, overflow: 'hidden' },
  shine: { position: 'absolute', width: 72, height: '100%', left: 0, top: 0, opacity: 0.75 },
});