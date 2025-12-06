import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { AuthProvider } from "@/contexts/AuthContext";
import { BusinessSettingsProvider } from "@/contexts/BusinessSettingsContext";
import { ProductsProvider } from "@/contexts/ProductsContext";
import { OrdersProvider } from "@/contexts/OrdersContext";
import { PrinterProvider } from "@/contexts/PrinterContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 60000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="receipt-viewer" options={{ headerShown: false }} />
      <Stack.Screen name="guide-viewer" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BusinessSettingsProvider>
            <ProductsProvider>
              <OrdersProvider>
                <PrinterProvider>
                  <RootLayoutNav />
                </PrinterProvider>
              </OrdersProvider>
            </ProductsProvider>
          </BusinessSettingsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
