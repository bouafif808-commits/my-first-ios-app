import { colors } from "@/constants/theme";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  value: string;
  color?: string;
};

export default function StatPill({ label, value, color = colors.text }: Props) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.cardSoft,
    borderRadius: 18,
    padding: 14,
  },
  value: {
    fontSize: 17,
    fontWeight: "800",
  },
  label: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 12,
  },
});