import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'finaceme_theme_mode';

// ─── DARK ─────────────────────────────────────────────────────────────────────
// Deep charcoal-navy: premium without being pitch-black.
// Primary: vivid sky-blue  · Success: emerald  · Danger: coral-red
const darkPalette = {
  mode:          'dark',
  background:    '#0C1120',  // deep navy canvas
  surface:       '#141E32',  // card surface (clearly above bg)
  surfaceAlt:    '#1B2640',  // elevated rows / list items
  border:        '#2B3D5C',  // refined, visible border
  text:          '#EEF4FF',  // warm near-white — no eye-strain
  textSecondary: '#94A8C4',  // readable muted blue-grey
  textMuted:     '#5E7494',  // subtle hints
  primary:       '#5BAEFF',  // sky-blue — confident & trustworthy
  primarySoft:   '#1C3560',  // primary tint background
  onPrimary:     '#020C1B',  // dark text on primary button
  inputBg:       '#101929',  // slightly lifted input bg
  inputBorder:   '#2D4268',
  inputText:     '#EEF4FF',
  placeholder:   '#5E7494',
  success:       '#4ADE80',  // vibrant emerald — readable on dark
  danger:        '#F87171',  // clear coral-red — visible without panic
};

// ─── LIGHT ────────────────────────────────────────────────────────────────────
// Very subtle blue-white canvas — clean, airy, trustworthy.
// Primary: strong professional blue  · Success: solid green  · Danger: solid red
const lightPalette = {
  mode:          'light',
  background:    '#F5F8FF',  // barely-blue off-white — softer than pure white
  surface:       '#FFFFFF',
  surfaceAlt:    '#ECF2FF',  // soft lavender-blue cards
  border:        '#D0DCF0',  // clear but not heavy
  text:          '#0F1D35',  // deep navy — high contrast
  textSecondary: '#445D80',  // readable secondary
  textMuted:     '#7190B0',  // light hints
  primary:       '#1B68E3',  // strong, professional blue
  primarySoft:   '#DCE8FF',  // tinted primary bg
  onPrimary:     '#FFFFFF',
  inputBg:       '#FFFFFF',
  inputBorder:   '#BFCFE8',
  inputText:     '#0F1D35',
  placeholder:   '#7A8FA8',
  success:       '#16A34A',  // solid, readable green
  danger:        '#DC2626',  // solid, readable red
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('dark');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_KEY);
        if (savedMode === 'light' || savedMode === 'dark') {
          setMode(savedMode);
        }
      } finally {
        setIsReady(true);
      }
    };
    restore();
  }, []);

  const setTheme = async (nextMode) => {
    if (nextMode !== 'light' && nextMode !== 'dark') return;
    setMode(nextMode);
    await AsyncStorage.setItem(THEME_KEY, nextMode);
  };

  const toggleTheme = async () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    await setTheme(next);
  };

  const palette = mode === 'dark' ? darkPalette : lightPalette;

  const value = useMemo(
    () => ({ mode, isLight: mode === 'light', isReady, palette, setTheme, toggleTheme }),
    [mode, isReady, palette]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within ThemeProvider');
  return context;
};
