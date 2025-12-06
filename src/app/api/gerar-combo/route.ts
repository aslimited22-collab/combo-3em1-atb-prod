import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabaseClient'; // Importa o cliente Supabase

// Inicializar cliente OpenAI com a chave de ambiente
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Função para reduzir número com "operação básica" (numerologia)
 * Soma os dígitos até sobrar um dígito (1 a 9), exceto se for 11 ou 22 (números mestres)
 */
function reduzirNumero(valor: number): number {
  while (valor > 22 || (valor > 9 && valor !== 11 && valor !== 22)) {
    let soma = 0;
    const valorStr = valor.toString();
    for (let i = 0; i < valorStr.length; i++) {
      soma += parseInt(valorStr[i]);
    }
    valor = soma;
  }
  return valor;
}

/**
 * Função para calcular o número do nome
 * Remove espaços, conta letras e aplica operação básica
 */
function calcularNumeroNome(nome: string): number {
  const nomeSemEspacos = nome.replace(/\s/g, '');
  const numeroLetras = nomeSemEspacos.length;
  return reduzirNumero(numeroLetras);
}

/**
 * Função para calcular o número da data
 * Remove tudo que não é dígito, soma todos e aplica operação básica
 */
function calcularNumeroData(data: string): number {
  const apenasDigitos = data.replace(/\D/g, '');
  let soma = 0;
  for (let i = 0; i < apenasDigitos.length; i++) {
    soma += parseInt(apenasDigitos[i]);
  }
  return reduzirNumero(soma);
}

/**
 * Função para descobrir o signo baseado na data
 */
function descobrirSigno(data: string): string {
  const [ano, mes, dia] = data.split('-').map(Number);
  
  if ((mes === 3 && dia >= 21) || (mes === 4 && dia <= 20)) return 'Áries';
  if ((mes === 4 && dia >= 21) || (mes === 5 && dia <= 20)) return 'Touro';
  if ((mes === 5 && dia >= 21) || (mes === 6 && dia <= 20)) return 'Gêmeos';
  if ((mes === 6 && dia >= 21) || (mes === 7 && dia <= 22)) return 'Câncer';
  if ((mes === 7 && dia >= 23) || (mes === 8 && dia <= 22)) return 'Leão';
  if ((mes === 8 && dia >= 23) || (mes === 9 && dia <= 22)) return 'Virgem';
  if ((mes === 9 && dia >= 23) || (mes === 10 && dia <= 22)) return 'Libra';
  if ((mes === 10 && dia >= 23) || (mes === 11 && dia <= 21)) return 'Escorpião';
  if ((mes === 11 && dia >= 22) || (mes === 12 && dia <= 21)) return 'Sagitário';
  if ((mes === 12 && dia >= 22) || (mes === 1 && dia <= 20)) return 'Capricórnio';
  if ((mes === 1 && dia >= 21) || (mes === 2 && dia <= 19)) return 'Aquário';
  if ((mes === 2 && dia >= 20) || (mes === 3 && dia <= 20)) return 'Peixes';
  
  return 'Desconhecido';
}

/**
 * Handler POST para gerar o combo personalizado
 */
export async function POST(request: NextRequest) {
  try {
    // --- ANÁLISE CRÍTICA ---
    // Esta é a rota que efetivamente gera o combo e tem um custo (chamada da OpenAI).
    // É IMPERATIVO que ela seja protegida. Não podemos confiar apenas na validação
    // do frontend. A verificação final DEVE acontecer aqui no backend.
    //
    // FLUXO DESTA ROTA:
    // 1. Recebe nome, data e o E-MAIL do cliente.
    // 2. Antes de fazer qualquer coisa, valida no Supabase se o e-mail tem
    //    permissão para gerar (compra existe E combo_gerado = false).
    // 3. Se a validação falhar, retorna erro.
    // 4. Se a validação passar, executa toda a lógica de geração com a OpenAI.
    // 5. APÓS gerar o HTML com sucesso, atualiza a tabela 'compras' no Supabase,
    //    marcando 'combo_gerado' como TRUE para aquele e-mail.
    // 6. Retorna o HTML para o frontend.

    const body = await request.json();
    const { nome, data, email } = body;

    // Validação básica de entrada
    if (!nome || !data || !email) {
      return NextResponse.json(
        { error: 'Nome, data e e-mail são obrigatórios' },
        { status: 400 }
      );
    }
    
    const userEmail = email.toLowerCase().trim();

    // --- CAMADA DE SEGURANÇA FINAL ---
    // Verifica o acesso ANTES de gastar com a API da OpenAI
    const { data: compra, error: erroAcesso } = await supabase
      .from('compras')
      .select('combo_gerado')
      .eq('email', userEmail)
      .single();

    if (erroAcesso || !compra) {
        return NextResponse.json(
          { error: 'Acesso não autorizado. Pagamento não encontrado.' },
          { status: 403 }
        );
    }

    if (compra.combo_gerado) {
        return NextResponse.json(
          { error: 'Este combo já foi gerado. A geração é permitida apenas uma vez.' },
          { status: 403 }
        );
    }

    // Calcular dados numerológicos e astrológicos
    const signo = descobrirSigno(data);
    const numeroNome = calcularNumeroNome(nome);
    const numeroData = calcularNumeroData(data);

    // Montar o prompt para a OpenAI
    const prompt = `Você é o assistente oficial da ATB Tarot e vai gerar um HTML completo de um PDF espiritual personalizado.

Dados da pessoa:
- Nome completo: ${nome}
- Data de nascimento: ${data}
- Signo: ${signo}
- Número da numerologia do nome: ${numeroNome}
- Número da numerologia da data de nascimento: ${numeroData}

Gere um HTML COMPLETO, com tags <html>, <head>, <body>, seguindo EXATAMENTE esta estrutura:

1) CAPA
   - <h1> "Combo 3 em 1 ATB – Numerologia, Mapa Astral e Limpeza Espiritual"
   - <h2> com nome e data
   - IMAGEM: Adicione uma imagem espiritual de capa (use: https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=400&fit=crop)
   - Um parágrafo de boas-vindas começando com "QUERIDA ALMA" falando diretamente com ${nome} em segunda pessoa ("você")

2) APRESENTAÇÃO
   - <h2> "Apresentação"
   - IMAGEM: Adicione imagem de cristais/espiritualidade (use: https://images.unsplash.com/photo-1602524206684-76b7ba8a9d76?w=600&h=400&fit=crop)
   - Explicar que o material foi personalizado para ${nome}, nascido(a) em ${data}, signo ${signo}
   - Mencionar explicitamente:
     * número do nome: ${numeroNome}
     * número da data: ${numeroData}
   - Tom acolhedor e responsável (sem prometer cura, dinheiro, resultados garantidos)

3) PARTE 1 – NUMEROLOGIA ATB
   - <h2> "Parte 1 – Numerologia ATB"
   - IMAGEM: Adicione imagem de números místicos (use: https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=400&fit=crop)
   - Explicar o que representa o número do nome ${numeroNome}
   - Explicar o que representa o número da data ${numeroData}
   - Falar de tendências energéticas, personalidade, caminho de vida, etc.
   - Falar sempre em segunda pessoa

4) PARTE 2 – MAPA ASTRAL / SIGNO
   - <h2> "Parte 2 – Seu Signo e Caminho Astrológico"
   - IMAGEM: Adicione imagem de constelações/zodíaco (use: https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&h=400&fit=crop)
   - Dizer claramente "Seu signo é ${signo}"
   - Descrever:
     * características principais do signo
     * pontos fortes
     * desafios
     * como isso se expressa em amor, trabalho e espiritualidade
   - Tom de mini mapa astral, com conselhos e reflexões, sem determinismo

5) PARTE 3 – LIMPEZA ESPIRITUAL ATB
   - <h2> "Parte 3 – Limpeza Espiritual ATB"
   - IMAGEM: Adicione imagem de velas/ervas (use: https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=400&fit=crop)
   - Explicar o objetivo da limpeza: renovar energia, cortar pesos, abrir caminhos
   - Descrever ritual com:
     * ervas (arruda, alecrim, sálvia)
     * vela de 7 dias
     * papel com nome e data de ${nome}
   - Criar um passo a passo em <ul><li>…</li></ul>:
     * preparar ambiente
     * preparar ervas
     * acender a vela com intenção
     * escrever no papel "${nome} – ${data}"
     * oração ou afirmações positivas
   - Incluir um exemplo de oração:
     "Eu, ${nome}, nascido(a) em ${data}, peço que toda energia pesada seja transmutada em luz, proteção e abertura de caminhos."
   - Deixar claro que é apoio espiritual/energético e não substitui acompanhamento médico, psicológico, financeiro ou jurídico

6) ENCERRAMENTO
   - <h2> "Encerramento"
   - IMAGEM: Adicione imagem de luz/esperança (use: https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop)
   - Mensagem de gratidão, dizendo para ${nome} voltar ao material sempre que quiser
   - Reforçar que ele(a) é protagonista da própria jornada
   - Lembrar que nada substitui profissionais humanos em saúde, finanças, direito etc.

REGRAS IMPORTANTES PARA AS IMAGENS:
- Use a tag <img> com style inline para centralizar e dimensionar
- Exemplo: <img src="URL" alt="descrição" style="width: 100%; max-width: 600px; height: auto; margin: 20px auto; display: block; border-radius: 10px;">
- Adicione as imagens LOGO APÓS cada título de seção
- Use APENAS as URLs fornecidas acima (são de bancos públicos permitidos)

REGRAS IMPORTANTES PARA O TEXTO:
- Idioma: português brasileiro
- Tom: espiritual, acolhedor, gentil, direto, estilo canal de tarot/numerologia
- SEMPRE comece a mensagem de boas-vindas com "QUERIDA ALMA"
- Sempre falar com a pessoa usando "você"
- NÃO usar termos como "cura garantida", "certeza absoluta", "riqueza garantida"
- Responda SOMENTE com o HTML completo, sem explicações adicionais
- Use estilos CSS inline para formatação bonita (fontes legíveis, cores suaves, espaçamento adequado)
- O HTML deve ser bem formatado e pronto para conversão em PDF`;

    // Chamar a API da OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em gerar conteúdo espiritual personalizado em formato HTML com imagens.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    // Extrair o HTML da resposta
    const html = completion.choices[0]?.message?.content || '';

    // --- ATUALIZAÇÃO PÓS-GERAÇÃO ---
    // Se a geração do HTML foi bem-sucedida, marcamos no banco de dados
    // que o combo foi utilizado para este e-mail.
    const { error: updateError } = await supabase
      .from('compras')
      .update({ combo_gerado: true })
      .eq('email', userEmail);
      
    if (updateError) {
      // Se a atualização falhar, o sistema continua funcionando, mas logamos o erro
      // pois é importante saber que este usuário poderia gerar o combo novamente.
      console.error(`❌ Falha ao marcar combo como gerado para o e-mail: ${userEmail}`, updateError);
    }

    // Retornar o resultado
    return NextResponse.json({
      html,
    });

  } catch (error) {
    console.error('Erro ao gerar combo:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar o combo. Tente novamente.' },
      { status: 500 }
    );
  }
}
