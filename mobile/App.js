import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { CategoryProvider } from './src/context/CategoryContext';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

const AppShell = () => {
  const { palette, isLight } = useAppTheme();

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      primary: palette.primary,
    },
  };

  return (
    <AuthProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style={isLight ? 'dark' : 'light'} />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <CategoryProvider>
          <AppShell />
        </CategoryProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
