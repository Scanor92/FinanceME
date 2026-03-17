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
import {
  investmentStatusOptions,
  investmentTypeOptions,
  getInvestmentStatusLabel,
  getInvestmentTypeIcon,
  getInvestmentTypeLabel,
} from '../constants/investmentMeta';
import { useAppTheme } from '../context/ThemeContext';
import { getSemanticColors } from '../theme/semanticColors';
import { formatDate, formatPercent, getDaysRemaining } from '../utils/format';

// Multi-currency formatter kept local (XOF / USD / EUR)
const formatMoney = (value, currencyCode = 'XOF') =>
  new Intl.NumberFormat('fr-NE', {
    style: 'currency',
    currency: ['XOF', 'USD', 'EUR'].includes(currencyCode) ? currencyCode : 'XOF',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const numberFormatter = new Intl.NumberFormat('fr-NE', {
  maximumFractionDigits: 2,
});

const maturityAssetTypes = ['fixed_deposit'];
const yieldAssetTypes = ['fixed_deposit', 'cooperative'];
const propertyAssetTypes = ['land', 'real_estate', 'agriculture'];

const isMaturityAsset = (assetType) => maturityAssetTypes.includes(assetType);
const isYieldAsset = (assetType) => yieldAssetTypes.includes(assetType);
const isPropertyAsset = (assetType) => propertyAssetTypes.includes(assetType);

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
              <View style={[styles.heroGlow, styles.heroGlowLeft, { backgroundColor: ui.heroGlowA }]} />
              <View style={[styles.heroGlow, styles.heroGlowRight, { backgroundColor: ui.heroGlowB }]} />

              <View style={[styles.heroRibbon, { backgroundColor: ui.heroRibbon }]}>
                <Text style={[styles.heroRibbonText, { color: ui.heroRibbonText }]}>INVESTIR AU NIGER</Text>
              </View>

              <Text style={[styles.title, { color: ui.text }]}>Des actifs concrets, bien suivis</Text>
              <Text style={[styles.subtitle, { color: ui.textSecondary }]}>
                Terrain, elevage, commerce, cooperative: suis ce que tu construis vraiment.
              </Text>

              <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, styles.kpiCardWide, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]}>
                  <Text style={[styles.kpiLabel, { color: ui.textSecondary }]}>Capital engage</Text>
                  <Text style={[styles.kpiValue, { color: ui.text }]}>{formatMoney(totals.invested, 'XOF')}</Text>
                  <Text style={[styles.kpiHint, { color: ui.textSecondary }]}>Valeur cumulee de tes positions en portefeuille</Text>
                </View>
                <View style={[styles.kpiCard, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]}>
                  <Text style={[styles.kpiLabel, { color: ui.textSecondary }]}>Positions</Text>
                  <Text style={[styles.kpiValue, { color: ui.text }]}>{totals.positions}</Text>
                  <Text style={[styles.kpiHint, { color: ui.textSecondary }]}>Actifs suivis</Text>
                </View>
              </View>

              <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]}>
                  <Text style={[styles.kpiLabel, { color: ui.textSecondary }]}>A echeance</Text>
                  <Text style={[styles.kpiValue, { color: ui.text }]}>{maturitySummary.maturityCount}</Text>
                  <Text style={[styles.kpiHint, { color: ui.textSecondary }]}>Depots et placements a terme</Text>
                </View>
                <View style={[styles.kpiCard, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]}>
                  <Text style={[styles.kpiLabel, { color: ui.textSecondary }]}>Actifs ouverts</Text>
                  <Text style={[styles.kpiValue, { color: ui.text }]}>{maturitySummary.openCount}</Text>
                  <Text style={[styles.kpiHint, { color: ui.textSecondary }]}>Terrain, elevage, commerce, or</Text>
                </View>
              </View>

              <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]}>
                  <Text style={[styles.kpiLabel, { color: ui.textSecondary }]}>Actifs</Text>
                  <Text style={[styles.kpiValue, { color: ui.text }]}>{totals.active}</Text>
                  <Text style={[styles.kpiHint, { color: ui.textSecondary }]}>Toujours detenus</Text>
                </View>
                <View style={[styles.kpiCard, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]}>
                  <Text style={[styles.kpiLabel, { color: ui.textSecondary }]}>En attente</Text>
                  <Text style={[styles.kpiValue, { color: ui.text }]}>{totals.pending}</Text>
                  <Text style={[styles.kpiHint, { color: ui.textSecondary }]}>Mise en place ou validation</Text>
                </View>
              </View>

              {performance.hasEstimate ? (
                <View
                  style={[
                    styles.performanceHero,
                    {
                      borderColor: ui.softBorder,
                      backgroundColor: performance.gain >= 0 ? `${sem.success}14` : `${sem.danger}14`,
                    },
                  ]}
                >
                  <Ionicons
                    name={performance.gain >= 0 ? 'trending-up-outline' : 'trending-down-outline'}
                    size={18}
                    color={performance.gain >= 0 ? sem.success : sem.danger}
                  />
                  <View style={styles.performanceHeroBody}>
                    <Text style={[styles.performanceHeroLabel, { color: ui.textSecondary }]}>Performance estimee</Text>
                    <Text style={[styles.performanceHeroValue, { color: performance.gain >= 0 ? sem.success : sem.danger }]}>
                      {performance.gain >= 0 ? '+' : '-'} {formatMoney(Math.abs(performance.gain), 'XOF')}
                    </Text>
                  </View>
                  <Text style={[styles.performanceHeroRate, { color: ui.text }]}>
                    {performance.gain >= 0 ? '+' : ''}
                    {performance.rate.toFixed(1)}%
                  </Text>
                </View>
              ) : null}

              <View style={styles.featuredRow}>
                {featuredTypes.map((item) => (
                  <View key={item.value} style={[styles.featureChip, { borderColor: ui.softBorder, backgroundColor: ui.panelAlt }]}>
                    <Ionicons name={item.icon} size={14} color={sem.investment} />
                    <Text style={[styles.featureChipText, { color: ui.text }]}>{item.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.filterBlock}>
                <Text style={[styles.filterTitle, { color: ui.textSecondary }]}>Filtrer le portefeuille</Text>
                <View style={styles.filterRow}>
                  <Pressable
                    style={[
                      styles.filterChip,
                      { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                      statusFilter === 'all' && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                    ]}
                    onPress={() => setStatusFilter('all')}
                  >
                    <Text style={[styles.filterChipText, { color: statusFilter === 'all' ? ui.text : ui.textSecondary }]}>Tous statuts</Text>
                  </Pressable>
                  {investmentStatusOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.filterChip,
                        { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                        statusFilter === option.value && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                      ]}
                      onPress={() => setStatusFilter(option.value)}
                    >
                      <Text style={[styles.filterChipText, { color: statusFilter === option.value ? ui.text : ui.textSecondary }]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.filterRow}>
                  <Pressable
                    style={[
                      styles.filterChip,
                      { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                      typeFilter === 'all' && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                    ]}
                    onPress={() => setTypeFilter('all')}
                  >
                    <Text style={[styles.filterChipText, { color: typeFilter === 'all' ? ui.text : ui.textSecondary }]}>Tous types</Text>
                  </Pressable>
                  {featuredTypes.map((option) => (
                    <Pressable
                      key={`filter-${option.value}`}
                      style={[
                        styles.filterChip,
                        { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                        typeFilter === option.value && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                      ]}
                      onPress={() => setTypeFilter(option.value)}
                    >
                      <Text style={[styles.filterChipText, { color: typeFilter === option.value ? ui.text : ui.textSecondary }]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.filterRow}>
                  {[
                    { value: 'recent', label: 'Plus recents' },
                    { value: 'amount_desc', label: 'Plus gros montants' },
                    { value: 'performance_desc', label: 'Plus rentables' },
                  ].map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.filterChip,
                        { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                        sortMode === option.value && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                      ]}
                      onPress={() => setSortMode(option.value)}
                    >
                      <Text style={[styles.filterChipText, { color: sortMode === option.value ? ui.text : ui.textSecondary }]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {(statusFilter !== 'all' || typeFilter !== 'all') ? (
                  <View style={[styles.filteredSummary, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]}>
                    <Text style={[styles.filteredSummaryText, { color: ui.text }]}>
                      {filteredTotals.positions} position(s) • {formatMoney(filteredTotals.invested, 'XOF')}
                    </Text>
                    <Pressable onPress={() => {
                      setStatusFilter('all');
                      setTypeFilter('all');
                    }}>
                      <Text style={[styles.filteredResetText, { color: ui.primary }]}>Reinitialiser</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <Pressable style={[styles.addBtn, { backgroundColor: ui.primary }]} onPress={() => setIsCreateOpen(true)}>
                <Ionicons name="add" size={16} color={ui.onPrimary} />
                <Text style={[styles.addBtnText, { color: ui.onPrimary }]}>Nouvelle position</Text>
              </Pressable>
            </View>

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
                  {portfolioInsights.topType ? formatMoney(portfolioInsights.topType[1], 'XOF') : 'Aucune donnee'}
                </Text>
              </View>
            </View>

            <View style={[styles.analyticsWideCard, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]}>
              <Text style={[styles.analyticsLabel, { color: ui.textSecondary }]}>Capital deja sorti</Text>
              <Text style={[styles.analyticsWideValue, { color: ui.text }]}>
                {formatMoney(filteredTotals.realized, 'XOF')}
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
          <View style={[styles.card, { borderColor: ui.border, backgroundColor: ui.panelAlt }]}>
            <View style={styles.cardHeader}>
              <View style={styles.identity}>
                <View style={[styles.iconWrap, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]}>
                  <Ionicons name={getInvestmentTypeIcon(item.assetType)} size={16} color={sem.investment} />
                </View>
                <View style={styles.body}>
                  <Text style={[styles.cardTitle, { color: ui.text }]}>{item.assetName}</Text>
                  <Text style={[styles.cardMeta, { color: ui.textSecondary }]}>
                    {getInvestmentTypeLabel(item.assetType)}{item.symbol ? ` - ${item.symbol}` : ''}
                  </Text>
                </View>
              </View>
              {item.symbol ? (
                <View style={[styles.symbolBadge, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]}>
                  <Text style={[styles.symbolBadgeText, { color: sem.investment }]}>{item.symbol}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Statut</Text>
              <Text
                style={[
                  styles.statusBadge,
                  {
                    color:
                      item.status === 'sold'
                        ? sem.danger
                        : item.status === 'completed'
                          ? sem.success
                          : item.status === 'pending'
                            ? sem.warning || ui.text
                            : ui.text,
                    borderColor:
                      item.status === 'sold'
                        ? ui.deleteBorder
                        : item.status === 'completed'
                          ? ui.softBorder
                          : ui.inputBorder,
                    backgroundColor:
                      item.status === 'sold'
                        ? ui.deleteBg
                        : item.status === 'completed'
                          ? `${sem.success}14`
                          : item.status === 'pending'
                            ? `${ui.primary}14`
                            : ui.softBg,
                  },
                ]}
              >
                {getInvestmentStatusLabel(item.status)}
              </Text>
            </View>

            <View style={styles.metricGrid}>
              <View style={[styles.metricTile, { borderColor: ui.statTileBorder, backgroundColor: ui.statTileBg }]}>
                <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Quantite</Text>
                <Text style={[styles.metricValue, { color: ui.text }]}>{numberFormatter.format(Number(item.quantity || 0))}</Text>
              </View>
              <View style={[styles.metricTile, { borderColor: ui.statTileBorder, backgroundColor: ui.statTileBg }]}>
                <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Prix moyen</Text>
                <Text style={[styles.metricValue, { color: ui.text }]}>{formatMoney(Number(item.averageBuyPrice || 0), item.currency)}</Text>
              </View>
              <View style={[styles.metricTile, styles.metricTileWide, { borderColor: ui.statTileBorder, backgroundColor: ui.statTileBg }]}>
                <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Total engage</Text>
                <Text style={[styles.metricStrong, { color: sem.investment }]}>{formatMoney(Number(item.totalInvested || 0), item.currency)}</Text>
              </View>
            </View>
            {item.estimatedCurrentValue !== null && item.estimatedCurrentValue !== undefined ? (
              <View
                style={[
                  styles.estimateBanner,
                  {
                    borderColor: ui.softBorder,
                    backgroundColor:
                      Number(item.estimatedCurrentValue || 0) >= Number(item.totalInvested || 0) ? `${sem.success}18` : `${sem.danger}18`,
                  },
                ]}
              >
                <Ionicons
                  name={Number(item.estimatedCurrentValue || 0) >= Number(item.totalInvested || 0) ? 'trending-up-outline' : 'trending-down-outline'}
                  size={14}
                  color={Number(item.estimatedCurrentValue || 0) >= Number(item.totalInvested || 0) ? sem.success : sem.danger}
                />
                <Text style={[styles.estimateText, { color: ui.text }]}>
                  Valeur estimee: {formatMoney(Number(item.estimatedCurrentValue || 0), item.currency)}
                </Text>
                <Text
                  style={[
                    styles.estimateDelta,
                    {
                      color:
                        Number(item.estimatedCurrentValue || 0) >= Number(item.totalInvested || 0)
                          ? sem.success
                          : sem.danger,
                    },
                  ]}
                >
                  {Number(item.estimatedCurrentValue || 0) - Number(item.totalInvested || 0) >= 0 ? '+' : '-'}{' '}
                  {formatMoney(Math.abs(Number(item.estimatedCurrentValue || 0) - Number(item.totalInvested || 0)), item.currency)}
                </Text>
              </View>
            ) : null}
            {item.location ? (
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Localisation</Text>
                <Text style={[styles.metricValue, { color: ui.text }]}>{item.location}</Text>
              </View>
            ) : null}
            {item.area !== null && item.area !== undefined ? (
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Superficie</Text>
                <Text style={[styles.metricValue, { color: ui.text }]}>{numberFormatter.format(Number(item.area || 0))} m2</Text>
              </View>
            ) : null}
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Mode de suivi</Text>
              <Text style={[styles.metricValue, { color: ui.text }]}>
                {isMaturityAsset(item.assetType) ? 'Placement a echeance' : 'Actif ouvert'}
              </Text>
            </View>
            {item.purchaseDate ? (
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Date d'achat</Text>
                <Text style={[styles.metricValue, { color: ui.text }]}>{formatDate(item.purchaseDate)}</Text>
              </View>
            ) : null}
            {item.expectedAnnualReturnRate !== null && item.expectedAnnualReturnRate !== undefined ? (
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Rendement attendu</Text>
                <Text style={[styles.metricValue, { color: sem.success }]}>{formatPercent(item.expectedAnnualReturnRate)}</Text>
              </View>
            ) : null}
            {item.maturityDate ? (
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Echeance</Text>
                <Text style={[styles.metricValue, { color: ui.text }]}>
                  {formatDate(item.maturityDate)}
                  {item.daysRemaining !== null ? ` (${item.daysRemaining >= 0 ? `${item.daysRemaining} j restants` : 'depassee'})` : ''}
                </Text>
              </View>
            ) : null}
            {item.projectedValue !== null ? (
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Valeur projetee</Text>
                <Text style={[styles.metricValue, { color: sem.investment }]}>
                  {formatMoney(item.projectedValue, item.currency)}
                </Text>
              </View>
            ) : null}
            {item.exitDate ? (
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Date de sortie</Text>
                <Text style={[styles.metricValue, { color: ui.text }]}>{formatDate(item.exitDate)}</Text>
              </View>
            ) : null}
            {item.realizedValue !== null ? (
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Valeur de sortie</Text>
                <Text style={[styles.metricValue, { color: ui.text }]}>{formatMoney(item.realizedValue, item.currency)}</Text>
              </View>
            ) : null}
            {item.realizedGain !== null ? (
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Resultat reel</Text>
                <Text style={[styles.metricValue, { color: item.realizedGain >= 0 ? sem.success : sem.danger }]}>
                  {item.realizedGain >= 0 ? '+' : '-'} {formatMoney(Math.abs(item.realizedGain), item.currency)}
                </Text>
              </View>
            ) : null}
            {item.institution ? (
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: ui.textSecondary }]}>Structure</Text>
                <Text style={[styles.metricValue, { color: ui.text }]}>{item.institution}</Text>
              </View>
            ) : null}
            {item.notes ? <Text style={[styles.noteText, { color: ui.textSecondary }]}>{item.notes}</Text> : null}

            <View style={styles.actionRow}>
              <Pressable style={[styles.actionBtn, { borderColor: ui.editBorder, backgroundColor: ui.editBg }]} onPress={() => openEdit(item)}>
                <Ionicons name="create-outline" size={12} color={ui.text} />
                <Text style={[styles.actionText, { color: ui.text }]}>Modifier</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { borderColor: ui.deleteBorder, backgroundColor: ui.deleteBg }]} onPress={() => deleteInvestment(item._id)}>
                <Ionicons name="trash-outline" size={12} color={sem.danger} />
                <Text style={[styles.actionText, { color: sem.danger }]}>Suppr.</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Modal visible={isCreateOpen} transparent animationType="slide" onRequestClose={closeCreate}>
        <View style={[styles.modalBackdrop, { backgroundColor: ui.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
            <Text style={[styles.modalTitle, { color: ui.text }]}>Nouvel investissement</Text>
            <TextInput
              placeholder="Nom de l'actif"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={assetName}
              onChangeText={setAssetName}
            />
            <TextInput
              placeholder="Symbole (optionnel)"
              autoCapitalize="characters"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={symbol}
              onChangeText={setSymbol}
            />
            <TextInput
              placeholder="Quantite"
              keyboardType="decimal-pad"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={quantity}
              onChangeText={setQuantity}
            />
            <TextInput
              placeholder="Prix moyen d'achat"
              keyboardType="decimal-pad"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={averageBuyPrice}
              onChangeText={setAverageBuyPrice}
            />
            <TextInput
              placeholder="Localisation (optionnel)"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={location}
              onChangeText={setLocation}
            />
            {showPropertyFields ? (
              <TextInput
                placeholder="Superficie en m2 (optionnel)"
                keyboardType="decimal-pad"
                placeholderTextColor={ui.placeholder}
                style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
                value={area}
                onChangeText={setArea}
              />
            ) : null}
            <TextInput
              placeholder="Date d'achat YYYY-MM-DD (optionnel)"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={purchaseDate}
              onChangeText={setPurchaseDate}
            />
            <TextInput
              placeholder="Valeur actuelle estimee (optionnel)"
              keyboardType="decimal-pad"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={estimatedCurrentValue}
              onChangeText={setEstimatedCurrentValue}
            />
            {showYieldFields ? (
              <TextInput
                placeholder="Rendement annuel attendu %"
                keyboardType="decimal-pad"
                placeholderTextColor={ui.placeholder}
                style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
                value={expectedAnnualReturnRate}
                onChangeText={setExpectedAnnualReturnRate}
              />
            ) : null}
            {showMaturityFields ? (
              <TextInput
                placeholder="Date d'echeance YYYY-MM-DD"
                placeholderTextColor={ui.placeholder}
                style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
                value={maturityDate}
                onChangeText={setMaturityDate}
              />
            ) : null}
            {showExitFields ? (
              <TextInput
                placeholder="Date de sortie YYYY-MM-DD"
                placeholderTextColor={ui.placeholder}
                style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
                value={exitDate}
                onChangeText={setExitDate}
              />
            ) : null}
            {showExitFields ? (
              <TextInput
                placeholder="Montant de sortie"
                keyboardType="decimal-pad"
                placeholderTextColor={ui.placeholder}
                style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
                value={exitValue}
                onChangeText={setExitValue}
              />
            ) : null}
            <TextInput
              placeholder="Structure / cooperative / banque (optionnel)"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={institution}
              onChangeText={setInstitution}
            />
            <TextInput
              placeholder="Notes (optionnel)"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, styles.noteInput, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
            <View style={styles.segmentWrap}>
              {['XOF', 'USD', 'EUR'].map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.segment,
                    { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                    currency === option && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                  ]}
                  onPress={() => setCurrency(option)}
                >
                  <Text style={[styles.segmentText, { color: currency === option ? ui.text : ui.textSecondary }]}>{option}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.segmentWrap}>
              {investmentTypeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.segment,
                    { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                    assetType === option.value && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                  ]}
                  onPress={() => setAssetType(option.value)}
                >
                  <Text style={[styles.segmentText, { color: assetType === option.value ? ui.text : ui.textSecondary }]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.segmentWrap}>
              {investmentStatusOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.segment,
                    { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                    status === option.value && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                  ]}
                  onPress={() => setStatus(option.value)}
                >
                  <Text style={[styles.segmentText, { color: status === option.value ? ui.text : ui.textSecondary }]}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
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
            <Text style={[styles.modalTitle, { color: ui.text }]}>Modifier investissement</Text>
            <TextInput
              placeholder="Nom de l'actif"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={assetName}
              onChangeText={setAssetName}
            />
            <TextInput
              placeholder="Symbole (optionnel)"
              autoCapitalize="characters"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={symbol}
              onChangeText={setSymbol}
            />
            <TextInput
              placeholder="Quantite"
              keyboardType="decimal-pad"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={quantity}
              onChangeText={setQuantity}
            />
            <TextInput
              placeholder="Prix moyen d'achat"
              keyboardType="decimal-pad"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={averageBuyPrice}
              onChangeText={setAverageBuyPrice}
            />
            <TextInput
              placeholder="Localisation (optionnel)"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={location}
              onChangeText={setLocation}
            />
            {showPropertyFields ? (
              <TextInput
                placeholder="Superficie en m2 (optionnel)"
                keyboardType="decimal-pad"
                placeholderTextColor={ui.placeholder}
                style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
                value={area}
                onChangeText={setArea}
              />
            ) : null}
            <TextInput
              placeholder="Date d'achat YYYY-MM-DD (optionnel)"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={purchaseDate}
              onChangeText={setPurchaseDate}
            />
            <TextInput
              placeholder="Valeur actuelle estimee (optionnel)"
              keyboardType="decimal-pad"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={estimatedCurrentValue}
              onChangeText={setEstimatedCurrentValue}
            />
            {showYieldFields ? (
              <TextInput
                placeholder="Rendement annuel attendu %"
                keyboardType="decimal-pad"
                placeholderTextColor={ui.placeholder}
                style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
                value={expectedAnnualReturnRate}
                onChangeText={setExpectedAnnualReturnRate}
              />
            ) : null}
            {showMaturityFields ? (
              <TextInput
                placeholder="Date d'echeance YYYY-MM-DD"
                placeholderTextColor={ui.placeholder}
                style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
                value={maturityDate}
                onChangeText={setMaturityDate}
              />
            ) : null}
            {showExitFields ? (
              <TextInput
                placeholder="Date de sortie YYYY-MM-DD"
                placeholderTextColor={ui.placeholder}
                style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
                value={exitDate}
                onChangeText={setExitDate}
              />
            ) : null}
            {showExitFields ? (
              <TextInput
                placeholder="Montant de sortie"
                keyboardType="decimal-pad"
                placeholderTextColor={ui.placeholder}
                style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
                value={exitValue}
                onChangeText={setExitValue}
              />
            ) : null}
            <TextInput
              placeholder="Structure / cooperative / banque (optionnel)"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={institution}
              onChangeText={setInstitution}
            />
            <TextInput
              placeholder="Notes (optionnel)"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, styles.noteInput, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
            <View style={styles.segmentWrap}>
              {['XOF', 'USD', 'EUR'].map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.segment,
                    { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                    currency === option && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                  ]}
                  onPress={() => setCurrency(option)}
                >
                  <Text style={[styles.segmentText, { color: currency === option ? ui.text : ui.textSecondary }]}>{option}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.segmentWrap}>
              {investmentTypeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.segment,
                    { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                    assetType === option.value && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                  ]}
                  onPress={() => setAssetType(option.value)}
                >
                  <Text style={[styles.segmentText, { color: assetType === option.value ? ui.text : ui.textSecondary }]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.segmentWrap}>
              {investmentStatusOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.segment,
                    { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                    status === option.value && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
                  ]}
                  onPress={() => setStatus(option.value)}
                >
                  <Text style={[styles.segmentText, { color: status === option.value ? ui.text : ui.textSecondary }]}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
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
    </>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 10, overflow: 'hidden' },
  heroGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.28,
  },
  heroGlowLeft: {
    top: -35,
    left: -25,
  },
  heroGlowRight: {
    bottom: -45,
    right: -20,
  },
  heroRibbon: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  heroRibbonText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: { fontSize: 22, fontFamily: 'Georgia', fontWeight: '700' },
  subtitle: { fontSize: 12, lineHeight: 18 },
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiCard: { flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 11, paddingHorizontal: 11 },
  kpiCardWide: { flex: 1.4 },
  kpiLabel: { fontSize: 11 },
  kpiValue: { marginTop: 4, fontWeight: '800', fontSize: 15 },
  kpiHint: { marginTop: 3, fontSize: 10, lineHeight: 14 },
  featuredRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterBlock: { gap: 7 },
  filterTitle: { fontSize: 11, fontWeight: '700' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  filterChipText: { fontSize: 10, fontWeight: '700' },
  filteredSummary: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  filteredSummaryText: { fontSize: 12, fontWeight: '700', flex: 1 },
  filteredResetText: { fontSize: 12, fontWeight: '800' },
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
  featureChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureChipText: { fontSize: 10, fontWeight: '700' },
  performanceHero: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  performanceHeroBody: { flex: 1 },
  performanceHeroLabel: { fontSize: 11, fontWeight: '700' },
  performanceHeroValue: { marginTop: 2, fontSize: 15, fontWeight: '800' },
  performanceHeroRate: { fontSize: 13, fontWeight: '800' },
  addBtn: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addBtnText: { fontWeight: '700', fontSize: 12 },
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
  card: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  cardTitle: { fontWeight: '700', fontSize: 14 },
  cardMeta: { marginTop: 2, fontSize: 12 },
  symbolBadge: { borderRadius: 999, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 8 },
  symbolBadgeText: { fontWeight: '700' },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricTile: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 4,
  },
  metricTileWide: {
    width: '100%',
  },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontSize: 11 },
  metricValue: { fontSize: 12, fontWeight: '700' },
  metricStrong: { fontSize: 13, fontWeight: '800' },
  estimateBanner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  estimateText: { fontSize: 12, fontWeight: '700', flex: 1 },
  estimateDelta: { fontSize: 11, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionText: { fontSize: 11, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, borderTopWidth: 1, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  noteInput: { minHeight: 72, textAlignVertical: 'top' },
  segmentWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  segment: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  segmentText: { fontWeight: '700', fontSize: 12 },
  modalActions: { marginTop: 4, flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  modalBtnText: { fontWeight: '700' },
  noteText: { fontSize: 12, lineHeight: 18, marginTop: 2 },
});

export default InvestmentsScreen;
