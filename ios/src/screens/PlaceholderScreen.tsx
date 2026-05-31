import { StyleSheet, Text, View } from "react-native";

interface Props {
  title: string;
}

export default function PlaceholderScreen({ title }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
  },
});
