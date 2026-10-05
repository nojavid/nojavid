// ============================================
// breb-qr.js — Generador de payload QR Bre-B con monto
// ============================================
// El payload base (QR sin monto) se obtiene del perfil del usuario
// (profiles.llave_bre_b) y se le inyecta el tag 54 antes del tag 58,
// recalculando el CRC16-CCITT-FALSE.
// ============================================

// ============================================
// CRC16-CCITT-FALSE (0x1021, init 0xFFFF)
// ============================================
function crc16(s) {
  let c = 0xFFFF;
  for (let i = 0; i < s.length; i++) {
    c ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      c = (c & 0x8000) ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF;
    }
  }
  return c.toString(16).toUpperCase().padStart(4, "0");
}

// ============================================
// VALIDAR PAYLOAD EMVCo (QR Bre-B)
// ============================================
// IMPORTANTE: un payload EMVCo contiene letras, dígitos y puntos.
// NO se debe validar con /^\d+$/ (eso era un error del código viejo).
// ============================================
function validarPayloadEMVCo(payload) {
  if (!payload || typeof payload !== "string") {
    return { valido: false, error: "El payload está vacío." };
  }

  // Quitar espacios/saltos/tabs (pero NO tocar letras ni puntos)
  const limpio = payload.replace(/\s+/g, "");

  if (limpio.length < 20) {
    return { valido: false, error: "El payload es demasiado corto." };
  }

  // Solo caracteres ASCII imprimibles (0x20 a 0x7E)
  if (!/^[\x20-\x7E]+$/.test(limpio)) {
    return { valido: false, error: "El payload contiene caracteres no válidos." };
  }

  // Debe tener el tag 63 (CRC) al final: "6304" + 4 hex
  const idx6304 = limpio.lastIndexOf("6304");
  if (idx6304 === -1) {
    return { valido: false, error: "Falta el tag 63 (CRC) en el payload." };
  }
  if (idx6304 + 8 !== limpio.length) {
    return { valido: false, error: "El CRC debe estar al final del payload." };
  }

  const body = limpio.slice(0, idx6304 + 4);
  const crcDeclarado = limpio.slice(idx6304 + 4).toUpperCase();

  // El CRC deben ser 4 caracteres hexadecimales
  if (!/^[0-9A-F]{4}$/.test(crcDeclarado)) {
    return { valido: false, error: "El CRC no tiene formato hexadecimal válido." };
  }

  const crcCalculado = crc16(body);

  if (crcDeclarado !== crcCalculado) {
    return {
      valido: false,
      error: `CRC inválido (esperado ${crcCalculado}, recibido ${crcDeclarado}).`
    };
  }

  // Debe contener el tag 58 con "CO" (Colombia)
  if (!limpio.includes("5802CO")) {
    return { valido: false, error: "El payload no parece ser un QR Bre-B de Colombia." };
  }

  return { valido: true, payload: limpio };
}

// ============================================
// CONSTRUIR PAYLOAD CON MONTO
// ============================================
function construirPayloadConMonto(payloadBase, monto) {
  const t = String(monto).replace(",", ".").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(t) || parseFloat(t) <= 0) {
    return null;
  }

  const idx6304 = payloadBase.lastIndexOf("6304");
  const sinCRC = payloadBase.slice(0, idx6304 + 4);

  // Tag 54: "54" + longitud (2 dígitos) + valor
  const tag54 = "54" + String(t.length).padStart(2, "0") + t;

  // Insertar antes del tag 58 (país)
  const body = sinCRC.replace("5802CO", tag54 + "5802CO");

  return body + crc16(body);
}

// ============================================
// API PÚBLICA
// generarPayloadBreB(payloadBase, monto)
// ============================================
function generarPayloadBreB(payloadBase, monto) {
  if (!payloadBase) return null;

  const n = Number(monto);
  if (!n || n <= 0) return payloadBase;

  return construirPayloadConMonto(payloadBase, n.toFixed(2)) || payloadBase;
}