import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { accountApi, budgetApi, transactionApi } from '../api/client';
import { buildCategoryOptions, expenseCategoryOptions, getCategoryLabel, incomeCategoryOptions } from '../constants/transactionCategories';
import { useCategoryStore } from '../context/CategoryContext';
import { useAppTheme } from '../context/ThemeContext';
import { getSemanticColors } from '../theme/semanticColors';
import { findExceededBudgets } from '../utils/budgetAlerts';
import { formatCurrency } from '../utils/format';

const quickAmounts = ['10', '25', '50', '100'];

const AddTransactionScreen = () => {
  const navigation = useNavigation();
  const { palette, isLight } = useAppTheme();
  const { customCategories, addCategory } = useCategoryStore();
  const sem = useMemo(() => getSemanticColors(isLight), [isLight]);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCustomCategoryOpen, setIsCustomCategoryOpen] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const [accounts, setAccounts] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useMemo(
    () => buildCategoryOptions(type === 'income' ? incomeCategoryOptions : expenseCategoryOptions, customCategories),
    [customCategories, type]
  );

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await accountApi.list();
      const nextAccounts = (response.data || []).filter((item) => item.isActive !== false);
      setAccounts(nextAccounts);
      if (!accountId && nextAccounts.length > 0) {
        setAccountId(nextAccounts[0]._id);
      }
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [accountId]);

  useFocusEffect(
    useCallback(() => {
      fetchAccounts();
    }, [fetchAccounts])
  );

  useFocusEffect(
    useCallback(() => {
      const loadBudgetContext = async () => {
        const [budgetRes, transactionRes] = await Promise.all([
          budgetApi.list(),
          transactionApi.listExtended({ limit: 100, page: 1, type: 'expense' }),
        ]);
        setBudgets(budgetRes.data || []);
        setTransactions(transactionRes.data?.data || []);
      };

      loadBudgetContext();
    }, [])
  );

  const createTransaction = async (parsedAmount) => {
    setIsSubmitting(true);
    try {
      await transactionApi.create({
        title: getCategoryLabel(category.trim()),
        amount: parsedAmount,
        type,
        category: category.trim(),
        accountId,
        note: note.trim() || undefined,
      });

      setAmount('');
      setCategory('');
      setNote('');
      Alert.alert('Succes', 'Transaction ajoutee');
      navigation.navigate('Transactions');
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Creation impossible');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async () => {
    if (!amount.trim() || !category.trim()) {
      Alert.alert('Validation', 'Montant et categorie sont requis');
      return;
    }

    if (!accountId) {
      Alert.alert('Validation', 'Selectionne un compte');
      return;
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation', 'Montant invalide (> 0)');
      return;
    }

    if (type === 'expense') {
      const exceededBudgets = findExceededBudgets({
        budgets,
        transactions,
        category: category.trim(),
        amount: parsedAmount,
      });

      if (exceededBudgets.length > 0) {
        const firstBudget = exceededBudgets[0];
        Alert.alert(
          'Budget depasse',
          `Cette depense va depasser le budget "${firstBudget.budget.name}" (${currency.format(firstBudget.nextSpent)} / ${currency.format(firstBudget.target)}). Continuer ?`,
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Continuer', onPress: () => createTransaction(parsedAmount) },
          ]
        );
        return;
      }
    }

    await createTransaction(parsedAmount);
  };

  const submitCustomCategory = async () => {
    const nextCategory = await addCategory(customCategoryName);
    if (!nextCategory) {
      Alert.alert('Validation', 'Saisis un nom de categorie');
      return;
    }

    setCategory(nextCategory);
    setCustomCategoryName('');
    setIsCustomCategoryOpen(false);
    setIsCategoryOpen(false);
  };

  const ui = useMemo(
    () => ({
      page: palette.background,
      panel: palette.surfaceAlt,
      border: palette.border,
      text: palette.text,
      textSecondary: palette.textSecondary,
      primary: palette.primary,
      onPrimary: palette.onPrimary,
      inputBg: palette.inputBg,
      inputBorder: palette.inputBorder,
      inputText: palette.inputText,
      placeholder: palette.placeholder,
      segmentBg: sem.segmentBg,
      segmentActiveBg: sem.segmentActiveBg,
      chipBg: sem.chipBg,
      chipBorder: sem.chipBorder,
      closeBg: sem.chipBg,
      closeBorder: sem.chipBorder,
      noAccount: sem.danger,
    }),
    [isLight, palette, sem.chipBg, sem.chipBorder, sem.danger, sem.segmentActiveBg, sem.segmentBg]
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.page, { backgroundColor: ui.page }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { borderColor: ui.border, backgroundColor: ui.panel }]}>
          <View style={styles.topRow}>
            <Text style={[styles.title, { color: ui.text }]}>Nouvelle transaction</Text>
            <Pressable style={[styles.closeBtn, { borderColor: ui.closeBorder, backgroundColor: ui.closeBg }]} onPress={() => navigation.navigate('Transactions')}>
              <Ionicons name="close" size={16} color={ui.text} />
              <Text style={[styles.closeBtnText, { color: ui.text }]}>Fermer</Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: ui.textSecondary }]}>Type</Text>
          <View style={styles.segmentRow}>
            <Pressable
              style={[
                styles.segment,
                { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                type === 'expense' && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
              ]}
              onPress={() => setType('expense')}
            >
              <Text style={[styles.segmentText, { color: ui.textSecondary }, type === 'expense' && { color: ui.text }]}>Depense</Text>
            </Pressable>
            <Pressable
              style={[
                styles.segment,
                { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                type === 'income' && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
              ]}
              onPress={() => setType('income')}
            >
              <Text style={[styles.segmentText, { color: ui.textSecondary }, type === 'income' && { color: ui.text }]}>Revenu</Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: ui.textSecondary }]}>Montant</Text>
          <TextInput
            placeholder="Ex: 120"
            placeholderTextColor={ui.placeholder}
            keyboardType="decimal-pad"
            style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
            value={amount}
            onChangeText={setAmount}
          />
          <View style={styles.chipsWrap}>
            {quickAmounts.map((item) => (
              <Pressable key={item} style={[styles.quickChip, { borderColor: ui.chipBorder, backgroundColor: ui.chipBg }]} onPress={() => setAmount(item)}>
                <Text style={[styles.quickChipText, { color: ui.text }]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: ui.textSecondary }]}>Categorie</Text>
          <Pressable
            style={[styles.selectField, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg }]}
            onPress={() => setIsCategoryOpen(true)}
          >
            <Text style={[styles.selectFieldText, { color: category ? ui.inputText : ui.placeholder }]}>
              {category ? getCategoryLabel(category) : 'Choisir une categorie'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={ui.textSecondary} />
          </Pressable>

          <Text style={[styles.label, { color: ui.textSecondary }]}>Compte</Text>
          {isLoadingAccounts ? (
            <View style={styles.accountsLoading}>
              <ActivityIndicator size="small" color={ui.primary} />
            </View>
          ) : (
            <View style={styles.chipsWrap}>
              {accounts.map((item) => (
                <Pressable
                  key={item._id}
                  style={[
                    styles.accountChip,
                    { borderColor: ui.chipBorder, backgroundColor: ui.chipBg },
                    accountId === item._id && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                  ]}
                  onPress={() => setAccountId(item._id)}
                >
                  <Text style={[styles.accountChipText, { color: ui.text }]}>{item.name}</Text>
                </Pressable>
              ))}
              {accounts.length === 0 ? <Text style={[styles.noAccounts, { color: ui.noAccount }]}>Aucun compte. Cree un compte d'abord.</Text> : null}
            </View>
          )}

          <TextInput
            placeholder="Note (optionnel)"
            placeholderTextColor={ui.placeholder}
            style={[styles.input, styles.noteInput, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
            value={note}
            onChangeText={setNote}
            multiline
          />

          <Pressable style={[styles.primaryBtn, { backgroundColor: ui.primary }]} onPress={onSubmit} disabled={isSubmitting}>
            <Text style={[styles.primaryBtnText, { color: ui.onPrimary }]}>{isSubmitting ? 'Ajout...' : 'Ajouter'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={isCategoryOpen} transparent animationType="fade" onRequestClose={() => setIsCategoryOpen(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: isLight ? 'rgba(16,28,47,0.32)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalCard, { borderColor: ui.border, backgroundColor: ui.panel }]}>
            <Text style={[styles.modalTitle, { color: ui.text }]}>Choisir une categorie</Text>
            {categories.map((item) => (
              <Pressable
                key={item.value}
                style={[
                  styles.modalOption,
                  { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                  category === item.value && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                ]}
                onPress={() => {
                  if (item.value === 'Autre') {
                    setIsCustomCategoryOpen(true);
                    return;
                  }
                  setCategory(item.value);
                  setIsCategoryOpen(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: category === item.value ? ui.text : ui.textSecondary }]}>
                  {item.label}
                </Text>
                {category === item.value ? <Ionicons name="checkmark" size={16} color={ui.primary} /> : null}
              </Pressable>
            ))}
            <Pressable style={[styles.modalCloseBtn, { backgroundColor: ui.segmentBg }]} onPress={() => setIsCategoryOpen(false)}>
              <Text style={[styles.modalCloseBtnText, { color: ui.text }]}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={isCustomCategoryOpen} transparent animationType="fade" onRequestClose={() => setIsCustomCategoryOpen(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: isLight ? 'rgba(16,28,47,0.32)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalCard, { borderColor: ui.border, backgroundColor: ui.panel }]}>
            <Text style={[styles.modalTitle, { color: ui.text }]}>Nouvelle categorie</Text>
            <TextInput
              placeholder="Ex: Restaurant, Taxi, Prime"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={customCategoryName}
              onChangeText={setCustomCategoryName}
            />
            <View style={styles.customActions}>
              <Pressable style={[styles.modalCloseBtn, { backgroundColor: ui.segmentBg }]} onPress={() => setIsCustomCategoryOpen(false)}>
                <Text style={[styles.modalCloseBtnText, { color: ui.text }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.modalCloseBtn, { backgroundColor: ui.primary }]} onPress={submitCustomCategory}>
                <Text style={[styles.modalCloseBtnText, { color: ui.onPrimary }]}>Ajouter</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 28 },
  card: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2, gap: 10 },
  title: { fontSize: 22, fontFamily: 'Georgia', fontWeight: '700' },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  closeBtnText: { fontSize: 12, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  noteInput: { minHeight: 70, textAlignVertical: 'top' },
  segmentRow: { flexDirection: 'row', gap: 10 },
  segment: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  segmentText: { fontWeight: '700' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { borderWidth: 1, borderRadius: 14, paddingVertical: 5, paddingHorizontal: 10 },
  quickChipText: { fontWeight: '700', fontSize: 12 },
  selectField: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectFieldText: { fontWeight: '600' },
  accountChip: { borderWidth: 1, borderRadius: 16, paddingVertical: 7, paddingHorizontal: 10 },
  accountChipText: { fontSize: 12, fontWeight: '700' },
  accountsLoading: { paddingVertical: 8, alignItems: 'flex-start' },
  noAccounts: { fontSize: 12 },
  primaryBtn: { marginTop: 8, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  primaryBtnText: { fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  modalCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalOption: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOptionText: { fontWeight: '700' },
  modalCloseBtn: { marginTop: 2, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  modalCloseBtnText: { fontWeight: '700' },
  customActions: { flexDirection: 'row', gap: 10 },
});

export default AddTransactionScreen;
