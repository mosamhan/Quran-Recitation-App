import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { UserProvider } from './src/context/UserContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SettingsProvider } from './src/context/SettingsContext';

// Main screens
import HomeScreen from './src/screens/HomeScreen';
import QuranScreen from './src/screens/QuranScreen';
import ChapterDetailScreen from './src/screens/ChapterDetailScreen';
import CurriculumScreen from './src/screens/CurriculumScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Auth screens (modal)
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const QuranStack = createNativeStackNavigator();

function QuranStackNavigator() {
  return (
    <QuranStack.Navigator screenOptions={{ headerShown: false }}>
      <QuranStack.Screen name="QuranList" component={QuranScreen} />
      <QuranStack.Screen name="ChapterDetail" component={ChapterDetailScreen} />
    </QuranStack.Navigator>
  );
}

const TAB_ICONS = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  Quran: { focused: 'book', unfocused: 'book-outline' },
  Learn: { focused: 'school', unfocused: 'school-outline' },
  Progress: { focused: 'stats-chart', unfocused: 'stats-chart-outline' },
  Settings: { focused: 'settings', unfocused: 'settings-outline' },
};

function MainTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Quran" component={QuranStackNavigator} />
      <Tab.Screen name="Learn" component={CurriculumScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
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
        <RootStack.Screen name="Profile" component={ProfileScreen} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <ThemeProvider>
          <SettingsProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </SettingsProvider>
        </ThemeProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
