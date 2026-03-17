import React, { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

const ResourceListScreen = ({
  pageTitle,
  pageSubtitle,
  accent,
  items,
  isRefreshing,
  onRefresh,
  emptyText,
  statLabel,
  statValue,
  renderItemCard,
}) => {
  const { palette: theme } = useAppTheme();
  const ui = useMemo(
    () => ({
      page: theme.background,
      panel: theme.surface,
      panelBorder: theme.border,
      title: theme.text,
      subtitle: theme.textSecondary,
      statBg: accent + '22',
      statBorder: accent + '66',
      statText: theme.textSecondary,
      statValue: theme.text,
      empty: theme.textMuted,
    }),
    [accent, theme]
  );

  return (
    <View style={[styles.page, { backgroundColor: ui.page }]}>
      <View style={[styles.shape, { backgroundColor: accent }]} />

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={[styles.hero, { backgroundColor: ui.panel, borderColor: ui.panelBorder }]}>
              <Text style={[styles.heroTitle, { color: ui.title }]}>{pageTitle}</Text>
              <Text style={[styles.heroSubtitle, { color: ui.subtitle }]}>{pageSubtitle}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: ui.statBg, borderColor: ui.statBorder }]}>
              <Text style={[styles.statLabel, { color: ui.statText }]}>{statLabel}</Text>
              <Text style={[styles.statValue, { color: ui.statValue }]}>{statValue}</Text>
            </View>

            <Text style={[styles.sectionTitle, { color: ui.statText }]}>List</Text>
          </>
        }
        ListEmptyComponent={<Text style={[styles.empty, { color: ui.empty }]}>{emptyText}</Text>}
        renderItem={renderItemCard}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  shape: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 170,
    height: 170,
    borderRadius: 85,
    opacity: 0.26,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 26,
    gap: 10,
  },
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: 'Georgia',
    fontWeight: '700',
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  statCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 4,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  empty: {
    textAlign: 'center',
    marginTop: 18,
  },
});

export default ResourceListScreen;
