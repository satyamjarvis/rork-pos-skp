import { Tabs } from "expo-router";
import { Calculator, ChefHat, Package } from "lucide-react-native";
import React from "react";
import AuthGuard from "@/components/AuthGuard";

export default function TabLayout() {
  return (
    <AuthGuard>
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10B981',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
          height: 70,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 16,
        },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Kasse",
          tabBarIcon: ({ color }) => <Calculator color={color} />,
        }}
      />
      <Tabs.Screen
        name="kitchen"
        options={{
          title: "Kjøkken",
          tabBarIcon: ({ color }) => <ChefHat color={color} />,
        }}
      />
      <Tabs.Screen
        name="backoffice"
        options={{
          title: "Backoffice",
          tabBarIcon: ({ color }) => <Package color={color} />,
        }}
      />
      <Tabs.Screen
        name="import"
        options={{
          href: null,
        }}
      />
      </Tabs>
    </AuthGuard>
  );
}
