import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { budgetApi, transactionApi } from '../api/client';
import { getCategoryIcon, getCategoryLabel } from '../constants/transactionCategories';
import { useAppTheme } from '../context/ThemeContext';
import { getSemanticColors } from '../theme/semanticColors';
import { formatCurrency, formatDate } from '../utils/format';

const periodLabels = {
  weekly: 'Hebdo',
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  semiannual: 'Semestriel',
  annual: 'Annuel',
};

const isInBudgetPeriod = (dateValue, period) => {
  const txDate = new Date(dateValue);
  if (Number.isNaN(txDate.getTime())) return false;

  const now = new Date();
  if (period === 'weekly') {
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return txDate >= start && txDate < end;
  }

  if (period === 'quarterly') {
    return Math.floor(txDate.getMonth() / 3) === Math.floor(now.getMonth() / 3) && txDate.getFullYear() === now.getFullYear();
  }

  if (period === 'semiannual') {
    return (txDate.getMonth() < 6 ? 0 : 1) === (now.getMonth() < 6 ? 0 : 1) && txDate.getFullYear() === now.getFullYear();
  }

  if (period === 'annual') {
    return txDate.getFullYear() === now.getFullYear();
  }

  return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
};

const BudgetDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { palette, isLight } = useAppTheme();
  const sem = useMemo(() => getSemanticColors(isLight), [isLight]);
  const budgetId = route.params?.budgetId;

  const [budget, setBudget] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!budgetId) return;

    const [budgetRes, transactionRes] = await Promise.all([
      budgetApi.getById(budgetId),
      transactionApi.listExtended({ limit: 'all', page: 1, type: 'expense' }),
    ]);

    setBudget(budgetRes.data);
    setTransactions(transactionRes.data?.data || []);
  }, [budgetId]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const load = async () => {
        try {
          await fetchData();
        } finally {
          if (mounted) setIsLoading(false);
        }
      };
      load();
      return () => {
        mounted = false;
      };
    }, [fetchData])
  );

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const budgetTransactions = useMemo(() => {
    if (!budget) return [];
    return transactions
      .filter((tx) => tx.category === budget.category && isInBudgetPeriod(tx.date, budget.period || 'monthly'))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [budget, transactions]);

  const spent = useMemo(() => budgetTransactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0), [budgetTransactions]);
  const remaining = Math.max(0, Number(budget?.amount || 0) - spent);
  const adjustments = useMemo(() => (Array.isArray(budget?.adjustments) ? [...budget.adjustments] : []), [budget]);

  const closeAdjust = () => {
    setIsAdjustOpen(false);
    setAdjustAmount('');
  };

  const submitAdjust = async (direction) => {
    if (!budget?._id) return;
    const parsedAmount = Number(adjustAmount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation', 'Saisis un montant positif');
      return;
    }

    const currentAmount = Number(budget.amount || 0);
    if (direction === 'decrease' && currentAmount - parsedAmount < 0) {
      Alert.alert('Validation', 'Le budget ne peut pas etre negatif');
      return;
    }

    try {
      setIsSaving(true);
      await budgetApi.adjust(budget._id, { amount: parsedAmount, direction });
      await fetchData();
      closeAdjust();
      Alert.alert('Succes', direction === 'decrease' ? 'Budget diminue' : 'Budget augmente');
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Ajustement impossible');
    } finally {
      setIsSaving(false);
    }
  };

  const ui = {
    page: palette.background,
    panel: palette.surface,
    panelAlt: palette.surfaceAlt,
    border: palette.border,
    text: palette.text,
    textSecondary: palette.textSecondary,
    muted: palette.textMuted,
    primary: palette.primary,
    onPrimary: palette.onPrimary,
    inputBg: palette.inputBg,
    inputBorder: palette.inputBorder,
    inputText: palette.inputText,
    placeholder: palette.placeholder,
    modalOverlay: isLight ? 'rgba(16,28,47,0.32)' : 'rgba(0,0,0,0.5)',
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: ui.page }]}>
        <ActivityIndicator size="large" color={ui.primary} />
      </View>
    );
  }

  if (!budget) {
    return (
      <View style={[styles.center, { backgroundColor: ui.page }]}>
        <Text style={[styles.empty, { color: ui.muted }]}>Budget introuvable.</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={[styles.page, { backgroundColor: ui.page }]}
        contentContainerStyle={styles.content}
        data={budgetTransactions}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={ui.primary} />}
        ListHeaderComponent={
          <View style={[styles.hero, { borderColor: ui.border, backgroundColor: ui.panel }]}>
            <View style={styles.topRow}>
              <Pressable style={[styles.backBtn, { borderColor: ui.border, backgroundColor: ui.panelAlt }]} onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Budgets'))}>
                <Ionicons name="chevron-back" size={16} color={ui.text} />
                <Text style={[styles.backBtnText, { color: ui.text }]}>Retour</Text>
              </Pressable>
            </View>

            <View style={styles.identityRow}>
              <View style={[styles.iconWrap, { borderColor: palette.border, backgroundColor: palette.surfaceAlt }]}>
                <Ionicons name={getCategoryIcon(budget.category)} size={18} color={sem.budget} />
              </View>
              <View style={styles.identityBody}>
                <Text style={[styles.title, { color: ui.text }]}>{budget.name}</Text>
                <Text style={[styles.meta, { color: ui.textSecondary }]}>
                  {getCategoryLabel(budget.category)} - {periodLabels[budget.period] || 'Mensuel'}
                </Text>
              </View>
            </View>

            <Text style={[styles.amount, { color: ui.text }]}>Budget: {formatCurrency(budget.amount || 0)}</Text>
            <Text style={[styles.meta, { color: ui.textSecondary }]}>Consomme: {formatCurrency(spent)}</Text>
            <Text style={[styles.meta, { color: ui.textSecondary }]}>Reste: {formatCurrency(remaining)}</Text>

            <Pressable style={[styles.adjustBtn, { backgroundColor: ui.primary }]} onPress={() => setIsAdjustOpen(true)}>
              <Ionicons name="swap-vertical-outline" size={15} color={ui.onPrimary} />
              <Text style={[styles.adjustBtnText, { color: ui.onPrimary }]}>Ajuster budget</Text>
            </Pressable>

            <View style={[styles.section, { borderTopColor: ui.border }]}>
              <Text style={[styles.sectionTitle, { color: ui.textSecondary }]}>Historique budget</Text>
              {adjustments.length > 0 ? (
                adjustments.slice(0, 10).map((entry, index) => (
                  <View key={`${budget._id}-adjust-${index}`} style={styles.row}>
                    <View style={[styles.dot, { backgroundColor: entry.direction === 'decrease' ? sem.danger : sem.success }]} />
                    <Text style={[styles.date, { color: ui.textSecondary }]}>{formatDate(entry.date)}</Text>
                    <Text style={[styles.rowLabel, { color: ui.text }]}>{entry.direction === 'decrease' ? 'Diminution' : 'Augmentation'}</Text>
                    <Text style={[styles.rowAmount, { color: entry.direction === 'decrease' ? sem.danger : sem.success }]}>
                      {entry.direction === 'decrease' ? '-' : '+'} {formatCurrency(entry.amount || 0)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyInline, { color: ui.muted }]}>Aucun ajustement.</Text>
              )}
            </View>

            <Text style={[styles.sectionTitle, { color: ui.textSecondary }]}>Transactions de la periode</Text>
          </View>
        }
        ListEmptyComponent={<Text style={[styles.empty, { color: ui.muted }]}>Aucune transaction pour ce budget.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.rowCard, { borderColor: ui.border, backgroundColor: ui.panelAlt }]}>
            <View style={[styles.dot, { backgroundColor: sem.danger }]} />
            <Text style={[styles.date, { color: ui.textSecondary }]}>{formatDate(item.date)}</Text>
            <Text style={[styles.rowLabel, { color: ui.text }]} numberOfLines={1}>
              {item.title || getCategoryLabel(item.category)}
            </Text>
            <Text style={[styles.rowAmount, { color: ui.text }]}>{formatCurrency(item.amount || 0)}</Text>
          </View>
        )}
      />

      <Modal visible={isAdjustOpen} transparent animationType="slide" onRequestClose={closeAdjust}>
        <View style={[styles.modalBackdrop, { backgroundColor: ui.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.modalTitle, { color: ui.text }]}>Ajuster budget</Text>
            <TextInput
              placeholder="Montant a ajuster"
              placeholderTextColor={ui.placeholder}
              keyboardType="decimal-pad"
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={adjustAmount}
              onChangeText={setAdjustAmount}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.primary }]} onPress={() => submitAdjust('increase')} disabled={isSaving}>
                <Ionicons name="arrow-up-circle-outline" size={16} color={ui.onPrimary} />
                <Text style={[styles.modalBtnText, { color: ui.onPrimary }]}>Augmenter</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: sem.danger }]} onPress={() => submitAdjust('decrease')} disabled={isSaving}>
                <Ionicons name="arrow-down-circle-outline" size={16} color="#FFFFFF" />
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Diminuer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8, marginBottom: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 10, paddingVertical: 5, paddingHorizontal: 8 },
  backBtnText: { fontSize: 12, fontWeight: '700' },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  identityBody: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', fontFamily: 'Georgia' },
  meta: { fontSize: 12 },
  amount: { fontSize: 13, fontWeight: '700' },
  adjustBtn: { alignSelf: 'flex-start', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  adjustBtnText: { fontSize: 12, fontWeight: '700' },
  section: { marginTop: 6, paddingTop: 8, borderTopWidth: 1, gap: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 20 },
  emptyInline: { fontSize: 11 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowCard: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  date: { fontSize: 12, width: 86 },
  rowLabel: { flex: 1, fontSize: 12 },
  rowAmount: { fontWeight: '700', fontSize: 12 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, borderTopWidth: 1, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  modalActions: { marginTop: 4, flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  modalBtnText: { fontWeight: '700' },
});

export default BudgetDetailScreen;
