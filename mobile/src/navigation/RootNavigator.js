import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import AppDrawer from './AppDrawer';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const { palette } = useAppTheme();

  const screenOptions = {
    headerStyle: { backgroundColor: palette.surface },
    headerTintColor: palette.text,
    headerTitleStyle: { fontFamily: 'Georgia' },
    contentStyle: { backgroundColor: palette.background },
  };

  if (isLoading) {
    return (
      <View style={[styles.loader, { backgroundColor: palette.background }]}>
        <View style={[styles.loaderCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {isAuthenticated ? (
        <Stack.Screen name="AppDrawer" component={AppDrawer} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Connexion' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Inscription' }} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Mot de passe oublie' }} />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderCard: {
    width: 92,
    height: 92,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RootNavigator;
