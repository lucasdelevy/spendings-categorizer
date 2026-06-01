import { Image, Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

interface Props {
  label: string;
  active: boolean;
  onPress: () => void;
  imageUri?: string;
}

export default function FilterChip({ label, active, onPress, imageUri }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? colors.primaryMutedBg : colors.surface,
        },
      ]}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.avatar} />
      ) : null}
      <Text
        style={{
          color: active ? colors.primaryText : colors.textMuted,
          fontSize: 12,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 32,
  },
  avatar: { width: 16, height: 16, borderRadius: 8 },
});
