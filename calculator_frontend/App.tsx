import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Pressable,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { colors, spacing, radii, shadows } from './theme';
import { Display } from './components/Display';
import { CalculatorButton } from './components/CalculatorButton';
import { evaluate } from './utils/evaluate';
import { healthcheck } from './utils/healthcheck';

type Operator = '+' | '-' | '×' | '÷';

const MAX_LENGTH = 12;

export default function App() {
  const [currentValue, setCurrentValue] = useState<string>('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [justEvaluated, setJustEvaluated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debugOverlay, setDebugOverlay] = useState<boolean>(false);

  // Optional environment-based behaviors
  useEffect(() => {
    healthcheck();
    const logLevel = process.env.EXPO_PUBLIC_LOG_LEVEL;
    if (process.env.EXPO_PUBLIC_EXPERIMENTS_ENABLED === 'true' || process.env.EXPO_PUBLIC_FEATURE_FLAGS?.includes('debug')) {
      setDebugOverlay(true);
    }
    if (logLevel === 'verbose') {
      // Announce ready for accessibility
      AccessibilityInfo.announceForAccessibility?.('Calculator ready');
    }
  }, []);

  const verboseLog = useCallback((msg: string, payload?: unknown) => {
    if (process.env.EXPO_PUBLIC_LOG_LEVEL === 'verbose') {
      // eslint-disable-next-line no-console
      console.debug(`[calc] ${msg}`, payload ?? '');
    }
  }, []);

  const handleClearEntry = useCallback(() => {
    verboseLog('clear-entry');
    setCurrentValue('0');
    setJustEvaluated(false);
    setError(null);
  }, [verboseLog]);

  const handleAllClear = useCallback(() => {
    verboseLog('all-clear');
    setCurrentValue('0');
    setPreviousValue(null);
    setOperator(null);
    setJustEvaluated(false);
    setError(null);
  }, [verboseLog]);

  const handleDigit = useCallback(
    (d: string) => {
      if (error) {
        // Clear error on next input
        handleAllClear();
      }
      if (justEvaluated) {
        // Start fresh after equals
        setCurrentValue(d);
        setJustEvaluated(false);
        return;
      }
      setCurrentValue((prev) => {
        if (prev.length >= MAX_LENGTH) return prev;
        if (prev === '0') return d; // replace leading zero
        return prev + d;
      });
    },
    [error, handleAllClear, justEvaluated]
  );

  const handleDecimal = useCallback(() => {
    if (error) {
      handleAllClear();
    }
    setCurrentValue((prev) => {
      if (prev.includes('.')) return prev;
      if (prev.length >= MAX_LENGTH) return prev;
      return prev + '.';
    });
    setJustEvaluated(false);
  }, [error, handleAllClear]);

  const handleToggleSign = useCallback(() => {
    if (error) {
      handleAllClear();
    }
    setCurrentValue((prev) => {
      if (prev === '0') return prev;
      return prev.startsWith('-') ? prev.slice(1) : `-${prev}`;
    });
    setJustEvaluated(false);
  }, [error, handleAllClear]);

  const handlePercent = useCallback(() => {
    if (error) {
      handleAllClear();
    }
    try {
      const result = evaluate(currentValue, null, null);
      const val = Number(result) / 100;
      const normalized = evaluate(String(val), null, null);
      setCurrentValue(normalized);
      setJustEvaluated(false);
      verboseLog('percent', { currentValue, normalized });
    } catch (e) {
      setError('Error');
      verboseLog('percent-error', e);
    }
  }, [currentValue, error, handleAllClear, verboseLog]);

  const commitPendingOpIfNeeded = useCallback(
    (nextOperator: Operator) => {
      if (previousValue !== null && operator !== null && !justEvaluated) {
        // Chain: evaluate previous op with current value
        try {
          const result = evaluate(previousValue, currentValue, operator);
          setPreviousValue(result);
          setCurrentValue('0');
          setOperator(nextOperator);
          verboseLog('chained-evaluate', { previousValue, operator, currentValue, result });
        } catch (e) {
          setError('Error');
          verboseLog('chained-evaluate-error', e);
        }
        return;
      }
      // Set previous and operator
      setPreviousValue(currentValue);
      setCurrentValue('0');
      setOperator(nextOperator);
      setJustEvaluated(false);
      verboseLog('operator-set', { nextOperator, previousValue: currentValue });
    },
    [currentValue, operator, previousValue, justEvaluated, verboseLog]
  );

  const handleOperator = useCallback(
    (op: Operator) => {
      if (error) {
        handleAllClear();
        return;
      }
      // If just evaluated, move currentValue to previous and set operator
      if (justEvaluated) {
        setPreviousValue(currentValue);
        setCurrentValue('0');
        setOperator(op);
        setJustEvaluated(false);
        verboseLog('operator-after-equals', { op, prev: currentValue });
        return;
      }
      commitPendingOpIfNeeded(op);
    },
    [commitPendingOpIfNeeded, currentValue, error, handleAllClear, justEvaluated, verboseLog]
  );

  const handleEquals = useCallback(() => {
    if (error) {
      handleAllClear();
      return;
    }
    if (previousValue === null || operator === null) {
      // nothing to compute
      return;
    }
    try {
      const result = evaluate(previousValue, currentValue, operator);
      setCurrentValue(result);
      setPreviousValue(null);
      setOperator(null);
      setJustEvaluated(true);
      verboseLog('equals', { previousValue, operator, currentValue, result });
    } catch (e) {
      setError('Error');
      verboseLog('equals-error', e);
    }
  }, [currentValue, error, handleAllClear, operator, previousValue, verboseLog]);

  const handleBackspace = useCallback(() => {
    if (error) {
      handleAllClear();
      return;
    }
    if (justEvaluated) {
      // After evaluation, backspace behaves like clear entry
      handleClearEntry();
      return;
    }
    setCurrentValue((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  }, [error, handleAllClear, handleClearEntry, justEvaluated]);

  const handleZero = useCallback(() => {
    if (error) {
      handleAllClear();
      return;
    }
    setCurrentValue((prev) => {
      if (prev.length >= MAX_LENGTH) return prev;
      if (prev === '0') return prev;
      return prev + '0';
    });
    setJustEvaluated(false);
  }, [error, handleAllClear]);

  const smallExpressionText = useMemo(() => {
    if (error) return 'Error';
    if (previousValue !== null && operator !== null) {
      return `${previousValue} ${operator}`;
    }
    return '';
  }, [error, operator, previousValue]);

  return (
    <SafeAreaView style={styles.safe}>

      <StatusBar style="light" backgroundColor={colors.primary} />

      {/* Top display card */}
      <View style={styles.topContainer}>
        <View style={styles.displayCard} accessible accessibilityRole="summary" accessibilityLabel={`Display ${smallExpressionText ? `${smallExpressionText} ` : ''}${currentValue}`}>
          <Display smallText={smallExpressionText} largeText={error ? 'Error' : currentValue} />
        </View>
      </View>

      {/* Operator row */}
      <View style={styles.operatorRow}>
        {(['÷', '×', '-', '+'] as Operator[]).map((op) => (
          <CalculatorButton
            key={op}
            label={op}
            variant="operator"
            onPress={() => handleOperator(op)}
            accessibilityLabel={`Operator ${op}`}
          />
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {/* Row 1 */}
        <CalculatorButton label="AC" variant="action" onPress={handleAllClear} accessibilityLabel="All Clear" />
        <CalculatorButton label="C" variant="action" onPress={handleClearEntry} accessibilityLabel="Clear Entry" />
        <CalculatorButton label="±" variant="action" onPress={handleToggleSign} accessibilityLabel="Toggle Sign" />
        <CalculatorButton label="⌫" variant="action" onPress={handleBackspace} accessibilityLabel="Backspace" />

        {/* Row 2 */}
        <CalculatorButton label="%" variant="action" onPress={handlePercent} accessibilityLabel="Percent" />
        <CalculatorButton label="8" onPress={() => handleDigit('8')} accessibilityLabel="Eight" />
        <CalculatorButton label="9" onPress={() => handleDigit('9')} accessibilityLabel="Nine" />
        <CalculatorButton label="×" variant="operator" onPress={() => handleOperator('×')} accessibilityLabel="Multiply" />

        {/* Row 3 */}
        <CalculatorButton label="4" onPress={() => handleDigit('4')} accessibilityLabel="Four" />
        <CalculatorButton label="5" onPress={() => handleDigit('5')} accessibilityLabel="Five" />
        <CalculatorButton label="6" onPress={() => handleDigit('6')} accessibilityLabel="Six" />
        <CalculatorButton label="-" variant="operator" onPress={() => handleOperator('-')} accessibilityLabel="Subtract" />

        {/* Row 4 */}
        <CalculatorButton label="1" onPress={() => handleDigit('1')} accessibilityLabel="One" />
        <CalculatorButton label="2" onPress={() => handleDigit('2')} accessibilityLabel="Two" />
        <CalculatorButton label="3" onPress={() => handleDigit('3')} accessibilityLabel="Three" />
        <CalculatorButton label="+" variant="operator" onPress={() => handleOperator('+')} accessibilityLabel="Add" />

        {/* Row 5 */}
        <CalculatorButton label="0" span={2} onPress={handleZero} accessibilityLabel="Zero" />
        <CalculatorButton label="." onPress={handleDecimal} accessibilityLabel="Decimal Point" />
        <CalculatorButton label="=" variant="equals" onPress={handleEquals} accessibilityLabel="Equals" />
      </View>

      {/* Optional debug overlay */}
      {debugOverlay ? (
        <Pressable
          accessible
          accessibilityLabel="Debug overlay"
          style={styles.debugOverlay}
          onLongPress={() => setDebugOverlay(false)}
        >
          <View style={styles.debugPill} />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  displayCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
    minHeight: 120,
    justifyContent: 'center',
  },
  operatorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'space-between',
  },
  grid: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.select({ web: spacing.lg, default: spacing.xl }),
    paddingTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    alignContent: 'stretch',
  },
  debugOverlay: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 24,
    height: 24,
    opacity: 0.3,
  },
  debugPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
});
