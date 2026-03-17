
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

const sections = [
  {
    title: 'Accueil',
    description: 'Vue rapide de tes soldes, mouvements et indicateurs utiles.',
  },
  {
    title: 'Transactions',
    description: "Ajoute, modifie et classe tes entrees et sorties d'argent.",
  },
  {
    title: 'Budgets',
    description: 'Fixe des limites, ajuste-les et suis les depassements.',
  },
  {
    title: 'Investissements',
    description: 'Suis terrain, elevage, commerce, depot et autres actifs.',
  },
  {
    title: 'Dettes et epargne',
    description: 'Visualise les remboursements, les echeances et tes objectifs.',
  },
];

const HelpScreen = () => {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.page, { backgroundColor: palette.background }]}>
      <View style={[styles.hero, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <View style={[styles.badge, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}>
          <Text style={[styles.badgeText, { color: palette.primary }]}>AIDE</Text>
        </View>
        <Text style={[styles.title, { color: palette.text }]}>Bien demarrer dans l'application</Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          Voici les reperes utiles pour te retrouver rapidement dans la V1.
        </Text>
      </View>

      <View style={styles.grid}>
        {sections.map((section) => (
          <View
            key={section.title}
            style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}
          >
            <Text style={[styles.cardTitle, { color: palette.text }]}>{section.title}</Text>
            <Text style={[styles.cardText, { color: palette.textSecondary }]}>{section.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 16,
    gap: 14,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Georgia',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  grid: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardText: {
    fontSize: 14,
    lineHeight: 21,
  },
});

export default HelpScreen;
