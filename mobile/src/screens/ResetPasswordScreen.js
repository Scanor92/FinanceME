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

import { authApi } from '../api/client';
import { useAppTheme } from '../context/ThemeContext';

const ResetPasswordScreen = ({ navigation }) => {
  const { palette } = useAppTheme();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRequestedToken, setHasRequestedToken] = useState(false);

  const requestResetToken = async () => {
    if (!email.trim()) {
      Alert.alert('Validation', 'Email requis.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authApi.requestPasswordReset({
        email: email.trim(),
      });
      const debugToken = response?.data?.resetToken;
      setHasRequestedToken(true);
      if (debugToken) {
        setToken(debugToken);
        Alert.alert('Token genere', `Token de test: ${debugToken}`);
      } else {
        Alert.alert('Information', 'Si le compte existe, un token de reinitialisation a ete genere.');
      }
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Demande impossible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async () => {
    if (!token.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Validation', 'Token et nouveau mot de passe sont requis.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Validation', 'Le mot de passe doit contenir au moins 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation', 'Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      setIsSubmitting(true);
      await authApi.resetPassword({
        token: token.trim(),
        newPassword,
      });
      Alert.alert('Succes', 'Mot de passe reinitialise. Connecte-toi avec le nouveau mot de passe.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      Alert.alert('Erreur', error?.response?.data?.message || 'Reinitialisation impossible.');
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
            <Text style={[styles.badgeText, { color: palette.primary }]}>SECURITE</Text>
          </View>
          <Text style={[styles.title, { color: palette.text }]}>Recupere l acces a ton espace</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            Demande un token temporaire, puis definis un nouveau mot de passe.
          </Text>
        </View>

        <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Reinitialisation</Text>

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
          <Pressable style={[styles.secondaryBtn, { borderColor: palette.primary }]} onPress={requestResetToken} disabled={isSubmitting}>
            <Text style={[styles.secondaryBtnText, { color: palette.primary }]}>
              {isSubmitting ? 'Envoi...' : 'Demander un token'}
            </Text>
          </Pressable>
          <TextInput
            autoCapitalize="none"
            placeholder="Token de reinitialisation"
            placeholderTextColor={palette.placeholder}
            style={[
              styles.input,
              { borderColor: palette.inputBorder, color: palette.inputText, backgroundColor: palette.inputBg },
            ]}
            value={token}
            onChangeText={setToken}
          />
          <TextInput
            secureTextEntry
            placeholder="Nouveau mot de passe"
            placeholderTextColor={palette.placeholder}
            style={[
              styles.input,
              { borderColor: palette.inputBorder, color: palette.inputText, backgroundColor: palette.inputBg },
            ]}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            secureTextEntry
            placeholder="Confirmer le mot de passe"
            placeholderTextColor={palette.placeholder}
            style={[
              styles.input,
              { borderColor: palette.inputBorder, color: palette.inputText, backgroundColor: palette.inputBg },
            ]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Pressable
            style={[styles.primaryBtn, { backgroundColor: palette.primary }, !hasRequestedToken && styles.disabledBtn]}
            onPress={onSubmit}
            disabled={isSubmitting || !hasRequestedToken}
          >
            <Text style={[styles.primaryBtnText, { color: palette.onPrimary }]}>
              {isSubmitting ? 'Envoi...' : 'Reinitialiser'}
            </Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.linkSecondary, { color: palette.textSecondary }]}>Retour a la connexion</Text>
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
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontWeight: '700',
  },
  secondaryBtnText: {
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  linkSecondary: {
    marginTop: 6,
    textAlign: 'center',
  },
});

export default ResetPasswordScreen;
