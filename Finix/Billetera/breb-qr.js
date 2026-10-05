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
// 📌 PLANTILLA REAL (QR de $5.000 con tu llave 3138744066)
// ============================================
const PLANTILLA_QR_REAL =
  "00020101021126320014CO.COM.RBM.LLA0210313874406649250014CO.COM.RBM.RED0103RBM" +
  "50310013CO.COM.RBM.CU0110000000000051220013CO.COM.RBM.CA0101052040000530317054" +
  "075000.00" +
  "5802CO59010600106101062270710CC3D75AE64080200110363180270016CO.COM.RBM.CANAL0103APP" +
  "81250015CO.COM.RBM.CIVA01020282260014CO.COM.RBM.IVA01040.00" +
  "83270015CO.COM.RBM.BASE01040.0084250015CO.COM.RBM.CINC010202" +
  "85260014CO.COM.RBM.INC01040.0090430016CO.COM.RBM.TRXID0119000002FSStDLs2ndrBr9" +
  "1460014CO.COM.RBM.SEC0124eXnV6BwgdGNLszxps5ijFyfR6304A413";

// ============================================
// Parser TLV correcto (recorre etiquetas en orden)
// ============================================
function parsearTLV(payload) {
  const bloques = [];
  let i = 0;
  while (i < payload.length) {
    // Necesitamos al menos 4 caracteres: 2 de tag + 2 de largo
    if (i + 4 > payload.length) {
      // Residuo final: guardamos tal cual
      bloques.push({ tag: null, valor: payload.substring(i) });
      break;
    }
    const tag = payload.substring(i, i + 2);
    const largoTxt = payload.substring(i + 2, i + 4);
    const largo = parseInt(largoTxt, 10);

    if (isNaN(largo)) {
      // Si no es un TLV válido, guardamos el resto crudo
      bloques.push({ tag: null, valor: payload.substring(i) });
      break;
    }

    const valor = payload.substring(i + 4, i + 4 + largo);
    bloques.push({ tag, largo, valor });
    i += 4 + largo;
  }
  return bloques;
}

// ============================================
// Reconstruir payload (excluye tag 63 que es el CRC)
// ============================================
function construirPayload(bloques) {
  let s = "";
  for (const b of bloques) {
    if (b.tag === "63") continue;   // saltamos el CRC viejo
    if (b.tag === null) { s += b.valor; continue; }  // residuo
    const largoTxt = String(b.valor.length).padStart(2, "0");
    s += b.tag + largoTxt + b.valor;
  }
  s += "6304";
  return s + crc16(s);
}

// ============================================
// Cambiar SOLO el monto (etiqueta 54)
// ============================================
function cambiarMonto(payload, monto) {
  const bloques = parsearTLV(payload);
  let encontrado = false;

  for (const b of bloques) {
    if (b.tag === "54") {
      b.valor = monto;
      b.largo = monto.length;
      encontrado = true;
    }
  }

  if (!encontrado) {
    console.warn("⚠️ No se encontró la etiqueta 54 (monto)");
  }

  return construirPayload(bloques);
}

// ============================================
// Generador final
// ============================================
function generarPayloadBreB(llave, valor) {
  const montoStr = Number(valor).toFixed(2);   // "5000.00"
  return cambiarMonto(PLANTILLA_QR_REAL, montoStr);
}

// ============================================
// Validación en consola
// ============================================
function validarPlantilla() {
  // Parsear la plantilla
  const bloques = parsearTLV(PLANTILLA_QR_REAL);
  console.log("Bloques parseados:", bloques);

  // Reconstruir sin cambiar nada → debe dar exactamente la plantilla original
  const reconstruido = construirPayload(bloques);
  console.log("Reconstruido === Original?", reconstruido === PLANTILLA_QR_REAL);
  console.log("CRC original:     ", PLANTILLA_QR_REAL.slice(-4));
  console.log("CRC reconstruido: ", reconstruido.slice(-4));
}