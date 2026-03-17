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

import { savingsApi } from '../api/client';
import { useAppTheme } from '../context/ThemeContext';
import { getSemanticColors } from '../theme/semanticColors';
import { formatCurrency, formatDate, getDaysRemaining } from '../utils/format';

const SavingsScreen = () => {
  const { palette, isLight } = useAppTheme();
  const sem = useMemo(() => getSemanticColors(isLight), [isLight]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [contributingItem, setContributingItem] = useState(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const response = await savingsApi.list();
    setItems(response.data || []);
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

  const computedItems = useMemo(
    () =>
      items.map((item) => {
        const target = Number(item.targetAmount || 0);
        const current = Number(item.currentAmount || 0);
        const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        const remaining = Math.max(0, target - current);
        const remainingDays = getDaysRemaining(item.targetDate);
        const isCompleted = current >= target && target > 0;
        const isLate = !isCompleted && remainingDays !== null && remainingDays < 0;
        const isSoon = !isCompleted && remainingDays !== null && remainingDays >= 0 && remainingDays <= 14;
        return { ...item, target, current, progress, remaining, remainingDays, isCompleted, isLate, isSoon };
      }),
    [items]
  );

  const filteredItems = useMemo(
    () =>
      computedItems.filter((item) => {
        if (filterMode === 'completed') return item.isCompleted;
        if (filterMode === 'late') return item.isLate;
        if (filterMode === 'soon') return item.isSoon;
        return true;
      }),
    [computedItems, filterMode]
  );

  const totals = useMemo(
    () =>
      computedItems.reduce(
        (acc, item) => {
          acc.target += item.target;
          acc.current += item.current;
          if (item.isCompleted) acc.completed += 1;
          if (item.isSoon) acc.soon += 1;
          if (item.isLate) acc.late += 1;
          return acc;
        },
        { target: 0, current: 0, completed: 0, soon: 0, late: 0 }
      ),
    [computedItems]
  );

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
    segmentBg: sem.segmentBg,
    segmentActiveBg: sem.segmentActiveBg,
    modalOverlay: isLight ? 'rgba(16,28,47,0.32)' : 'rgba(0,0,0,0.5)',
    successBg: sem.incomeBg,
    successBorder: sem.incomeBorder,
    dangerBg: sem.expenseBg,
    dangerBorder: sem.expenseBorder,
    softBg: sem.softBlueBg,
    softBorder: sem.softBlueBorder,
    accent: sem.savings,
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    resetForm();
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    resetForm();
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setName(item.name || '');
    setTargetAmount(String(item.targetAmount ?? ''));
    setCurrentAmount(String(item.currentAmount ?? ''));
    setTargetDate(item.targetDate ? String(item.targetDate).slice(0, 10) : '');
    setIsEditOpen(true);
  };

  const openContribution = (item) => {
    setContributingItem(item);
    setContributionAmount('');
    setIsContributeOpen(true);
  };

  const validateForm = () => {
    if (!name.trim() || !targetAmount.trim()) {
      Alert.alert('Validation', 'Nom et cible sont requis');
      return null;
    }
    const parsedTarget = Number(targetAmount);
    const parsedCurrent = currentAmount.trim() ? Number(currentAmount) : 0;
    if (Number.isNaN(parsedTarget) || parsedTarget < 0) {
      Alert.alert('Validation', 'Cible invalide');
      return null;
    }
    if (Number.isNaN(parsedCurrent) || parsedCurrent < 0) {
      Alert.alert('Validation', 'Montant actuel invalide');
      return null;
    }
    if (targetDate.trim()) {
      const parsedDate = new Date(targetDate);
      if (Number.isNaN(parsedDate.getTime())) {
        Alert.alert('Validation', 'Date cible invalide');
        return null;
      }
    }
    return {
      name: name.trim(),
      targetAmount: parsedTarget,
      currentAmount: parsedCurrent,
      targetDate: targetDate.trim() || null,
    };
  };

  const submitCreate = async () => {
    const payload = validateForm();
    if (!payload) return;
    try {
      setIsSaving(true);
      await savingsApi.create(payload);
      await fetchData();
      closeCreate();
      Alert.alert('Succes', "Objectif d'epargne cree");
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Creation impossible');
    } finally {
      setIsSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!editingId) return;
    const payload = validateForm();
    if (!payload) return;
    try {
      setIsSaving(true);
      await savingsApi.update(editingId, payload);
      await fetchData();
      closeEdit();
      Alert.alert('Succes', "Objectif d'epargne mis a jour");
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Mise a jour impossible');
    } finally {
      setIsSaving(false);
    }
  };

  const submitContribution = async () => {
    if (!contributingItem || !contributionAmount.trim()) {
      Alert.alert('Validation', 'Montant requis');
      return;
    }
    const amount = Number(contributionAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Validation', 'Montant invalide');
      return;
    }
    try {
      setIsSaving(true);
      await savingsApi.update(contributingItem._id, {
        currentAmount: Number(contributingItem.currentAmount || 0) + amount,
      });
      await fetchData();
      setIsContributeOpen(false);
      setContributingItem(null);
      setContributionAmount('');
      Alert.alert('Succes', 'Contribution ajoutee');
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Contribution impossible');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = (item) => {
    Alert.alert('Confirmation', "Supprimer cet objectif d'epargne ?", [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await savingsApi.remove(item._id);
            await fetchData();
          } catch (error) {
            Alert.alert('Erreur', error?.response?.data?.message || 'Suppression impossible');
          }
        },
      },
    ]);
  };

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
          <>
            <View style={[styles.hero, { borderColor: ui.border, backgroundColor: ui.panel }]}>
              <Text style={[styles.title, { color: ui.text }]}>Epargne</Text>
              <Text style={[styles.subtitle, { color: ui.textSecondary }]}>Construis tes reserves et suis chaque objectif</Text>

              <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]}>
                  <Text style={[styles.kpiLabel, { color: ui.textSecondary }]}>Total epargne</Text>
                  <Text style={[styles.kpiValue, { color: ui.text }]}>{formatCurrency(totals.current)}</Text>
                </View>
                <View style={[styles.kpiCard, { borderColor: ui.successBorder, backgroundColor: ui.successBg }]}>
                  <Text style={[styles.kpiLabel, { color: ui.textSecondary }]}>Cible totale</Text>
                  <Text style={[styles.kpiValue, { color: ui.text }]}>{formatCurrency(totals.target)}</Text>
                </View>
              </View>

              <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { borderColor: ui.successBorder, backgroundColor: ui.successBg }]}>
                  <Text style={[styles.kpiLabel, { color: ui.textSecondary }]}>Atteints</Text>
                  <Text style={[styles.kpiValue, { color: ui.text }]}>{totals.completed}</Text>
                </View>
                <View style={[styles.kpiCard, { borderColor: ui.dangerBorder, backgroundColor: ui.dangerBg }]}>
                  <Text style={[styles.kpiLabel, { color: ui.textSecondary }]}>Urgents</Text>
                  <Text style={[styles.kpiValue, { color: ui.text }]}>{totals.soon + totals.late}</Text>
                </View>
              </View>

              <View style={styles.filterRow}>
                {[
                  { value: 'all', label: 'Tous' },
                  { value: 'soon', label: 'Bientot' },
                  { value: 'late', label: 'En retard' },
                  { value: 'completed', label: 'Atteints' },
                ].map((item) => (
                  <Pressable
                    key={item.value}
                    style={[
                      styles.filterChip,
                      { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                      filterMode === item.value && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                    ]}
                    onPress={() => setFilterMode(item.value)}
                  >
                    <Text style={[styles.filterChipText, { color: filterMode === item.value ? ui.text : ui.textSecondary }]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable style={[styles.addBtn, { backgroundColor: ui.primary }]} onPress={() => setIsCreateOpen(true)}>
                <Ionicons name="add" size={16} color={ui.onPrimary} />
                <Text style={[styles.addBtnText, { color: ui.onPrimary }]}>Nouvel objectif</Text>
              </Pressable>
            </View>

            <View style={[styles.insightCard, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]}>
              <Text style={[styles.insightTitle, { color: ui.text }]}>Bon rythme</Text>
              <Text style={[styles.insightText, { color: ui.textSecondary }]}>
                Garde une cible claire, une date realiste et ajoute de petites contributions regulieres.
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={<Text style={[styles.empty, { color: ui.muted }]}>Aucun objectif pour ce filtre.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, { borderColor: ui.border, backgroundColor: ui.panelAlt }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: ui.text }]}>{item.name}</Text>
                <Text style={[styles.cardMeta, { color: ui.textSecondary }]}>
                  {formatCurrency(item.current)} / {formatCurrency(item.target)}
                </Text>
              </View>
              <Text
                style={[
                  styles.progressBadge,
                  {
                    color: item.isCompleted ? sem.success : ui.text,
                    borderColor: item.isCompleted ? ui.successBorder : ui.softBorder,
                    backgroundColor: item.isCompleted ? ui.successBg : ui.softBg,
                  },
                ]}
              >
                {item.progress}%
              </Text>
            </View>

            <View style={[styles.progressTrack, { backgroundColor: `${sem.savings}22` }]}>
              <View style={[styles.progressFill, { width: `${item.progress}%`, backgroundColor: sem.savings }]} />
            </View>

            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Reste</Text>
              <Text style={[styles.metricValue, { color: ui.text }]}>{formatCurrency(item.remaining)}</Text>
            </View>
            {item.targetDate ? (
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Date cible</Text>
                <Text style={[styles.metricValue, { color: ui.text }]}>
                  {formatDate(item.targetDate)}
                  {item.remainingDays !== null
                    ? item.isCompleted
                      ? ' • Atteint'
                      : item.remainingDays < 0
                        ? ` • ${Math.abs(item.remainingDays)} j de retard`
                        : ` • ${item.remainingDays} j restants`
                    : ''}
                </Text>
              </View>
            ) : null}

            <View style={styles.actionRow}>
              <Pressable style={[styles.actionBtn, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]} onPress={() => openContribution(item)}>
                <Text style={[styles.actionText, { color: ui.text }]}>Ajouter</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]} onPress={() => openEdit(item)}>
                <Text style={[styles.actionText, { color: ui.text }]}>Modifier</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { borderColor: ui.dangerBorder, backgroundColor: ui.dangerBg }]} onPress={() => deleteItem(item)}>
                <Text style={[styles.actionText, { color: sem.danger }]}>Suppr.</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Modal visible={isCreateOpen} transparent animationType="slide" onRequestClose={closeCreate}>
        <View style={[styles.modalBackdrop, { backgroundColor: ui.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.modalTitle, { color: ui.text }]}>Nouvel objectif</Text>
            <TextInput placeholder="Nom" placeholderTextColor={ui.placeholder} style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]} value={name} onChangeText={setName} />
            <TextInput placeholder="Cible" placeholderTextColor={ui.placeholder} keyboardType="decimal-pad" style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]} value={targetAmount} onChangeText={setTargetAmount} />
            <TextInput placeholder="Deja epargne (optionnel)" placeholderTextColor={ui.placeholder} keyboardType="decimal-pad" style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]} value={currentAmount} onChangeText={setCurrentAmount} />
            <TextInput placeholder="Date cible YYYY-MM-DD (optionnel)" placeholderTextColor={ui.placeholder} style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]} value={targetDate} onChangeText={setTargetDate} />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.segmentBg }]} onPress={closeCreate}>
                <Text style={[styles.modalBtnText, { color: ui.text }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.primary }]} onPress={submitCreate} disabled={isSaving}>
                <Text style={[styles.modalBtnText, { color: ui.onPrimary }]}>{isSaving ? 'Creation...' : 'Creer'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isEditOpen} transparent animationType="slide" onRequestClose={closeEdit}>
        <View style={[styles.modalBackdrop, { backgroundColor: ui.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.modalTitle, { color: ui.text }]}>Modifier objectif</Text>
            <TextInput placeholder="Nom" placeholderTextColor={ui.placeholder} style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]} value={name} onChangeText={setName} />
            <TextInput placeholder="Cible" placeholderTextColor={ui.placeholder} keyboardType="decimal-pad" style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]} value={targetAmount} onChangeText={setTargetAmount} />
            <TextInput placeholder="Deja epargne" placeholderTextColor={ui.placeholder} keyboardType="decimal-pad" style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]} value={currentAmount} onChangeText={setCurrentAmount} />
            <TextInput placeholder="Date cible YYYY-MM-DD (optionnel)" placeholderTextColor={ui.placeholder} style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]} value={targetDate} onChangeText={setTargetDate} />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.segmentBg }]} onPress={closeEdit}>
                <Text style={[styles.modalBtnText, { color: ui.text }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.primary }]} onPress={submitEdit} disabled={isSaving}>
                <Text style={[styles.modalBtnText, { color: ui.onPrimary }]}>{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isContributeOpen} transparent animationType="slide" onRequestClose={() => setIsContributeOpen(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: ui.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.modalTitle, { color: ui.text }]}>Ajouter a l'epargne</Text>
            <Text style={[styles.modalHint, { color: ui.textSecondary }]}>
              {contributingItem ? `${contributingItem.name} • actuel ${formatCurrency(contributingItem.currentAmount || 0)}` : ''}
            </Text>
            <TextInput placeholder="Montant a ajouter" placeholderTextColor={ui.placeholder} keyboardType="decimal-pad" style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]} value={contributionAmount} onChangeText={setContributionAmount} />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.segmentBg }]} onPress={() => setIsContributeOpen(false)}>
                <Text style={[styles.modalBtnText, { color: ui.text }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.primary }]} onPress={submitContribution} disabled={isSaving}>
                <Text style={[styles.modalBtnText, { color: ui.onPrimary }]}>{isSaving ? 'Ajout...' : 'Ajouter'}</Text>
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
  kpiValue: { marginTop: 4, fontWeight: '800', fontSize: 15 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { borderRadius: 14, borderWidth: 1, paddingVertical: 5, paddingHorizontal: 10 },
  filterChipText: { fontSize: 11, fontWeight: '700' },
  addBtn: { alignSelf: 'flex-start', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  addBtnText: { fontWeight: '700', fontSize: 12 },
  insightCard: { borderRadius: 16, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14, gap: 4 },
  insightTitle: { fontSize: 13, fontWeight: '800' },
  insightText: { fontSize: 12, lineHeight: 18 },
  empty: { textAlign: 'center', marginTop: 18 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  cardBody: { flex: 1 },
  cardTitle: { fontWeight: '700', fontSize: 14 },
  cardMeta: { marginTop: 2, fontSize: 12 },
  progressBadge: { borderWidth: 1, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 9, fontSize: 11, fontWeight: '700', overflow: 'hidden' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontSize: 11 },
  metricValue: { fontSize: 12, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  actionBtn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 8, alignItems: 'center' },
  actionText: { fontSize: 11, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, borderTopWidth: 1, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalHint: { fontSize: 12, lineHeight: 18 },
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  modalActions: { marginTop: 4, flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  modalBtnText: { fontWeight: '700' },
});

export default SavingsScreen;
