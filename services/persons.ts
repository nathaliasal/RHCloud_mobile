import http from '@/services/http';
import { ENDPOINTS } from '@/constants/api';

// ── Types ─────────────────────────────────────────────────

// Segun el DTO los tipos de documento validos son: CC, CE, NIT
export type DocumentType = 'CC' | 'CE' | 'NIT';

// Fallbacks en caso de que el endpoint falle
const DOCUMENT_TYPES_FALLBACK: DocumentType[] = ['CC', 'CE', 'NIT'];
const GENDERS_FALLBACK = ['Masculino', 'Femenino', 'Otro'];

/**
 * Extrae un array de strings de la respuesta del servidor.
 * Soporta todos los formatos posibles:
 *   - ["CC", "CE"]                                      → array de strings
 *   - [{value:"CC", name:"..."}, ...]                   → array de objetos
 *   - { "CC": "Cédula", "CE": "..." }                   → objeto plano (keys son los valores)
 *   - { "document_types": [...] }                       → wrapper con cualquier formato interno
 */
function extractOptions(data: unknown): string[] {
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        // Soporta {value: "CC"}, {name: "CC"}, {key: "CC"}
        if (typeof obj.value === 'string') return obj.value;
        if (typeof obj.name === 'string') return obj.name;
        if (typeof obj.key === 'string') return obj.key;
      }
      return String(item);
    });
  }

  if (data && typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    // Wrapper con un solo key cuyo valor es array u objeto → extraer el inner
    if (entries.length === 1) {
      const [, inner] = entries[0];
      if (Array.isArray(inner) || (inner && typeof inner === 'object')) {
        return extractOptions(inner);
      }
    }
    // Objeto plano tipo { "CC": "Cédula", "CE": "..." } → las keys son los valores
    return Object.keys(data as Record<string, unknown>);
  }

  return [];
}

export interface PersonCreate {
  first_name: string;
  last_name: string;
  document_type?: DocumentType;
  document_number?: string;
  birth_date?: string;       // formato YYYY-MM-DD
  gender?: string;
  code_department?: string;
  code_city?: string;
  phone?: string;
  address?: string;
}

export interface PersonResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  document_type: DocumentType;
  document_number: string;
  birth_date: string;
  gender: string;
  code_department: string;
  code_city: string;
  phone: string;
  address: string;
  is_active: boolean;
}

// ── Tipos de documento disponibles (endpoint público) ────

export async function getDocumentTypes(): Promise<string[]> {
  try {
    const response = await fetch(ENDPOINTS.persons.documentTypes);
    if (!response.ok) return DOCUMENT_TYPES_FALLBACK;
    const data = await response.json();
    const options = extractOptions(data);
    return options.length > 0 ? options : DOCUMENT_TYPES_FALLBACK;
  } catch {
    return DOCUMENT_TYPES_FALLBACK;
  }
}

export async function getGenders(): Promise<string[]> {
  try {
    const response = await fetch(ENDPOINTS.persons.genders);
    if (!response.ok) return GENDERS_FALLBACK;
    const data = await response.json();
    const options = extractOptions(data);
    return options.length > 0 ? options : GENDERS_FALLBACK;
  } catch {
    return GENDERS_FALLBACK;
  }
}

// ── Obtener perfil personal del usuario autenticado ───────

export async function getMyProfile(): Promise<PersonResponse> {
  const response = await http.get<PersonResponse>(ENDPOINTS.persons.myProfile);
  return response.data;
}

export interface PersonUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  birth_date?: string;
  gender?: string;
  code_department?: string;
  code_city?: string;
  phone?: string;
  address?: string;
}

// ── Actualizar datos personales ───────────────────────────

export async function updateMyProfile(data: PersonUpdate): Promise<PersonResponse> {
  const response = await http.put<PersonResponse>(ENDPOINTS.persons.updateProfile, data);
  return response.data;
}

// ── Crear datos personales ────────────────────────────────

export async function createPerson(data: PersonCreate): Promise<PersonResponse> {
  const response = await http.post<PersonResponse>(ENDPOINTS.persons.create, data);
  return response.data;
}
