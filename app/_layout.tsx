import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="day/[day]" />
      <Stack.Screen
        name="add-meal"
        options={{
          presentation: "modal",
        }}
      />
      <Stack.Screen name="modal" />
    </Stack>
  );
}