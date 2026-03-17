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

import { budgetApi, transactionApi } from '../api/client';
import { buildCategoryOptions, expenseCategoryOptions, getCategoryIcon, getCategoryLabel, incomeCategoryOptions } from '../constants/transactionCategories';
import { useCategoryStore } from '../context/CategoryContext';
import { useAppTheme } from '../context/ThemeContext';
import { getSemanticColors } from '../theme/semanticColors';
import { findExceededBudgets } from '../utils/budgetAlerts';
import { formatCurrency } from '../utils/format';

const TransactionsScreen = () => {
  const navigation = useNavigation();
  const { palette, isLight } = useAppTheme();
  const { customCategories, addCategory } = useCategoryStore();
  const sem = useMemo(() => getSemanticColors(isLight), [isLight]);

  const [items,        setItems]        = useState([]);
  const [budgets,      setBudgets]      = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit modal
  const [isEditOpen,   setIsEditOpen]   = useState(false);
  const [isSaving,     setIsSaving]     = useState(false);
  const [editingId,    setEditingId]    = useState(null);
  const [title,        setTitle]        = useState('');
  const [amount,       setAmount]       = useState('');
  const [type,         setType]         = useState('expense');
  const [category,     setCategory]     = useState('');
  const [note,         setNote]         = useState('');

  // Filters
  const [filterType,     setFilterType]     = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAccount,  setFilterAccount]  = useState('all');

  // Pickers
  const [categoryOpen,       setCategoryOpen]       = useState(false);
  const [filterCatOpen,      setFilterCatOpen]      = useState(false);
  const [filterAccountOpen,  setFilterAccountOpen]  = useState(false);
  const [customCategoryOpen, setCustomCategoryOpen] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const ui = useMemo(() => ({
    page:        palette.background,
    panel:       palette.surface,
    panelAlt:    palette.surfaceAlt,
    border:      palette.border,
    text:        palette.text,
    sub:         palette.textSecondary,
    muted:       palette.textMuted,
    inputBg:     palette.inputBg,
    inputBorder: palette.inputBorder,
    inputText:   palette.inputText,
    placeholder: palette.placeholder,
    primary:     palette.primary,
    onPrimary:   palette.onPrimary,
    overlay:     isLight ? 'rgba(16,28,47,0.32)' : 'rgba(0,0,0,0.5)',
    softBg:      sem.softBlueBg,
    softBorder:  sem.softBlueBorder,
    editBg:      sem.editBg,
    editBorder:  sem.editBorder,
    deleteBg:    sem.deleteBg,
    deleteBorder:sem.deleteBorder,
    segBg:       sem.segmentBg,
    segActive:   sem.segmentActiveBg,
  }), [isLight, palette, sem]);

  const fetchData = useCallback(async () => {
    const [txRes, budgetRes] = await Promise.all([transactionApi.list(), budgetApi.list()]);
    setItems(txRes.data?.data || []);
    setBudgets(budgetRes.data || []);
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    const load = async () => {
      try { await fetchData(); } finally { if (active) setIsLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [fetchData]));

  const onRefresh = async () => {
    try { setIsRefreshing(true); await fetchData(); } finally { setIsRefreshing(false); }
  };

  const categoryFilterOptions = useMemo(() => [...new Set(items.map((i) => i.category).filter(Boolean))], [items]);
  const accountFilterOptions  = useMemo(() => [...new Set(items.map((i) => i.accountId?.name).filter(Boolean))], [items]);
  const categoryOptions       = useMemo(() => buildCategoryOptions(type === 'income' ? incomeCategoryOptions : expenseCategoryOptions, customCategories), [customCategories, type]);
  const filteredItems         = useMemo(() => items.filter((i) => {
    if (filterType !== 'all' && i.type !== filterType) return false;
    if (filterCategory !== 'all' && i.category !== filterCategory) return false;
    if (filterAccount !== 'all' && i.accountId?.name !== filterAccount) return false;
    return true;
  }), [filterAccount, filterCategory, filterType, items]);
  const total = useMemo(() => filteredItems.reduce((s, i) => s + Number(i.amount || 0), 0), [filteredItems]);

  const openEdit  = (item) => { setEditingId(item._id); setTitle(item.title || ''); setAmount(String(item.amount ?? '')); setType(item.type || 'expense'); setCategory(item.category || ''); setNote(item.note || ''); setIsEditOpen(true); };
  const closeEdit = () => { setIsEditOpen(false); setCategoryOpen(false); setCustomCategoryOpen(false); setEditingId(null); setTitle(''); setAmount(''); setType('expense'); setCategory(''); setNote(''); setCustomCategoryName(''); };

  const submitCustomCategory = async () => {
    const next = await addCategory(customCategoryName);
    if (!next) { Alert.alert('Validation', 'Saisis un nom de catégorie'); return; }
    setCategory(next); setTitle(next); setCustomCategoryName(''); setCustomCategoryOpen(false); setCategoryOpen(false);
  };

  const saveEdit = async (parsedAmount) => {
    setIsSaving(true);
    try {
      await transactionApi.update(editingId, { title: title.trim(), amount: parsedAmount, type, category: category.trim(), note: note.trim() || undefined });
      await fetchData();
      closeEdit();
      Alert.alert('Succès', 'Transaction mise à jour');
    } catch (err) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Mise à jour impossible');
    } finally {
      setIsSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!editingId) return;
    if (!title.trim() || !amount.trim() || !category.trim()) { Alert.alert('Validation', 'Titre, montant et catégorie sont requis'); return; }
    const n = Number(amount);
    if (Number.isNaN(n) || n < 0) { Alert.alert('Validation', 'Montant invalide'); return; }
    if (type === 'expense') {
      const exceeded = findExceededBudgets({ budgets, transactions: items, category: category.trim(), amount: n, excludeTransactionId: editingId });
      if (exceeded.length > 0) {
        const b = exceeded[0];
        Alert.alert('Budget dépassé', `Cette dépense dépasse le budget "${b.budget.name}" (${formatCurrency(b.nextSpent)} / ${formatCurrency(b.target)}). Continuer ?`, [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Continuer', onPress: () => saveEdit(n) },
        ]);
        return;
      }
    }
    await saveEdit(n);
  };

  const deleteItem = (id) => {
    Alert.alert('Confirmation', 'Supprimer cette transaction ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await transactionApi.remove(id); await fetchData(); }
        catch (err) { Alert.alert('Erreur', err?.response?.data?.message || 'Suppression impossible'); }
      }},
    ]);
  };

  if (isLoading) {
    return <View style={[styles.center, { backgroundColor: ui.page }]}><ActivityIndicator size="large" color={ui.primary} /></View>;
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
          <View style={[styles.header, { backgroundColor: ui.panel, borderColor: ui.border }]}>
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.screenTitle, { color: ui.text }]}>Transactions</Text>
                <Text style={[styles.screenMeta, { color: ui.sub }]}>Historique récent</Text>
              </View>
              <View style={[styles.totalBadge, { backgroundColor: ui.softBg, borderColor: ui.softBorder }]}>
                <Text style={[styles.totalLabel, { color: ui.sub }]}>VOLUME</Text>
                <Text style={[styles.totalValue, { color: ui.text }]}>{formatCurrency(total)}</Text>
              </View>
            </View>

            {/* Type filter chips */}
            <View style={styles.chipRow}>
              {[{ value: 'all', label: 'Toutes' }, { value: 'expense', label: 'Dépenses' }, { value: 'income', label: 'Revenus' }].map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.chip, { borderColor: ui.inputBorder, backgroundColor: ui.segBg }, filterType === opt.value && { borderColor: ui.primary, backgroundColor: ui.segActive }]}
                  onPress={() => setFilterType(opt.value)}
                >
                  <Text style={[styles.chipText, { color: filterType === opt.value ? ui.text : ui.sub }]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Select filters */}
            <View style={styles.selectRow}>
              <Pressable style={[styles.select, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg }]} onPress={() => setFilterCatOpen(true)}>
                <Text style={[styles.selectText, { color: filterCategory === 'all' ? ui.placeholder : ui.inputText }]} numberOfLines={1}>
                  {filterCategory === 'all' ? 'Toutes catégories' : getCategoryLabel(filterCategory)}
                </Text>
                <Ionicons name="chevron-down" size={14} color={ui.sub} />
              </Pressable>
              <Pressable style={[styles.select, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg }]} onPress={() => setFilterAccountOpen(true)}>
                <Text style={[styles.selectText, { color: filterAccount === 'all' ? ui.placeholder : ui.inputText }]} numberOfLines={1}>
                  {filterAccount === 'all' ? 'Tous comptes' : filterAccount}
                </Text>
                <Ionicons name="chevron-down" size={14} color={ui.sub} />
              </Pressable>
            </View>

            {(filterType !== 'all' || filterCategory !== 'all' || filterAccount !== 'all') && (
              <Pressable style={[styles.resetBtn, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]}
                onPress={() => { setFilterType('all'); setFilterCategory('all'); setFilterAccount('all'); }}>
                <Ionicons name="refresh-outline" size={12} color={ui.primary} />
                <Text style={[styles.resetText, { color: ui.text }]}>Réinitialiser filtres</Text>
              </Pressable>
            )}

            <Pressable style={[styles.addBtn, { backgroundColor: ui.primary }]} onPress={() => navigation.navigate('Add')}>
              <Ionicons name="add" size={16} color={ui.onPrimary} />
              <Text style={[styles.addBtnText, { color: ui.onPrimary }]}>Nouvelle transaction</Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={<Text style={[styles.empty, { color: ui.muted }]}>Aucune transaction pour le moment.</Text>}
        renderItem={({ item }) => {
          const isIncome = item.type === 'income';
          const accentBg     = isIncome ? sem.incomeBg     : sem.expenseBg;
          const accentBorder = isIncome ? sem.incomeBorder : sem.expenseBorder;
          const accentColor  = isIncome ? sem.success      : sem.danger;
          return (
            <View style={[styles.card, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
              <View style={[styles.iconWrap, { backgroundColor: accentBg, borderColor: accentBorder }]}>
                <Ionicons name={getCategoryIcon(item.category)} size={14} color={accentColor} />
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: ui.text }]}>
                  {item.title === item.category ? getCategoryLabel(item.category) : item.title}
                </Text>
                <Text style={[styles.cardMeta, { color: ui.sub }]}>
                  {getCategoryLabel(item.category)}{item.accountId?.name ? ` · ${item.accountId.name}` : ''}
                </Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.amount, { color: accentColor, backgroundColor: accentBg, borderColor: accentBorder }]}>
                  {isIncome ? '+' : '-'} {formatCurrency(item.amount || 0)}
                </Text>
                <View style={styles.actionRow}>
                  <Pressable style={[styles.smallBtn, { borderColor: ui.editBorder, backgroundColor: ui.editBg }]} onPress={() => openEdit(item)}>
                    <Ionicons name="create-outline" size={12} color={ui.text} />
                    <Text style={[styles.smallBtnText, { color: ui.text }]}>Modifier</Text>
                  </Pressable>
                  <Pressable style={[styles.smallBtn, { borderColor: ui.deleteBorder, backgroundColor: ui.deleteBg }]} onPress={() => deleteItem(item._id)}>
                    <Ionicons name="trash-outline" size={12} color={sem.danger} />
                    <Text style={[styles.smallBtnText, { color: sem.danger }]}>Suppr.</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* ── Edit modal ── */}
      <Modal visible={isEditOpen} transparent animationType="slide" onRequestClose={closeEdit}>
        <View style={[styles.backdrop, { backgroundColor: ui.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.sheetTitle, { color: ui.text }]}>Modifier transaction</Text>
            <TextInput placeholder="Titre" placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={title} onChangeText={setTitle} />
            <TextInput placeholder="Montant" placeholderTextColor={ui.placeholder} keyboardType="decimal-pad"
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={amount} onChangeText={setAmount} />
            <Pressable style={[styles.selectField, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg }]} onPress={() => setCategoryOpen(true)}>
              <Text style={[styles.selectFieldText, { color: category ? ui.inputText : ui.placeholder }]}>
                {category ? getCategoryLabel(category) : 'Choisir une catégorie'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={ui.sub} />
            </Pressable>
            {/* Type toggle */}
            <View style={styles.segmentRow}>
              {[{ value: 'expense', label: 'Dépense' }, { value: 'income', label: 'Revenu' }].map((opt) => (
                <Pressable key={opt.value}
                  style={[styles.segment, { borderColor: ui.inputBorder, backgroundColor: ui.segBg }, type === opt.value && { borderColor: ui.primary, backgroundColor: ui.segActive }]}
                  onPress={() => setType(opt.value)}>
                  <Text style={[styles.segmentText, { color: type === opt.value ? ui.text : ui.sub }]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput placeholder="Note (optionnel)" placeholderTextColor={ui.placeholder} multiline
              style={[styles.input, styles.noteInput, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={note} onChangeText={setNote} />
            <View style={styles.sheetActions}>
              <Pressable style={[styles.sheetBtn, { backgroundColor: ui.segBg }]} onPress={closeEdit}>
                <Text style={[styles.sheetBtnText, { color: ui.text }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.sheetBtn, { backgroundColor: ui.primary }]} onPress={submitEdit} disabled={isSaving}>
                <Text style={[styles.sheetBtnText, { color: ui.onPrimary }]}>{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Category picker ── */}
      <Modal visible={categoryOpen} transparent animationType="fade" onRequestClose={() => setCategoryOpen(false)}>
        <View style={[styles.backdrop, { backgroundColor: ui.overlay, justifyContent: 'center', paddingHorizontal: 20 }]}>
          <View style={[styles.pickerCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.sheetTitle, { color: ui.text }]}>Choisir une catégorie</Text>
            {categoryOptions.map((opt) => (
              <Pressable key={opt.value}
                style={[styles.pickerOption, { borderColor: ui.inputBorder, backgroundColor: ui.segBg }, category === opt.value && { borderColor: ui.primary, backgroundColor: ui.segActive }]}
                onPress={() => { if (opt.value === 'Autre') { setCustomCategoryOpen(true); return; } setCategory(opt.value); setTitle(opt.label); setCategoryOpen(false); }}>
                <Text style={[styles.pickerOptionText, { color: category === opt.value ? ui.text : ui.sub }]}>{opt.label}</Text>
                {category === opt.value && <Ionicons name="checkmark" size={16} color={ui.primary} />}
              </Pressable>
            ))}
            <Pressable style={[styles.sheetBtn, { backgroundColor: ui.segBg }]} onPress={() => setCategoryOpen(false)}>
              <Text style={[styles.sheetBtnText, { color: ui.text }]}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Filter: category ── */}
      <Modal visible={filterCatOpen} transparent animationType="fade" onRequestClose={() => setFilterCatOpen(false)}>
        <View style={[styles.backdrop, { backgroundColor: ui.overlay, justifyContent: 'center', paddingHorizontal: 20 }]}>
          <View style={[styles.pickerCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.sheetTitle, { color: ui.text }]}>Filtrer par catégorie</Text>
            <Pressable style={[styles.pickerOption, { borderColor: ui.inputBorder, backgroundColor: ui.segBg }]} onPress={() => { setFilterCategory('all'); setFilterCatOpen(false); }}>
              <Text style={[styles.pickerOptionText, { color: ui.text }]}>Toutes catégories</Text>
            </Pressable>
            {categoryFilterOptions.map((cat) => (
              <Pressable key={cat}
                style={[styles.pickerOption, { borderColor: ui.inputBorder, backgroundColor: ui.segBg }, filterCategory === cat && { borderColor: ui.primary, backgroundColor: ui.segActive }]}
                onPress={() => { setFilterCategory(cat); setFilterCatOpen(false); }}>
                <Text style={[styles.pickerOptionText, { color: filterCategory === cat ? ui.text : ui.sub }]}>{getCategoryLabel(cat)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* ── Filter: account ── */}
      <Modal visible={filterAccountOpen} transparent animationType="fade" onRequestClose={() => setFilterAccountOpen(false)}>
        <View style={[styles.backdrop, { backgroundColor: ui.overlay, justifyContent: 'center', paddingHorizontal: 20 }]}>
          <View style={[styles.pickerCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.sheetTitle, { color: ui.text }]}>Filtrer par compte</Text>
            <Pressable style={[styles.pickerOption, { borderColor: ui.inputBorder, backgroundColor: ui.segBg }]} onPress={() => { setFilterAccount('all'); setFilterAccountOpen(false); }}>
              <Text style={[styles.pickerOptionText, { color: ui.text }]}>Tous comptes</Text>
            </Pressable>
            {accountFilterOptions.map((acc) => (
              <Pressable key={acc}
                style={[styles.pickerOption, { borderColor: ui.inputBorder, backgroundColor: ui.segBg }, filterAccount === acc && { borderColor: ui.primary, backgroundColor: ui.segActive }]}
                onPress={() => { setFilterAccount(acc); setFilterAccountOpen(false); }}>
                <Text style={[styles.pickerOptionText, { color: filterAccount === acc ? ui.text : ui.sub }]}>{acc}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* ── Custom category ── */}
      <Modal visible={customCategoryOpen} transparent animationType="fade" onRequestClose={() => setCustomCategoryOpen(false)}>
        <View style={[styles.backdrop, { backgroundColor: ui.overlay, justifyContent: 'center', paddingHorizontal: 20 }]}>
          <View style={[styles.pickerCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.sheetTitle, { color: ui.text }]}>Nouvelle catégorie</Text>
            <TextInput placeholder="Ex: Restaurant, Taxi, Prime" placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={customCategoryName} onChangeText={setCustomCategoryName} />
            <View style={styles.sheetActions}>
              <Pressable style={[styles.sheetBtn, { backgroundColor: ui.segBg }]} onPress={() => setCustomCategoryOpen(false)}>
                <Text style={[styles.sheetBtnText, { color: ui.text }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.sheetBtn, { backgroundColor: ui.primary }]} onPress={submitCustomCategory}>
                <Text style={[styles.sheetBtnText, { color: ui.onPrimary }]}>Ajouter</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  page:    { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, gap: 10 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:    { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10, marginBottom: 4 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  screenTitle: { fontSize: 24, fontFamily: 'Georgia', fontWeight: '700' },
  screenMeta:  { marginTop: 3, fontSize: 12 },
  totalBadge:  { borderRadius: 12, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 10, alignItems: 'flex-end' },
  totalLabel:  { fontSize: 10, letterSpacing: 0.5 },
  totalValue:  { marginTop: 2, fontWeight: '800', fontSize: 12 },

  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip:    { borderWidth: 1, borderRadius: 14, paddingVertical: 5, paddingHorizontal: 10 },
  chipText:{ fontSize: 11, fontWeight: '700' },

  selectRow: { flexDirection: 'row', gap: 8 },
  select:    { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText:{ flex: 1, fontSize: 12, fontWeight: '600', marginRight: 4 },

  resetBtn:  { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  resetText: { fontSize: 11, fontWeight: '700' },

  addBtn:    { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 },
  addBtnText:{ fontSize: 12, fontWeight: '700' },

  card:     { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cardBody: { flex: 1 },
  cardTitle:{ fontWeight: '700', fontSize: 14 },
  cardMeta: { marginTop: 2, fontSize: 12 },
  cardRight:{ alignItems: 'flex-end', gap: 8 },
  amount:   { fontWeight: '800', fontSize: 12, borderWidth: 1, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 7, overflow: 'hidden' },
  actionRow:{ flexDirection: 'row', gap: 6 },
  smallBtn: { borderRadius: 8, paddingVertical: 5, paddingHorizontal: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  smallBtnText: { fontSize: 10, fontWeight: '700' },

  empty:  { textAlign: 'center', marginTop: 20 },

  backdrop:   { flex: 1, justifyContent: 'flex-end' },
  sheet:      { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, borderTopWidth: 1, gap: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  input:      { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  noteInput:  { minHeight: 72, textAlignVertical: 'top' },
  selectField:     { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectFieldText: { fontWeight: '600' },
  segmentRow: { flexDirection: 'row', gap: 10 },
  segment:    { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  segmentText:{ fontWeight: '700' },
  sheetActions:{ flexDirection: 'row', gap: 10, marginTop: 4 },
  sheetBtn:   { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  sheetBtnText:{ fontWeight: '700' },

  pickerCard:       { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  pickerOption:     { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerOptionText: { fontWeight: '700' },
});

export default TransactionsScreen;
