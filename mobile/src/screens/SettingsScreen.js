
import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';

import { useAppTheme } from '../context/ThemeContext';

const SettingsScreen = () => {
  const { palette, isLight } = useAppTheme();
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'http://10.0.2.2:5000/api';

  return (
    <View style={[styles.page, { backgroundColor: palette.background }]}>
      <View style={[styles.shapeA, { backgroundColor: palette.primary }]} />

      <View style={[styles.hero, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <View style={[styles.badge, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}>
          <Text style={[styles.badgeText, { color: palette.primary }]}>PARAMETRES</Text>
        </View>
        <Text style={[styles.title, { color: palette.text }]}>Reglages de l'application</Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          Verifie ici les informations de base de ton application avant une mise en service ou une demonstration.
        </Text>
      </View>

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Configuration actuelle</Text>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>Theme</Text>
          <Text style={[styles.infoValue, { color: palette.text }]}>{isLight ? 'Clair' : 'Sombre'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>Version</Text>
          <Text style={[styles.infoValue, { color: palette.text }]}>{appVersion}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>API mobile</Text>
          <Text style={[styles.apiValue, { color: palette.text }]}>{apiBaseUrl}</Text>
        </View>
      </View>

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Rappel utile</Text>
        <Text style={[styles.cardText, { color: palette.textSecondary }]}>
          Le changement de theme se fait depuis le menu lateral. Pour utiliser l'app sur un autre appareil, adapte l'URL API dans le fichier `mobile/app.json`.
        </Text>
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
  shapeA: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    opacity: 0.12,
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
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoBlock: {
    gap: 6,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  apiValue: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  cardText: {
    fontSize: 14,
    lineHeight: 21,
  },
});

export default SettingsScreen;
