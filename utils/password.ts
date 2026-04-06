// ── Política de contraseñas ───────────────────────────────
// Refleja los valores por defecto del backend (.env)
//
//  PASSWORD_MIN_LENGTH        = 8
//  PASSWORD_REQUIRE_UPPERCASE = true
//  PASSWORD_REQUIRE_LOWERCASE = true
//  PASSWORD_REQUIRE_DIGIT     = true
//  PASSWORD_REQUIRE_SPECIAL   = false

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'min_length',
    label: 'Mínimo 8 caracteres',
    test: (p) => p.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'Al menos una mayúscula',
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: 'lowercase',
    label: 'Al menos una minúscula',
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: 'digit',
    label: 'Al menos un número',
    test: (p) => /[0-9]/.test(p),
  },
];

/** Devuelve true si la contraseña cumple todas las reglas */
export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

/** Devuelve el primer mensaje de error o null si es válida */
export function getPasswordError(password: string): string | null {
  const failed = PASSWORD_RULES.find((rule) => !rule.test(password));
  return failed ? failed.label : null;
}
