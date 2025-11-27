import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

export type DisplayProps = {
  smallText?: string;
  largeText: string;
};

// PUBLIC_INTERFACE
export const Display: React.FC<DisplayProps> = ({ smallText, largeText }) => {
  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel={`Expression ${smallText || ''} result ${largeText}`}
    >
      <Text
        style={styles.small}
        numberOfLines={1}
        ellipsizeMode="head"
        accessibilityLabel={smallText ? `Expression ${smallText}` : 'No expression'}
      >
        {smallText || ' '}
      </Text>
      <Text
        style={styles.large}
        numberOfLines={1}
        ellipsizeMode="head"
        accessibilityLabel={`Current value ${largeText}`}
      >
        {largeText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  small: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
  large: {
    color: colors.text,
    fontSize: typography.display,
    fontWeight: '700',
  },
});

export default Display;
