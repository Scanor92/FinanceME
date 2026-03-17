import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORY_STORAGE_KEY = 'finaceme_custom_categories';
const CategoryContext = createContext(null);

const normalizeCategoryName = (value) => value.trim().replace(/\s+/g, ' ');

export const CategoryProvider = ({ children }) => {
  const [customCategories, setCustomCategories] = useState([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const raw = await AsyncStorage.getItem(CATEGORY_STORAGE_KEY);
        if (!raw) {
          return;
        }

        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCustomCategories(parsed.filter((item) => typeof item === 'string' && item.trim()));
        }
      } finally {
        setIsReady(true);
      }
    };

    restore();
  }, []);

  const persist = async (nextCategories) => {
    setCustomCategories(nextCategories);
    await AsyncStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(nextCategories));
  };

  const addCategory = async (value) => {
    const normalized = normalizeCategoryName(value || '');
    if (!normalized) {
      return null;
    }

    const exists = customCategories.find((item) => item.toLowerCase() === normalized.toLowerCase());
    if (exists) {
      return exists;
    }

    const nextCategories = [...customCategories, normalized];
    await persist(nextCategories);
    return normalized;
  };

  const value = useMemo(
    () => ({
      customCategories,
      isReady,
      addCategory,
    }),
    [customCategories, isReady]
  );

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
};

export const useCategoryStore = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategoryStore must be used within CategoryProvider');
  }
  return context;
};
