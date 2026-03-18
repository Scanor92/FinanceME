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

import { debtApi } from '../api/client';
import { useAppTheme } from '../context/ThemeContext';
import { getSemanticColors } from '../theme/semanticColors';
import { formatCurrency, formatDate } from '../utils/format';

const DebtDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { palette, isLight } = useAppTheme();
  const sem = useMemo(() => getSemanticColors(isLight), [isLight]);
  const debtId = route.params?.debtId;

  const [debt, setDebt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [personName, setPersonName] = useState('');
  const [type, setType] = useState('payable');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [note, setNote] = useState('');

  const fetchData = useCallback(async () => {
    if (!debtId) return;
    const response = await debtApi.getById(debtId);
    setDebt(response.data);
  }, [debtId]);

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

  const submitPayment = async () => {
    if (!debt) return;

    const amount = Number(paymentAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Validation', 'montant invalide');
      return;
    }

    try {
      setIsSaving(true);
      await debtApi.pay(debt._id, { amount });
      await fetchData();
      setIsPayOpen(false);
      setPaymentAmount('');
      Alert.alert('Succes', 'Paiement enregistre');
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Paiement impossible');
    } finally {
      setIsSaving(false);
    }
  };

  const payAll = async () => {
    if (!debt || debt.remainingAmount <= 0) return;

    try {
      await debtApi.pay(debt._id, { amount: debt.remainingAmount });
      await fetchData();
      Alert.alert('Succes', debt.type === 'payable' ? 'Dette totalement payee' : 'Dette totalement encaissee');
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Operation impossible');
    }
  };

  const openEdit = () => {
    if (!debt) return;
    setPersonName(debt.personName || '');
    setType(debt.type || 'payable');
    setPrincipalAmount(String(debt.principalAmount ?? ''));
    setNote(debt.note || '');
    setIsEditOpen(true);
  };

  const submitEdit = async () => {
    if (!debt) return;
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
      setIsSaving(true);
      await debtApi.update(debt._id, {
        personName: personName.trim(),
        type,
        principalAmount: amount,
        note: note.trim() || undefined,
      });
      await fetchData();
      setIsEditOpen(false);
      Alert.alert('Succes', 'Dette modifiee');
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Modification impossible');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDebt = () => {
    if (!debt) return;

    Alert.alert('Confirmation', 'Supprimer cette dette ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await debtApi.remove(debt._id);
            Alert.alert('Succes', 'Dette supprimee');
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Debts');
            }
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
      modalOverlay: isLight ? 'rgba(16,28,47,0.32)' : 'rgba(0,0,0,0.5)',
      backBtnBg: sem.chipBg,
      backBtnBorder: sem.chipBorder,
      payAllBg: sem.incomeBg,
      payAllBorder: sem.incomeBorder,
    }),
    [isLight, palette, sem.chipBg, sem.chipBorder, sem.incomeBg, sem.incomeBorder]
  );

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: ui.page }]}>
        <ActivityIndicator size="large" color={ui.primary} />
      </View>
    );
  }

  if (!debt) {
    return (
      <View style={[styles.center, { backgroundColor: ui.page }]}>
        <Text style={[styles.empty, { color: ui.muted }]}>Dette introuvable.</Text>
      </View>
    );
  }

  const payments = Array.isArray(debt.payments) ? [...debt.payments].reverse() : [];

  return (
    <>
      <FlatList
        style={[styles.page, { backgroundColor: ui.page }]}
        contentContainerStyle={styles.content}
        data={payments}
        keyExtractor={(_, index) => `${debt._id}-payment-${index}`}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={ui.primary} />}
        ListHeaderComponent={
          <View style={[styles.hero, { borderColor: ui.border, backgroundColor: ui.panel }]}> 
            <View style={styles.topRow}>
              <Pressable style={[styles.backBtn, { borderColor: ui.backBtnBorder, backgroundColor: ui.backBtnBg }]} onPress={() => navigation.navigate('Debts')}>
                <Ionicons name="chevron-back" size={16} color={ui.text} />
                <Text style={[styles.backBtnText, { color: ui.text }]}>Retour</Text>
              </Pressable>
            </View>

            <Text style={[styles.title, { color: ui.text }]}>{debt.personName}</Text>
            <Text style={[styles.meta, { color: ui.textSecondary }]}>{debt.type === 'payable' ? 'Je dois' : 'On me doit'}</Text>
            <Text style={[styles.amount, { color: ui.text }]}>Reste: {formatCurrency(debt.remainingAmount || 0)} / {formatCurrency(debt.principalAmount || 0)}</Text>
            <Text style={[styles.meta, { color: ui.textSecondary }]}>Statut: {debt.status === 'paid' ? 'paye' : 'ouvert'}</Text>

            {debt.status === 'open' ? (
              <View style={styles.actionsRow}>
                <Pressable style={[styles.editBtn, { borderColor: ui.backBtnBorder, backgroundColor: ui.backBtnBg }]} onPress={openEdit}>
                  <Text style={[styles.editBtnText, { color: ui.text }]}>Modifier</Text>
                </Pressable>
                <Pressable style={[styles.payBtn, { backgroundColor: ui.primary }]} onPress={() => setIsPayOpen(true)}>
                  <Text style={[styles.payBtnText, { color: ui.onPrimary }]}>{debt.type === 'payable' ? 'Payer' : 'Encaisser'}</Text>
                </Pressable>
                <Pressable style={[styles.payAllBtn, { borderColor: ui.payAllBorder, backgroundColor: ui.payAllBg }]} onPress={payAll}>
                  <Text style={[styles.payAllBtnText, { color: sem.success }]}>{debt.type === 'payable' ? 'Tout payer' : 'Tout encaisser'}</Text>
                </Pressable>
              </View>
            ) : null}

            <Pressable style={[styles.deleteBtn, { borderColor: `${sem.danger}55`, backgroundColor: `${sem.danger}14` }]} onPress={deleteDebt}>
              <Ionicons name="trash-outline" size={14} color={sem.danger} />
              <Text style={[styles.deleteBtnText, { color: sem.danger }]}>Supprimer la dette</Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={<Text style={[styles.empty, { color: ui.muted }]}>Aucun paiement enregistre.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.row, { borderColor: ui.border, backgroundColor: ui.panelAlt }]}>
            <View style={[styles.dot, { backgroundColor: ui.primary }]} />
            <Text style={[styles.date, { color: ui.textSecondary }]}>{formatDate(item.date)}</Text>
            <Text style={[styles.rowAmount, { color: ui.text }]}>{formatCurrency(item.amount || 0)}</Text>
          </View>
        )}
      />

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
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.backBtnBg }]} onPress={() => setIsPayOpen(false)}>
                <Text style={[styles.modalBtnText, { color: ui.text }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.primary }]} onPress={submitPayment} disabled={isSaving}>
                <Text style={[styles.modalBtnText, { color: ui.onPrimary }]}>{isSaving ? 'Validation...' : 'Valider'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isEditOpen} transparent animationType="slide" onRequestClose={() => setIsEditOpen(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: ui.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.modalTitle, { color: ui.text }]}>Modifier dette</Text>
            <TextInput
              placeholder="Personne"
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
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.segment, { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg }]}
                onPress={() => setType('payable')}
              >
                <Text style={[styles.segmentText, { color: type === 'payable' ? ui.text : ui.textSecondary }]}>Je dois</Text>
              </Pressable>
              <Pressable
                style={[styles.segment, { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg }]}
                onPress={() => setType('receivable')}
              >
                <Text style={[styles.segmentText, { color: type === 'receivable' ? ui.text : ui.textSecondary }]}>On me doit</Text>
              </Pressable>
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
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.backBtnBg }]} onPress={() => setIsEditOpen(false)}>
                <Text style={[styles.modalBtnText, { color: ui.text }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: ui.primary }]} onPress={submitEdit} disabled={isSaving}>
                <Text style={[styles.modalBtnText, { color: ui.onPrimary }]}>{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</Text>
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
  hero: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 4, marginBottom: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 2 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 10, paddingVertical: 5, paddingHorizontal: 8 },
  backBtnText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700', fontFamily: 'Georgia' },
  meta: { fontSize: 12 },
  amount: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  editBtn: { borderRadius: 8, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 10 },
  editBtnText: { fontWeight: '700', fontSize: 11 },
  payBtn: { borderRadius: 8, paddingVertical: 7, paddingHorizontal: 10 },
  payBtnText: { fontWeight: '700', fontSize: 11 },
  payAllBtn: { borderRadius: 8, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 10 },
  payAllBtnText: { fontWeight: '700', fontSize: 11 },
  deleteBtn: { marginTop: 8, alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  deleteBtnText: { fontWeight: '700', fontSize: 11 },
  empty: { textAlign: 'center', marginTop: 20 },
  row: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  date: { fontSize: 12, flex: 1 },
  rowAmount: { fontWeight: '700', fontSize: 12 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, borderTopWidth: 1, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  modalActions: { marginTop: 4, flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  modalBtnText: { fontWeight: '700' },
});

export default DebtDetailScreen;
