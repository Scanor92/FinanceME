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
import { budgetCategoryOptions, buildCategoryOptions, getCategoryIcon, getCategoryLabel } from '../constants/transactionCategories';
import { useCategoryStore } from '../context/CategoryContext';
import { useAppTheme } from '../context/ThemeContext';
import { getSemanticColors } from '../theme/semanticColors';
import { formatCurrency } from '../utils/format';

const periodOptions = [
  { value: 'weekly',     label: 'Hebdomadaire' },
  { value: 'monthly',    label: 'Mensuel'      },
  { value: 'quarterly',  label: 'Trimestriel'  },
  { value: 'semiannual', label: 'Semestriel'   },
  { value: 'annual',     label: 'Annuel'       },
];

const getPeriodLabel = (p) => periodOptions.find((o) => o.value === p)?.label ?? 'Mensuel';

const isInBudgetPeriod = (dateValue, period) => {
  const txDate = new Date(dateValue);
  if (Number.isNaN(txDate.getTime())) return false;
  const now = new Date();
  if (period === 'weekly') {
    const diff = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(now.getDate() - diff);
    const end   = new Date(start); end.setDate(start.getDate() + 7);
    return txDate >= start && txDate < end;
  }
  if (period === 'quarterly') {
    return Math.floor(txDate.getMonth() / 3) === Math.floor(now.getMonth() / 3) && txDate.getFullYear() === now.getFullYear();
  }
  if (period === 'semiannual') {
    const sem = (m) => (m < 6 ? 0 : 1);
    return sem(txDate.getMonth()) === sem(now.getMonth()) && txDate.getFullYear() === now.getFullYear();
  }
  if (period === 'annual') return txDate.getFullYear() === now.getFullYear();
  return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
};

const BudgetsScreen = () => {
  const navigation = useNavigation();
  const { palette, isLight } = useAppTheme();
  const { customCategories, addCategory } = useCategoryStore();
  const sem = useMemo(() => getSemanticColors(isLight), [isLight]);

  const [budgets,      setBudgets]      = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form modal (create + edit unified)
  const [formOpen,       setFormOpen]       = useState(false);
  const [editingId,      setEditingId]      = useState(null);
  const [isSaving,       setIsSaving]       = useState(false);
  const [name,           setName]           = useState('');
  const [amount,         setAmount]         = useState('');
  const [category,       setCategory]       = useState('');
  const [period,         setPeriod]         = useState('monthly');

  // Adjust modal
  const [adjustOpen,     setAdjustOpen]     = useState(false);
  const [adjustingBudget,setAdjustingBudget]= useState(null);
  const [adjustAmount,   setAdjustAmount]   = useState('');

  // Pickers
  const [categoryPickerOpen,      setCategoryPickerOpen]      = useState(false);
  const [customCategoryOpen,      setCustomCategoryOpen]      = useState(false);
  const [customCategoryName,      setCustomCategoryName]      = useState('');
  const [periodPickerOpen,        setPeriodPickerOpen]        = useState(false);

  const categoryOptions = useMemo(() => buildCategoryOptions(budgetCategoryOptions, customCategories), [customCategories]);

  const ui = useMemo(() => ({
    page:         palette.background,
    panel:        palette.surface,
    panelAlt:     palette.surfaceAlt,
    border:       palette.border,
    text:         palette.text,
    sub:          palette.textSecondary,
    muted:        palette.textMuted,
    inputBg:      palette.inputBg,
    inputBorder:  palette.inputBorder,
    inputText:    palette.inputText,
    placeholder:  palette.placeholder,
    primary:      palette.primary,
    onPrimary:    palette.onPrimary,
    overlay:      isLight ? 'rgba(16,28,47,0.32)' : 'rgba(0,0,0,0.5)',
    softBg:       sem.softBlueBg,
    softBorder:   sem.softBlueBorder,
    segBg:        sem.segmentBg,
    segActive:    sem.segmentActiveBg,
    successBg:    sem.incomeBg,
    successBorder:sem.incomeBorder,
    dangerBg:     sem.expenseBg,
    dangerBorder: sem.expenseBorder,
    ribbonBg:     sem.softBlueBg,
    ribbonText:   palette.primary,
  }), [isLight, palette, sem]);

  const fetchData = useCallback(async () => {
    const [budgetRes, txRes] = await Promise.all([
      budgetApi.list(),
      transactionApi.listExtended({ limit: 'all', page: 1, type: 'expense' }),
    ]);
    setBudgets(budgetRes.data || []);
    setTransactions(txRes.data?.data || []);
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

  const budgetsWithProgress = useMemo(() => budgets.map((b) => {
    const spent    = transactions
      .filter((tx) => tx.category === b.category && isInBudgetPeriod(tx.date, b.period || 'monthly'))
      .reduce((s, tx) => s + Number(tx.amount || 0), 0);
    const target   = Number(b.amount || 0);
    const progress = target > 0 ? Math.min(100, Math.round((spent / target) * 100)) : 0;
    return { ...b, spent, progress, remaining: Math.max(0, target - spent), exceeded: spent > target };
  }), [budgets, transactions]);

  const totals = useMemo(() => budgetsWithProgress.reduce(
    (acc, b) => { acc.total += Number(b.amount || 0); acc.spent += b.spent; if (b.exceeded) acc.exceeded++; return acc; },
    { total: 0, spent: 0, exceeded: 0 }
  ), [budgetsWithProgress]);

  // Form helpers
  const resetForm = () => { setEditingId(null); setName(''); setAmount(''); setCategory(''); setPeriod('monthly'); };
  const openCreate = () => { resetForm(); setFormOpen(true); };
  const openEdit   = (b) => { setEditingId(b._id); setName(b.name || ''); setAmount(String(b.amount ?? '')); setCategory(b.category || ''); setPeriod(b.period || 'monthly'); setFormOpen(true); };
  const closeForm  = () => { setFormOpen(false); setCategoryPickerOpen(false); setCustomCategoryOpen(false); setPeriodPickerOpen(false); resetForm(); };

  const validateForm = () => {
    if (!name.trim() || !amount.trim() || !category.trim()) { Alert.alert('Validation', 'Nom, montant et catégorie sont requis'); return null; }
    const n = Number(amount);
    if (Number.isNaN(n) || n < 0) { Alert.alert('Validation', 'Montant invalide'); return null; }
    return { name: name.trim(), amount: n, category: category.trim(), period };
  };

  const submitForm = async () => {
    const payload = validateForm();
    if (!payload) return;
    try {
      setIsSaving(true);
      if (editingId) {
        await budgetApi.update(editingId, payload);
        Alert.alert('Succès', 'Budget mis à jour');
      } else {
        await budgetApi.create(payload);
        Alert.alert('Succès', 'Budget créé');
      }
      await fetchData();
      closeForm();
    } catch (err) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Opération impossible');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBudget = (id) => {
    Alert.alert('Confirmation', 'Supprimer ce budget ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await budgetApi.remove(id); await fetchData(); }
        catch (err) { Alert.alert('Erreur', err?.response?.data?.message || 'Suppression impossible'); }
      }},
    ]);
  };

  const openAdjust  = (b) => { setAdjustingBudget(b); setAdjustAmount(''); setAdjustOpen(true); };
  const closeAdjust = () => { setAdjustOpen(false); setAdjustingBudget(null); setAdjustAmount(''); };

  const submitAdjust = async (direction) => {
    const n = Number(adjustAmount);
    if (Number.isNaN(n) || n <= 0) { Alert.alert('Validation', 'Saisis un montant positif'); return; }
    const next = Number(adjustingBudget.amount || 0) + (direction === 'decrease' ? -n : n);
    if (next < 0) { Alert.alert('Validation', 'Le budget ne peut pas être négatif'); return; }
    try {
      setIsSaving(true);
      await budgetApi.adjust(adjustingBudget._id, { amount: n, direction });
      await fetchData();
      closeAdjust();
      Alert.alert('Succès', direction === 'decrease' ? 'Budget diminué' : 'Budget augmenté');
    } catch (err) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Ajustement impossible');
    } finally {
      setIsSaving(false);
    }
  };

  const submitCustomCategory = async () => {
    const next = await addCategory(customCategoryName);
    if (!next) { Alert.alert('Validation', 'Saisis un nom de catégorie'); return; }
    setCategory(next); setCustomCategoryName(''); setCustomCategoryOpen(false); setCategoryPickerOpen(false);
  };

  if (isLoading) {
    return <View style={[styles.center, { backgroundColor: ui.page }]}><ActivityIndicator size="large" color={ui.primary} /></View>;
  }

  return (
    <>
      <FlatList
        style={[styles.page, { backgroundColor: ui.page }]}
        contentContainerStyle={styles.content}
        data={budgetsWithProgress}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={ui.primary} />}
        ListHeaderComponent={
          <>
            {/* Hero */}
            <View style={[styles.hero, { backgroundColor: ui.panel, borderColor: ui.border }]}>
              <View style={[styles.ribbon, { backgroundColor: ui.ribbonBg }]}>
                <Text style={[styles.ribbonText, { color: ui.ribbonText }]}>BUDGETS</Text>
              </View>
              <Text style={[styles.heroTitle, { color: ui.text }]}>Maîtriser les dépenses</Text>
              <Text style={[styles.heroSub, { color: ui.sub }]}>Fixe un plafond, suis la consommation, ajuste avant de dépasser.</Text>

              {/* KPIs */}
              <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { backgroundColor: ui.softBg, borderColor: ui.softBorder }]}>
                  <Text style={[styles.kpiLabel, { color: ui.sub }]}>Budget total</Text>
                  <Text style={[styles.kpiValue, { color: ui.text }]}>{formatCurrency(totals.total)}</Text>
                </View>
                <View style={[styles.kpiCard, { backgroundColor: ui.successBg, borderColor: ui.successBorder }]}>
                  <Text style={[styles.kpiLabel, { color: ui.sub }]}>Dépensé</Text>
                  <Text style={[styles.kpiValue, { color: ui.text }]}>{formatCurrency(totals.spent)}</Text>
                </View>
              </View>

              {/* Alert banner */}
              <View style={[styles.alertBanner, {
                backgroundColor: totals.exceeded > 0 ? ui.dangerBg : ui.successBg,
                borderColor:     totals.exceeded > 0 ? ui.dangerBorder : ui.successBorder,
              }]}>
                <Text style={[styles.alertTitle, { color: ui.text }]}>
                  {totals.exceeded > 0 ? `${totals.exceeded} budget(s) dépassé(s)` : 'Aucun budget dépassé'}
                </Text>
                <Text style={[styles.alertText, { color: ui.sub }]}>
                  {totals.exceeded > 0
                    ? 'Priorise les catégories sous tension pour ajuster rapidement.'
                    : 'Ton rythme de dépense reste sous contrôle.'}
                </Text>
              </View>

              <Pressable style={[styles.addBtn, { backgroundColor: ui.primary }]} onPress={openCreate}>
                <Ionicons name="add" size={16} color={ui.onPrimary} />
                <Text style={[styles.addBtnText, { color: ui.onPrimary }]}>Nouveau budget</Text>
              </Pressable>
            </View>

            {/* Tip */}
            <View style={[styles.tipCard, { backgroundColor: ui.softBg, borderColor: ui.softBorder }]}>
              <Ionicons name="bulb-outline" size={14} color={ui.primary} />
              <Text style={[styles.tipText, { color: ui.sub }]}>
                Un budget sert à t'alerter avant qu'une catégorie prenne trop de place.
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={<Text style={[styles.empty, { color: ui.muted }]}>Aucun budget défini.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}
            onPress={() => navigation.navigate('BudgetDetail', { budgetId: item._id })}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconWrap, { backgroundColor: ui.softBg, borderColor: ui.softBorder }]}>
                  <Ionicons name={getCategoryIcon(item.category)} size={15} color={ui.primary} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.cardTitle, { color: ui.text }]}>{item.name}</Text>
                  <Text style={[styles.cardMeta, { color: ui.sub }]}>
                    {getCategoryLabel(item.category)} · {getPeriodLabel(item.period)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.cardAmount, { color: ui.primary }]}>{formatCurrency(item.amount || 0)}</Text>
            </View>

            {/* Progress */}
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: ui.sub }]}>Consommé</Text>
              <Text style={[styles.progressValue, { color: item.exceeded ? sem.danger : sem.success }]}>
                {formatCurrency(item.spent)} / {formatCurrency(item.amount || 0)}
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: `${ui.primary}22` }]}>
              <View style={[styles.progressFill, { width: `${item.progress}%`, backgroundColor: item.exceeded ? sem.danger : ui.primary }]} />
            </View>
            <Text style={[styles.remainingText, { color: item.exceeded ? sem.danger : ui.sub }]}>
              {item.exceeded ? 'Budget dépassé' : `Reste ${formatCurrency(item.remaining)}`}
            </Text>

            {/* Actions */}
            <View style={styles.actionRow}>
              <Pressable style={[styles.actionBtn, { backgroundColor: ui.softBg, borderColor: ui.softBorder }]} onPress={() => openEdit(item)}>
                <Ionicons name="create-outline" size={12} color={ui.text} />
                <Text style={[styles.actionText, { color: ui.text }]}>Modifier</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: ui.successBg, borderColor: ui.successBorder }]} onPress={() => openAdjust(item)}>
                <Ionicons name="swap-vertical-outline" size={12} color={ui.text} />
                <Text style={[styles.actionText, { color: ui.text }]}>Ajuster</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: ui.dangerBg, borderColor: ui.dangerBorder }]} onPress={() => deleteBudget(item._id)}>
                <Ionicons name="trash-outline" size={12} color={sem.danger} />
                <Text style={[styles.actionText, { color: sem.danger }]}>Suppr.</Text>
              </Pressable>
            </View>

            <Text style={[styles.detailHint, { color: ui.muted }]}>Appuie pour voir l'historique</Text>
          </Pressable>
        )}
      />

      {/* ── Create / Edit modal (unified) ── */}
      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={closeForm}>
        <View style={[styles.backdrop, { backgroundColor: ui.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.sheetTitle, { color: ui.text }]}>{editingId ? 'Modifier budget' : 'Nouveau budget'}</Text>

            <TextInput
              placeholder="Nom du budget"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={name} onChangeText={setName}
            />
            <TextInput
              placeholder="Montant"
              placeholderTextColor={ui.placeholder}
              keyboardType="decimal-pad"
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={amount} onChangeText={setAmount}
            />

            <Text style={[styles.fieldLabel, { color: ui.sub }]}>Catégorie</Text>
            <Pressable style={[styles.selectField, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg }]} onPress={() => setCategoryPickerOpen(true)}>
              <Text style={[styles.selectText, { color: ui.inputText }]}>{getCategoryLabel(category)}</Text>
              <Ionicons name="chevron-down" size={16} color={ui.sub} />
            </Pressable>

            <Text style={[styles.fieldLabel, { color: ui.sub }]}>Période</Text>
            <Pressable style={[styles.selectField, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg }]} onPress={() => setPeriodPickerOpen(true)}>
              <Text style={[styles.selectText, { color: ui.inputText }]}>{getPeriodLabel(period)}</Text>
              <Ionicons name="chevron-down" size={16} color={ui.sub} />
            </Pressable>

            <View style={styles.sheetActions}>
              <Pressable style={[styles.sheetBtn, { backgroundColor: ui.segBg }]} onPress={closeForm}>
                <Text style={[styles.sheetBtnText, { color: ui.text }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.sheetBtn, { backgroundColor: ui.primary }]} onPress={submitForm} disabled={isSaving}>
                <Text style={[styles.sheetBtnText, { color: ui.onPrimary }]}>{isSaving ? '...' : editingId ? 'Sauvegarder' : 'Créer'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Adjust modal ── */}
      <Modal visible={adjustOpen} transparent animationType="slide" onRequestClose={closeAdjust}>
        <View style={[styles.backdrop, { backgroundColor: ui.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.sheetTitle, { color: ui.text }]}>Ajuster budget</Text>
            {adjustingBudget && (
              <Text style={[styles.adjustHint, { color: ui.sub }]}>
                {adjustingBudget.name} — actuel {formatCurrency(adjustingBudget.amount || 0)}
              </Text>
            )}
            <TextInput
              placeholder="Montant à ajuster"
              placeholderTextColor={ui.placeholder}
              keyboardType="decimal-pad"
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={adjustAmount} onChangeText={setAdjustAmount}
            />
            <Text style={[styles.adjustHint, { color: ui.sub }]}>Saisis un montant positif puis choisis Augmenter ou Diminuer.</Text>
            <View style={styles.sheetActions}>
              <Pressable style={[styles.sheetBtn, { backgroundColor: ui.segBg }]} onPress={closeAdjust}>
                <Text style={[styles.sheetBtnText, { color: ui.text }]}>Annuler</Text>
              </Pressable>
            </View>
            <View style={styles.sheetActions}>
              <Pressable style={[styles.sheetBtn, styles.iconBtn, { backgroundColor: ui.primary }]} onPress={() => submitAdjust('increase')} disabled={isSaving}>
                <Ionicons name="arrow-up-circle-outline" size={16} color={ui.onPrimary} />
                <Text style={[styles.sheetBtnText, { color: ui.onPrimary }]}>{isSaving ? '...' : 'Augmenter'}</Text>
              </Pressable>
              <Pressable style={[styles.sheetBtn, styles.iconBtn, { backgroundColor: sem.danger }]} onPress={() => submitAdjust('decrease')} disabled={isSaving}>
                <Ionicons name="arrow-down-circle-outline" size={16} color="#FFF" />
                <Text style={[styles.sheetBtnText, { color: '#FFF' }]}>{isSaving ? '...' : 'Diminuer'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Category picker ── */}
      <Modal visible={categoryPickerOpen} transparent animationType="fade" onRequestClose={() => setCategoryPickerOpen(false)}>
        <View style={[styles.backdrop, { backgroundColor: ui.overlay, justifyContent: 'center', paddingHorizontal: 20 }]}>
          <View style={[styles.pickerCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.sheetTitle, { color: ui.text }]}>Choisir une catégorie</Text>
            {categoryOptions.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.pickerOption, { borderColor: ui.inputBorder, backgroundColor: ui.segBg },
                  category === opt.value && { borderColor: ui.primary, backgroundColor: ui.segActive }]}
                onPress={() => {
                  if (opt.value === 'Autre') { setCustomCategoryOpen(true); return; }
                  setCategory(opt.value); setCategoryPickerOpen(false);
                }}
              >
                <Text style={[styles.pickerOptionText, { color: category === opt.value ? ui.text : ui.sub }]}>{opt.label}</Text>
                {category === opt.value && <Ionicons name="checkmark" size={16} color={ui.primary} />}
              </Pressable>
            ))}
            <Pressable style={[styles.sheetBtn, { backgroundColor: ui.segBg }]} onPress={() => setCategoryPickerOpen(false)}>
              <Text style={[styles.sheetBtnText, { color: ui.text }]}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Custom category ── */}
      <Modal visible={customCategoryOpen} transparent animationType="fade" onRequestClose={() => setCustomCategoryOpen(false)}>
        <View style={[styles.backdrop, { backgroundColor: ui.overlay, justifyContent: 'center', paddingHorizontal: 20 }]}>
          <View style={[styles.pickerCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.sheetTitle, { color: ui.text }]}>Nouvelle catégorie</Text>
            <TextInput
              placeholder="Ex: Restaurant, Taxi…"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={customCategoryName} onChangeText={setCustomCategoryName}
            />
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

      {/* ── Period picker ── */}
      <Modal visible={periodPickerOpen} transparent animationType="fade" onRequestClose={() => setPeriodPickerOpen(false)}>
        <View style={[styles.backdrop, { backgroundColor: ui.overlay, justifyContent: 'center', paddingHorizontal: 20 }]}>
          <View style={[styles.pickerCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.sheetTitle, { color: ui.text }]}>Choisir une période</Text>
            {periodOptions.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.pickerOption, { borderColor: ui.inputBorder, backgroundColor: ui.segBg },
                  period === opt.value && { borderColor: ui.primary, backgroundColor: ui.segActive }]}
                onPress={() => { setPeriod(opt.value); setPeriodPickerOpen(false); }}
              >
                <Text style={[styles.pickerOptionText, { color: period === opt.value ? ui.text : ui.sub }]}>{opt.label}</Text>
                {period === opt.value && <Ionicons name="checkmark" size={16} color={ui.primary} />}
              </Pressable>
            ))}
            <Pressable style={[styles.sheetBtn, { backgroundColor: ui.segBg }]} onPress={() => setPeriodPickerOpen(false)}>
              <Text style={[styles.sheetBtnText, { color: ui.text }]}>Fermer</Text>
            </Pressable>
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

  hero:      { borderRadius: 22, borderWidth: 1, padding: 16, gap: 12 },
  ribbon:    { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  ribbonText:{ fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  heroTitle: { fontSize: 24, fontFamily: 'Georgia', fontWeight: '700' },
  heroSub:   { fontSize: 13, lineHeight: 19 },

  kpiRow:  { flexDirection: 'row', gap: 10 },
  kpiCard: { flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 12, gap: 4 },
  kpiLabel:{ fontSize: 11 },
  kpiValue:{ fontWeight: '800', fontSize: 15 },

  alertBanner: { borderRadius: 14, borderWidth: 1, paddingVertical: 11, paddingHorizontal: 12, gap: 4 },
  alertTitle:  { fontSize: 13, fontWeight: '800' },
  alertText:   { fontSize: 12, lineHeight: 18 },

  addBtn:    { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  addBtnText:{ fontWeight: '700', fontSize: 12 },

  tipCard: { borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18 },

  empty: { textAlign: 'center', marginTop: 18 },

  card:       { borderRadius: 18, borderWidth: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardLeft:   { flexDirection: 'row', gap: 10, flex: 1, alignItems: 'center' },
  iconWrap:   { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cardBody:   { flex: 1 },
  cardTitle:  { fontWeight: '700', fontSize: 14 },
  cardMeta:   { marginTop: 2, fontSize: 12 },
  cardAmount: { fontWeight: '800', fontSize: 14 },

  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel:  { fontSize: 11, fontWeight: '700' },
  progressValue:  { fontSize: 11, fontWeight: '700' },
  progressTrack:  { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill:   { height: 8 },
  remainingText:  { fontSize: 11 },

  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionText:{ fontSize: 11, fontWeight: '700' },
  detailHint:{ fontSize: 11, marginTop: 2 },

  backdrop:   { flex: 1, justifyContent: 'flex-end' },
  sheet:      { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, borderTopWidth: 1, gap: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  input:      { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  selectField:{ borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectText: { fontWeight: '600' },
  sheetActions:{ flexDirection: 'row', gap: 10, marginTop: 4 },
  sheetBtn:   { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  iconBtn:    { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  sheetBtnText:{ fontWeight: '700' },
  adjustHint: { fontSize: 12, lineHeight: 18 },

  pickerCard:       { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  pickerOption:     { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerOptionText: { fontWeight: '700' },
});

export default BudgetsScreen;
