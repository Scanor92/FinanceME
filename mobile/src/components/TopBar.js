import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';

const TopBar = ({ title, navigation }) => {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();
  const canOpenDrawer = typeof navigation?.getParent === 'function' || typeof navigation?.openDrawer === 'function';

  const handleOpenDrawer = () => {
    if (typeof navigation?.openDrawer === 'function') {
      navigation.openDrawer();
      return;
    }
    navigation?.getParent?.()?.openDrawer?.();
  };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top, backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
      <View style={styles.bar}>
        {canOpenDrawer ? (
          <Pressable style={styles.menuButton} onPress={handleOpenDrawer}>
            <Ionicons name="menu" size={24} color={palette.text} />
          </Pressable>
        ) : null}
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
  },
  bar: {
    height: 56,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  menuButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
});

export default TopBar;
