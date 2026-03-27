import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { UserProvider } from './src/context/UserContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Main screens
import QuranScreen from './src/screens/QuranScreen';
import ChapterDetailScreen from './src/screens/ChapterDetailScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import CurriculumScreen from './src/screens/CurriculumScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Auth screens (modal)
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const QuranStack = createNativeStackNavigator();

function QuranStackNavigator() {
  const { theme } = useTheme();
  return (
    <QuranStack.Navigator screenOptions={{ headerShown: false }}>
      <QuranStack.Screen name="QuranList" component={QuranScreen} />
      <QuranStack.Screen
        name="ChapterDetail"
        component={ChapterDetailScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params?.chapter?.name_simple || 'Chapter',
          headerTintColor: theme.colors.primary,
          headerStyle: { backgroundColor: theme.colors.bgPrimary },
          headerTitleStyle: { ...theme.fonts.bold, color: theme.colors.textPrimary },
        })}
      />
    </QuranStack.Navigator>
  );
}

function MainTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.tabBarBorder,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, ...theme.fonts.semiBold },
      }}
    >
      <Tab.Screen
        name="Quran"
        component={QuranStackNavigator}
        options={{
          tabBarLabel: 'Quran',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>📖</Text>,
        }}
      />
      <Tab.Screen
        name="Practice"
        component={PracticeScreen}
        options={{
          tabBarLabel: 'Practice',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🎙</Text>,
        }}
      />
      <Tab.Screen
        name="Learn"
        component={CurriculumScreen}
        options={{
          tabBarLabel: 'Learn',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🎯</Text>,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>📊</Text>,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { loaded } = useTheme();

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main" component={MainTabs} />
      <RootStack.Group screenOptions={{ presentation: 'modal' }}>
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="Register" component={RegisterScreen} />
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <ThemeProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
