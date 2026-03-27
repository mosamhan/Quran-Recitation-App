import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { UserProvider, useUser } from './src/context/UserContext';
import { colors, fonts } from './src/utils/theme';

// Auth screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

// Main screens
import HomeScreen from './src/screens/HomeScreen';
import QuranScreen from './src/screens/QuranScreen';
import ChapterDetailScreen from './src/screens/ChapterDetailScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import CurriculumScreen from './src/screens/CurriculumScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const QuranStack = createNativeStackNavigator();

function QuranStackNavigator() {
  return (
    <QuranStack.Navigator screenOptions={{ headerShown: false }}>
      <QuranStack.Screen name="QuranList" component={QuranScreen} />
      <QuranStack.Screen
        name="ChapterDetail"
        component={ChapterDetailScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params?.chapter?.name_simple || 'Chapter',
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.bgLight },
          headerTitleStyle: { ...fonts.bold, color: colors.textPrimary },
        })}
      />
    </QuranStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.borderLight,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: { fontSize: 11, ...fonts.semiBold },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => tabIcon('🏠', color) }}
      />
      <Tab.Screen
        name="Quran"
        component={QuranStackNavigator}
        options={{ tabBarLabel: 'Quran', tabBarIcon: ({ color }) => tabIcon('📖', color) }}
      />
      <Tab.Screen
        name="Practice"
        component={PracticeScreen}
        options={{ tabBarLabel: 'Practice', tabBarIcon: ({ color }) => tabIcon('🎙', color) }}
      />
      <Tab.Screen
        name="Curriculum"
        component={CurriculumScreen}
        options={{ tabBarLabel: 'Learn', tabBarIcon: ({ color }) => tabIcon('🎯', color) }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ tabBarLabel: 'Progress', tabBarIcon: ({ color }) => tabIcon('📊', color) }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings', tabBarIcon: ({ color }) => tabIcon('⚙️', color) }}
      />
    </Tab.Navigator>
  );
}

function tabIcon(emoji) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

function RootNavigator() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgLight }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : !user.onboarding_completed ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <UserProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </UserProvider>
  );
}
