import { StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

export default function Card({ style, children, ...props }: ViewProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
});
