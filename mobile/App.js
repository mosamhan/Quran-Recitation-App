import React from 'react';
import { ActivityIndicator, View, Image } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

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
          title: route.params?.chapter?.name_simple || route.params?.chapter?.english_name || 'Chapter',
          headerTintColor: theme.colors.primary,
          headerStyle: { backgroundColor: theme.colors.bgPrimary },
          headerTitleStyle: { ...theme.fonts.bold, color: theme.colors.textPrimary },
        })}
      />
    </QuranStack.Navigator>
  );
}

const TAB_ICONS = {
  Quran: { focused: 'book', unfocused: 'book-outline' },
  Practice: { focused: 'mic', unfocused: 'mic-outline' },
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
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Quran" component={QuranStackNavigator} />
      <Tab.Screen name="Practice" component={PracticeScreen} />
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
