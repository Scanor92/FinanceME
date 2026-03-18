import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatCompactMoney, formatCurrency } from '../../utils/format';

const DashboardSummaryCards = ({
  fadeUp,
  balanceAnim,
  metricsAnim,
  palette,
  ui,
  sem,
  stats,
  accountSummary,
  debtSummary,
}) => (
  <>
    <Animated.View style={[styles.card, fadeUp(balanceAnim), { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}>
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <View style={[styles.iconBubble, { backgroundColor: ui.badgeIconBg, borderColor: ui.badgeIconBorder }]}>
            <Ionicons name="sparkles-outline" size={14} color={palette.primary} />
          </View>
          <Text style={[styles.label, { color: ui.metricLabel }]}>Solde net</Text>
        </View>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: stats.balance >= 0 ? ui.badgePosBg : ui.badgeNegBg,
              borderColor: stats.balance >= 0 ? ui.badgePosBorder : ui.badgeNegBorder,
            },
          ]}
        >
          <Text style={[styles.pillText, { color: ui.badgeText }]}>{stats.balance >= 0 ? 'Positif' : 'Negatif'}</Text>
        </View>
      </View>
      <Text style={[styles.balanceValue, { color: ui.metricValue }]}>{formatCompactMoney(stats.balance)}</Text>
      <Text style={[styles.balanceExact, { color: ui.metricLabel }]}>{formatCurrency(stats.balance)}</Text>
      <Text style={[styles.balanceSub, { color: ui.metricLabel }]}>Situation globale apres revenus et depenses</Text>
    </Animated.View>

    <Animated.View style={[styles.grid2, fadeUp(metricsAnim)]}>
      <View style={[styles.metricCard, { backgroundColor: ui.heroBg, borderColor: ui.heroBorder }]}>
        <Text style={[styles.label, { color: ui.metricLabel }]}>Tresorerie dispo</Text>
        <Text style={[styles.metricValue, { color: ui.metricValue }]}>{formatCompactMoney(accountSummary.totalBalance)}</Text>
        <Text style={[styles.metricSub, { color: ui.metricLabel }]}>{accountSummary.accountsCount} compte(s) actif(s)</Text>
      </View>
      <View style={[styles.metricCard, { backgroundColor: ui.heroBg, borderColor: ui.heroBorder }]}>
        <Text style={[styles.label, { color: ui.metricLabel }]}>Dettes nettes</Text>
        <Text style={[styles.metricValue, { color: debtSummary.net >= 0 ? sem.success : sem.danger }]}>
          {formatCompactMoney(debtSummary.net)}
        </Text>
        <Text style={[styles.metricSub, { color: ui.metricLabel }]}>
          {debtSummary.iOwe > 0 ? 'A payer: ' : 'A recevoir: '}
          {formatCompactMoney(debtSummary.iOwe > 0 ? debtSummary.iOwe : debtSummary.owedToMe)}
        </Text>
      </View>
    </Animated.View>
  </>
);

const styles = StyleSheet.create({
  card: { marginTop: 8, borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  iconBubble: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pill: { borderRadius: 10, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 8 },
  pillText: { fontSize: 10, fontWeight: '700' },
  balanceValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  balanceExact: { fontSize: 11 },
  balanceSub: { fontSize: 11 },
  grid2: { marginTop: 8, flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, borderRadius: 20, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 14, gap: 6 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  metricSub: { fontSize: 11 },
});

export default DashboardSummaryCards;
