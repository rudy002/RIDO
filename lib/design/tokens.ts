// Rido — tokens de design V1 (React Native)
// Police : Nunito (expo-google-fonts/nunito ou fichiers .ttf), graisses 600, 700, 800, 900.
// Règles : pas d'ombre, pas de flou, pas de dégradé. Le jaune `primary` = une seule action principale par écran.

export const palette = {
  light: {
    background: '#FBF6EE',
    surface: '#FFFFFF',
    surfaceMuted: '#F1ECE3', // carte « complet » / désactivée
    segment: '#EFE7DA', // fond des onglets segmentés
    text: '#1D2840',
    textMuted: '#5A6378',
    border: '#DCD3C4',
    divider: '#ECE4D8',
    primary: '#FFC94A',
    onPrimary: '#1D2840',
    inverse: '#1D2840', // bouton secondaire plein, onglet actif
    onInverse: '#FBF6EE',
    onInverseMuted: '#C9CEDA', // texte secondaire sur fond inverse (relevé sur la maquette I1)
    accentSoft: '#FFF0C7', // pastille événement, avatars
    onAccentSoft: '#5A4210',
    seatFree: '#D3EFEA', // aussi : fond succès
    seatFreeStroke: '#1E8A7A', // aussi : interrupteur activé
    seatFreeText: '#14665A',
    successText: '#0F4F46',
    seatTaken: '#CBD0D8',
    dangerSoft: '#FCE1DA',
    dangerText: '#7A2412',
    danger: '#D2462A',
  },
  dark: {
    background: '#121826',
    surface: '#1B2334',
    surfaceMuted: '#161D2B',
    segment: '#1B2334',
    text: '#F3EEE4',
    textMuted: '#A7AFC0',
    border: '#34405A',
    divider: '#2A3448',
    primary: '#FFC94A',
    onPrimary: '#1D2840',
    inverse: '#F3EEE4',
    onInverse: '#121826',
    onInverseMuted: '#5A6378', // texte secondaire sur fond inverse (relevé sur la maquette I1)
    accentSoft: '#3A3220',
    onAccentSoft: '#FFD978',
    seatFree: '#123F3A',
    seatFreeStroke: '#5FD0BE',
    seatFreeText: '#5FD0BE',
    successText: '#8FE3D3',
    seatTaken: '#3A4459',
    dangerSoft: '#4A2620',
    dangerText: '#FFB4A3',
    danger: '#FF7A5C',
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type Colors = { [K in keyof typeof palette.light]: string };

export const fonts = {
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

export const typography = {
  display: { fontFamily: fonts.black, fontSize: 40, lineHeight: 42, letterSpacing: -0.5 },
  title: { fontFamily: fonts.black, fontSize: 32, lineHeight: 36, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.black, fontSize: 19, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.extrabold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  label: { fontFamily: fonts.extrabold, fontSize: 15, lineHeight: 20 },
  tag: { fontFamily: fonts.black, fontSize: 13, lineHeight: 16 }, // petites pastilles (rôle, statut)
  caption: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 18 }, // libellés des tuiles compactes
  button: { fontFamily: fonts.black, fontSize: 18, lineHeight: 22 },
  statSmall: { fontFamily: fonts.black, fontSize: 24, lineHeight: 28 }, // tuiles dans une carte (maquette A2)
  stat: { fontFamily: fonts.black, fontSize: 30, lineHeight: 34 }, // tuiles de chiffres compactes (maquette O3)
  counter: { fontFamily: fonts.black, fontSize: 56, lineHeight: 64 }, // compteur de places (maquette C2)
  overline: {
    fontFamily: fonts.black,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 1.1,
    textTransform: 'uppercase' as const,
  },
} as const;

export const radius = { sm: 12, segmentItem: 14, md: 16, lg: 18, xl: 22, pill: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, screen: 20 } as const;

export const sizes = {
  buttonPrimary: 60,
  buttonSecondary: 52,
  input: 56,
  segment: 52,
  touchMin: 48,
  avatar: 48,
  stepperButton: 60, // boutons − / + du compteur de places
  avatarLarge: 76, // en-tête d’une fiche (maquette T)
  avatarProfile: 80, // en-tête du profil (maquette A3)
  progressBar: 10, // barre de remplissage par zone (maquette O3)
  iconCircle: 72, // rond de réussite (maquette O2)
  iconCircleGlyph: 32, // en-tête d'une fiche (maquette T)
  stepBadge: 36, // rond numéroté (« Comment ça marche »)
  icon: 20, // icônes dans le texte (date, lieu)
  iconTile: 52, // pastille d'icône des cartes de choix (maquette I2)
  iconTileGlyph: 26, // icône dans cette pastille
  radio: 28, // rond de sélection des cartes de choix
  radioGlyph: 16, // coche dans le rond
  borderSelected: 3, // contour d'une carte sélectionnée
  countryField: 124, // largeur du champ indicatif (drapeau + « +972 » + chevron)
  seatWidth: 38, // icône de siège (viewBox 0 0 38 40)
  seatHeight: 40,
  seatLargeScale: 1.35,
  seatSmallScale: 0.6, // sièges dans le résumé d'une carte (maquette A1) // sièges de sa propre voiture (maquette C3)
  tabBar: 84,
  tabIcon: 24,
  noteIcon: 22, // icône des encadrés d'aide
  borderStrong: 2, // champs, boutons contour
  borderHairline: 1.5, // séparateurs
} as const;

// Styles de composants prêts à l'emploi (à brancher sur ta lib façon shadcn)
export const components = (c: Colors) => ({
  buttonPrimary: {
    container: {
      height: sizes.buttonPrimary,
      borderRadius: radius.lg,
      backgroundColor: c.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    text: { ...typography.button, color: c.onPrimary },
  },
  buttonInverse: {
    container: {
      height: sizes.buttonSecondary,
      borderRadius: radius.segmentItem,
      backgroundColor: c.inverse,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: { ...typography.label, color: c.onInverse },
  },
  buttonOutline: {
    container: {
      height: sizes.buttonSecondary,
      borderRadius: radius.segmentItem,
      borderWidth: sizes.borderStrong,
      borderColor: c.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: { ...typography.label, color: c.text },
  },
  // Action qu'on ne peut pas annuler (« Ne plus conduire », « Se déconnecter »).
  buttonDanger: {
    container: {
      height: sizes.buttonPrimary,
      borderRadius: radius.lg,
      backgroundColor: c.danger,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: { ...typography.button, color: c.onInverse },
  },
  // Action principale dans une carte (« Contacter »).
  buttonPrimarySmall: {
    container: {
      height: sizes.touchMin,
      borderRadius: radius.md,
      backgroundColor: c.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: { ...typography.label, color: c.onPrimary },
  },
  // Action secondaire dans une ligne (« Relancer »).
  buttonOutlineSmall: {
    container: {
      height: sizes.touchMin,
      borderRadius: radius.sm,
      borderWidth: sizes.borderStrong,
      borderColor: c.inverse,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: { ...typography.label, color: c.text },
  },
  // Deuxième action principale, à hauteur du bouton principal (« Écrire sur WhatsApp »).
  buttonInverseLarge: {
    container: {
      height: sizes.buttonPrimary,
      borderRadius: radius.lg,
      backgroundColor: c.inverse,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: { ...typography.button, color: c.onInverse },
  },
  // Action secondaire pleine largeur en pied d'écran (« J'ai trouvé ma place »).
  buttonOutlineStrong: {
    container: {
      height: sizes.buttonPrimary,
      borderRadius: radius.lg,
      borderWidth: sizes.borderStrong,
      borderColor: c.inverse,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: { ...typography.button, color: c.text },
  },
  input: {
    container: {
      height: sizes.input,
      borderRadius: radius.md,
      borderWidth: sizes.borderStrong,
      borderColor: c.border,
      backgroundColor: c.surface,
      paddingHorizontal: spacing.lg,
    },
    text: { fontFamily: fonts.bold, fontSize: 17, color: c.text },
    label: { ...typography.label, color: c.text, marginBottom: 6 },
  },
  segmented: {
    container: {
      flexDirection: 'row' as const,
      padding: 4,
      gap: 4,
      borderRadius: radius.lg,
      backgroundColor: c.segment,
    },
    item: {
      flex: 1,
      height: sizes.segment,
      borderRadius: radius.segmentItem,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    itemActive: { backgroundColor: c.inverse },
    text: { ...typography.label, color: c.text },
    textActive: { color: c.onInverse },
  },
  card: {
    borderRadius: radius.xl,
    backgroundColor: c.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardMuted: {
    borderRadius: radius.xl,
    backgroundColor: c.surfaceMuted,
    padding: spacing.lg,
    gap: spacing.md,
  },
  radioCard: {
    container: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.lg,
      padding: spacing.lg,
      borderRadius: radius.xl,
      borderWidth: sizes.borderSelected,
      borderColor: 'transparent',
      backgroundColor: c.surface,
    },
    containerSelected: { borderColor: c.inverse },
    iconTile: {
      width: sizes.iconTile,
      height: sizes.iconTile,
      borderRadius: radius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    radio: {
      width: sizes.radio,
      height: sizes.radio,
      borderRadius: radius.pill,
      borderWidth: sizes.borderStrong,
      borderColor: c.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    radioSelected: { borderColor: c.inverse, backgroundColor: c.inverse },
  },
  chip: {
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: sizes.borderStrong,
    borderColor: c.border,
    backgroundColor: c.surface,
    justifyContent: 'center' as const,
  },
  chipSelected: { borderColor: c.inverse, backgroundColor: c.inverse },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill },
  badgeSmall: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  switch: {
    trackOn: c.seatFreeStroke,
    trackOff: c.border,
    thumb: c.surface,
    width: 56,
    height: 34,
    thumbSize: 26,
  },
  seat: {
    free: { fill: c.seatFree, stroke: c.seatFreeStroke, strokeWidth: 2.5 },
    taken: { fill: c.seatTaken, stroke: c.seatTaken, strokeWidth: 2.5 },
    // SVG (react-native-svg), viewBox 0 0 38 40 : dossier + assise
    back: { x: 7, y: 2, width: 24, height: 24, rx: 8 },
    base: { x: 2, y: 24, width: 34, height: 13, rx: 6 },
  },
  stepper: {
    button: {
      width: sizes.stepperButton,
      height: sizes.stepperButton,
      borderRadius: radius.md,
      borderWidth: sizes.borderStrong,
      borderColor: c.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    buttonFilled: { borderColor: c.inverse, backgroundColor: c.inverse },
    // Version compacte, dans un formulaire (« Combien êtes-vous ? »).
    buttonCompact: { width: sizes.touchMin, height: sizes.touchMin, borderRadius: radius.sm },
  },
  // Lien à copier, cadre en pointillés (maquette O2).
  copyField: {
    container: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      paddingStart: spacing.lg,
      paddingEnd: spacing.sm,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: sizes.borderStrong,
      borderStyle: 'dashed' as const,
      borderColor: c.border,
    },
    button: {
      height: sizes.touchMin,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: c.segment,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  },
  // Frise d'un trajet : point de départ, trait, carré d'arrivée (maquette T).
  timeline: {
    start: { width: 16, height: 16, borderRadius: radius.pill, backgroundColor: c.inverse },
    line: { width: 3, backgroundColor: c.border },
    end: {
      width: 18,
      height: 18,
      borderRadius: 5,
      borderWidth: sizes.borderStrong,
      borderColor: c.inverse,
      backgroundColor: c.primary,
    },
    markerColumn: 18,
  },
  tabBar: {
    container: {
      height: sizes.tabBar,
      paddingBottom: 20,
      backgroundColor: c.surface,
      borderTopWidth: sizes.borderHairline,
      borderTopColor: c.divider,
      flexDirection: 'row' as const,
    },
    indicator: { height: 3, backgroundColor: c.text }, // trait en haut de l'onglet actif
    label: { fontFamily: fonts.bold, fontSize: 13, color: c.textMuted },
    labelActive: { fontFamily: fonts.black, color: c.text },
  },
});

export const theme = (scheme: ColorScheme) => {
  const colors = palette[scheme] as Colors;
  return { colors, fonts, typography, radius, spacing, sizes, components: components(colors) };
};
