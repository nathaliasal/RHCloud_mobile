import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';

import { AppIcon } from '@/components/ui/app-icon';
import { queryBot, BotTerm } from '@/services/bot';

// ── Design tokens ─────────────────────────────────────────

const C = {
  bg: '#07101F',
  accent: '#00E5CC',
  accentGlow: 'rgba(0,229,204,0.12)',
  accentBorder: 'rgba(0,229,204,0.30)',
  text: '#EDF4FF',
  muted: 'rgba(237,244,255,0.45)',
  card: 'rgba(237,244,255,0.05)',
  cardBorder: 'rgba(237,244,255,0.10)',
  overlay: 'rgba(0,0,0,0.65)',
  modalBg: '#0D1A2E',
  rejected: '#FF6B6B',
  inputBg: 'rgba(237,244,255,0.06)',
};

const F = Platform.select({
  ios: { heavy: 'AvenirNext-Heavy', demi: 'AvenirNext-DemiBold', regular: 'AvenirNext-Regular' },
  default: { heavy: 'sans-serif-condensed', demi: 'sans-serif-medium', regular: 'sans-serif' },
});

// Altura de la tab bar (coincide con CustomTabBar TAB_BAR_H)
const TAB_BAR_HEIGHT = 70;

// ── Types ─────────────────────────────────────────────────

type MessageRole = 'user' | 'bot' | 'error';

interface ChatMessage {
  id: string;
  role: MessageRole;
  text?: string;
  terms?: BotTerm[];
}

// ── Welcome message ───────────────────────────────────────

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'bot',
  text: 'Hola, soy el asistente de RHCloud. Puedo ayudarte a consultar los términos y condiciones de tu empresa. Escribe el nombre o NIT de la empresa que deseas consultar.',
};

// ── Term card (expandable) ────────────────────────────────

function TermCard({ term }: { term: BotTerm }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity
      style={styles.termCard}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.75}
    >
      <View style={styles.termHeader}>
        <AppIcon name="contract" size={14} color={C.accent} />
        <Text style={styles.termTitle} numberOfLines={expanded ? undefined : 1}>
          {term.title}
        </Text>
        <AppIcon name={expanded ? 'chevronUp' : 'chevronDown'} size={16} color={C.accent} />
      </View>
      {expanded && (
        <Text style={styles.termDescription}>{term.description}</Text>
      )}
    </TouchableOpacity>
  );
}

// ── Message bubble ────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  // Usuario
  if (msg.role === 'user') {
    return (
      <View style={styles.userBubbleWrap}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{msg.text}</Text>
        </View>
      </View>
    );
  }

  // Error
  if (msg.role === 'error') {
    return (
      <View style={styles.errorBubble}>
        <AppIcon name="info" size={15} color={C.rejected} />
        <Text style={styles.errorText}>{msg.text}</Text>
      </View>
    );
  }

  // Bot — texto simple (bienvenida u otro mensaje)
  if (msg.text) {
    return (
      <View style={styles.botBubbleWrap}>
        <View style={styles.botBubble}>
          <Text style={styles.botText}>{msg.text}</Text>
        </View>
      </View>
    );
  }

  // Bot — respuesta con términos (cards expandibles)
  return (
    <View style={styles.botBubbleWrap}>
      <Text style={styles.botResultLabel}>
        {msg.terms!.length === 1
          ? '1 término encontrado:'
          : `${msg.terms!.length} términos encontrados:`}
      </Text>
      {msg.terms!.map((term) => (
        <TermCard key={term.id} term={term} />
      ))}
    </View>
  );
}

// ── Main export ───────────────────────────────────────────

export function ChatBot() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  function handleClose() {
    setOpen(false);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await queryBot(text);
      setMessages((prev) => [
        ...prev,
        { id: `b-${Date.now()}`, role: 'bot', terms: data.items },
      ]);
    } catch (err: any) {
      // El interceptor de http convierte errores a ApiError:
      // err.status  = código HTTP   (no err.response.status)
      // err.message = mensaje ya extraído del servidor
      const status = err?.status;
      console.error('[ChatBot] status:', status, '| message:', err?.message);

      let errorText: string;

      if (status === 503) {
        errorText = 'El asistente está temporalmente desactivado. Inténtalo más tarde.';
      } else if (status === 422) {
        errorText = err?.message ?? 'No pude identificar la empresa. Menciona el nombre o NIT.';
      } else if (status === 404) {
        errorText = err?.message ?? 'No se encontraron términos para esa empresa.';
      } else if (status === 502) {
        errorText = 'Error de comunicación con el proveedor de IA.';
      } else {
        errorText = err?.message ?? 'Ocurrió un error inesperado. Inténtalo de nuevo.';
      }

      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: 'error', text: errorText },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }

  const fabBottom = TAB_BAR_HEIGHT + insets.bottom + 16;
  const isProfile = pathname === '/profile';

  return (
    <>
      {/* ── Botón flotante — oculto en perfil ── */}
      {!isProfile && (
        <TouchableOpacity
          style={[styles.fab, { bottom: fabBottom }]}
          onPress={() => setOpen(true)}
          activeOpacity={0.85}
        >
          <AppIcon name="chatBot" size={24} color={C.bg} />
        </TouchableOpacity>
      )}

      {/* ── Modal de chat ── */}
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Fondo oscuro — toca para cerrar */}
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={handleClose}
          />

          <View style={[styles.modal, { paddingBottom: insets.bottom + 12 }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <AppIcon name="sparkles" size={18} color={C.accent} />
                <Text style={styles.headerTitle}>Asistente RHCloud</Text>
              </View>
              <TouchableOpacity onPress={handleClose} hitSlop={12}>
                <AppIcon name="close" size={22} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Lista de mensajes */}
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => <MessageBubble msg={item} />}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                listRef.current?.scrollToEnd({ animated: true })
              }
            />

            {/* Indicador "consultando..." */}
            {loading && (
              <View style={styles.typingWrap}>
                <ActivityIndicator size="small" color={C.accent} />
                <Text style={styles.typingText}>Consultando...</Text>
              </View>
            )}

            {/* Área de input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Escribe tu consulta..."
                placeholderTextColor={C.muted}
                multiline
                maxLength={300}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!input.trim() || loading) && styles.sendBtnDisabled,
                ]}
                onPress={handleSend}
                disabled={!input.trim() || loading}
                activeOpacity={0.8}
              >
                <AppIcon
                  name="send"
                  size={18}
                  color={!input.trim() || loading ? C.muted : C.bg}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Floating button
  fab: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: C.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.55,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },

  // Modal wrapper
  kav: { flex: 1, justifyContent: 'flex-end' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlay,
  },
  modal: {
    backgroundColor: C.modalBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingTop: 20,
  },

  // Header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    fontFamily: F?.demi,
  },

  // Messages list
  messagesList: { padding: 16, gap: 14, flexGrow: 1 },

  // User bubble
  userBubbleWrap: { alignItems: 'flex-end' },
  userBubble: {
    backgroundColor: C.accentGlow,
    borderWidth: 1,
    borderColor: C.accentBorder,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '80%',
  },
  userText: {
    fontSize: 14,
    color: C.accent,
    fontFamily: F?.regular,
    lineHeight: 20,
  },

  // Bot bubble
  botBubbleWrap: { alignItems: 'flex-start', gap: 8 },
  botBubble: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '85%',
  },
  botText: {
    fontSize: 14,
    color: C.text,
    fontFamily: F?.regular,
    lineHeight: 20,
  },
  botResultLabel: {
    fontSize: 12,
    color: C.muted,
    fontFamily: F?.demi,
    letterSpacing: 0.4,
    marginBottom: 2,
  },

  // Error bubble
  errorBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.22)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '90%',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: C.rejected,
    fontFamily: F?.regular,
    lineHeight: 18,
  },

  // Term card
  termCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    width: '100%',
  },
  termHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  termTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    fontFamily: F?.demi,
  },
  termDescription: {
    fontSize: 13,
    color: C.muted,
    fontFamily: F?.regular,
    lineHeight: 20,
  },

  // Typing indicator
  typingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 13,
    color: C.muted,
    fontFamily: F?.regular,
  },

  // Input area
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
  },
  input: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: C.text,
    fontSize: 14,
    fontFamily: F?.regular,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(237,244,255,0.08)',
  },
});
