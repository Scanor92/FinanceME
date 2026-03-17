import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { palette } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation', 'Email et mot de passe sont requis.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email.trim(), password);
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Connexion impossible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.page, { backgroundColor: palette.background }]}
    >
      <View style={[styles.shapeA, { backgroundColor: palette.primary }]} />
      <View style={[styles.shapeB, { backgroundColor: palette.surfaceAlt }]} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <View style={[styles.badge, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}>
            <Text style={[styles.badgeText, { color: palette.primary }]}>FINANCEME</Text>
          </View>
          <Text style={[styles.title, { color: palette.text }]}>Ton argent merite une vue claire</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            Budget, terrain, commerce, dettes: reconnecte-toi et reprends le controle.
          </Text>

          <View style={styles.featureRow}>
            <View style={[styles.featureChip, { borderColor: palette.border, backgroundColor: palette.surfaceAlt }]}>
              <Text style={[styles.featureChipText, { color: palette.text }]}>Budget</Text>
            </View>
            <View style={[styles.featureChip, { borderColor: palette.border, backgroundColor: palette.surfaceAlt }]}>
              <Text style={[styles.featureChipText, { color: palette.text }]}>Investissements</Text>
            </View>
            <View style={[styles.featureChip, { borderColor: palette.border, backgroundColor: palette.surfaceAlt }]}>
              <Text style={[styles.featureChipText, { color: palette.text }]}>Suivi reel</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Connexion</Text>

          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor={palette.placeholder}
            style={[
              styles.input,
              { borderColor: palette.inputBorder, color: palette.inputText, backgroundColor: palette.inputBg },
            ]}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            secureTextEntry
            placeholder="Mot de passe"
            placeholderTextColor={palette.placeholder}
            style={[
              styles.input,
              { borderColor: palette.inputBorder, color: palette.inputText, backgroundColor: palette.inputBg },
            ]}
            value={password}
            onChangeText={setPassword}
          />

          <Pressable style={[styles.primaryBtn, { backgroundColor: palette.primary }]} onPress={onSubmit} disabled={isSubmitting}>
            <Text style={[styles.primaryBtnText, { color: palette.onPrimary }]}>
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('ResetPassword')}>
            <Text style={[styles.link, { color: palette.primary }]}>Mot de passe oublie ?</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.linkSecondary, { color: palette.textSecondary }]}>Pas encore de compte ? Creer un compte</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 54,
    paddingBottom: 28,
    gap: 16,
  },
  shapeA: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.14,
  },
  shapeB: {
    position: 'absolute',
    top: 120,
    left: -70,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.35,
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
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 10,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Georgia',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  featureChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  primaryBtn: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontWeight: '700',
  },
  link: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '700',
  },
  linkSecondary: {
    marginTop: 4,
    textAlign: 'center',
  },
});

export default LoginScreen;
