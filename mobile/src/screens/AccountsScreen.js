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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { accountApi } from '../api/client';
import { accountTypeOptions, getAccountTypeLabel } from '../constants/accountTypes';
import { useAppTheme } from '../context/ThemeContext';
import { getSemanticColors } from '../theme/semanticColors';
import { formatCurrency, formatCompactMoney } from '../utils/format';

const AccountsScreen = () => {
  const { palette, isLight } = useAppTheme();
  const sem = useMemo(() => getSemanticColors(isLight), [isLight]);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ totalBalance: 0, accountsCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [formOpen,     setFormOpen]     = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [openingBalance, setOpeningBalance] = useState('');
  const [adjustingAccount, setAdjustingAccount] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  const fetchData = useCallback(async () => {
    const [listRes, summaryRes] = await Promise.all([accountApi.list(), accountApi.summary()]);
    setItems(listRes.data || []);
    setSummary(summaryRes.data || { totalBalance: 0, accountsCount: 0 });
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

  const resetForm = () => { setEditingId(null); setName(''); setType('bank'); setOpeningBalance(''); };
  const closeForm  = () => { setFormOpen(false); resetForm(); };
  const openCreate = () => { resetForm(); setFormOpen(true); };
  const openEdit   = (item) => { setEditingId(item._id); setName(item.name || ''); setType(item.type || 'bank'); setOpeningBalance(String(item.openingBalance ?? '0')); setFormOpen(true); };

  const submitForm = async () => {
    if (!name.trim()) { Alert.alert('Validation', 'Nom du compte requis'); return; }
    const opening = openingBalance.trim() ? Number(openingBalance) : 0;
    if (Number.isNaN(opening) || opening < 0) { Alert.alert('Validation', 'Solde initial invalide'); return; }
    try {
      if (editingId) {
        await accountApi.update(editingId, { name: name.trim(), type, openingBalance: opening });
        Alert.alert('Succès', 'Compte mis à jour');
      } else {
        await accountApi.create({ name: name.trim(), type, openingBalance: opening });
        Alert.alert('Succès', 'Compte créé');
      }
      await fetchData();
      closeForm();
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Opération impossible');
    }
  };

  const closeAdjust = () => {
    setIsAdjustOpen(false);
    setAdjustingAccount(null);
    setAdjustAmount('');
    setAdjustNote('');
  };

  const openAdjust = (account) => {
    setAdjustingAccount(account);
    setAdjustAmount('');
    setAdjustNote('');
    setIsAdjustOpen(true);
  };

  const submitAdjust = async (direction) => {
    if (!adjustingAccount?._id) return;

    const parsedAmount = Number(adjustAmount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation', 'Saisis un montant positif');
      return;
    }

    const amount = direction === 'decrease' ? -parsedAmount : parsedAmount;

    try {
      await accountApi.adjust(adjustingAccount._id, { amount, note: adjustNote.trim() || undefined });
      await fetchData();
      closeAdjust();
      Alert.alert('Succes', direction === 'decrease' ? 'Solde diminue' : 'Solde augmente');
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Ajustement impossible');
    }
  };

  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') return items;
    if (statusFilter === 'inactive') return items.filter((item) => item.isActive === false);
    return items.filter((item) => item.isActive !== false);
  }, [items, statusFilter]);

  const inactiveCount = useMemo(() => items.filter((item) => item.isActive === false).length, [items]);

  const archiveAccount = async (item) => {
    try {
      await accountApi.update(item._id, { isActive: false });
      await fetchData();
      Alert.alert('Succes', 'Compte archive');
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Archivage impossible');
    }
  };

  const restoreAccount = async (item) => {
    try {
      await accountApi.update(item._id, { isActive: true });
      await fetchData();
      Alert.alert('Succes', 'Compte reactive');
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Reactivation impossible');
    }
  };

  const deleteAccount = (item) => {
    Alert.alert('Confirmation', 'Supprimer ce compte ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await accountApi.remove(item._id);
            await fetchData();
          } catch (error) {
            Alert.alert('Erreur', error?.response?.data?.message || 'Suppression impossible');
          }
        },
      },
    ]);
  };

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
      kpiBg: sem.incomeBg,
      kpiBorder: sem.incomeBorder,
      kpiText: sem.success,
      actionBg: sem.softBlueBg,
      actionBorder: sem.softBlueBorder,
    }),
    [isLight, palette, sem.incomeBg, sem.incomeBorder, sem.segmentActiveBg, sem.segmentBg, sem.softBlueBg, sem.softBlueBorder, sem.success]
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
        data={filteredItems}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={ui.primary} />}
        ListHeaderComponent={
          <View style={[styles.hero, { borderColor: ui.border, backgroundColor: ui.panel }]}> 
            <Text style={[styles.title, { color: ui.text }]}>Comptes</Text>
            <Text style={[styles.subtitle, { color: ui.textSecondary }]}>Cash, banque, mobile money</Text>
            <View style={styles.kpiRow}>
              <View style={[styles.kpi, { borderColor: ui.kpiBorder, backgroundColor: ui.kpiBg }]}>
                <Text style={[styles.kpiLabel, { color: ui.kpiText }]}>Total disponible</Text>
                <Text style={[styles.kpiValue, { color: ui.text }]}>{formatCompactMoney(summary.totalBalance || 0)}</Text>
                <Text style={[styles.kpiSubtle, { color: ui.textSecondary }]}>{formatCurrency(summary.totalBalance || 0)}</Text>
              </View>
              <View style={[styles.kpi, { borderColor: ui.actionBorder, backgroundColor: ui.actionBg }]}>
                <Text style={[styles.kpiLabel, { color: ui.textSecondary }]}>Comptes</Text>
                <Text style={[styles.kpiValue, { color: ui.text }]}>{summary.accountsCount || 0}</Text>
                <Text style={[styles.kpiSubtle, { color: ui.textSecondary }]}>{inactiveCount} archive(s)</Text>
              </View>
            </View>
            <View style={styles.filterRow}>
              {[
                { value: 'active', label: 'Actifs' },
                { value: 'inactive', label: 'Archives' },
                { value: 'all', label: 'Tous' },
              ].map((item) => (
                <Pressable
                  key={item.value}
                  style={[
                    styles.filterChip,
                    { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                    statusFilter === item.value && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                  ]}
                  onPress={() => setStatusFilter(item.value)}
                >
                  <Text style={[styles.filterChipText, { color: statusFilter === item.value ? ui.text : ui.textSecondary }]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.addBtn, { backgroundColor: ui.primary }]} onPress={openCreate}>
              <Text style={[styles.addBtnText, { color: ui.onPrimary }]}>Nouveau compte</Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={<Text style={[styles.empty, { color: ui.muted }]}>Aucun compte pour ce filtre.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, { borderColor: ui.border, backgroundColor: ui.panelAlt }]}>
            <View style={styles.row}>
              <View style={styles.nameWrap}>
                <View style={[styles.accountIconWrap, { borderColor: ui.actionBorder, backgroundColor: ui.actionBg }]}>
                  <Ionicons name={item.type === 'bank' ? 'card-outline' : item.type === 'cash' ? 'cash-outline' : item.type === 'mobile_money' ? 'phone-portrait-outline' : 'wallet-outline'} size={14} color={ui.text} />
                </View>
                <Text style={[styles.name, { color: ui.text }]}>{item.name}</Text>
              </View>
              <Text style={[styles.type, { color: ui.textSecondary }]}>{getAccountTypeLabel(item.type)}</Text>
            </View>
            <Text style={[styles.balance, { color: ui.text }]}>{formatCompactMoney(item.currentBalance || 0)}</Text>
            <Text style={[styles.meta, { color: ui.textSecondary }]}>Solde initial: {formatCurrency(item.openingBalance || 0)}</Text>
            {Array.isArray(item.movements) && item.movements.length > 0 ? (
              <View style={styles.movementWrap}>
                <Text style={[styles.movementTitle, { color: ui.textSecondary }]}>Dernier mouvement</Text>
                <Text style={[styles.movementText, { color: ui.text }]}>
                  {item.movements[item.movements.length - 1].amount > 0 ? '+' : '-'} {formatCompactMoney(Math.abs(item.movements[item.movements.length - 1].amount || 0))}
                  {item.movements[item.movements.length - 1].note ? ` • ${item.movements[item.movements.length - 1].note}` : ''}
                </Text>
              </View>
            ) : null}
            <View style={styles.actions}>
              <Pressable style={[styles.actionBtn, { borderColor: ui.actionBorder, backgroundColor: ui.actionBg }]} onPress={() => openAdjust(item)}>
                <Text style={[styles.actionText, { color: ui.text }]}>Ajuster + / -</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { borderColor: ui.actionBorder, backgroundColor: ui.actionBg }]} onPress={() => openEdit(item)}>
                <Text style={[styles.actionText, { color: ui.text }]}>Modifier</Text>
              </Pressable>
            </View>
            <View style={styles.actions}>
              {item.isActive !== false ? (
                <Pressable style={[styles.actionBtn, { borderColor: ui.actionBorder, backgroundColor: ui.actionBg }]} onPress={() => archiveAccount(item)}>
                  <Text style={[styles.actionText, { color: ui.text }]}>Archiver</Text>
                </Pressable>
              ) : (
                <Pressable style={[styles.actionBtn, { borderColor: ui.actionBorder, backgroundColor: ui.actionBg }]} onPress={() => restoreAccount(item)}>
                  <Text style={[styles.actionText, { color: ui.text }]}>Reactiver</Text>
                </Pressable>
              )}
              <Pressable style={[styles.actionBtn, { borderColor: sem.deleteBorder || ui.border, backgroundColor: sem.deleteBg || ui.panel }]} onPress={() => deleteAccount(item)}>
                <Text style={[styles.actionText, { color: sem.danger }]}>Suppr.</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      {/* ── Create / Edit modal (unified) ── */}
      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={closeForm}>
        <View style={[styles.modalBackdrop, { backgroundColor: ui.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.modalTitle, { color: ui.text }]}>{editingId ? 'Modifier compte' : 'Nouveau compte'}</Text>
            <TextInput
              placeholder="Nom (ex: Banque principale)"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={name}
              onChangeText={setName}
            />
            <View style={styles.segmentRow}>
              {accountTypeOptions.map((item) => (
                <Pressable
                  key={item.value}
                  style={[styles.segment, { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg }, type === item.value && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg }]}
                  onPress={() => setType(item.value)}
                >
                  <Text style={[styles.segmentText, { color: ui.textSecondary }, type === item.value && { color: ui.text }]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              placeholder="Solde initial"
              placeholderTextColor={ui.placeholder}
              keyboardType="decimal-pad"
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={openingBalance}
              onChangeText={setOpeningBalance}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.segmentBg }]} onPress={closeForm}>
                <Text style={[styles.modalBtnText, { color: ui.text }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.primary }]} onPress={submitForm}>
                <Text style={[styles.modalBtnText, { color: ui.onPrimary }]}>{editingId ? 'Sauvegarder' : 'Créer'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isAdjustOpen} transparent animationType="slide" onRequestClose={closeAdjust}>
        <View style={[styles.modalBackdrop, { backgroundColor: ui.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.modalTitle, { color: ui.text }]}>Ajuster solde</Text>
            <Text style={[styles.adjustHint, { color: ui.textSecondary }]}>
              {adjustingAccount ? `${adjustingAccount.name} - actuel ${formatCurrency(adjustingAccount.currentBalance || 0)}` : ''}
            </Text>
            <TextInput
              placeholder="Montant a ajuster"
              placeholderTextColor={ui.placeholder}
              keyboardType="decimal-pad"
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={adjustAmount}
              onChangeText={setAdjustAmount}
            />
            <TextInput
              placeholder="Note (optionnel)"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, styles.noteInput, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={adjustNote}
              onChangeText={setAdjustNote}
              multiline
            />
            <Text style={[styles.adjustHint, { color: ui.textSecondary }]}>
              Saisis un montant positif, puis choisis augmenter ou diminuer.
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.segmentBg }]} onPress={closeAdjust}>
                <Text style={[styles.modalBtnText, { color: ui.text }]}>Annuler</Text>
              </Pressable>
            </View>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.iconBtn, { backgroundColor: ui.primary }]} onPress={() => submitAdjust('increase')}>
                <Ionicons name="arrow-up-circle-outline" size={16} color={ui.onPrimary} />
                <Text style={[styles.modalBtnText, { color: ui.onPrimary }]}>Augmenter</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.iconBtn, { backgroundColor: sem.danger }]} onPress={() => submitAdjust('decrease')}>
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
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 8 },
  title: { fontSize: 24, fontFamily: 'Georgia', fontWeight: '700' },
  subtitle: { fontSize: 12 },
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpi: { borderRadius: 12, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 10 },
  kpiLabel: { fontSize: 11 },
  kpiValue: { marginTop: 4, fontWeight: '800', fontSize: 16 },
  kpiSubtle: { marginTop: 2, fontSize: 10 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { borderRadius: 999, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 10 },
  filterChipText: { fontSize: 11, fontWeight: '700' },
  addBtn: { alignSelf: 'flex-start', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  addBtnText: { fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 18 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nameWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  accountIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontWeight: '700', fontSize: 14 },
  type: { fontSize: 11 },
  balance: { fontWeight: '800', fontSize: 16 },
  meta: { fontSize: 11 },
  movementWrap: { marginTop: 2, gap: 2 },
  movementTitle: { fontSize: 11, fontWeight: '700' },
  movementText: { fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { borderRadius: 8, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 10, flex: 1, alignItems: 'center' },
  actionText: { fontSize: 11, fontWeight: '700' },
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
  adjustHint: { fontSize: 12, lineHeight: 18 },
  noteInput: { minHeight: 72, textAlignVertical: 'top' },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  segmentText: { fontWeight: '700', fontSize: 11 },
  modalActions: { marginTop: 4, flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  iconBtn: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  modalBtnText: { fontWeight: '700' },
});

export default AccountsScreen;
