/**
 * Central icon map — all icons used across the app live here.
 * Values are Ionicons names (@expo/vector-icons/Ionicons).
 * To swap icon sets in the future, change only this file.
 */
export const Icons = {
  // ── Tabs / Navegación
  tabHome:        'home',
  tabContracts:   'document-text',
  tabPermissions: 'key',
  tabVacations:   'umbrella',
  tabProfile:     'person-circle',

  // ── Campana
  bell:           'notifications',
  bellOutline:    'notifications-outline',
  bellOff:        'notifications-off-outline',

  // ── Estados de notificación / solicitud
  approved:       'checkmark-circle',
  pending:        'time',
  rejected:       'close-circle',
  info:           'information-circle',
  schedule:       'calendar',

  // ── Acciones generales
  edit:           'create-outline',
  logout:         'log-out-outline',
  close:          'close',
  back:           'chevron-back',
  eyeOn:          'eye-outline',
  eyeOff:         'eye-off-outline',
  lock:           'lock-closed-outline',
  mail:           'mail-outline',
  person:         'person-outline',
  password:       'key-outline',
  save:           'checkmark-outline',

  // ── Features en Home (outline para estilo card)
  featureContracts:   'document-text-outline',
  featureSchedule:    'time-outline',
  featureLeave:       'umbrella-outline',
  featureNotifs:      'notifications-outline',

  // ── Acciones adicionales
  add:                'add',
  chevronRight:       'chevron-forward',
  chevronDown:        'chevron-down',
  chevronUp:          'chevron-up',
  download:           'download-outline',
  filter:             'options-outline',
  send:               'send',

  // ── Chatbot
  chatBot:            'chatbubble-ellipses',
  sparkles:           'sparkles-outline',

  // ── Datos / campos
  calendarToday:      'today-outline',
  calendarRange:      'calendar-outline',
  money:              'cash-outline',
  contract:           'document-text-outline',
  clockTime:          'time-outline',

  // ── Estados vacíos / error
  wifiOff:            'cloud-offline-outline',
  calendarBusy:       'calendar-clear-outline',
  personOff:          'person-remove-outline',
  leaveAvailable:     'checkmark-done-outline',
} as const;

export type IconName = keyof typeof Icons;
