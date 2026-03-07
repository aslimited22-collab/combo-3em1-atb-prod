'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { t, isValidLang, type Lang } from '@/lib/translations';

interface ComboResponse {
  success: boolean;
  html: string;
  analises?: {
    nome: string;
    signoZodiacal: string;
    numerologia: string;
    mapaAstral: string;
    limpezaEspiritual: string;
  };
}

interface ClientData {
  nome: string;
  email: string;
  signoZodiacal?: string;
}

export default function EntregaContent() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get('lang');
  const lang: Lang = isValidLang(langParam) ? langParam : 'pt';

  const [loading, setLoading] = useState(true);
  const [downloaded, setDownloaded] = useState(false);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [comboHtml, setComboHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const email = searchParams.get('email');
        const dataNascimento = searchParams.get('data');
        const nome = searchParams.get('nome');

        if (!email || !dataNascimento || !nome) {
          setError(t(lang, 'entrega.error.params'));
          setLoading(false);
          return;
        }

        const client: ClientData = { nome, email };
        setClientData(client);

        const response = await fetch('/api/gerar-combo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, data: dataNascimento, email, lang }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || t(lang, 'entrega.error.generic'));
          setLoading(false);
          return;
        }

        const data: ComboResponse = await response.json();

        if (data.success && data.html) {
          setComboHtml(data.html);

          if (data.analises) {
            setClientData(prev => ({
              ...prev!,
              signoZodiacal: data.analises?.signoZodiacal,
            }));
          }
        } else {
          setError(t(lang, 'entrega.error.generic'));
        }

        const downloadKey = `combo_downloaded_${email}`;
        const wasDownloaded = localStorage.getItem(downloadKey);
        setDownloaded(!!wasDownloaded);

      } catch (err) {
        setError(t(lang, 'entrega.error.load'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [searchParams, lang]);

  const handleDownload = () => {
    if (!clientData || !comboHtml) return;

    const blob = new Blob([comboHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapa-espiritual-${clientData.nome.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const downloadKey = `combo_downloaded_${clientData.email}`;
    localStorage.setItem(downloadKey, new Date().toISOString());
    setDownloaded(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0B0B] via-[#1a0933] to-[#2d1b4e] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 bg-[#d4af37] rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
        </div>

        <div className="text-center space-y-8 relative z-10 max-w-xl w-full">
          <div className="relative">
            <Sparkles className="w-20 h-20 text-[#d4af37] mx-auto relative animate-pulse" />
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-purple-400 to-[#d4af37] animate-pulse">
              {t(lang, 'entrega.loading.title')}
            </h2>
          </div>

          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="flex items-center justify-center gap-3 text-purple-200 bg-black/40 backdrop-blur-xl px-8 py-4 rounded-full border border-[#d4af37]/30">
              <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
              <span className="text-lg">{t(lang, 'entrega.loading.subtitle')}</span>
            </div>

            <div className="w-full bg-purple-900/30 rounded-full h-2 mt-2">
              <div className="bg-gradient-to-r from-[#d4af37] to-purple-400 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>

            <div className="bg-red-900/40 border-2 border-red-500 rounded-2xl px-8 py-4 mt-2 w-full text-center">
              <p className="text-red-200 text-lg font-bold">{t(lang, 'entrega.loading.dontclose')}</p>
              <p className="text-red-300 text-sm mt-1">{t(lang, 'entrega.loading.wait')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0B0B] via-[#1a0933] to-[#2d1b4e] flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-black/40 backdrop-blur-xl border-[#d4af37] p-12 text-center space-y-6">
          <h2 className="text-4xl font-bold text-white">{t(lang, 'entrega.error.title')}</h2>
          <p className="text-purple-300 text-lg">{error}</p>
        </Card>
      </div>
    );
  }

  if (downloaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0B0B] via-[#1a0933] to-[#2d1b4e] flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-black/40 backdrop-blur-xl border-[#d4af37] p-12 text-center space-y-6">
          <h2 className="text-4xl font-bold text-white">{t(lang, 'entrega.downloaded.title')}</h2>
          <p className="text-purple-300 text-lg">{t(lang, 'entrega.downloaded.description')}</p>
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-xl p-4 text-left">
            <p className="text-blue-200 text-sm">📁 {t(lang, 'entrega.download.instruction')}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0B0B] via-[#1a0933] to-[#2d1b4e] relative overflow-hidden">
      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">

          {/* Banner de alerta + Botão de salvar — ANTES do conteúdo */}
          <div className="mb-8 space-y-4">
            <div className="bg-yellow-600/20 border-2 border-yellow-500 rounded-2xl p-5 text-center">
              <p className="text-yellow-200 text-base font-bold">{t(lang, 'entrega.save.banner')}</p>
            </div>

            <Card className="bg-gradient-to-br from-green-900/60 to-[#1a3a2a]/60 backdrop-blur-xl border-2 border-green-500 p-6 md:p-8 text-center shadow-2xl">
              <div className="space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  {t(lang, 'entrega.download.title')}
                </h3>

                <Button
                  onClick={handleDownload}
                  disabled={!comboHtml}
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xl px-8 py-8 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-white/20"
                >
                  <Download className="w-7 h-7 mr-3" />
                  {t(lang, 'entrega.download.button')}
                </Button>

                <p className="text-green-200 text-sm">{t(lang, 'entrega.download.instruction')}</p>
              </div>
            </Card>
          </div>

          {comboHtml && (
            <div className="mb-16">
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                <iframe
                  srcDoc={comboHtml}
                  className="w-full h-screen border-0"
                  title={t(lang, 'entrega.iframe.title')}
                />
              </div>
            </div>
          )}

          {/* Botão de salvar repetido abaixo do conteúdo */}
          <div className="space-y-8 mb-16">
            <Card className="bg-gradient-to-br from-green-900/60 to-[#1a3a2a]/60 backdrop-blur-xl border-2 border-green-500 p-8 md:p-12 text-center shadow-2xl">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <Download className="w-16 h-16 text-green-400" />
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-white">
                  {t(lang, 'entrega.download.title')}
                </h3>

                <div className="flex flex-col items-center gap-4 py-4">
                  <Button
                    onClick={handleDownload}
                    disabled={!comboHtml}
                    size="lg"
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xl px-8 py-8 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-white/20"
                  >
                    <Download className="w-7 h-7 mr-3" />
                    {t(lang, 'entrega.download.button')}
                  </Button>
                  <p className="text-green-200 text-sm">{t(lang, 'entrega.download.instruction')}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
