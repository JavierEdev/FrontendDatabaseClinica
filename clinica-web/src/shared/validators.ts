// src/shared/validators.ts

// ==============================
// Reglas (Regex) reutilizables
// ==============================
export const REGEX = {
  // Números
  onlyDigits: /^\d+$/,          // Solo dígitos
  dpi13: /^\d{13}$/,            // DPI exacto 13 dígitos
  phone8: /^\d{8}$/,            // Teléfono exacto 8 dígitos

  // Letras + espacio (sin doble espacio)
  onlyLettersSpacesNoDouble: /^(?!.* {2})[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/,

  // EMAIL (restringido a A–Z a–z 0–9 . _ -)
  // - 1 solo '@'
  // - sin dobles consecutivos de . _ -
  // - local y cada label del dominio no empiezan/terminan con . _ -
  // - al menos un punto en el dominio
  // - TLD de 2+ letras
  emailRestricted:
    /^(?!.*[._-]{2})[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9_-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/,

  // Email simple (se deja por compatibilidad si se usa en otra parte)
  email: /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,

  // Fechas
  dateUS: /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/, // mm/dd/yyyy
  dateISO: /^\d{4}-\d{2}-\d{2}$/,                            // yyyy-mm-dd

  // Dirección/Notas: letras (con acentos), números, espacio, - _ . , ( ) "
  // Prohíbe dobles consecutivos: "--", "__", "..", ",,", "\"\"", "((", "))" y doble espacio
  notesAllowed:
    /^(?!.* {2})(?!.*--)(?!.*__)(?!.*\.\.)(?!.*,,)(?!.*"")(?!.*\(\()(?!.*\)\))[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 _\-\.,\(\)"]+$/,
};

// ==============================
// Funciones de validación
// ==============================
export const isOnlyDigits = (v: string) => REGEX.onlyDigits.test(v);
export const isDpi13 = (v: string) => REGEX.dpi13.test(v);
export const isPhone8 = (v: string) => REGEX.phone8.test(v);

export const isLettersNoDouble = (v: string) =>
  REGEX.onlyLettersSpacesNoDouble.test(v);

export const isEmail = (v: string) => REGEX.email.test(v);
export const isEmailRestricted = (v: string) => REGEX.emailRestricted.test(v);

export const isDateISO = (v: string) => REGEX.dateISO.test(v);

// Valida mm/dd/yyyy real (día/mes válidos)
export const isDateUS = (v: string) => {
  if (!REGEX.dateUS.test(v)) return false;
  const [m, d, y] = v.split("/").map((n) => parseInt(n, 10));
  const dt = new Date(y, m - 1, d); // JS: mes 0-11
  return (
    dt.getFullYear() === y &&
    dt.getMonth() === m - 1 &&
    dt.getDate() === d
  );
};

export const isNotes = (v: string) => REGEX.notesAllowed.test(v);
export const isAddress = (v: string) => REGEX.notesAllowed.test(v); // alias

// ==============================
// Utilidades para inputs (tecleo/pegado)
// ==============================

// No permitir doble espacio al teclear
export const blocksDoubleSpace = (e: any) => {
  const v = e.data ?? "";
  if (v === " " && e.currentTarget.value.endsWith(" ")) e.preventDefault();
};

// No permitir segundo guion consecutivo al teclear
export const blocksDoubleHyphen = (e: any) => {
  const v = e.data ?? "";
  if (v === "-" && e.currentTarget.value.endsWith("-")) e.preventDefault();
};

// Bloquea duplicados inmediatos de: espacio, -, _, ., ,, ", (, )
export const blocksImmediateDuplicates = (e: any) => {
  const ch = e.data ?? "";
  if (!ch) return;
  const specials = [" ", "-", "_", ".", ",", '"', "(", ")"];
  if (specials.includes(ch) && e.currentTarget.value.endsWith(ch)) {
    e.preventDefault();
  }
};

// EMAIL restringido:
// - bloquea 2º '@'
// - bloquea caracteres fuera de A–Z a–z 0–9 . _ -
// - bloquea dobles consecutivos de . _ -
export const blocksEmailRestrictedInput = (e: any) => {
  const ch = e.data ?? "";
  if (!ch) return;
  const el: HTMLInputElement = e.currentTarget;
  const val = el.value;

  // sólo letras, números, @ . _ -
  if (!/^[A-Za-z0-9@._-]$/.test(ch)) {
    e.preventDefault();
    return;
  }
  // un solo '@'
  if (ch === "@" && val.includes("@")) {
    e.preventDefault();
    return;
  }
  // sin dobles de . _ -
  if (/[._-]/.test(ch) && val.endsWith(ch)) {
    e.preventDefault();
  }
};
