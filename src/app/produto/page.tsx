'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { t, isValidLang, type Lang } from '@/lib/translations';

type Etapa = 'VERIFICAR_EMAIL' | 'CARREGANDO' | 'LIBERADO' | 'NEGADO' | 'RESULTADO';

function ProdutoContent() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get('lang');
  const lang: Lang = isValidLang(langParam) ? langParam : 'pt';

  const [etapa, setEtapa] = useState<Etapa>('VERIFICAR_EMAIL');
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<string | null>(null);

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
        setEtapa('LIBERADO');
      } else {
        setError(result.message || t(lang, 'produto.verify.error'));
        setEtapa('NEGADO');
      }
    } catch (err) {
      setError(t(lang, 'produto.verify.connection'));
      setEtapa('NEGADO');
    } finally {
      setLoading(false);
    }
  };

  const handleGerarCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/gerar-combo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, data, email, lang }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t(lang, 'entrega.error.generic'));
      }

      setResultado(result.html);
      setEtapa('RESULTADO');

    } catch (err) {
      setError(err instanceof Error ? err.message : t(lang, 'entrega.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleBaixarCombo = () => {
    if (!resultado) return;

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

  if (etapa === 'RESULTADO' && resultado) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black"></div>

        <div className="relative z-10 p-4">
          {/* Banner de salvar — no topo */}
          <div className="max-w-7xl mx-auto mb-4 bg-green-900/40 border-2 border-green-500 rounded-lg p-5 text-center">
            <p className="text-green-200 text-base font-bold">{t(lang, 'produto.result.save.banner')}</p>
          </div>

          <div className="max-w-7xl mx-auto mb-4 flex flex-col gap-3 bg-gray-900 p-5 rounded-lg border-2 border-green-500">
            <h2 className="text-white text-xl font-bold text-center">{t(lang, 'produto.result.title')}</h2>
            <button
              onClick={handleBaixarCombo}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-lg rounded-lg transition-all"
            >
              {t(lang, 'produto.result.download')}
            </button>
            <p className="text-gray-400 text-xs text-center">{t(lang, 'produto.result.save.instruction')}</p>
          </div>

          <div className="max-w-7xl mx-auto mb-4 bg-yellow-600/20 border-2 border-yellow-500 rounded-lg p-4 text-center">
            <p className="text-yellow-200 text-sm font-semibold">
              {t(lang, 'produto.result.warning')}
            </p>
          </div>

          <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-2xl overflow-hidden border-4 border-green-500">
            <div
              dangerouslySetInnerHTML={{ __html: resultado }}
              className="w-full"
            />
          </div>

          {/* Botão de salvar repetido abaixo do conteúdo */}
          <div className="max-w-7xl mx-auto mt-6 flex flex-col gap-3 bg-gray-900 p-5 rounded-lg border-2 border-green-500">
            <button
              onClick={handleBaixarCombo}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-lg rounded-lg transition-all"
            >
              {t(lang, 'produto.result.download')}
            </button>
            <p className="text-gray-400 text-xs text-center">{t(lang, 'produto.result.save.instruction')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZjAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-t-2xl p-6 text-center border-4 border-purple-500">
            <div className="text-5xl mb-3">✨</div>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider mb-2">
              {t(lang, 'produto.title')}
            </h2>
            <p className="text-purple-100 text-lg font-semibold">
              {t(lang, 'produto.subtitle')}
            </p>
          </div>

          <div className="bg-gradient-to-b from-gray-900 to-black rounded-b-2xl p-8 md:p-12 shadow-2xl border-x-4 border-b-4 border-purple-500">

            {(etapa === 'VERIFICAR_EMAIL' || etapa === 'NEGADO' || etapa === 'CARREGANDO') && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                    {t(lang, 'produto.verify.title')}
                  </h1>
                  <p className="text-gray-300 text-lg md:text-xl font-semibold">
                    {t(lang, 'produto.verify.description')}
                  </p>
                </div>
                <form onSubmit={handleValidarAcesso} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
                      {t(lang, 'produto.verify.label')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-4 bg-black/50 border-2 border-purple-500/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder={t(lang, 'produto.verify.placeholder')}
                    />
                    <p className="text-gray-400 text-xs mt-2 italic">{t(lang, 'produto.verify.hint')}</p>
                  </div>

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
                    {loading ? t(lang, 'produto.verify.loading') : t(lang, 'produto.verify.button')}
                  </button>
                </form>
              </>
            )}

            {etapa === 'LIBERADO' && (
               <>
                <div className="text-center mb-8">
                  <div className="inline-block bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-2 rounded-full text-sm font-bold uppercase mb-4">
                    {t(lang, 'produto.access.badge')}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                    {t(lang, 'produto.access.title')}
                  </h1>
                   <p className="text-gray-300 text-lg md:text-xl font-semibold">
                    {t(lang, 'produto.access.description')}
                  </p>
                </div>

                 <div className="bg-yellow-600/20 border-2 border-yellow-500 rounded-lg p-4 mb-4 text-center">
                    <p className="text-yellow-200 text-sm font-bold">
                      {t(lang, 'produto.access.warning')}
                    </p>
                  </div>

                <form onSubmit={handleGerarCombo} className="space-y-6">
                  <div>
                    <label htmlFor="nome" className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">{t(lang, 'produto.access.name.label')}</label>
                    <input
                      type="text"
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      className="w-full px-4 py-4 bg-black/50 border-2 border-purple-500/50 rounded-lg text-white"
                      placeholder={t(lang, 'produto.access.name.placeholder')}
                    />
                  </div>
                  <div>
                    <label htmlFor="data" className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">{t(lang, 'produto.access.date.label')}</label>
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

                  <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-3 text-center">
                    <p className="text-orange-200 text-xs font-semibold">{t(lang, 'produto.access.dontclose')}</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 disabled:opacity-50 text-white font-black text-lg rounded-lg"
                  >
                    {loading ? t(lang, 'produto.access.generating') : t(lang, 'produto.access.generate')}
                  </button>

                  {loading && (
                    <p className="text-center text-gray-300 text-sm animate-pulse">
                      {t(lang, 'produto.access.wait')}
                    </p>
                  )}
                </form>
               </>
            )}

          </div>

          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm font-semibold">
              {t(lang, 'produto.footer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProdutoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white text-xl animate-pulse">Loading...</div></div>}>
      <ProdutoContent />
    </Suspense>
  );
}
