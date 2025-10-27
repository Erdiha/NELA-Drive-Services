// commonStyles.js
// Reusable style presets - Modern, Professional, Warm
// Includes online/offline state styles

import { StyleSheet } from "react-native";
import theme from "./theme";

export const commonStyles = StyleSheet.create({
  // ===================================
  // CONTAINERS
  // ===================================
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  containerOnline: {
    flex: 1,
    backgroundColor: theme.colors.online.background,
  },

  containerOffline: {
    flex: 1,
    backgroundColor: theme.colors.offline.background,
  },

  screenPadding: {
    padding: theme.spacing.md,
  },

  contentContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },

  // ===================================
  // CARDS
  // ===================================
  card: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.background.border,
    ...theme.shadows.sm,
  },

  cardElevated: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },

  cardHero: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.layout.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
  },

  // Online/Offline Cards
  cardOnline: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: theme.layout.borderWidth.medium,
    borderColor: theme.colors.online.border,
    ...theme.shadows.glow.online,
  },

  cardOffline: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.offline.border,
    ...theme.shadows.sm,
  },

  // ===================================
  // BUTTONS
  // ===================================
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.layout.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  buttonLarge: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.layout.borderRadius.lg,
  },

  buttonSmall: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.sm,
  },

  buttonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.onPrimary,
  },

  buttonTextLarge: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },

  // Button Variants
  buttonPrimary: {
    backgroundColor: theme.colors.primary.main,
  },

  buttonSecondary: {
    backgroundColor: theme.colors.secondary.main,
  },

  buttonSuccess: {
    backgroundColor: theme.colors.status.success,
  },

  buttonDanger: {
    backgroundColor: theme.colors.status.danger,
  },

  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: theme.layout.borderWidth.medium,
    borderColor: theme.colors.primary.main,
  },

  buttonOutlineText: {
    color: theme.colors.primary.main,
  },

  buttonDisabled: {
    opacity: theme.opacity.disabled,
  },

  // ===================================
  // TEXT STYLES
  // ===================================
  h1: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    lineHeight:
      theme.typography.fontSize.xxxl * theme.typography.lineHeight.tight,
  },

  h2: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    lineHeight:
      theme.typography.fontSize.xxl * theme.typography.lineHeight.tight,
  },

  h3: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },

  h4: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },

  bodyLarge: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.text.primary,
    lineHeight:
      theme.typography.fontSize.lg * theme.typography.lineHeight.normal,
  },

  bodyText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.text.primary,
    lineHeight:
      theme.typography.fontSize.md * theme.typography.lineHeight.normal,
  },

  bodyTextSecondary: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.text.secondary,
    lineHeight:
      theme.typography.fontSize.md * theme.typography.lineHeight.normal,
  },

  bodySmall: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.text.secondary,
  },

  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  caption: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.text.tertiary,
  },

  // Gradient Text (requires MaskedView or TextGradient component)
  gradientText: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.extrabold,
  },

  // ===================================
  // STATUS BADGES
  // ===================================
  badge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.layout.borderRadius.full,
    alignSelf: "flex-start",
  },

  badgeSmall: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.layout.borderRadius.full,
  },

  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.onPrimary,
  },

  badgePrimary: {
    backgroundColor: theme.colors.primary.main,
  },

  badgeSuccess: {
    backgroundColor: theme.colors.status.success,
  },

  badgeWarning: {
    backgroundColor: theme.colors.status.warning,
  },

  badgeDanger: {
    backgroundColor: theme.colors.status.danger,
  },

  badgeOnline: {
    backgroundColor: theme.colors.status.online,
  },

  badgeOffline: {
    backgroundColor: theme.colors.status.offline,
  },

  // ===================================
  // LOCATION MARKERS
  // ===================================
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.status.success,
    marginRight: theme.spacing.sm,
  },

  destinationDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: theme.colors.status.danger,
    marginRight: theme.spacing.sm,
  },

  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: theme.colors.neutral[200],
    marginLeft: 4,
    marginVertical: theme.spacing.xs,
  },

  // ===================================
  // DIVIDERS
  // ===================================
  divider: {
    height: 1,
    backgroundColor: theme.colors.background.border,
    marginVertical: theme.spacing.md,
  },

  dividerThick: {
    height: 2,
    backgroundColor: theme.colors.neutral[300],
    marginVertical: theme.spacing.md,
  },

  dividerVertical: {
    width: 1,
    backgroundColor: theme.colors.background.border,
    marginHorizontal: theme.spacing.md,
  },

  // ===================================
  // LAYOUT HELPERS
  // ===================================
  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  column: {
    flexDirection: "column",
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
  },

  flex1: {
    flex: 1,
  },

  // ===================================
  // LOADING/EMPTY STATES
  // ===================================
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },

  emptyStateIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
    opacity: theme.opacity.subtle,
  },

  emptyStateTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },

  emptyStateText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight:
      theme.typography.fontSize.md * theme.typography.lineHeight.relaxed,
  },

  // ===================================
  // STATS & METRICS
  // ===================================
  statCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.layout.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: "center",
    ...theme.shadows.sm,
  },

  statValue: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },

  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: theme.spacing.xs,
  },

  // ===================================
  // AVATAR
  // ===================================
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.main,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  avatarText: {
    color: theme.colors.text.onPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },

  // ===================================
  // INPUT FIELDS
  // ===================================
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.background.border,
    borderRadius: theme.layout.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },

  inputFocused: {
    borderColor: theme.colors.primary.main,
    borderWidth: theme.layout.borderWidth.medium,
  },

  // ===================================
  // ONLINE/OFFLINE TOGGLE BUTTON
  // ===================================
  toggleButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.lg,
  },

  toggleButtonOnline: {
    backgroundColor: theme.colors.background.card,
    borderWidth: 3,
    borderColor: theme.colors.primary.main,
    ...theme.shadows.glow.online,
  },

  toggleButtonOffline: {
    backgroundColor: theme.colors.background.card,
    borderWidth: 2,
    borderColor: theme.colors.neutral[300],
    ...theme.shadows.md,
  },
});

export default commonStyles;
