import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

type Variant = "primary" | "secondary" | "ghost";

interface Props extends Omit<PressableProps, "children"> {
  label: string;
  variant?: Variant;
  compact?: boolean;
}

export default function Button({
  label,
  variant = "primary",
  compact = false,
  disabled,
  style,
  ...props
}: Props) {
  const { colors } = useTheme();

  const variantStyle =
    variant === "primary"
      ? { backgroundColor: colors.primary }
      : variant === "secondary"
        ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
        : { backgroundColor: "transparent" };

  const textColor =
    variant === "primary" ? "#ffffff" : variant === "secondary" ? colors.text : colors.primary;

  return (
    <Pressable
      disabled={disabled}
      style={(state) => {
        const { pressed } = state;
        const flatStyle = typeof style === "function" ? style(state) : style;
        return [
          styles.base,
          compact ? styles.compact : null,
          variantStyle,
          pressed && !disabled ? styles.pressed : null,
          disabled ? styles.disabled : null,
          flatStyle,
        ];
      }}
      {...props}
    >
      <Text style={[styles.label, { color: textColor }, compact ? styles.compactLabel : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  compact: { minHeight: 36, paddingHorizontal: 12 },
  label: { fontSize: 14, fontWeight: "600" },
  compactLabel: { fontSize: 12 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
