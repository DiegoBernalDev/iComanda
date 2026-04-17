import { View, TextInput, Text, Pressable, StyleSheet, TextInputProps } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useMD3Theme } from '@/hooks/use-md3-theme';

type TextFieldVariant = 'filled' | 'outlined';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label:          string;
  variant?:       TextFieldVariant;
  leadingIcon?:   keyof typeof Ionicons.glyphMap;
  trailingIcon?:  keyof typeof Ionicons.glyphMap;
  onTrailingPress?: () => void;
  error?:         string;
  supportingText?: string;
}

export function TextField({
  label, variant = 'outlined', leadingIcon, trailingIcon, onTrailingPress,
  error, supportingText, value, onFocus, onBlur, ...rest
}: TextFieldProps) {
  const { colors, shape } = useMD3Theme();
  const [focused, setFocused] = useState(false);
  const hasValue = !!value;
  const isActive = focused || hasValue;

  const borderColor = error ? colors.error
    : focused ? colors.primary
    : colors.outline;

  const labelColor = error ? colors.error
    : focused ? colors.primary
    : colors.onSurfaceVariant;

  return (
    <View style={styles.wrapper}>
      {variant === 'filled' ? (
        // Filled variant
        <View style={[
          styles.filledContainer,
          { backgroundColor: colors.surfaceVariant, borderRadius: shape.extraSmall,
            borderBottomWidth: focused ? 2 : 1,
            borderBottomColor: borderColor },
        ]}>
          {leadingIcon && (
            <Ionicons name={leadingIcon} size={20} color={colors.onSurfaceVariant} style={styles.leadIcon} />
          )}
          <View style={styles.inputArea}>
            <Text style={[
              styles.floatingLabel,
              { color: labelColor },
              isActive ? styles.floatingLabelSmall : styles.floatingLabelLarge,
            ]}>
              {label}
            </Text>
            <TextInput
              value={value}
              style={[styles.input, { color: colors.onSurface }, isActive && styles.inputActive]}
              placeholderTextColor={colors.onSurfaceVariant}
              onFocus={(e) => { setFocused(true); onFocus?.(e); }}
              onBlur={(e)  => { setFocused(false); onBlur?.(e); }}
              {...rest}
            />
          </View>
          {trailingIcon && (
            <Pressable onPress={onTrailingPress} style={styles.trailIcon}>
              <Ionicons name={trailingIcon} size={20} color={colors.onSurfaceVariant} />
            </Pressable>
          )}
        </View>
      ) : (
        // Outlined variant
        <View style={[
          styles.outlinedContainer,
          { borderRadius: shape.extraSmall, borderWidth: focused ? 2 : 1, borderColor },
        ]}>
          {/* Floating label cutout */}
          <Text style={[
            styles.outlinedLabel,
            { color: labelColor, backgroundColor: colors.surface },
            isActive ? styles.outlinedLabelActive : styles.outlinedLabelInactive,
          ]}>
            {label}
          </Text>
          <View style={styles.outlinedRow}>
            {leadingIcon && (
              <Ionicons name={leadingIcon} size={20} color={colors.onSurfaceVariant} style={styles.leadIcon} />
            )}
            <TextInput
              value={value}
              style={[styles.input, styles.outlinedInput, { color: colors.onSurface }]}
              placeholderTextColor="transparent"
              onFocus={(e) => { setFocused(true); onFocus?.(e); }}
              onBlur={(e)  => { setFocused(false); onBlur?.(e); }}
              {...rest}
            />
            {trailingIcon && (
              <Pressable onPress={onTrailingPress} style={styles.trailIcon}>
                <Ionicons name={trailingIcon} size={20} color={error ? colors.error : colors.onSurfaceVariant} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Supporting / error text */}
      {(error || supportingText) && (
        <Text style={[styles.supporting, { color: error ? colors.error : colors.onSurfaceVariant }]}>
          {error ?? supportingText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },

  // Filled
  filledContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 56 },
  inputArea: { flex: 1, justifyContent: 'center' },
  floatingLabel: { position: 'absolute' },
  floatingLabelLarge: { fontSize: 16, top: 18 },
  floatingLabelSmall: { fontSize: 12, top: 8 },
  input: { fontSize: 16, paddingVertical: 0 },
  inputActive: { marginTop: 16 },

  // Outlined
  outlinedContainer: { position: 'relative', minHeight: 56 },
  outlinedLabel: {
    position: 'absolute', left: 12, paddingHorizontal: 4, zIndex: 1,
    fontSize: 12,
  },
  outlinedLabelActive:   { top: -10 },
  outlinedLabelInactive: { top: 18, fontSize: 16 },
  outlinedRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, flex: 1, minHeight: 56 },
  outlinedInput: { flex: 1, paddingTop: 8 },

  leadIcon:  { marginRight: 12 },
  trailIcon: { marginLeft: 12, padding: 4 },

  supporting: { fontSize: 12, marginTop: 4, marginLeft: 16, letterSpacing: 0.4 },
});
