import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DashboardQuickActions = ({ fadeUp, balanceAnim, navigation, quickActions, ui, sem, palette }) => (
  <Animated.View style={fadeUp(balanceAnim)}>
    <Text style={[styles.sectionTitle, { color: ui.metricValue }]}>Acces rapides</Text>
    <View style={styles.quickGrid}>
      {quickActions.map((item) => (
        <Pressable
          key={item.key}
          style={[styles.quickCard, { backgroundColor: ui.heroBg, borderColor: ui.heroBorder }]}
          onPress={() => navigation.navigate(item.key)}
        >
          <View style={[styles.quickIcon, { backgroundColor: sem.softBlueBg, borderColor: sem.softBlueBorder }]}>
            <Ionicons name={item.icon} size={18} color={palette.primary} />
          </View>
          <Text style={[styles.quickLabel, { color: ui.metricValue }]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  </Animated.View>
);

const styles = StyleSheet.create({
  sectionTitle: { marginTop: 12, marginBottom: 8, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickCard: { width: '31.3%', borderRadius: 18, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', gap: 6 },
  quickIcon: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
});

export default DashboardQuickActions;
