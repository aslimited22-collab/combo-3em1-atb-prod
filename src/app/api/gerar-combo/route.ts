import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface GerarComboRequest {
  nome: string;
  data: string;
  email: string;
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GerarComboRequest;
    const { nome, data, email } = body;

    if (!nome || !data || !email) {
      return NextResponse.json(
        { error: 'Nome, data e email são obrigatórios' },
        { status: 400 }
      );
    }

    // Valida se o usuário existe
    const { data: userData, error: userError } = await supabase
      .from('compras')
      .select('*')
      .eq('customer_email', email.toLowerCase().trim())
      .eq('aprovado', true)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Email não encontrado ou sem acesso' },
        { status: 401 }
      );
    }

    if (userData.combo_gerado) {
      return NextResponse.json(
        { error: 'Você já gerou seu combo. Limite de uma geração por conta.' },
        { status: 403 }
      );
    }

    // Calcula informações
    const idade = calcularIdade(data);
    const { dia, mes, ano, nomeNumeros } = extrairNumeros(data, nome);
    const signoZodiacal = obterSignoZodiacal(dia, mes);

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

    console.log('🔮 Gerando combo para:', { nome, data, signoZodiacal });

    // ========== 1. NUMEROLOGIA ==========
    const promptNumerologia = `Você é um mestre em numerologia espiritual. Gere uma leitura profunda e mística sobre:

Nome: ${nome}
Data de Nascimento: ${data}
Número do Destino: ${numeroDestino}
Número da Expressão: ${numeroExpressao}
Número da Alma: ${numeroSoul}
Idade: ${idade} anos

Crie uma análise esotérica incluindo:
- Significado profundo de cada número
- Missão de vida indicada pelos números
- Desafios e oportunidades numerológicas
- Ciclos pessoais
- Mensagem do Universo através dos números

Seja poético, inspirador e misterioso. Responda em português brasileiro.`;

    const numerologia = await chamarChatGPT(promptNumerologia);

    // ========== 2. MAPA ASTRAL ==========
    const promptMapaAstral = `Você é um astrólogo experiente. Gere uma interpretação astrológica para:

Nome: ${nome}
Data de Nascimento: ${data}
Signo Solar: ${signoZodiacal}

Crie uma leitura astrológica incluindo:
- Características do signo solar
- Influência dos planetas (Sol, Lua, Ascendente)
- Chamado espiritual astrológico
- Relacionamentos e compatibilidades
- Ciclos astrológicos atuais
- Conselhos astrológicos personalizados

Seja místico e revelador. Responda em português brasileiro.`;

    const mapaAstral = await chamarChatGPT(promptMapaAstral);

    // ========== 3. LIMPEZA ESPIRITUAL ==========
    const promptLimpeza = `Você é um curador espiritual e praticante de magia branca. Gere um ritual de limpeza espiritual para:

Nome: ${nome}
Signo: ${signoZodiacal}
Idade: ${idade} anos

Crie um guia de limpeza espiritual incluindo:
- Diagnóstico energético pessoal
- Bloqueios espirituais identificados
- Ritual de limpeza recomendado (banho, incenso, cristais)
- Afirmações e mantras poderosos
- Proteção energética
- Conexão com guias espirituais
- Próximos passos para evolução espiritual

Seja profundo, sábio e transformador. Responda em português brasileiro.`;

    const limpezaEspiritual = await chamarChatGPT(promptLimpeza);

    // Marca no Supabase que foi gerado
    await supabase
      .from('compras')
      .update({ combo_gerado: true })
      .eq('customer_email', email.toLowerCase().trim());

    // ========== GERA HTML ==========
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu Combo Espiritual 3 em 1 - ATB Tarot</title>
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
      <h1>✨ Seu Combo Espiritual 3 em 1 ✨</h1>
      <p>Numerologia • Mapa Astral • Limpeza Espiritual</p>
      <p style="font-size: 0.9em; margin-top: 15px;">Uma jornada de autoconhecimento e transformação espiritual</p>
    </div>

    <!-- INFO CARDS -->
    <div class="info-grid">
      <div class="info-card">
        <h4>Nome</h4>
        <div class="value">${nome}</div>
      </div>
      <div class="info-card">
        <h4>Signo</h4>
        <div class="value">${signoZodiacal}</div>
      </div>
      <div class="info-card">
        <h4>Destino</h4>
        <div class="value">${numeroDestino}</div>
      </div>
      <div class="info-card">
        <h4>Expressão</h4>
        <div class="value">${numeroExpressao}</div>
      </div>
      <div class="info-card">
        <h4>Alma</h4>
        <div class="value">${numeroSoul}</div>
      </div>
      <div class="info-card">
        <h4>Idade</h4>
        <div class="value">${idade}</div>
      </div>
    </div>

    <!-- SEÇÃO 1: NUMEROLOGIA -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🔢</div>
        <h2 class="section-title">Numerologia Espiritual</h2>
      </div>
      <div class="section-content">
        ${numerologia
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string) => `<p>${line}</p>`)
          .join('')}
      </div>
    </div>

    <div class="mystical-ornament">⭐ • 🔮 • ⭐</div>

    <!-- SEÇÃO 2: MAPA ASTRAL -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🌙</div>
        <h2 class="section-title">Mapa Astral</h2>
      </div>
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
        <h2 class="section-title">Limpeza Espiritual</h2>
      </div>
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
      <p style="font-size: 1.1em; font-weight: bold; margin-bottom: 15px;">Que sua jornada seja iluminada pelas energias do Universo</p>
      <p>🌙 ATB Tarot - Autoconhecimento, Transformação, Bênção 🌙</p>
      <p style="margin-top: 20px; font-size: 0.85em; opacity: 0.8;">
        Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return NextResponse.json({
      success: true,
      html,
      analises: {
        nome,
        signoZodiacal,
        numerologia,
        mapaAstral,
        limpezaEspiritual,
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