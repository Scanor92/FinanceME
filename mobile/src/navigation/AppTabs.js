import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../components/TopBar';
import { useAppTheme } from '../context/ThemeContext';

import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import InvestmentsScreen from '../screens/InvestmentsScreen';
import SavingsScreen from '../screens/SavingsScreen';
import DebtsScreen from '../screens/DebtsScreen';
import DebtDetailScreen from '../screens/DebtDetailScreen';
import AccountsScreen from '../screens/AccountsScreen';
import BudgetDetailScreen from '../screens/BudgetDetailScreen';

const Tab = createBottomTabNavigator();

const iconByRoute = {
  Home: ['home', 'home-outline'],
  Transactions: ['receipt', 'receipt-outline'],
  Add: ['add', 'add'],
  Budgets: ['wallet', 'wallet-outline'],
  Investments: ['stats-chart', 'stats-chart-outline'],
  Savings: ['cash', 'cash-outline'],
  Debts: ['people', 'people-outline'],
  DebtDetail: ['document-text', 'document-text-outline'],
  BudgetDetail: ['document-text', 'document-text-outline'],
  Accounts: ['card', 'card-outline'],
};

const titleByRoute = {
  Home: 'FinanceME',
  Transactions: 'Transactions',
  Add: 'Ajouter',
  Budgets: 'Budgets',
  Investments: 'Investissements',
  Savings: 'Epargne',
  Debts: 'Dettes',
  DebtDetail: 'Detail dette',
  BudgetDetail: 'Detail budget',
  Accounts: 'Comptes',
};

const AppTabs = () => {
  const { palette } = useAppTheme();

  const tabScreenOptions = {
    tabBarStyle: {
      backgroundColor: palette.surface,
      borderTopColor: palette.border,
      height: 68,
      paddingBottom: 9,
      paddingTop: 7,
    },
    tabBarActiveTintColor: palette.primary,
    tabBarInactiveTintColor: palette.textMuted,
    tabBarLabelStyle: {
      fontSize: 9,
      fontWeight: '600',
    },
    sceneStyle: { backgroundColor: palette.background },
  };

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        ...tabScreenOptions,
      header: () => <TopBar title={titleByRoute[route.name] || 'FinanceME'} navigation={navigation} />,
      tabBarIcon: ({ focused, color, size }) => {
        const [activeIcon, inactiveIcon] = iconByRoute[route.name] || ['ellipse', 'ellipse-outline'];
        return <Ionicons name={focused ? activeIcon : inactiveIcon} size={size} color={color} />;
      },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ tabBarLabel: 'Accueil' }} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} options={{ tabBarLabel: 'Mouvts' }} />
      <Tab.Screen
        name="Add"
        component={AddTransactionScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => <Ionicons name="add" size={28} color={palette.onPrimary} />,
          tabBarItemStyle: { marginTop: -8 },
          tabBarIconStyle: {
            backgroundColor: palette.primary,
            width: 54,
            height: 54,
            borderRadius: 27,
            justifyContent: 'center',
            alignItems: 'center',
          },
        }}
      />
      <Tab.Screen name="Budgets" component={BudgetsScreen} options={{ tabBarLabel: 'Budgets' }} />
      <Tab.Screen name="Investments" component={InvestmentsScreen} options={{ tabBarLabel: 'Invest.' }} />
      <Tab.Screen
        name="Savings"
        component={SavingsScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="Debts"
        component={DebtsScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="DebtDetail"
        component={DebtDetailScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="BudgetDetail"
        component={BudgetDetailScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
};

export default AppTabs;
