import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { t, isValidLang, type Lang } from '@/lib/translations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface GerarComboRequest {
  nome: string;
  data: string;
  email: string;
  lang?: string;
}

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

function extrairNumeros(data: string, nome: string) {
  const [ano, mes, dia] = data.split('-').map(Number);

  const nomeNumeros = nome
    .toUpperCase()
    .split('')
    .filter(char => /[A-Z]/.test(char))
    .map(char => char.charCodeAt(0) - 64);

  return { dia, mes, ano, nomeNumeros };
}

function reduzirNumero(num: number): number {
  while (num >= 10) {
    num = String(num).split('').reduce((a, b) => a + Number(b), 0);
  }
  return num;
}

function obterSignoZodiacal(dia: number, mes: number): string {
  const signos = [
    { nome: 'Capricórnio', data: [21, 1, 19] },
    { nome: 'Aquário', data: [20, 2, 18] },
    { nome: 'Peixes', data: [19, 3, 20] },
    { nome: 'Áries', data: [21, 4, 19] },
    { nome: 'Touro', data: [20, 5, 20] },
    { nome: 'Gêmeos', data: [21, 6, 20] },
    { nome: 'Câncer', data: [21, 7, 22] },
    { nome: 'Leão', data: [23, 8, 22] },
    { nome: 'Virgem', data: [23, 9, 22] },
    { nome: 'Libra', data: [23, 10, 22] },
    { nome: 'Escorpião', data: [23, 11, 21] },
    { nome: 'Sagitário', data: [22, 12, 21] },
  ];

  for (let signo of signos) {
    if (mes === signo.data[1]) {
      if ((signo.data[1] === signo.data[2] && dia >= signo.data[0]) ||
          (signo.data[1] !== signo.data[2] && dia <= signo.data[2])) {
        return signo.nome;
      }
    } else if (mes === signo.data[2]) {
      if (dia <= signo.data[2]) {
        return signo.nome;
      }
    }
  }

  return 'Desconhecido';
}

function gerarNumerosLoteria(nome: string, data: string): number[] {
  const [ano, mes, dia] = data.split('-').map(Number);

  let seed = 0;
  for (let i = 0; i < nome.length; i++) {
    seed += nome.charCodeAt(i);
  }
  seed += dia + mes + ano;

  const random = (min: number, max: number) => {
    seed = (seed * 9301 + 49297) % 233280;
    return Math.floor((seed / 233280) * (max - min + 1)) + min;
  };

  const numeros = new Set<number>();

  while (numeros.size < 5) {
    numeros.add(random(1, 60));
  }

  return Array.from(numeros).sort((a, b) => a - b);
}

async function chamarChatGPT(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Erro OpenAI:', error);
    throw new Error('Erro ao chamar ChatGPT');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function limparTexto(texto: string): string {
  return texto
    .replace(/\[.*?Especialista.*?\]/g, '')
    .replace(/\[.*?Mestre.*?\]/g, '')
    .replace(/\[.*?Tarólogo.*?\]/g, '')
    .replace(/\[.*?Astrólogo.*?\]/g, '')
    .replace(/\[.*?Curador.*?\]/g, '')
    .replace(/\[.*?Specialist.*?\]/g, '')
    .replace(/\[.*?Master.*?\]/g, '')
    .replace(/\[.*?Healer.*?\]/g, '')
    .replace(/\[.*?Experte.*?\]/g, '')
    .replace(/\[.*?Esperto.*?\]/g, '')
    .replace(/\[.*?Especialista.*?\]/g, '')
    .replace(/Atenciosamente,?.*$/gm, '')
    .replace(/Com bênçãos,?.*$/gm, '')
    .replace(/Sincerely,?.*$/gm, '')
    .replace(/Best regards,?.*$/gm, '')
    .replace(/Mit freundlichen Grüßen,?.*$/gm, '')
    .replace(/Cordialmente,?.*$/gm, '')
    .replace(/Con cariño,?.*$/gm, '')
    .trim();
}

function getPromptNumerologia(lang: Lang, nome: string, data: string, numeroDestino: number, numeroExpressao: number, numeroSoul: number, idade: number): string {
  const gptLang = t(lang, 'gpt.language');

  return `You are a master of spiritual numerology. Generate a deep and mystical reading about:

Name: ${nome}
Date of Birth: ${data}
Destiny Number: ${numeroDestino}
Expression Number: ${numeroExpressao}
Soul Number: ${numeroSoul}
Age: ${idade} years

Create an esoteric analysis including:
- Deep meaning of each number
- Life mission indicated by the numbers
- Numerological challenges and opportunities
- Personal cycles
- Message from the Universe through numbers

Be poetic, inspiring and mysterious. Respond entirely in ${gptLang}. Do NOT add any signature or credit at the end.`;
}

function getPromptMapaAstral(lang: Lang, nome: string, data: string, signoZodiacal: string): string {
  const gptLang = t(lang, 'gpt.language');
  const signoTraduzido = t(lang, `signo.${signoZodiacal}`);

  return `You are an experienced astrologer. Generate an astrological interpretation for:

Name: ${nome}
Date of Birth: ${data}
Sun Sign: ${signoTraduzido}

Create an astrological reading including:
- Sun sign characteristics
- Planetary influences (Sun, Moon, Ascendant)
- Astrological spiritual calling
- Relationships and compatibilities
- Current astrological cycles
- Personalized astrological advice

Be mystical and revealing. Respond entirely in ${gptLang}. Do NOT add any signature or credit at the end.`;
}

function getPromptLimpeza(lang: Lang, nome: string, signoZodiacal: string, idade: number): string {
  const gptLang = t(lang, 'gpt.language');
  const signoTraduzido = t(lang, `signo.${signoZodiacal}`);

  return `You are a spiritual healer and white magic practitioner. Generate a spiritual cleansing ritual for:

Name: ${nome}
Sign: ${signoTraduzido}
Age: ${idade} years

Create a spiritual cleansing guide including:
- Personal energy diagnosis
- Identified spiritual blockages
- Recommended cleansing ritual (bath, incense, crystals)
- Powerful affirmations and mantras
- Energy protection
- Connection with spiritual guides
- Next steps for spiritual evolution

Be deep, wise and transformative. Respond entirely in ${gptLang}. Do NOT add any signature or credit at the end.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GerarComboRequest;
    const { nome, data, email } = body;
    const lang: Lang = isValidLang(body.lang || null) ? (body.lang as Lang) : 'pt';

    if (!nome || !data || !email) {
      return NextResponse.json(
        { error: t(lang, 'api.error.required') },
        { status: 400 }
      );
    }

    const { data: userData, error: userError } = await supabase
      .from('compras')
      .select('*')
      .eq('customer_email', email.toLowerCase().trim())
      .eq('aprovado', true)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: t(lang, 'api.error.notfound') },
        { status: 401 }
      );
    }

    if (userData.combo_gerado) {
      return NextResponse.json(
        { error: t(lang, 'api.error.limit') },
        { status: 403 }
      );
    }

    const idade = calcularIdade(data);
    const { dia, mes, ano, nomeNumeros } = extrairNumeros(data, nome);
    const signoZodiacal = obterSignoZodiacal(dia, mes);
    const signoTraduzido = t(lang, `signo.${signoZodiacal}`);
    const numerosLoteria = gerarNumerosLoteria(nome, data);

    const numeroDestino = reduzirNumero(dia + mes + ano);
    const numeroExpressao = reduzirNumero(nomeNumeros.reduce((a, b) => a + b, 0));
    const numeroSoul = reduzirNumero(
      nomeNumeros
        .map((_, i) => {
          const char = nome.toUpperCase()[i];
          const vowels = 'AEIOU';
          return vowels.includes(char) ? nomeNumeros[i] : 0;
        })
        .reduce((a, b) => a + b, 0)
    );

    console.log('🔮 Gerando combo para:', { nome, data, signoZodiacal, lang });

    // ========== 1. NUMEROLOGIA ==========
    let numerologia = await chamarChatGPT(getPromptNumerologia(lang, nome, data, numeroDestino, numeroExpressao, numeroSoul, idade));
    numerologia = limparTexto(numerologia);

    // ========== 2. MAPA ASTRAL ==========
    let mapaAstral = await chamarChatGPT(getPromptMapaAstral(lang, nome, data, signoZodiacal));
    mapaAstral = limparTexto(mapaAstral);

    // ========== 3. LIMPEZA ESPIRITUAL ==========
    let limpezaEspiritual = await chamarChatGPT(getPromptLimpeza(lang, nome, signoZodiacal, idade));
    limpezaEspiritual = limparTexto(limpezaEspiritual);

    // ========== GERA HTML ==========
    const htmlLang = lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : 'it-IT';

    const html = `
<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t(lang, 'html.title')} - ATB Tarot</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #1a0033 0%, #2d0052 50%, #1a0033 100%);
      min-height: 100vh;
      padding: 20px;
      color: #333;
    }

    .container {
      max-width: 950px;
      margin: 0 auto;
      background: white;
      border-radius: 15px;
      box-shadow: 0 20px 80px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      color: white;
      padding: 50px 20px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: "✨ ⭐ 🔮 ✨";
      position: absolute;
      top: 10px;
      left: 0;
      right: 0;
      font-size: 1.5em;
      opacity: 0.3;
    }

    .header h1 {
      font-size: 2.8em;
      margin-bottom: 10px;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
      letter-spacing: 2px;
    }

    .header p {
      font-size: 1.3em;
      opacity: 0.95;
      margin-bottom: 15px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      padding: 20px;
      background: #f8f6ff;
      border-bottom: 2px solid #667eea;
    }

    .info-card {
      background: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      border-left: 4px solid #764ba2;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .info-card h4 {
      color: #764ba2;
      font-size: 0.85em;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .info-card .value {
      font-size: 1.3em;
      font-weight: bold;
      color: #333;
    }

    .section {
      padding: 40px;
      border-bottom: 3px solid #f0f0f0;
    }

    .section:last-child {
      border-bottom: none;
    }

    .section-image {
      width: 100%;
      max-width: 600px;
      height: 300px;
      object-fit: cover;
      border-radius: 10px;
      margin: 20px auto;
      display: block;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #667eea;
    }

    .section-icon {
      font-size: 2.5em;
      margin-right: 15px;
    }

    .section-title {
      font-size: 2em;
      color: #764ba2;
      margin: 0;
    }

    .section-content {
      line-height: 1.9;
      font-size: 1.05em;
      color: #555;
    }

    .section-content p {
      margin-bottom: 18px;
      text-align: justify;
    }

    .numeros-loteria {
      background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
      color: white;
      padding: 25px;
      border-radius: 10px;
      text-align: center;
      margin: 25px 0;
      box-shadow: 0 4px 15px rgba(118, 75, 162, 0.3);
    }

    .numeros-loteria h3 {
      font-size: 1.3em;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .numeros-display {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .numero {
      background: white;
      color: #764ba2;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.2em;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .divider {
      text-align: center;
      font-size: 1.5em;
      margin: 30px 0;
      color: #764ba2;
      opacity: 0.6;
    }

    .footer {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }

    .footer p {
      margin: 10px 0;
      font-size: 0.95em;
    }

    .mystical-ornament {
      text-align: center;
      font-size: 1.3em;
      margin: 25px 0;
      color: #764ba2;
      letter-spacing: 3px;
    }

    @media print {
      body {
        background: white;
      }
      .container {
        box-shadow: none;
        border-radius: 0;
      }
      .header::before {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- HEADER -->
    <div class="header">
      <h1>✨ ${t(lang, 'html.title')} ✨</h1>
      <p>${t(lang, 'html.subtitle')}</p>
      <p style="font-size: 0.9em; margin-top: 15px;">${t(lang, 'html.journey')}</p>
    </div>

    <!-- INFO CARDS -->
    <div class="info-grid">
      <div class="info-card">
        <h4>${t(lang, 'html.name')}</h4>
        <div class="value">${nome}</div>
      </div>
      <div class="info-card">
        <h4>${t(lang, 'html.sign')}</h4>
        <div class="value">${signoTraduzido}</div>
      </div>
      <div class="info-card">
        <h4>${t(lang, 'html.destiny')}</h4>
        <div class="value">${numeroDestino}</div>
      </div>
      <div class="info-card">
        <h4>${t(lang, 'html.expression')}</h4>
        <div class="value">${numeroExpressao}</div>
      </div>
      <div class="info-card">
        <h4>${t(lang, 'html.soul')}</h4>
        <div class="value">${numeroSoul}</div>
      </div>
      <div class="info-card">
        <h4>${t(lang, 'html.age')}</h4>
        <div class="value">${idade}</div>
      </div>
    </div>

    <!-- SEÇÃO 1: NUMEROLOGIA -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🔢</div>
        <h2 class="section-title">${t(lang, 'html.numerology')}</h2>
      </div>
      <img src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=300&fit=crop" alt="Numerologia" class="section-image">
      <div class="section-content">
        ${numerologia
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string) => `<p>${line}</p>`)
          .join('')}
      </div>

      <!-- Números para Loteria -->
      <div class="numeros-loteria">
        <h3>🎰 ${t(lang, 'html.lottery')}</h3>
        <p style="font-size: 0.9em; margin-bottom: 15px; opacity: 0.9;">${t(lang, 'html.lottery.desc')}</p>
        <div class="numeros-display">
          ${numerosLoteria.map(num => `<div class="numero">${num}</div>`).join('')}
        </div>
      </div>
    </div>

    <div class="mystical-ornament">⭐ • 🔮 • ⭐</div>

    <!-- SEÇÃO 2: MAPA ASTRAL -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🌙</div>
        <h2 class="section-title">${t(lang, 'html.astral')}</h2>
      </div>
      <img src="https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&h=300&fit=crop" alt="Astral" class="section-image">
      <div class="section-content">
        ${mapaAstral
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string) => `<p>${line}</p>`)
          .join('')}
      </div>
    </div>

    <div class="mystical-ornament">✨ • 🌟 • ✨</div>

    <!-- SEÇÃO 3: LIMPEZA ESPIRITUAL -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🕯️</div>
        <h2 class="section-title">${t(lang, 'html.cleansing')}</h2>
      </div>
      <img src="https://images.unsplash.com/photo-1604881991720-f91add269bed?w=600&h=300&fit=crop" alt="Ritual" class="section-image">
      <div class="section-content">
        ${limpezaEspiritual
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string) => `<p>${line}</p>`)
          .join('')}
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <div class="mystical-ornament">🔮 ✨ 🔮</div>
      <p style="font-size: 1.1em; font-weight: bold; margin-bottom: 15px;">${t(lang, 'html.footer.message')}</p>
      <p>🌙 ${t(lang, 'html.footer.brand')} 🌙</p>
      <p style="margin-top: 20px; font-size: 0.85em; opacity: 0.8;">
      </p>
    </div>
  </div>
</body>
</html>
    `;

    await supabase
      .from('compras')
      .update({ combo_gerado: true })
      .eq('customer_email', email.toLowerCase().trim());

    console.log('✅ Combo gerado e marcado com sucesso!');

    return NextResponse.json({
      success: true,
      html,
      analises: {
        nome,
        signoZodiacal: signoTraduzido,
        numerologia,
        mapaAstral,
        limpezaEspiritual,
        numerosLoteria,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao gerar combo:', error);
    return NextResponse.json(
      { error: 'Erro interno ao gerar o combo' },
      { status: 500 }
    );
  }
}
