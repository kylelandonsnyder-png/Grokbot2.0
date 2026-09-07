import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/src/hooks/useTheme';
import { formatMoney, formatSignedMoney } from '@/src/lib/money';
import type { Theme } from '@/src/theme';

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return <View style={[styles.flex, { backgroundColor: theme.bg }, style]}>{children}</View>;
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const body = (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        style,
      ]}>
      {children}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}>
      {body}
    </Pressable>
  );
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  return <Text style={[styles.title, { color: theme.text }, style]}>{children}</Text>;
}

export function Heading({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  return <Text style={[styles.heading, { color: theme.text }, style]}>{children}</Text>;
}

export function Muted({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  return <Text style={[styles.muted, { color: theme.muted }, style]}>{children}</Text>;
}

export function MoneyText({
  value,
  exact = false,
  signed = false,
  size = 28,
  color,
}: {
  value: number;
  exact?: boolean;
  signed?: boolean;
  size?: number;
  color?: string;
}) {
  const theme = useTheme();
  const tone = color ?? (value < 0 ? theme.danger : value > 0 ? theme.accent : theme.text);
  return (
    <Text style={{ color: tone, fontSize: size, fontWeight: '700', letterSpacing: -0.6 }}>
      {signed ? formatSignedMoney(value, exact) : formatMoney(value, exact)}
    </Text>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Text style={[styles.section, { color: theme.muted }]}>{String(children).toUpperCase()}</Text>
  );
}

export function Row({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const content = <View style={[styles.row, style]}>{children}</View>;
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {content}
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.accentSoft : theme.surface,
          borderColor: active ? theme.accent : theme.border,
        },
      ]}>
      <Text style={{ color: active ? theme.accent : theme.muted, fontWeight: '600', fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.track, { backgroundColor: theme.border }]}>
      <View
        style={[
          styles.fill,
          { width: `${clamped * 100}%`, backgroundColor: color ?? theme.accent },
        ]}
      />
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  placeholder,
  secureTextEntry,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'email-address' | 'phone-pad';
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Muted>{label}</Muted>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={!secureTextEntry}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.accent, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}>
      {icon ? <Ionicons name={icon} size={18} color={buttonLabelColor(theme)} /> : null}
      <Text style={[styles.buttonLabel, { color: buttonLabelColor(theme) }]}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <Text style={{ color: theme.blue, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

function buttonLabelColor(theme: Theme) {
  return theme.name === 'dark' ? '#0B0F14' : '#FFFFFF';
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8 },
  heading: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  muted: { fontSize: 14, lineHeight: 20 },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  track: { height: 8, borderRadius: 999, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 999 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonLabel: { fontSize: 16, fontWeight: '700' },
  divider: { height: 1, width: '100%' },
});
