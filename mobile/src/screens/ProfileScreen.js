
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { palette } = useAppTheme();

  const initials = (user?.name || 'Utilisateur')
    .trim()
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.page, { backgroundColor: palette.background }]}>
      <View style={[styles.shapeA, { backgroundColor: palette.primary }]} />
      <View style={[styles.shapeB, { backgroundColor: palette.surfaceAlt }]} />

      <View style={[styles.hero, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <View style={[styles.badge, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}>
          <Text style={[styles.badgeText, { color: palette.primary }]}>PROFIL</Text>
        </View>
        <View style={styles.heroRow}>
          <View style={[styles.avatar, { backgroundColor: palette.primary }]}>
            <Text style={[styles.avatarText, { color: palette.onPrimary }]}>{initials}</Text>
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={[styles.name, { color: palette.text }]}>{user?.name || 'Utilisateur'}</Text>
            <Text style={[styles.email, { color: palette.textSecondary }]}>{user?.email || '-'}</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          Cet espace centralise ton identite et l'acces rapide a ta session FinanceME.
        </Text>
      </View>

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Compte actif</Text>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>Nom</Text>
          <Text style={[styles.infoValue, { color: palette.text }]}>{user?.name || 'Utilisateur'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>Email</Text>
          <Text style={[styles.infoValue, { color: palette.text }]}>{user?.email || '-'}</Text>
        </View>
      </View>

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Actions</Text>
        <Text style={[styles.cardText, { color: palette.textSecondary }]}>
          Tu peux changer le theme depuis le menu lateral. La deconnexion reste disponible ici aussi pour un acces rapide.
        </Text>
        <Pressable style={[styles.primaryButton, { backgroundColor: palette.primary }]} onPress={logout}>
          <Text style={[styles.primaryButtonText, { color: palette.onPrimary }]}>Se deconnecter</Text>
        </Pressable>
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
    top: -40,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.12,
  },
  shapeB: {
    position: 'absolute',
    bottom: 60,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.22,
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
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
  },
  heroTextWrap: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Georgia',
    fontWeight: '700',
  },
  email: {
    marginTop: 4,
    fontSize: 14,
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
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
  },
  cardText: {
    fontSize: 14,
    lineHeight: 21,
  },
  primaryButton: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontWeight: '700',
  },
});

export default ProfileScreen;
