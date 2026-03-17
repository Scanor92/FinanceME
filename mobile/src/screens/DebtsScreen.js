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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { debtApi } from '../api/client';
import { debtStatusOptions, debtTypeOptions, getDebtStatusLabel, getDebtTypeIcon, getDebtTypeLabel } from '../constants/debtMeta';
import { useAppTheme } from '../context/ThemeContext';
import { getSemanticColors } from '../theme/semanticColors';
import { formatCurrency, formatDate, getDaysRemaining } from '../utils/format';

const getDueState = (dueDate, status) => {
  if (!dueDate || status === 'paid') return null;
  const diffDays = getDaysRemaining(dueDate);
  if (diffDays === null) return null;
  if (diffDays < 0) return { tone: 'late', label: 'En retard', detail: `${Math.abs(diffDays)} j de retard` };
  if (diffDays <= 7) return { tone: 'soon', label: 'Échéance proche', detail: `${diffDays} j restants` };
  return { tone: 'normal', label: 'À venir', detail: `${diffDays} j restants` };
};

const DebtsScreen = () => {
  const navigation = useNavigation();
  const { palette, isLight } = useAppTheme();
  const sem = useMemo(() => getSemanticColors(isLight), [isLight]);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ iOwe: 0, owedToMe: 0, net: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [type, setType] = useState('payable');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentDebtId, setPaymentDebtId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = useCallback(async () => {
    const [listRes, summaryRes] = await Promise.all([debtApi.list(), debtApi.summary()]);
    setItems(listRes.data || []);
    setSummary(summaryRes.data || { iOwe: 0, owedToMe: 0, net: 0 });
  }, []);

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

  const openPayment = (id) => {
    setPaymentDebtId(id);
    setPaymentAmount('');
    setIsPayOpen(true);
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    setPersonName('');
    setType('payable');
    setPrincipalAmount('');
    setNote('');
  };

  const submitCreate = async () => {
    if (!personName.trim() || !principalAmount.trim()) {
      Alert.alert('Validation', 'personne et montant sont requis');
      return;
    }

    const amount = Number(principalAmount);
    if (Number.isNaN(amount) || amount < 0) {
      Alert.alert('Validation', 'montant invalide');
      return;
    }

    try {
      await debtApi.create({
        personName: personName.trim(),
        type,
        principalAmount: amount,
        note: note.trim() || undefined,
      });
      await fetchData();
      closeCreate();
      Alert.alert('Succes', 'Dette creee');
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Creation impossible');
    }
  };

  const submitPayment = async () => {
    if (!paymentDebtId || !paymentAmount.trim()) {
      Alert.alert('Validation', 'montant de paiement requis');
      return;
    }

    const amount = Number(paymentAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Validation', 'montant de paiement invalide');
      return;
    }

    try {
      await debtApi.pay(paymentDebtId, { amount });
      await fetchData();
      setIsPayOpen(false);
      setPaymentDebtId(null);
      setPaymentAmount('');
      Alert.alert('Succes', 'Paiement enregistre');
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Paiement impossible');
    }
  };

  const payAll = async (debt) => {
    try {
      await debtApi.pay(debt._id, { amount: debt.remainingAmount });
      await fetchData();
      Alert.alert('Succes', debt.type === 'payable' ? 'Dette totalement payee' : 'Dette totalement encaissee');
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Operation impossible');
    }
  };

  const sortedItems = useMemo(() => {
    const filtered = statusFilter === 'all' ? items : items.filter((item) => item.status === statusFilter);
    return [...filtered].sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'open' ? -1 : 1;
    });
  }, [items, statusFilter]);

  const dueSummary = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          const dueState = getDueState(item.dueDate, item.status);
          if (!dueState) return acc;
          if (dueState.tone === 'late') acc.late += 1;
          if (dueState.tone === 'soon') acc.soon += 1;
          return acc;
        },
        { late: 0, soon: 0 }
      ),
    [items]
  );

  const ui = useMemo(
    () => ({
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
      segmentBg: sem.segmentBg,
      segmentActiveBg: sem.segmentActiveBg,
      modalOverlay: isLight ? 'rgba(16,28,47,0.32)' : 'rgba(0,0,0,0.5)',
      kpiPayableBg: sem.expenseBg,
      kpiPayableBorder: sem.expenseBorder,
      kpiReceivableBg: sem.incomeBg,
      kpiReceivableBorder: sem.incomeBorder,
      badgePayableBg: sem.expenseBg,
      badgePayableBorder: sem.expenseBorder,
      badgeReceivableBg: sem.incomeBg,
      badgeReceivableBorder: sem.incomeBorder,
      badgePayableText: sem.danger,
      badgeReceivableText: sem.success,
    }),
    [
      isLight,
      palette,
      sem.danger,
      sem.expenseBg,
      sem.expenseBorder,
      sem.incomeBg,
      sem.incomeBorder,
      sem.segmentActiveBg,
      sem.segmentBg,
      sem.success,
    ]
  );

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: ui.page }]}>
        <ActivityIndicator size="large" color={ui.primary} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={[styles.page, { backgroundColor: ui.page }]}
        contentContainerStyle={styles.content}
        data={sortedItems}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={ui.primary} />}
        ListHeaderComponent={
          <View style={[styles.hero, { borderColor: ui.border, backgroundColor: ui.panel }]}> 
            <Text style={[styles.title, { color: ui.text }]}>Dettes</Text>
            <Text style={[styles.subtitle, { color: ui.textSecondary }]}>Je dois a qui / Qui me doit</Text>
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: ui.kpiPayableBg, borderColor: ui.kpiPayableBorder }]}>
                <Text style={[styles.kpiLabel, { color: ui.textSecondary }]}>Je dois</Text>
                <Text style={[styles.kpiValue, { color: ui.text }]}>{formatCurrency(summary.iOwe || 0)}</Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: ui.kpiReceivableBg, borderColor: ui.kpiReceivableBorder }]}>
                <Text style={[styles.kpiLabel, { color: ui.textSecondary }]}>On me doit</Text>
                <Text style={[styles.kpiValue, { color: ui.text }]}>{formatCurrency(summary.owedToMe || 0)}</Text>
              </View>
            </View>
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: ui.kpiPayableBg, borderColor: ui.kpiPayableBorder }]}>
                <Text style={[styles.kpiLabel, { color: ui.textSecondary }]}>En retard</Text>
                <Text style={[styles.kpiValue, { color: ui.text }]}>{dueSummary.late}</Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: ui.kpiReceivableBg, borderColor: ui.kpiReceivableBorder }]}>
                <Text style={[styles.kpiLabel, { color: ui.textSecondary }]}>Cette semaine</Text>
                <Text style={[styles.kpiValue, { color: ui.text }]}>{dueSummary.soon}</Text>
              </View>
            </View>
            <View style={styles.filterRow}>
              {debtStatusOptions.map((item) => (
                <Pressable
                  key={item.value}
                  style={[
                    styles.filterChip,
                    { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                    statusFilter === item.value && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                  ]}
                  onPress={() => setStatusFilter(item.value)}
                >
                  <Text style={[styles.filterChipText, { color: ui.textSecondary }, statusFilter === item.value && { color: ui.text }]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.addBtn, { backgroundColor: ui.primary }]} onPress={() => setIsCreateOpen(true)}>
              <Text style={[styles.addBtnText, { color: ui.onPrimary }]}>Nouvelle dette</Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={<Text style={[styles.empty, { color: ui.muted }]}>Aucune dette.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.card,
              {
                borderColor: item.status === 'paid' ? `${ui.border}AA` : ui.border,
                backgroundColor: item.status === 'paid' ? ui.panel : ui.panelAlt,
                opacity: item.status === 'paid' ? 0.92 : 1,
              },
            ]}
            onPress={() => navigation.navigate('DebtDetail', { debtId: item._id })}
          >
            <View style={styles.mainRow}>
              <View style={styles.personWrap}>
                <View
                  style={[
                    styles.typeIconWrap,
                    item.type === 'payable'
                      ? { color: ui.badgePayableText, backgroundColor: ui.badgePayableBg, borderColor: ui.badgePayableBorder }
                      : { color: ui.badgeReceivableText, backgroundColor: ui.badgeReceivableBg, borderColor: ui.badgeReceivableBorder },
                  ]}
                >
                  <Ionicons
                    name={getDebtTypeIcon(item.type)}
                    size={15}
                    color={item.type === 'payable' ? ui.badgePayableText : ui.badgeReceivableText}
                  />
                </View>
                <Text style={[styles.person, { color: ui.text }]}>{item.personName}</Text>
              </View>
              <Text
                style={[
                  styles.typeBadge,
                  item.type === 'payable'
                    ? { color: ui.badgePayableText, backgroundColor: ui.badgePayableBg, borderColor: ui.badgePayableBorder }
                    : { color: ui.badgeReceivableText, backgroundColor: ui.badgeReceivableBg, borderColor: ui.badgeReceivableBorder },
                ]}
              >
                {getDebtTypeLabel(item.type)}
              </Text>
            </View>
            <Text style={[styles.amount, { color: ui.text }]}>
              {item.status === 'paid'
                ? `Soldee: ${formatCurrency(item.principalAmount || 0)}`
                : `Reste: ${formatCurrency(item.remainingAmount || 0)} / ${formatCurrency(item.principalAmount || 0)}`}
            </Text>
            <Text style={[styles.meta, { color: ui.textSecondary }]}>Statut: {getDebtStatusLabel(item.status)}</Text>
            {item.dueDate ? (
              <View style={styles.dueRow}>
                <Text style={[styles.meta, { color: ui.textSecondary }]}>Echeance: {formatDate(item.dueDate)}</Text>
                {getDueState(item.dueDate, item.status) ? (
                  <Text
                    style={[
                      styles.dueBadge,
                      getDueState(item.dueDate, item.status)?.tone === 'late'
                        ? { color: sem.danger, backgroundColor: ui.badgePayableBg, borderColor: ui.badgePayableBorder }
                        : getDueState(item.dueDate, item.status)?.tone === 'soon'
                          ? { color: ui.text, backgroundColor: ui.kpiReceivableBg, borderColor: ui.kpiReceivableBorder }
                          : { color: ui.textSecondary, backgroundColor: ui.segmentBg, borderColor: ui.inputBorder },
                    ]}
                  >
                    {getDueState(item.dueDate, item.status)?.detail}
                  </Text>
                ) : null}
              </View>
            ) : null}
            {item.status === 'open' ? (
              <View style={styles.actionRow}>
                <Pressable style={[styles.payBtn, { backgroundColor: ui.primary }]} onPress={() => openPayment(item._id)}>
                  <Text style={[styles.payBtnText, { color: ui.onPrimary }]}>{item.type === 'payable' ? 'Payer' : 'Encaisser'}</Text>
                </Pressable>
                <Pressable style={[styles.payAllBtn, { borderColor: ui.kpiReceivableBorder, backgroundColor: ui.kpiReceivableBg }]} onPress={() => payAll(item)}>
                  <Text style={[styles.payAllBtnText, { color: ui.badgeReceivableText }]}>{item.type === 'payable' ? 'Tout payer' : 'Tout encaisser'}</Text>
                </Pressable>
              </View>
            ) : null}

            {Array.isArray(item.payments) && item.payments.length > 0 ? (
              <View style={[styles.historyWrap, { borderTopColor: ui.border }]}>
                <Text style={[styles.historyTitle, { color: ui.textSecondary }]}>
                  {item.payments.length > 1 ? 'Historique paiements' : 'Dernier paiement'}
                </Text>
                {item.payments
                  .slice()
                  .reverse()
                  .slice(0, item.status === 'paid' ? 2 : 3)
                  .map((payment, index) => (
                    <View key={`${item._id}-payment-${index}`} style={styles.historyRow}>
                      <View style={[styles.historyDot, { backgroundColor: ui.primary }]} />
                      <Text style={[styles.historyDate, { color: ui.textSecondary }]}>{formatDate(payment.date)}</Text>
                      <Text style={[styles.historyAmount, { color: ui.text }]}>{formatCurrency(payment.amount || 0)}</Text>
                    </View>
                  ))}
              </View>
            ) : null}
          </Pressable>
        )}
      />

      <Modal visible={isCreateOpen} transparent animationType="slide" onRequestClose={closeCreate}>
        <View style={[styles.modalBackdrop, { backgroundColor: ui.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.modalTitle, { color: ui.text }]}>Nouvelle dette</Text>
            <TextInput
              placeholder="Personne (ex: Ali, Banque X)"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={personName}
              onChangeText={setPersonName}
            />
            <TextInput
              placeholder="Montant"
              placeholderTextColor={ui.placeholder}
              keyboardType="decimal-pad"
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={principalAmount}
              onChangeText={setPrincipalAmount}
            />
            <View style={styles.segmentRow}>
              {debtTypeOptions.map((item) => (
                <Pressable
                  key={item.value}
                  style={[
                    styles.segment,
                    { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                    type === item.value && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                  ]}
                  onPress={() => setType(item.value)}
                >
                  <Text style={[styles.segmentText, { color: ui.textSecondary }, type === item.value && { color: ui.text }]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              placeholder="Note (optionnel)"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, styles.noteInput, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={note}
              onChangeText={setNote}
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.segmentBg }]} onPress={closeCreate}>
                <Text style={[styles.modalBtnText, { color: ui.text }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.primary }]} onPress={submitCreate}>
                <Text style={[styles.modalBtnText, { color: ui.onPrimary }]}>Creer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isPayOpen} transparent animationType="slide" onRequestClose={() => setIsPayOpen(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: ui.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.modalTitle, { color: ui.text }]}>Enregistrer un paiement</Text>
            <TextInput
              placeholder="Montant du paiement"
              placeholderTextColor={ui.placeholder}
              keyboardType="decimal-pad"
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={paymentAmount}
              onChangeText={setPaymentAmount}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.segmentBg }]} onPress={() => setIsPayOpen(false)}>
                <Text style={[styles.modalBtnText, { color: ui.text }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.primary }]} onPress={submitPayment}>
                <Text style={[styles.modalBtnText, { color: ui.onPrimary }]}>Valider</Text>
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
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 8 },
  title: { fontSize: 24, fontFamily: 'Georgia', fontWeight: '700' },
  subtitle: { fontSize: 12 },
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiCard: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 10 },
  kpiLabel: { fontSize: 11 },
  kpiValue: { marginTop: 4, fontWeight: '800', fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  filterChip: { borderRadius: 14, borderWidth: 1, paddingVertical: 5, paddingHorizontal: 10 },
  filterChipText: { fontSize: 11, fontWeight: '700' },
  addBtn: { alignSelf: 'flex-start', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  addBtnText: { fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 18 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  mainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  personWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  typeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  person: { fontWeight: '700', fontSize: 14 },
  typeBadge: { borderRadius: 8, borderWidth: 1, paddingVertical: 3, paddingHorizontal: 7, fontSize: 11, fontWeight: '700' },
  amount: { fontWeight: '700', fontSize: 12 },
  meta: { fontSize: 11 },
  payBtn: { marginTop: 2, alignSelf: 'flex-start', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  payBtnText: { fontWeight: '700', fontSize: 11 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  payAllBtn: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 10 },
  payAllBtnText: { fontWeight: '700', fontSize: 11 },
  historyWrap: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, gap: 5 },
  historyTitle: { fontSize: 11, fontWeight: '700' },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyDot: { width: 6, height: 6, borderRadius: 3 },
  historyDate: { fontSize: 11, width: 82 },
  historyAmount: { fontSize: 11, fontWeight: '700' },
  dueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dueBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 10,
    fontWeight: '700',
    overflow: 'hidden',
  },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  noteInput: { minHeight: 72, textAlignVertical: 'top' },
  segmentRow: { flexDirection: 'row', gap: 10 },
  segment: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  segmentText: { fontWeight: '700' },
  modalActions: { marginTop: 4, flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  modalBtnText: { fontWeight: '700' },
});

export default DebtsScreen;
