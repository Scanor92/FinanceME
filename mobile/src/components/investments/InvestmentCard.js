import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  getInvestmentStatusLabel,
  getInvestmentTypeIcon,
  getInvestmentTypeLabel,
} from '../../constants/investmentMeta';
import { formatDate, formatPercent } from '../../utils/format';

const InvestmentCard = ({
  item,
  ui,
  sem,
  formatMoney,
  numberFormatter,
  isMaturityAsset,
  onEdit,
  onDelete,
}) => (
  <View style={[styles.card, { borderColor: ui.border, backgroundColor: ui.panelAlt }]}>
    <View style={styles.cardHeader}>
      <View style={styles.identity}>
        <View style={[styles.iconWrap, { borderColor: ui.softBorder, backgroundColor: ui.softBg }]}>
          <Ionicons name={getInvestmentTypeIcon(item.assetType)} size={16} color={sem.investment} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.cardTitle, { color: ui.text }]}>{item.assetName}</Text>
          <Text style={[styles.cardMeta, { color: ui.textSecondary }]}>
            {getInvestmentTypeLabel(item.assetType)}
            {item.symbol ? ` - ${item.symbol}` : ''}
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
      <Text style={[styles.metricValue, { color: ui.text }]}>{isMaturityAsset(item.assetType) ? 'Placement a echeance' : 'Actif ouvert'}</Text>
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
        <Text style={[styles.metricValue, { color: sem.investment }]}>{formatMoney(item.projectedValue, item.currency)}</Text>
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
      <Pressable style={[styles.actionBtn, { borderColor: ui.editBorder, backgroundColor: ui.editBg }]} onPress={() => onEdit(item)}>
        <Ionicons name="create-outline" size={12} color={ui.text} />
        <Text style={[styles.actionText, { color: ui.text }]}>Modifier</Text>
      </Pressable>
      <Pressable style={[styles.actionBtn, { borderColor: ui.deleteBorder, backgroundColor: ui.deleteBg }]} onPress={() => onDelete(item._id)}>
        <Ionicons name="trash-outline" size={12} color={sem.danger} />
        <Text style={[styles.actionText, { color: sem.danger }]}>Suppr.</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  cardTitle: { fontWeight: '700', fontSize: 14 },
  cardMeta: { marginTop: 2, fontSize: 12 },
  symbolBadge: { borderRadius: 999, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 8 },
  symbolBadgeText: { fontWeight: '700' },
  statusBadge: { borderWidth: 1, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10, fontSize: 11, fontWeight: '700', overflow: 'hidden' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricTile: { width: '48%', borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 10, gap: 4 },
  metricTileWide: { width: '100%' },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontSize: 11 },
  metricValue: { fontSize: 12, fontWeight: '700' },
  metricStrong: { fontSize: 13, fontWeight: '800' },
  estimateBanner: { borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  estimateText: { fontSize: 12, fontWeight: '700', flex: 1 },
  estimateDelta: { fontSize: 11, fontWeight: '800' },
  noteText: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  actionBtn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionText: { fontSize: 11, fontWeight: '700' },
});

export default InvestmentCard;
