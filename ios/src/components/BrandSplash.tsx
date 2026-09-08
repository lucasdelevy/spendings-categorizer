import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Image, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const MARK = require("../../assets/splash-alpha.png");

export const BRAND_INDIGO = "#4f46e5";
const LETHE = "#1e1b4b";

const MARK_ASPECT = 577 / 547;
const SLICE_COUNT = 48;

function WaveSlice({
  index,
  width,
  height,
  time,
}: {
  index: number;
  width: number;
  height: number;
  time: SharedValue<number>;
}) {
  const sliceH = height / SLICE_COUNT;
  const depth = index / Math.max(1, SLICE_COUNT - 1);
  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: Math.sin(time.value + index * 0.16) * (0.6 + depth * 2.4),
      },
    ],
  }));

  return (
    <Animated.View style={[{ width, height: sliceH, overflow: "hidden" }, style]}>
      <Image
        source={MARK}
        style={{
          width,
          height,
          marginTop: -index * sliceH,
          transform: [{ scaleY: -1 }],
        }}
      />
    </Animated.View>
  );
}

function LetheFade({ width, height }: { width: number; height: number }) {
  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id="letheFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={LETHE} stopOpacity="0" />
          <Stop offset="0.28" stopColor={LETHE} stopOpacity="0.08" />
          <Stop offset="0.55" stopColor={LETHE} stopOpacity="0.45" />
          <Stop offset="0.78" stopColor={LETHE} stopOpacity="0.85" />
          <Stop offset="1" stopColor={LETHE} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#letheFade)" />
    </Svg>
  );
}

function WaterReflection({ width, height }: { width: number; height: number }) {
  const time = useSharedValue(0);

  useEffect(() => {
    time.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 4200, easing: Easing.linear }),
      -1,
      false,
    );
  }, [time]);

  return (
    <View style={{ width, height, overflow: "hidden" }}>
      <Image
        source={MARK}
        style={[styles.ghost, { width, height }]}
      />
      <View style={[StyleSheet.absoluteFill, { opacity: 0.38 }]}>
        {Array.from({ length: SLICE_COUNT }, (_, index) => (
          <WaveSlice
            key={index}
            index={index}
            width={width}
            height={height}
            time={time}
          />
        ))}
      </View>
      <LetheFade width={width} height={height} />
    </View>
  );
}

export default function BrandSplash() {
  const { width } = useWindowDimensions();
  const letterW = Math.min(200, width * 0.5);
  const letterH = letterW * MARK_ASPECT;

  return (
    <View
      style={styles.root}
      accessibilityRole="progressbar"
      accessibilityLabel="Aletheia"
    >
      <StatusBar style="light" />
      <View style={styles.sky}>
        <Image
          source={MARK}
          accessibilityIgnoresInvertColors
          style={{ width: letterW, height: letterH, marginBottom: -4 }}
        />
      </View>
      <View style={styles.horizon} />
      <View style={styles.water}>
        <WaterReflection width={letterW} height={letterH} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND_INDIGO,
  },
  sky: {
    flex: 0.62,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  horizon: {
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: "rgba(165, 180, 252, 0.45)",
  },
  water: {
    flex: 0.38,
    backgroundColor: LETHE,
    alignItems: "center",
    overflow: "hidden",
  },
  ghost: {
    opacity: 0.22,
    transform: [{ scaleY: -1 }],
  },
});
