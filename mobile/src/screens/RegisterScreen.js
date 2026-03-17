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

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const { palette } = useAppTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Validation', 'Nom, email et mot de passe sont requis.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register(name.trim(), email.trim(), password);
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Inscription impossible.');
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
            <Text style={[styles.badgeText, { color: palette.primary }]}>NOUVEAU COMPTE</Text>
          </View>
          <Text style={[styles.title, { color: palette.text }]}>Construis ta vue complete sur tes finances</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            Cree ton espace pour suivre ton budget, tes investissements et tes activites reelles.
          </Text>
        </View>

        <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Inscription</Text>

          <TextInput
            placeholder="Nom complet"
            placeholderTextColor={palette.placeholder}
            style={[
              styles.input,
              { borderColor: palette.inputBorder, color: palette.inputText, backgroundColor: palette.inputBg },
            ]}
            value={name}
            onChangeText={setName}
          />
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
              {isSubmitting ? 'Creation...' : 'Creer mon compte'}
            </Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.linkSecondary, { color: palette.textSecondary }]}>J ai deja un compte</Text>
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
  linkSecondary: {
    marginTop: 6,
    textAlign: 'center',
  },
});

export default RegisterScreen;
