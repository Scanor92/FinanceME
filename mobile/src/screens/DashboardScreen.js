import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { accountApi, debtApi, transactionApi } from '../api/client';
import DashboardQuickActions from '../components/dashboard/DashboardQuickActions';
import DashboardSummaryCards from '../components/dashboard/DashboardSummaryCards';
import { useAppTheme } from '../context/ThemeContext';
import { getSemanticColors } from '../theme/semanticColors';
import { formatCurrency } from '../utils/format';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { palette, isLight } = useAppTheme();
  const [transactions, setTransactions] = useState([]);
  const [accountSummary, setAccountSummary] = useState({ totalBalance: 0, accountsCount: 0 });
  const [debtSummary, setDebtSummary] = useState({ iOwe: 0, owedToMe: 0, net: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const metricsAnim = useRef(new Animated.Value(0)).current;
  const balanceAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const sem = useMemo(() => getSemanticColors(isLight), [isLight]);

  const ui = useMemo(
    () => ({
      page: palette.background,
      decor: sem.decorPrimary,
      heroBg: palette.surface,
      heroBorder: palette.border,
      metricLabel: palette.textSecondary,
      metricValue: palette.text,
      rowBg: palette.surfaceAlt,
      rowBorder: palette.border,
      empty: palette.textMuted,
      badgeIconBg: sem.iconBubbleBg,
      badgeIconBorder: sem.iconBubbleBorder,
      badgePosBg: sem.positiveBadgeBg,
      badgePosBorder: sem.positiveBadgeBorder,
      badgeNegBg: sem.negativeBadgeBg,
      badgeNegBorder: sem.negativeBadgeBorder,
      badgeText: sem.badgeText,
    }),
    [palette, sem]
  );

  useEffect(() => {
    [metricsAnim, balanceAnim, listAnim].forEach((anim) => anim.setValue(0));
    Animated.stagger(120, [
      Animated.timing(metricsAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(balanceAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(listAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [balanceAnim, listAnim, metricsAnim]);

  const fadeUp = (anim) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  });

  const fetchDashboardData = useCallback(async () => {
    const [txRes, acRes, debtRes] = await Promise.all([
      transactionApi.listExtended({ limit: 5, page: 1 }),
      accountApi.summary(),
      debtApi.summary(),
    ]);

    setTransactions(txRes.data?.data || []);
    setAccountSummary({
      totalBalance: Number(acRes.data?.totalBalance || 0),
      accountsCount: Number(acRes.data?.accountsCount || 0),
    });
    setDebtSummary({
      iOwe: Number(debtRes.data?.iOwe || 0),
      owedToMe: Number(debtRes.data?.owedToMe || 0),
      net: Number(debtRes.data?.net || 0),
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchDashboardData();
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [fetchDashboardData]);

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchDashboardData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const stats = useMemo(() => {
    const income = transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expense = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const insight = useMemo(() => {
    let tone = sem.success;
    let label = 'Situation stable';
    let text = 'Tes flux recents restent globalement equilibres.';

    if (stats.balance < 0) {
      tone = sem.danger;
      label = 'Depenses a surveiller';
      text = 'Les depenses recentes depassent les revenus sur cette periode.';
    } else if (debtSummary.iOwe > 0) {
      tone = palette.primary;
      label = 'Dettes ouvertes';
      text = 'Tu as des engagements ouverts a garder sous controle.';
    }

    return { tone, label, text, active: transactions.length > 0 };
  }, [debtSummary.iOwe, palette.primary, sem.danger, sem.success, stats.balance, transactions.length]);

  const quickActions = useMemo(
    () => [
      { key: 'Transactions', label: 'Transactions', icon: 'receipt-outline' },
      { key: 'Budgets', label: 'Budgets', icon: 'wallet-outline' },
      { key: 'Accounts', label: 'Comptes', icon: 'card-outline' },
      { key: 'Investments', label: 'Investissements', icon: 'stats-chart-outline' },
      { key: 'Debts', label: 'Dettes', icon: 'people-outline' },
      { key: 'Savings', label: 'Epargne', icon: 'cash-outline' },
      { key: 'Add', label: 'Ajouter', icon: 'add-circle-outline' },
    ],
    []
  );

  return (
    <View style={[styles.page, { backgroundColor: ui.page }]}>
      <View style={[styles.decor, { backgroundColor: ui.decor }]} />

      <FlatList
        data={transactions}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <DashboardSummaryCards
              fadeUp={fadeUp}
              balanceAnim={balanceAnim}
              metricsAnim={metricsAnim}
              palette={palette}
              ui={ui}
              sem={sem}
              stats={stats}
              accountSummary={accountSummary}
              debtSummary={debtSummary}
            />

            <Animated.View
              style={[
                styles.card,
                fadeUp(metricsAnim),
                { backgroundColor: ui.heroBg, borderColor: ui.heroBorder },
              ]}
            >
              {[
                { label: 'Revenus', value: stats.income, color: sem.success, dot: true },
                { label: 'Depenses', value: stats.expense, color: sem.danger, dot: true },
                { label: 'Activite recente', value: `${transactions.length} mouvts`, color: ui.metricValue, dot: false, raw: true },
              ].map((item, index) => (
                <View key={item.label}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: palette.border }]} />}
                  <View style={styles.summaryRow}>
                    <View style={styles.rowLeft}>
                      <View style={[styles.dot, { backgroundColor: item.dot ? item.color : palette.primary }]} />
                      <Text style={[styles.label, { color: ui.metricLabel }]}>{item.label}</Text>
                    </View>
                    <Text style={[styles.summaryAmount, { color: item.color }]}>
                      {item.raw ? item.value : formatCurrency(item.value)}
                    </Text>
                  </View>
                </View>
              ))}
            </Animated.View>

            <Animated.View
              style={[
                styles.insightCard,
                fadeUp(listAnim),
                { backgroundColor: `${insight.tone}15`, borderColor: `${insight.tone}40` },
              ]}
            >
              <View style={styles.row}>
                <Text style={[styles.insightTitle, { color: ui.metricValue }]}>{insight.label}</Text>
                <View style={[styles.pill, { backgroundColor: `${insight.tone}22`, borderColor: `${insight.tone}66` }]}>
                  <Text style={[styles.pillText, { color: insight.tone }]}>{insight.active ? 'Actif' : 'Calme'}</Text>
                </View>
              </View>
              <Text style={[styles.insightText, { color: ui.metricLabel }]}>{insight.text}</Text>
            </Animated.View>

            <DashboardQuickActions
              fadeUp={fadeUp}
              balanceAnim={balanceAnim}
              navigation={navigation}
              quickActions={quickActions}
              ui={ui}
              sem={sem}
              palette={palette}
            />

            <Animated.Text style={[styles.sectionTitle, fadeUp(listAnim), { color: ui.metricValue }]}>
              Activite recente
            </Animated.Text>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={palette.primary} />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIcon, { borderColor: palette.border, backgroundColor: palette.surface }]}>
                <Ionicons name="receipt-outline" size={22} color={ui.empty} />
              </View>
              <Text style={[styles.emptyText, { color: ui.empty }]}>Aucune transaction pour l'instant.</Text>
              <Pressable style={[styles.emptyBtn, { backgroundColor: palette.primary }]} onPress={() => navigation.navigate('Add')}>
                <Text style={[styles.emptyBtnText, { color: palette.onPrimary }]}>Ajouter une transaction</Text>
              </Pressable>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={[styles.txRow, { backgroundColor: ui.rowBg, borderColor: ui.rowBorder }]}>
            <View style={[styles.dot, { backgroundColor: item.type === 'income' ? sem.success : sem.danger }]} />
            <View style={styles.txBody}>
              <Text style={[styles.txTitle, { color: ui.metricValue }]}>{item.title}</Text>
              <Text style={[styles.txMeta, { color: ui.metricLabel }]}>{item.category}</Text>
            </View>
            <Text style={[styles.txAmount, { color: item.type === 'income' ? sem.success : sem.danger }]}>
              {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount || 0)}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1 },
  decor: { position: 'absolute', top: -50, right: -40, width: 200, height: 200, borderRadius: 100, opacity: 0.25 },
  listContent: { paddingHorizontal: 16, paddingBottom: 28, gap: 10 },
  card: { marginTop: 8, borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  pill: { borderRadius: 10, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 8 },
  pillText: { fontSize: 10, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  divider: { height: 1, opacity: 0.3 },
  summaryAmount: { fontSize: 14, fontWeight: '800' },
  insightCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
  insightTitle: { fontSize: 13, fontWeight: '800' },
  insightText: { fontSize: 12, lineHeight: 18 },
  sectionTitle: { marginTop: 12, marginBottom: 8, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  loader: { marginTop: 28, alignItems: 'center' },
  emptyWrap: { marginTop: 14, alignItems: 'center', paddingBottom: 6 },
  emptyIcon: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', marginTop: 10 },
  emptyBtn: { marginTop: 12, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  emptyBtnText: { fontWeight: '700', fontSize: 12 },
  txRow: { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  txBody: { flex: 1 },
  txTitle: { fontWeight: '700' },
  txMeta: { marginTop: 2, fontSize: 12 },
  txAmount: { fontWeight: '700', fontSize: 13 },
});

export default DashboardScreen;
