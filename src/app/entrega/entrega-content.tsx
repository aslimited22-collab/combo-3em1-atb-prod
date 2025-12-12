'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Download, Sparkles, Moon, Sun, Star, Heart, Eye, Crown, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
          setError('Parâmetros inválidos. Verifique sua URL.');
          setLoading(false);
          return;
        }

        const client: ClientData = { nome, email };
        setClientData(client);

        const response = await fetch('/api/gerar-combo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, data: dataNascimento, email }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Erro ao gerar combo');
          setLoading(false);
          return;
        }

        const data: ComboResponse = await response.json();
        console.log('✅ Response recebida:', data);
        console.log('📄 HTML recebido?', !!data.html);
        console.log('✅ Success?', data.success);
        if (data.success && data.html) {
          console.log('🎉 HTML recebido! Tamanho:', data.html.length);
          setComboHtml(data.html);
          
          if (data.analises) {
            setClientData(prev => ({
              ...prev!,
              signoZodiacal: data.analises?.signoZodiacal,
            }));
          }
          
          setLoading(false);
          return;
        } else {
          console.log('❌ Erro: HTML vazio ou success false');
          setError('Erro ao gerar combo');
          setLoading(false);
        }
      }

      const downloadKey = `combo_downloaded_${email}`;
          const wasDownloaded = localStorage.getItem(downloadKey);
          setDownloaded(!!wasDownloaded);
        }
      } catch (err) {
        setError('Erro ao carregar seu combo. Tente novamente.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [searchParams]);

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

  // [RESTO DO CÓDIGO IGUAL AO QUE VOCÊ TEM]
  // Só copio o JSX da renderização...

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0B0B] via-[#1a0933] to-[#2d1b4e] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 bg-[#d4af37] rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
        </div>

        <div className="text-center space-y-8 relative z-10">
          <div className="relative">
            <Sparkles className="w-20 h-20 text-[#d4af37] mx-auto relative animate-pulse" />
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-purple-400 to-[#d4af37] animate-pulse">
              ATB está canalizando suas energias...
            </h2>
          </div>

          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="flex items-center justify-center gap-3 text-purple-200 bg-black/40 backdrop-blur-xl px-8 py-4 rounded-full border border-[#d4af37]/30">
              <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
              <span className="text-lg">Canalizando as mensagens do universo...</span>
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
          <h2 className="text-4xl font-bold text-white">Erro ao carregar</h2>
          <p className="text-purple-300 text-lg">{error}</p>
        </Card>
      </div>
    );
  }

  if (downloaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0B0B] via-[#1a0933] to-[#2d1b4e] flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-black/40 backdrop-blur-xl border-[#d4af37] p-12 text-center space-y-6">
          <h2 className="text-4xl font-bold text-white">Produto já entregue</h2>
          <p className="text-purple-300 text-lg">Você já realizou o download do seu mapa espiritual.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0B0B] via-[#1a0933] to-[#2d1b4e] relative overflow-hidden">
      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {comboHtml && (
            <div className="mb-16">
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                <iframe
                  srcDoc={comboHtml}
                  className="w-full h-screen border-0"
                  title="Seu Mapa Espiritual"
                />
              </div>
            </div>
          )}

          <div className="space-y-8 mb-16">
            <Card className="bg-gradient-to-br from-purple-900/60 to-[#2d1b4e]/60 backdrop-blur-xl border-2 border-[#d4af37] p-8 md:p-12 text-center shadow-2xl">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <Download className="w-20 h-20 text-[#d4af37]" />
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-white">
                  Baixe Seu Mapa Espiritual Completo
                </h3>

                <div className="flex flex-col items-center gap-4 py-6">
                  <Button
                    onClick={handleDownload}
                    disabled={!comboHtml}
                    size="lg"
                    className="bg-gradient-to-r from-[#d4af37] via-purple-600 to-[#d4af37] hover:from-[#e5c158] hover:via-purple-700 hover:to-[#e5c158] text-white font-bold text-xl px-16 py-8 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-white/20"
                  >
                    <Download className="w-7 h-7 mr-3" />
                    Baixar Meu Mapa Espiritual Exclusivo
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}