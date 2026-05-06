import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { CustomTabBar } from '@/components/custom-tab-bar';
import { ChatBot } from '@/components/chat-bot';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        initialRouteName="index"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        {/* Visible tabs — order matches CustomTabBar's TABS array */}
        <Tabs.Screen name="contratos" />
        <Tabs.Screen name="permisos" />
        <Tabs.Screen name="index" />
        <Tabs.Screen name="vacaciones" />
        <Tabs.Screen name="profile" />

        {/* Hidden — only reachable via programmatic navigation (auth redirect) */}
        <Tabs.Screen name="login" options={{ href: null }} />
      </Tabs>
      <ChatBot />
    </View>
  );
}
