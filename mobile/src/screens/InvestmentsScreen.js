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

import { investmentApi } from '../api/client';
import InvestmentCard from '../components/investments/InvestmentCard';
import InvestmentFormModal from '../components/investments/InvestmentFormModal';
import InvestmentsHero from '../components/investments/InvestmentsHero';
import {
  investmentStatusOptions,
  investmentTypeOptions,
  getInvestmentStatusLabel,
  getInvestmentTypeLabel,
} from '../constants/investmentMeta';
import { useAppTheme } from '../context/ThemeContext';
import { getSemanticColors } from '../theme/semanticColors';
import { formatDate, formatPercent, getDaysRemaining } from '../utils/format';
import {
  formatInvestmentMoney,
  investmentNumberFormatter,
  isMaturityAsset,
  isPropertyAsset,
  isYieldAsset,
} from '../utils/investments';

const InvestmentsScreen = () => {
  const { palette, isLight } = useAppTheme();
  const sem = useMemo(() => getSemanticColors(isLight), [isLight]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortMode, setSortMode] = useState('recent');
  const [assetName, setAssetName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [averageBuyPrice, setAverageBuyPrice] = useState('');
  const [assetType, setAssetType] = useState('livestock');
  const [status, setStatus] = useState('active');
  const [currency, setCurrency] = useState('XOF');
  const [location, setLocation] = useState('');
  const [area, setArea] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [estimatedCurrentValue, setEstimatedCurrentValue] = useState('');
  const [expectedAnnualReturnRate, setExpectedAnnualReturnRate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [exitDate, setExitDate] = useState('');
  const [exitValue, setExitValue] = useState('');
  const [institution, setInstitution] = useState('');
  const [notes, setNotes] = useState('');

  const fetchData = useCallback(async () => {
    const response = await investmentApi.list();
    setItems(response.data || []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const load = async () => {
        try {
          await fetchData();
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
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
        const totalInvested = Number(item.quantity || 0) * Number(item.averageBuyPrice || 0);
        const expectedGain =
          item.expectedAnnualReturnRate !== null && item.expectedAnnualReturnRate !== undefined
            ? totalInvested * (Number(item.expectedAnnualReturnRate || 0) / 100)
            : null;
        const projectedValue =
          expectedGain !== null
            ? totalInvested + expectedGain
            : item.estimatedCurrentValue !== null && item.estimatedCurrentValue !== undefined
              ? Number(item.estimatedCurrentValue || 0)
              : null;
        const daysRemaining = getDaysRemaining(item.maturityDate);
        const realizedValue = item.exitValue !== null && item.exitValue !== undefined ? Number(item.exitValue || 0) : null;
        const realizedGain = realizedValue !== null ? realizedValue - totalInvested : null;
        return { ...item, totalInvested, expectedGain, projectedValue, daysRemaining, realizedValue, realizedGain };
      }),
    [items]
  );

  const totals = useMemo(
    () =>
      computedItems.reduce(
        (acc, item) => {
          acc.positions += 1;
          acc.invested += Number(item.totalInvested || 0);
          acc.units += Number(item.quantity || 0);
          if (item.status === 'active') acc.active += 1;
          if (item.status === 'pending') acc.pending += 1;
          if (item.estimatedCurrentValue !== null && item.estimatedCurrentValue !== undefined) {
            acc.estimated += Number(item.estimatedCurrentValue || 0);
          }
          return acc;
        },
        { positions: 0, invested: 0, units: 0, estimated: 0, active: 0, pending: 0 }
      ),
    [computedItems]
  );

  const performance = useMemo(() => {
    const gain = totals.estimated - totals.invested;
    const rate = totals.invested > 0 ? (gain / totals.invested) * 100 : 0;
    return {
      gain,
      rate,
      hasEstimate: totals.estimated > 0,
    };
  }, [totals]);

  const filteredItems = useMemo(() => {
    const nextItems = computedItems.filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) {
          return false;
        }
        if (typeFilter !== 'all' && item.assetType !== typeFilter) {
          return false;
        }
        return true;
      });

    nextItems.sort((left, right) => {
      if (sortMode === 'amount_desc') {
        return Number(right.totalInvested || 0) - Number(left.totalInvested || 0);
      }

      if (sortMode === 'performance_desc') {
        const rightValue = right.realizedGain ?? right.expectedGain ?? (Number(right.estimatedCurrentValue || 0) - Number(right.totalInvested || 0));
        const leftValue = left.realizedGain ?? left.expectedGain ?? (Number(left.estimatedCurrentValue || 0) - Number(left.totalInvested || 0));
        return Number(rightValue || 0) - Number(leftValue || 0);
      }

      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });

    return nextItems;
  }, [computedItems, statusFilter, typeFilter, sortMode]);

  const filteredTotals = useMemo(
    () =>
      filteredItems.reduce(
        (acc, item) => {
          acc.positions += 1;
          acc.invested += Number(item.totalInvested || 0);
          if (item.realizedValue !== null) {
            acc.realized += Number(item.realizedValue || 0);
          }
          return acc;
        },
        { positions: 0, invested: 0, realized: 0 }
      ),
    [filteredItems]
  );

  const portfolioInsights = useMemo(() => {
    const byStatus = filteredItems.reduce((acc, item) => {
      const key = item.status || 'active';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const byType = filteredItems.reduce((acc, item) => {
      const key = item.assetType || 'other';
      acc[key] = (acc[key] || 0) + Number(item.totalInvested || 0);
      return acc;
    }, {});

    const topStatus = Object.entries(byStatus).sort((a, b) => b[1] - a[1])[0] || null;
    const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0] || null;

    return {
      topStatus,
      topType,
      realizedShare: filteredTotals.invested > 0 ? (filteredTotals.realized / filteredTotals.invested) * 100 : 0,
    };
  }, [filteredItems, filteredTotals.invested, filteredTotals.realized]);

  const maturitySummary = useMemo(
    () =>
      computedItems.reduce(
        (acc, item) => {
          if (isMaturityAsset(item.assetType)) {
            acc.maturityCount += 1;
          } else {
            acc.openCount += 1;
          }
          return acc;
        },
        { maturityCount: 0, openCount: 0 }
      ),
    [computedItems]
  );

  const featuredTypes = useMemo(
    () =>
      investmentTypeOptions.filter((option) =>
        ['land', 'livestock', 'trade', 'cooperative'].includes(option.value)
      ),
    []
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
      inputBg: palette.inputBg,
      inputBorder: palette.inputBorder,
      inputText: palette.inputText,
      placeholder: palette.placeholder,
      primary: palette.primary,
      onPrimary: palette.onPrimary,
      modalOverlay: isLight ? 'rgba(16,28,47,0.32)' : 'rgba(0,0,0,0.5)',
      segmentBg: sem.segmentBg,
      segmentActiveBg: sem.segmentActiveBg,
      softBg: `${sem.investment}16`,
      softBorder: `${sem.investment}66`,
      editBg: sem.editBg,
      editBorder: sem.editBorder,
      deleteBg: sem.deleteBg,
      deleteBorder: sem.deleteBorder,
      heroGlowA: isLight ? '#FFD66B' : '#6B4E10',
      heroGlowB: isLight ? '#9AD7FF' : '#1F4365',
      heroRibbon: isLight ? '#FFF3CC' : '#4B3A11',
      heroRibbonText: isLight ? '#5D4600' : '#FFE7A6',
      insightBg: isLight ? '#FFF8E7' : '#251F12',
      insightBorder: isLight ? '#E7CD8C' : '#6B5723',
      statTileBg: isLight ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.04)',
      statTileBorder: isLight ? 'rgba(138,91,232,0.35)' : 'rgba(138,91,232,0.35)',
    }),
    [isLight, palette, sem]
  );

  const showYieldFields = isYieldAsset(assetType);
  const showMaturityFields = isMaturityAsset(assetType);
  const showPropertyFields = isPropertyAsset(assetType);
  const showExitFields = ['sold', 'completed'].includes(status);

  const resetForm = () => {
    setEditingId(null);
    setAssetName('');
    setSymbol('');
    setQuantity('');
    setAverageBuyPrice('');
    setAssetType('livestock');
    setStatus('active');
    setCurrency('XOF');
    setLocation('');
    setArea('');
    setPurchaseDate('');
    setEstimatedCurrentValue('');
    setExpectedAnnualReturnRate('');
    setMaturityDate('');
    setExitDate('');
    setExitValue('');
    setInstitution('');
    setNotes('');
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
    setAssetName(item.assetName || '');
    setSymbol(item.symbol || '');
    setQuantity(String(item.quantity ?? ''));
    setAverageBuyPrice(String(item.averageBuyPrice ?? ''));
    setAssetType(item.assetType || 'other');
    setStatus(item.status || 'active');
    setCurrency(item.currency || 'XOF');
    setLocation(item.location || '');
    setArea(item.area === null || item.area === undefined ? '' : String(item.area));
    setPurchaseDate(item.purchaseDate ? String(item.purchaseDate).slice(0, 10) : '');
    setEstimatedCurrentValue(
      item.estimatedCurrentValue === null || item.estimatedCurrentValue === undefined ? '' : String(item.estimatedCurrentValue)
    );
    setExpectedAnnualReturnRate(
      item.expectedAnnualReturnRate === null || item.expectedAnnualReturnRate === undefined
        ? ''
        : String(item.expectedAnnualReturnRate)
    );
    setMaturityDate(item.maturityDate ? String(item.maturityDate).slice(0, 10) : '');
    setExitDate(item.exitDate ? String(item.exitDate).slice(0, 10) : '');
    setExitValue(item.exitValue === null || item.exitValue === undefined ? '' : String(item.exitValue));
    setInstitution(item.institution || '');
    setNotes(item.notes || '');
    setIsEditOpen(true);
  };

  const validateForm = () => {
    if (!assetName.trim() || !quantity.trim() || !averageBuyPrice.trim()) {
      Alert.alert('Validation', 'Nom, quantite et prix moyen sont requis');
      return null;
    }

    const parsedQuantity = Number(quantity);
    const parsedAverageBuyPrice = Number(averageBuyPrice);

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      Alert.alert('Validation', 'Quantite invalide');
      return null;
    }

    if (Number.isNaN(parsedAverageBuyPrice) || parsedAverageBuyPrice < 0) {
      Alert.alert('Validation', 'Prix moyen invalide');
      return null;
    }

    const parsedArea = area.trim() ? Number(area) : null;
    if (parsedArea !== null && (Number.isNaN(parsedArea) || parsedArea < 0)) {
      Alert.alert('Validation', 'Superficie invalide');
      return null;
    }

    const parsedEstimatedCurrentValue = estimatedCurrentValue.trim() ? Number(estimatedCurrentValue) : null;
    if (parsedEstimatedCurrentValue !== null && (Number.isNaN(parsedEstimatedCurrentValue) || parsedEstimatedCurrentValue < 0)) {
      Alert.alert('Validation', 'Valeur actuelle estimee invalide');
      return null;
    }

    const parsedExpectedAnnualReturnRate = expectedAnnualReturnRate.trim() ? Number(expectedAnnualReturnRate) : null;
    if (
      parsedExpectedAnnualReturnRate !== null &&
      (Number.isNaN(parsedExpectedAnnualReturnRate) || parsedExpectedAnnualReturnRate < 0)
    ) {
      Alert.alert('Validation', 'Rendement attendu invalide');
      return null;
    }

    if (purchaseDate.trim()) {
      const parsedDate = new Date(purchaseDate);
      if (Number.isNaN(parsedDate.getTime())) {
        Alert.alert('Validation', 'Date d achat invalide');
        return null;
      }
    }

    if (maturityDate.trim()) {
      const parsedDate = new Date(maturityDate);
      if (Number.isNaN(parsedDate.getTime())) {
        Alert.alert('Validation', "Date d'echeance invalide");
        return null;
      }
    }

    const parsedExitValue = exitValue.trim() ? Number(exitValue) : null;
    if (parsedExitValue !== null && (Number.isNaN(parsedExitValue) || parsedExitValue < 0)) {
      Alert.alert('Validation', 'Montant de sortie invalide');
      return null;
    }

    if (exitDate.trim()) {
      const parsedDate = new Date(exitDate);
      if (Number.isNaN(parsedDate.getTime())) {
        Alert.alert('Validation', 'Date de sortie invalide');
        return null;
      }
    }

    if (showMaturityFields && !maturityDate.trim()) {
      Alert.alert('Validation', "La date d'echeance est requise pour ce type de placement");
      return null;
    }

    if (showYieldFields && !expectedAnnualReturnRate.trim()) {
      Alert.alert('Validation', 'Le rendement attendu est requis pour ce type de placement');
      return null;
    }

    if (showExitFields && !exitDate.trim()) {
      Alert.alert('Validation', 'La date de sortie est requise pour ce statut');
      return null;
    }

    if (showExitFields && !exitValue.trim()) {
      Alert.alert('Validation', 'Le montant de sortie est requis pour ce statut');
      return null;
    }

    return {
      assetName: assetName.trim(),
      symbol: symbol.trim().toUpperCase(),
      quantity: parsedQuantity,
      averageBuyPrice: parsedAverageBuyPrice,
      assetType,
      status,
      currency,
      location: location.trim(),
      area: showPropertyFields ? parsedArea : null,
      purchaseDate: purchaseDate.trim() || null,
      estimatedCurrentValue: parsedEstimatedCurrentValue,
      expectedAnnualReturnRate: showYieldFields ? parsedExpectedAnnualReturnRate : null,
      maturityDate: showMaturityFields ? maturityDate.trim() || null : null,
      exitDate: showExitFields ? exitDate.trim() || null : null,
      exitValue: showExitFields ? parsedExitValue : null,
      institution: institution.trim(),
      notes: notes.trim(),
    };
  };

  const submitCreate = async () => {
    const payload = validateForm();
    if (!payload) {
      return;
    }

    try {
      setIsSaving(true);
      await investmentApi.create(payload);
      await fetchData();
      closeCreate();
      Alert.alert('Succes', 'Investissement cree');
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Creation impossible');
    } finally {
      setIsSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!editingId) {
      return;
    }

    const payload = validateForm();
    if (!payload) {
      return;
    }

    try {
      setIsSaving(true);
      await investmentApi.update(editingId, payload);
      await fetchData();
      closeEdit();
      Alert.alert('Succes', 'Investissement mis a jour');
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Mise a jour impossible');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteInvestment = (id) => {
    Alert.alert('Confirmation', 'Supprimer cet investissement ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await investmentApi.remove(id);
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

  const formValues = {
    assetName,
    symbol,
    quantity,
    averageBuyPrice,
    assetType,
    status,
    currency,
    location,
    area,
    purchaseDate,
    estimatedCurrentValue,
    expectedAnnualReturnRate,
    maturityDate,
    exitDate,
    exitValue,
    institution,
    notes,
  };

  const formSetters = {
    setAssetName,
    setSymbol,
    setQuantity,
    setAverageBuyPrice,
    setAssetType,
    setStatus,
    setCurrency,
    setLocation,
    setArea,
    setPurchaseDate,
    setEstimatedCurrentValue,
    setExpectedAnnualReturnRate,
    setMaturityDate,
    setExitDate,
    setExitValue,
    setInstitution,
    setNotes,
  };

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
            <InvestmentsHero
              ui={ui}
              sem={sem}
              totals={totals}
              maturitySummary={maturitySummary}
              performance={performance}
              featuredTypes={featuredTypes}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              sortMode={sortMode}
              setSortMode={setSortMode}
              filteredTotals={filteredTotals}
              setIsCreateOpen={setIsCreateOpen}
              formatMoney={formatInvestmentMoney}
            />

            <View style={styles.analyticsRow}>
              <View style={[styles.analyticsCard, { borderColor: ui.softBorder, backgroundColor: ui.panelAlt }]}>
                <Text style={[styles.analyticsLabel, { color: ui.textSecondary }]}>Statut dominant</Text>
                <Text style={[styles.analyticsValue, { color: ui.text }]}>
                  {portfolioInsights.topStatus ? getInvestmentStatusLabel(portfolioInsights.topStatus[0]) : '-'}
                </Text>
                <Text style={[styles.analyticsHint, { color: ui.textSecondary }]}>
                  {portfolioInsights.topStatus ? `${portfolioInsights.topStatus[1]} position(s)` : 'Aucune donnee'}
                </Text>
              </View>
              <View style={[styles.analyticsCard, { borderColor: ui.softBorder, backgroundColor: ui.panelAlt }]}>
                <Text style={[styles.analyticsLabel, { color: ui.textSecondary }]}>Type dominant</Text>
                <Text style={[styles.analyticsValue, { color: ui.text }]}>
                  {portfolioInsights.topType ? getInvestmentTypeLabel(portfolioInsights.topType[0]) : '-'}
                </Text>
                <Text style={[styles.analyticsHint, { color: ui.textSecondary }]}>
                  {portfolioInsights.topType ? formatInvestmentMoney(portfolioInsights.topType[1], 'XOF') : 'Aucune donnee'}
                </Text>
              </View>
            </View>

            <View style={[styles.analyticsWideCard, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]}>
              <Text style={[styles.analyticsLabel, { color: ui.textSecondary }]}>Capital deja sorti</Text>
              <Text style={[styles.analyticsWideValue, { color: ui.text }]}>
                {formatInvestmentMoney(filteredTotals.realized, 'XOF')}
              </Text>
              <Text style={[styles.analyticsHint, { color: ui.textSecondary }]}>
                {filteredTotals.invested > 0
                  ? `${portfolioInsights.realizedShare.toFixed(1)}% du capital engage visible dans ce filtre`
                  : 'Aucune sortie enregistree pour l instant'}
              </Text>
            </View>

            <View style={[styles.insightCard, { borderColor: ui.insightBorder, backgroundColor: ui.insightBg }]}>
              <Text style={[styles.insightTitle, { color: ui.text }]}>Ce module sert a quoi ?</Text>
              <Text style={[styles.insightText, { color: ui.textSecondary }]}>
                Suivre ce que tu as immobilise dans un terrain, un troupeau, un stock commercial ou un depot.
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { color: ui.muted }]}>
            {statusFilter !== 'all' || typeFilter !== 'all' ? 'Aucun investissement pour ce filtre.' : 'Aucun investissement enregistre.'}
          </Text>
        }
        renderItem={({ item }) => (
          <InvestmentCard
            item={item}
            ui={ui}
            sem={sem}
            formatMoney={formatInvestmentMoney}
            numberFormatter={investmentNumberFormatter}
            isMaturityAsset={isMaturityAsset}
            onEdit={openEdit}
            onDelete={deleteInvestment}
          />
        )}
      />

      <InvestmentFormModal
        visible={isCreateOpen}
        title="Nouvel investissement"
        ui={ui}
        isSaving={isSaving}
        onClose={closeCreate}
        onSubmit={submitCreate}
        submitLabel="Creer"
        values={formValues}
        setters={formSetters}
        showPropertyFields={showPropertyFields}
        showYieldFields={showYieldFields}
        showMaturityFields={showMaturityFields}
        showExitFields={showExitFields}
      />

      <InvestmentFormModal
        visible={isEditOpen}
        title="Modifier investissement"
        ui={ui}
        isSaving={isSaving}
        onClose={closeEdit}
        onSubmit={submitEdit}
        submitLabel="Sauvegarder"
        values={formValues}
        setters={formSetters}
        showPropertyFields={showPropertyFields}
        showYieldFields={showYieldFields}
        showMaturityFields={showMaturityFields}
        showExitFields={showExitFields}
      />
    </>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  analyticsRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  analyticsCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  analyticsWideCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  analyticsLabel: { fontSize: 11, fontWeight: '700' },
  analyticsValue: { fontSize: 14, fontWeight: '800' },
  analyticsWideValue: { fontSize: 16, fontWeight: '800' },
  analyticsHint: { fontSize: 11, lineHeight: 16 },
  insightCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  insightTitle: { fontSize: 13, fontWeight: '800' },
  insightText: { fontSize: 13, lineHeight: 19 },
  empty: { textAlign: 'center', marginTop: 18 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontSize: 11 },
  noteText: { fontSize: 12, lineHeight: 18, marginTop: 2 },
});

export default InvestmentsScreen;
