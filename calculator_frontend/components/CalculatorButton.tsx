import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radii, shadows, typography } from '../theme';

type Variant = 'number' | 'operator' | 'action' | 'equals';

export type CalculatorButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  span?: 1 | 2;
  accessibilityLabel?: string;
};

// PUBLIC_INTERFACE
export const CalculatorButton: React.FC<CalculatorButtonProps> = ({
  label,
  onPress,
  variant = 'number',
  span = 1,
  accessibilityLabel,
}) => {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={({ pressed }) => [
        styles.base,
        span === 2 ? styles.span2 : undefined,
        variantStyles[variant],
        pressed ? styles.pressed : undefined,
      ]}
    >
      <Text style={[styles.text, textVariant[variant]]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {label}
      </Text>
    </Pressable>
  );
};

const cell: ViewStyle = {
  width: '23%', // leaves gap for 4 per row with spacing
  minWidth: 64,
  aspectRatio: 1.15,
  justifyContent: 'center',
  alignItems: 'center',
};

const styles = StyleSheet.create({
  base: {
    ...cell,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.card,
  },
  span2: {
    width: '48%',
    minWidth: 140,
    aspectRatio: 2.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    fontSize: typography.title,
    fontWeight: '600',
    color: colors.text,
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  number: {
    backgroundColor: colors.surface,
  },
  operator: {
    backgroundColor: '#E8F0FE',
    borderWidth: 1,
    borderColor: '#C7DBFF',
  },
  action: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  equals: {
    backgroundColor: colors.secondary,
  },
};

type TextStyleMap = {
  [K in Variant]: { color: string; fontWeight?: '800' | '600' | '700' | '400' };
};

const textVariant: TextStyleMap = {
  number: { color: colors.text },
  operator: { color: colors.primary },
  action: { color: '#92400E' },
  equals: { color: '#1F2937', fontWeight: '800' },
};

export default CalculatorButton;
