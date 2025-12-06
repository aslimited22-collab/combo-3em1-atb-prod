'use client';

import { useState } from 'react';

// --- ANÁLISE CRÍTICA ---
// A página do produto foi refatorada para seguir o novo fluxo de validação.
// A lógica antiga baseada em `localStorage` foi removida, pois era insegura.
//
// FLUXO DA PÁGINA:
// 1. A página começa no estado 'VERIFICAR_EMAIL', pedindo o e-mail da compra.
// 2. O usuário insere o e-mail e clica em "Verificar Acesso".
// 3. A função `handleValidarAcesso` é chamada, consultando a API `/api/validar-acesso`.
//    - O estado muda para 'CARREGANDO' durante a consulta.
// 4. Com base na resposta da API:
//    - Se o acesso for 'allowed', o estado muda para 'LIBERADO'.
//      O formulário para gerar o combo (com nome e data) é exibido.
//    - Se o acesso for negado, o estado muda para 'NEGADO', e a mensagem de erro
//      da API é exibida.
// 5. No estado 'LIBERADO', o usuário preenche nome/data e clica em "Gerar Meu Combo".
// 6. A função `handleGerarCombo` é chamada:
//    - Ela envia NOME, DATA e o E-MAIL validado para a API `/api/gerar-combo`.
//    - O backend faz a verificação final e, se tudo estiver OK, gera o combo.
// 7. Se a geração for bem-sucedida, o estado muda para 'RESULTADO', e o HTML
//    gerado é exibido, com a opção de download.

type Etapa = 'VERIFICAR_EMAIL' | 'CARREGANDO' | 'LIBERADO' | 'NEGADO' | 'RESULTADO';

export default function ProdutoPage() {
  // Estado para controlar o fluxo da página
  const [etapa, setEtapa] = useState<Etapa>('VERIFICAR_EMAIL');
  
  // Estado para os dados do formulário
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  
  // Estado para controle de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estado para armazenar o HTML final
  const [resultado, setResultado] = useState<string | null>(null);
  
  /**
   * Passo 1: Valida o e-mail do usuário contra o backend.
   */
  const handleValidarAcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setEtapa('CARREGANDO');

    try {
      const response = await fetch('/api/validar-acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok && result.acesso) {
        setEtapa('LIBERADO'); // Sucesso! Avança para a próxima etapa.
      } else {
        setError(result.message || 'Ocorreu um erro ao validar seu acesso.');
        setEtapa('NEGADO'); // Acesso negado, exibe o erro.
      }
    } catch (err) {
      setError('Não foi possível conectar ao servidor. Tente novamente.');
      setEtapa('NEGADO');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Passo 2: Gera o combo se o acesso foi liberado.
   */
  const handleGerarCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/gerar-combo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, data, email }), // Envia o email junto para validação final
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro desconhecido ao gerar o combo.');
      }
      
      setResultado(result.html);
      setEtapa('RESULTADO'); // Sucesso! Exibe o resultado.

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao gerar seu combo.');
      // Mantém o usuário na etapa 'LIBERADO' para que possa tentar de novo
    } finally {
      setLoading(false);
    }
  };

  const handleBaixarCombo = () => {
    if (!resultado) return;

    // Criar um blob com o HTML e fazer download
    const blob = new Blob([resultado], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combo-3-em-1-${nome.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Se a etapa for 'RESULTADO', mostrar preview
  if (etapa === 'RESULTADO' && resultado) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black"></div>
        
        <div className="relative z-10 p-4">
          {/* Barra de ações */}
          <div className="max-w-7xl mx-auto mb-4 flex flex-wrap gap-4 justify-between items-center bg-gray-900 p-4 rounded-lg border-2 border-green-500">
            <h2 className="text-white text-xl font-bold">✅ Seu Combo foi Gerado!</h2>
            <div className="flex gap-3">
              <button
                onClick={handleBaixarCombo}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition-all"
              >
                📥 Baixar Combo
              </button>
            </div>
          </div>

          {/* Aviso de limite */}
          <div className="max-w-7xl mx-auto mb-4 bg-yellow-600/20 border-2 border-yellow-500 rounded-lg p-4 text-center">
            <p className="text-yellow-200 text-sm font-semibold">
              ⚠️ Você já utilizou sua geração única. Não é possível gerar outro combo.
            </p>
          </div>

          {/* Preview do resultado */}
          <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-2xl overflow-hidden border-4 border-green-500">
            <div 
              dangerouslySetInnerHTML={{ __html: resultado }}
              className="w-full"
            />
          </div>
        </div>
      </div>
    );
  }

  // Renderiza a UI com base na etapa atual
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZjAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-t-2xl p-6 text-center border-4 border-purple-500">
            <div className="text-5xl mb-3">✨</div>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider mb-2">
              Combo Espiritual 3 em 1
            </h2>
            <p className="text-purple-100 text-lg font-semibold">
              Sua jornada de autoconhecimento começa aqui
            </p>
          </div>

          <div className="bg-gradient-to-b from-gray-900 to-black rounded-b-2xl p-8 md:p-12 shadow-2xl border-x-4 border-b-4 border-purple-500">
            
            {/* ETAPA 1: VERIFICAR EMAIL ou NEGADO */}
            {(etapa === 'VERIFICAR_EMAIL' || etapa === 'NEGADO' || etapa === 'CARREGANDO') && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                    Verifique seu Acesso
                  </h1>
                  <p className="text-gray-300 text-lg md:text-xl font-semibold">
                    Digite o mesmo e-mail que você usou na compra.
                  </p>
                </div>
                <form onSubmit={handleValidarAcesso} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
                      E-mail da Compra
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-4 bg-black/50 border-2 border-purple-500/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="seu.email@exemplo.com"
                    />
                  </div>

                  {/* Exibe erro se a etapa for NEGADO */}
                  {etapa === 'NEGADO' && error && (
                    <div className="bg-red-600/20 border-2 border-red-500 rounded-lg p-4">
                      <p className="text-red-200 text-sm font-semibold text-center">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 px-6 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 disabled:opacity-50 text-white font-black text-lg rounded-lg"
                  >
                    {loading ? 'Verificando...' : 'Verificar Acesso'}
                  </button>
                </form>
              </>
            )}

            {/* ETAPA 2: LIBERADO PARA GERAR */}
            {etapa === 'LIBERADO' && (
               <>
                <div className="text-center mb-8">
                  <div className="inline-block bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-2 rounded-full text-sm font-bold uppercase mb-4">
                    ✅ Acesso Liberado!
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                    Gere Seu Combo Personalizado
                  </h1>
                   <p className="text-gray-300 text-lg md:text-xl font-semibold">
                    Preencha os dados abaixo para criar sua análise.
                  </p>
                </div>
                
                 <div className="bg-yellow-600/20 border-2 border-yellow-500 rounded-lg p-4 mb-6 text-center">
                    <p className="text-yellow-200 text-sm font-semibold">
                      ⚠️ ATENÇÃO: Você pode gerar apenas UM combo.
                    </p>
                  </div>

                <form onSubmit={handleGerarCombo} className="space-y-6">
                  <div>
                    <label htmlFor="nome" className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">Nome Completo</label>
                    <input
                      type="text"
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      className="w-full px-4 py-4 bg-black/50 border-2 border-purple-500/50 rounded-lg text-white"
                      placeholder="Digite seu nome completo"
                    />
                  </div>
                  <div>
                    <label htmlFor="data" className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">Data de Nascimento</label>
                    <input
                      type="date"
                      id="data"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      required
                      className="w-full px-4 py-4 bg-black/50 border-2 border-purple-500/50 rounded-lg text-white"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-600/20 border-2 border-red-500 rounded-lg p-4">
                      <p className="text-red-200 text-sm font-semibold">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 disabled:opacity-50 text-white font-black text-lg rounded-lg"
                  >
                    {loading ? 'Gerando seu combo...' : '✨ Gerar Meu Combo 3 em 1'}
                  </button>
                </form>
               </>
            )}
            
          </div>

          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm font-semibold">
              © 2024 ATB Tarot - Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
