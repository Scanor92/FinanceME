import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DrawerContentScrollView,
  DrawerItemList,
  createDrawerNavigator,
} from '@react-navigation/drawer';

import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import TopBar from '../components/TopBar';
import AppTabs from './AppTabs';
import ProfileScreen from '../screens/ProfileScreen';
import AccountsScreen from '../screens/AccountsScreen';
import DebtsScreen from '../screens/DebtsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HelpScreen from '../screens/HelpScreen';

const Drawer = createDrawerNavigator();

const titleByRoute = {
  Main: 'FinanceME',
  Profile: 'Profil',
  Accounts: 'Comptes',
  Debts: 'Dettes',
  Settings: 'Parametres',
  Help: 'Aide',
};

const CustomDrawerContent = (props) => {
  const { user, logout } = useAuth();
  const { isLight, toggleTheme, palette } = useAppTheme();

  const initials = (user?.name || 'User')
    .trim()
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.drawerRoot, { backgroundColor: palette.surfaceAlt }]}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
        <View style={[styles.userCard, { borderBottomColor: palette.border }]}>
          <View style={styles.userRow}>
            <View style={[styles.avatar, { backgroundColor: palette.primary }]}>
              <Text style={[styles.avatarText, { color: palette.onPrimary }]}>{initials}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: palette.text }]}>{user?.name || 'Utilisateur'}</Text>
              <Text style={[styles.userEmail, { color: palette.textSecondary }]}>{user?.email || '-'}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.themeRow}>
            <View style={styles.themeLabelWrap}>
              <Ionicons name={isLight ? 'sunny-outline' : 'moon-outline'} size={18} color={palette.primary} />
              <Text style={[styles.themeLabel, { color: palette.text }]}>Theme global</Text>
            </View>
            <Switch
              value={isLight}
              onValueChange={toggleTheme}
              trackColor={{ false: palette.border, true: palette.primarySoft }}
              thumbColor={palette.primary}
            />
          </View>
        </View>

        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <Pressable style={[styles.logoutButton, { backgroundColor: palette.primary }]} onPress={logout}>
        <Ionicons name="log-out-outline" size={18} color={palette.onPrimary} />
        <Text style={[styles.logoutText, { color: palette.onPrimary }]}>Se deconnecter</Text>
      </Pressable>
    </View>
  );
};

const AppDrawer = () => {
  const { palette } = useAppTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation, route }) => ({
        header: () => <TopBar title={titleByRoute[route.name] || 'FinanceME'} navigation={navigation} />,
        drawerStyle: { ...styles.drawer, backgroundColor: palette.surfaceAlt, borderRightColor: palette.border },
        drawerActiveTintColor: palette.primary,
        drawerInactiveTintColor: palette.textSecondary,
        drawerLabelStyle: styles.drawerLabel,
        drawerType: 'front',
        sceneStyle: { backgroundColor: palette.background },
      })}
    >
      <Drawer.Screen
        name="Main"
        component={AppTabs}
        options={{
          title: 'Accueil',
          headerShown: false,
          drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{
          title: 'Comptes',
          drawerIcon: ({ color, size }) => <Ionicons name="card-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Debts"
        component={DebtsScreen}
        options={{
          title: 'Dettes',
          drawerIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Parametres',
          drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Help"
        component={HelpScreen}
        options={{
          title: 'Aide',
          drawerIcon: ({ color, size }) => <Ionicons name="help-circle-outline" size={size} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawer: {
    borderRightWidth: 1,
  },
  drawerRoot: {
    flex: 1,
  },
  drawerContent: {
    paddingTop: 0,
  },
  userCard: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '800',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    marginTop: 4,
    fontSize: 13,
  },
  panel: {
    marginHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  drawerLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: -8,
  },
  logoutButton: {
    margin: 12,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontWeight: '700',
  },
});

export default AppDrawer;
