import { Link, Stack } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Colors from "@/constants/colors";

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.bg,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <Text
          style={{
            fontSize: 48,
            fontWeight: "bold",
            color: Colors.orange,
            marginBottom: 8,
          }}
        >
          404
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: Colors.textSecondary,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          This route doesn't exist in the grid.
        </Text>
        <Pressable
          style={{
            backgroundColor: Colors.olive,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Link href="/" style={{ color: Colors.textPrimary, fontWeight: "600" }}>
            Return to base
          </Link>
        </Pressable>
      </View>
    </>
  );
}
