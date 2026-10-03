// supabase/functions/parsear-texto/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY") ?? "";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY no configurada en el servidor");
    }

    const { texto } = await req.json();

    if (!texto || typeof texto !== "string" || !texto.trim()) {
      return new Response(
        JSON.stringify({ error: "Texto vacío o inválido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = `Eres un extractor de datos financieros colombianos. 
Analizas texto en español y devuelves SOLO un JSON válido, sin markdown, sin explicaciones.`;

    const userPrompt = `Analiza el siguiente texto y extrae los movimientos financieros.

REGLAS ESTRICTAS:
1. Cada movimiento debe tener: "nombre" (string), "valor" (número entero en pesos colombianos, SIN puntos ni comas), "icono" (un emoji apropiado) y "tipo" ("ingreso" o "gasto").
2. "tipo" es "ingreso" SOLO si el usuario escribe explícitamente palabras como: "ingreso", "ingresó", "recibí", "me pagaron", "me consignaron", "entró", "ganancia", "sueldo", "salario", "venta", "cobré". En CUALQUIER otro caso es "gasto".
3. Interpretación de valores:
   - "350k" o "350 mil" = 350000
   - "600.000" o "600,000" = 600000
   - "30mil" = 30000
   - "2.5M" o "2,5 millones" = 2500000
   - "1.200.000" = 1200000
4. Iconos: usa emojis representativos según el nombre:
   - Comida/almuerzo/cena/desayuno → 🍽️
   - Uber/taxi/bus/moto/didi → 🚗
   - Café → ☕
   - Zapatos/tenis → 👟
   - Ropa/camisa → 👕
   - Mercado/supermercado → 🛒
   - Gasolina/combustible → ⛽
   - Regalo → 🎁
   - Sueldo/salario → 💰
   - Tecnología/celular/computador → 📱
   - Casa/arriendo → 🏠
   - Salud/medicina/doctor → 💊
   - Educación/curso/libro → 📚
   - Entretenimiento/cine/juego → 🎬
   - Viaje/vuelo/hotel → ✈️
   - Mascota → 🐶
   - Peluquería/barbería → 💇
   - Servicios/luz/agua/internet → 💡
   - Si no identificas → 💸
5. Separa múltiples movimientos si están unidos por "+" o comas.
6. Devuelve SOLO un array JSON válido.

FORMATO:
[{"nombre":"Almuerzo","valor":18000,"icono":"🍽️","tipo":"gasto"}]

EJEMPLOS:
- "zapatos 350k + comida 600.000 + uber 30mil" 
  → [{"nombre":"Zapatos","valor":350000,"icono":"👟","tipo":"gasto"},{"nombre":"Comida","valor":600000,"icono":"🍽️","tipo":"gasto"},{"nombre":"Uber","valor":30000,"icono":"🚗","tipo":"gasto"}]
- "ingreso de didi 15k" 
  → [{"nombre":"Didi","valor":15000,"icono":"🚗","tipo":"ingreso"}]
- "recibí sueldo 2.500.000" 
  → [{"nombre":"Sueldo","valor":2500000,"icono":"💰","tipo":"ingreso"}]
- "café 5mil + mercado 120.000" 
  → [{"nombre":"Café","valor":5000,"icono":"☕","tipo":"gasto"},{"nombre":"Mercado","valor":120000,"icono":"🛒","tipo":"gasto"}]

TEXTO DEL USUARIO:
"${texto.replace(/"/g, '\\"')}"

Responde SOLO el JSON:`;

    const deepseekResponse = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      throw new Error(`DeepSeek error ${deepseekResponse.status}: ${errorText}`);
    }

    const data = await deepseekResponse.json();
    let contenido = data.choices?.[0]?.message?.content || "[]";

    contenido = contenido.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed = JSON.parse(contenido);

    if (!Array.isArray(parsed)) {
      const claveArray = Object.keys(parsed).find((k) =>
        Array.isArray(parsed[k])
      );
      if (claveArray) parsed = parsed[claveArray];
      else parsed = [parsed];
    }

    const movimientos = parsed
      .filter((m: any) => m && (m.nombre || m.valor))
      .map((m: any) => ({
        nombre: String(m.nombre || "Movimiento").trim(),
        valor: Math.abs(Math.round(Number(m.valor) || 0)),
        icono: m.icono || (m.tipo === "ingreso" ? "💰" : "💸"),
        tipo: m.tipo === "ingreso" ? "ingreso" : "gasto",
      }))
      .filter((m: any) => m.valor > 0);

    return new Response(JSON.stringify({ movimientos }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Error desconocido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});