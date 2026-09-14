// worker.js — Cloudflare Worker como proxy seguro para Gemini
// La API key NUNCA se expone al frontend (vive como secret: env.GEMINI_API_KEY)
// Modelo: gemini-3.1-flash-lite (GA desde mayo 2026, sin fecha de apagado programada)

export default {
  async fetch(request, env) {
    // ---- CORS: restringido a tu dominio real de GitHub Pages ----
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://tuusuario.github.io", // ⚠️ REEMPLAZA con tu usuario real
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    // ---- Preflight OPTIONS ----
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ---- Solo POST ----
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Método no permitido" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      // ---- Parsear body ----
      const { texto } = await request.json();
      if (!texto || typeof texto !== "string") {
        return new Response(JSON.stringify({ error: "Falta 'texto'" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ---- Prompt para Gemini ----
      const prompt = `Eres un extractor de movimientos financieros personales. Analiza el siguiente texto en español colombiano y devuelve EXCLUSIVAMENTE un array JSON válido (sin backticks, sin texto antes ni después, sin explicaciones).

REGLAS DE INTERPRETACIÓN:
1. El texto puede contener VARIOS movimientos separados por "+", comas, punto y coma o saltos de línea.
   Ejemplo: "gasolina 15k + comida 30mil + zapatos 50.000" → 3 movimientos.
2. Cada movimiento tiene un NOMBRE y un VALOR. Sepáralos.
3. Convierte los valores a pesos colombianos (COP) como NÚMERO ENTERO sin puntos ni comas:
   - "15k" → 15000
   - "30mil" → 30000
   - "50.000" o "50,000" → 50000
   - "1.5k" → 1500
   - "2M" o "2 millones" → 2000000
4. Asigna un emoji (icono) según la categoría del nombre:
   - comida / almuerzo / cena / desayuno / restaurante / café → 🍔
   - gasolina / combustible / uber / taxi / bus / transporte / pasaje → ⛽
   - ropa / zapatos / camisa / pantalón → 👟
   - salario / sueldo / pago / nómina / ingreso / recibí / me pagaron → 💰
   - supermercado / mercado / tienda / víveres → 🛒
   - arriendo / renta / alquiler → 🏠
   - luz / agua / gas / internet / teléfono / servicios → 💡
   - salud / médico / farmacia / medicinas → 💊
   - entretenimiento / cine / juego / netflix / spotify → 🎮
   - Si no reconoces la categoría → 📌
5. Determina el campo "tipo":
   - "ingreso" SOLO si el texto indica claramente entrada de dinero: "me pagaron", "recibí", "sueldo", "salario", "ingreso", "me consignaron", "cobré", "venta".
   - En cualquier otro caso → "gasto".

FORMATO DE SALIDA (array JSON puro):
[
  { "tipo": "gasto", "nombre": "Comida", "precio": 30000, "icono": "🍔" },
  { "tipo": "gasto", "nombre": "Gasolina", "precio": 15000, "icono": "⛽" }
]

TEXTO A ANALIZAR:
"""${texto}"""`;

      // ---- Llamada a Gemini 3.1 Flash Lite ----
      const geminiUrl =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=" +
        env.GEMINI_API_KEY;

      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json", // fuerza JSON puro
          },
        }),
      });

      // ---- Manejo de error de Gemini ----
      if (!geminiRes.ok) {
        const errTxt = await geminiRes.text();
        return new Response(
          JSON.stringify({ error: "Gemini error", detalle: errTxt }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const data = await geminiRes.json();
      let textoRespuesta =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      // ---- Limpieza defensiva de backticks ----
      textoRespuesta = textoRespuesta
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      // ---- Parsear JSON ----
      let movimientos;
      try {
        movimientos = JSON.parse(textoRespuesta);
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "JSON inválido de Gemini", raw: textoRespuesta }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // ---- Normalización final ----
      if (Array.isArray(movimientos)) {
        movimientos = movimientos.map((m) => ({
          tipo: m.tipo === "ingreso" ? "ingreso" : "gasto",
          nombre: String(m.nombre || "Movimiento"),
          precio: Math.round(Number(m.precio) || 0),
          icono: m.icono || "📌",
        }));
      } else {
        movimientos = [];
      }

      return new Response(JSON.stringify(movimientos), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Error interno", detalle: String(err) }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  },
};