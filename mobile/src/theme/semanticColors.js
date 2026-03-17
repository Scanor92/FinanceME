// Semantic tints — derived from the 3 core accents:
//   primary (sky-blue) · success (emerald) · danger (coral-red)
// All tints are harmonised with the new ThemeContext palette.

export const getSemanticColors = (isLight) => {
  const primary = isLight ? '#1B68E3' : '#5BAEFF';
  const success = isLight ? '#16A34A' : '#4ADE80';
  const danger  = isLight ? '#DC2626' : '#F87171';

  return {
    // ── Core accents ──────────────────────────────────────────────
    primary,
    success,
    danger,
    info: primary,

    // ── Category aliases (all primary or success) ─────────────────
    investment:   primary,
    budget:       primary,
    account:      primary,
    savings:      success,
    transactions: primary,

    // ── Income / Expense tinted surfaces ──────────────────────────
    incomeBg:      isLight ? '#ECFBF0' : '#0F2820',
    incomeBorder:  isLight ? '#7FCCA0' : '#1E5A3A',
    expenseBg:     isLight ? '#FEF2F2' : '#2A1318',
    expenseBorder: isLight ? '#F0A8A8' : '#6B2530',

    // ── Soft primary tint (chips, filters, icon bubbles) ──────────
    softBlueBg:     isLight ? '#E5F0FF' : '#162238',
    softBlueBorder: isLight ? '#A8C4F0' : '#2A4870',
    chipBg:         isLight ? '#E5F0FF' : '#162238',
    chipBorder:     isLight ? '#A8C4F0' : '#2A4870',

    // ── Segment / tab controls ────────────────────────────────────
    segmentBg:       isLight ? '#EEF4FF' : '#111D30',
    segmentActiveBg: isLight ? '#DAE8FF' : '#1C3258',

    // ── Edit / Delete action tints ────────────────────────────────
    editBg:     isLight ? '#E5F0FF' : '#162238',
    editBorder: isLight ? '#8AAEDF' : '#2D5080',
    deleteBg:     isLight ? '#FEF2F2' : '#2A1318',
    deleteBorder: isLight ? '#E8A8A8' : '#8A2D3A',

    // ── Decorative accent (single, primary-blue) ──────────────────
    decorPrimary: isLight ? '#C0D8F8' : '#162645',

    // ── Icon bubble ───────────────────────────────────────────────
    iconBubbleBg:     isLight ? '#E5F0FF' : '#1A2E4F',
    iconBubbleBorder: isLight ? '#A8C4F0' : '#2A4870',

    // ── Positive / Negative badges ────────────────────────────────
    positiveBadgeBg:     isLight ? '#ECFBF0' : '#0F2820',
    positiveBadgeBorder: isLight ? '#7FCCA0' : '#236B3E',
    negativeBadgeBg:     isLight ? '#FEF2F2' : '#2A1318',
    negativeBadgeBorder: isLight ? '#E09090' : '#882A3A',
    badgeText: isLight ? '#1A3050' : '#EEF4FF',
  };
};
