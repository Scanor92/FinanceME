import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { investmentStatusOptions } from '../../constants/investmentMeta';

const InvestmentsHero = ({
  ui,
  sem,
  totals,
  maturitySummary,
  performance,
  featuredTypes,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  sortMode,
  setSortMode,
  filteredTotals,
  setIsCreateOpen,
  formatMoney,
}) => (
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
            <Text style={[styles.filterChipText, { color: statusFilter === option.value ? ui.text : ui.textSecondary }]}>{option.label}</Text>
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
            <Text style={[styles.filterChipText, { color: typeFilter === option.value ? ui.text : ui.textSecondary }]}>{option.label}</Text>
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
            <Text style={[styles.filterChipText, { color: sortMode === option.value ? ui.text : ui.textSecondary }]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>

      {statusFilter !== 'all' || typeFilter !== 'all' ? (
        <View style={[styles.filteredSummary, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]}>
          <Text style={[styles.filteredSummaryText, { color: ui.text }]}>
            {filteredTotals.positions} position(s) • {formatMoney(filteredTotals.invested, 'XOF')}
          </Text>
          <Pressable
            onPress={() => {
              setStatusFilter('all');
              setTypeFilter('all');
            }}
          >
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
);

const styles = StyleSheet.create({
  hero: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 10, overflow: 'hidden' },
  heroGlow: { position: 'absolute', width: 140, height: 140, borderRadius: 70, opacity: 0.28 },
  heroGlowLeft: { top: -35, left: -25 },
  heroGlowRight: { bottom: -45, right: -20 },
  heroRibbon: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  heroRibbonText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
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
  filterChip: { borderRadius: 999, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 10 },
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
  featureChip: { borderRadius: 999, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureChipText: { fontSize: 10, fontWeight: '700' },
  performanceHero: { borderWidth: 1, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  performanceHeroBody: { flex: 1 },
  performanceHeroLabel: { fontSize: 11, fontWeight: '700' },
  performanceHeroValue: { marginTop: 2, fontSize: 15, fontWeight: '800' },
  performanceHeroRate: { fontSize: 13, fontWeight: '800' },
  addBtn: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  addBtnText: { fontWeight: '700', fontSize: 12 },
});

export default InvestmentsHero;
