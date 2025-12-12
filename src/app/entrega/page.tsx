'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Download, Sparkles, Moon, Sun, Star, Heart, Eye, Crown, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  numeroDestino?: number;
  numeroExpressao?: number;
  numeroSoul?: number;
}

export default function EntregaPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [comboHtml, setComboHtml] = useState<string>('');
  const [analises, setAnalises] = useState({
    numerologia: '',
    mapaAstral: '',
    limpezaEspiritual: ''
  });
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

        // Dados do cliente
        const client: ClientData = {
          nome,
          email,
        };

        setClientData(client);

        // Chama o endpoint gerar-combo que já tem toda a lógica
        const response = await fetch('/api/gerar-combo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome,
            data: dataNascimento,
            email,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Erro ao gerar combo');
          setLoading(false);
          return;
        }

        const data: ComboResponse = await response.json();

        if (data.success) {
          setComboHtml(data.html);
          if (data.analises) {
            setAnalises({
              numerologia: data.analises.numerologia,
              mapaAstral: data.analises.mapaAstral,
              limpezaEspiritual: data.analises.limpezaEspiritual,
            });
            setClientData(prev => ({
              ...prev!,
              signoZodiacal: data.analises?.signoZodiacal,
            }));
          }
          
          // Verifica se já foi baixado (localStorage como backup)
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

    // Marca como baixado
    const downloadKey = `combo_downloaded_${clientData.email}`;
    localStorage.setItem(downloadKey, new Date().toISOString());
    setDownloaded(true);
  };

  // Estado de carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0B0B] via-[#1a0933] to-[#2d1b4e] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Partículas flutuantes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 bg-[#d4af37] rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
          <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-pulse"></div>
        </div>

        <div className="text-center space-y-8 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <Sparkles className="w-20 h-20 text-[#d4af37] mx-auto opacity-50" />
            </div>
            <Sparkles className="w-20 h-20 text-[#d4af37] mx-auto relative animate-pulse" />
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-purple-400 to-[#d4af37] animate-pulse">
              ATB está canalizando suas energias...
            </h2>
            <p className="text-[#d4af37] text-xl font-semibold">
              ✨ Preparando seu mapa espiritual exclusivo ✨
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="flex items-center justify-center gap-3 text-purple-200 bg-black/40 backdrop-blur-xl px-8 py-4 rounded-full border border-[#d4af37]/30">
              <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
              <span className="text-lg">Canalizando as mensagens do universo...</span>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="flex flex-col items-center gap-2 text-purple-300">
                <div className="w-12 h-12 rounded-full bg-purple-900/50 flex items-center justify-center border-2 border-purple-400 animate-pulse">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-sm">Numerologia</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-purple-300">
                <div className="w-12 h-12 rounded-full bg-purple-900/50 flex items-center justify-center border-2 border-purple-400 animate-pulse delay-100">
                  <Star className="w-6 h-6" />
                </div>
                <span className="text-sm">Mapa Astral</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-purple-300">
                <div className="w-12 h-12 rounded-full bg-purple-900/50 flex items-center justify-center border-2 border-purple-400 animate-pulse delay-200">
                  <Flame className="w-6 h-6" />
                </div>
                <span className="text-sm">Limpeza</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0B0B] via-[#1a0933] to-[#2d1b4e] flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-black/40 backdrop-blur-xl border-[#d4af37] p-12 text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse">
              <Star className="w-20 h-20 text-red-500 mx-auto opacity-30" />
            </div>
            <Star className="w-20 h-20 text-red-500 mx-auto relative" />
          </div>
          <h2 className="text-4xl font-bold text-white">Erro ao carregar</h2>
          <p className="text-purple-300 text-lg">{error}</p>
          <p className="text-gray-400 text-sm mt-8">
            Verifique se sua URL está correta ou entre em contato com nosso suporte.
          </p>
        </Card>
      </div>
    );
  }

  // Estado de já baixado
  if (downloaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0B0B] via-[#1a0933] to-[#2d1b4e] flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-black/40 backdrop-blur-xl border-[#d4af37] p-12 text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse">
              <Star className="w-20 h-20 text-[#d4af37] mx-auto opacity-30" />
            </div>
            <Star className="w-20 h-20 text-[#d4af37] mx-auto relative" />
          </div>
          <h2 className="text-4xl font-bold text-white">Produto já entregue</h2>
          <p className="text-purple-300 text-lg">
            Você já realizou o download do seu mapa espiritual.
          </p>
          <p className="text-[#d4af37]">
            Por questões de segurança e exclusividade, cada produto pode ser baixado apenas uma vez.
          </p>
          <p className="text-gray-400 text-sm mt-8">
            Caso tenha perdido o arquivo, entre em contato com nosso suporte.
          </p>
        </Card>
      </div>
    );
  }

  // Estado principal - exibição do combo
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0B0B] via-[#1a0933] to-[#2d1b4e] relative overflow-hidden">
      {/* Partículas místicas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-2 h-2 bg-[#d4af37] rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-300 rounded-full animate-ping"></div>
      </div>

      <div className="relative z-10 p-4 md:p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-16">
          <div className="relative h-80 rounded-3xl overflow-hidden mb-8 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1400&h=400&fit=crop"
              alt="Universo místico"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent"></div>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 animate-ping">
                  <div className="w-40 h-40 rounded-full bg-[#d4af37] opacity-20"></div>
                </div>
                <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-[#d4af37] shadow-2xl shadow-[#d4af37]/70">
                  <img
                    src="https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=400&h=400&fit=crop"
                    alt="Cartas de Tarot"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-[#d4af37] to-purple-600 rounded-full flex items-center justify-center border-4 border-[#0B0B0B] animate-pulse">
                  <Crown className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mb-4">
                <Moon className="w-10 h-10 text-[#d4af37] animate-pulse" />
                <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-purple-300 to-[#d4af37]">
                  ATB TAROT
                </h1>
                <Sun className="w-10 h-10 text-[#d4af37] animate-pulse" />
              </div>

              <p className="text-2xl md:text-3xl text-purple-200 font-semibold mb-2">
                Seu Mapa Espiritual Exclusivo
              </p>
              <div className="flex items-center gap-2 text-[#d4af37]">
                <Star className="w-5 h-5" />
                <Star className="w-6 h-6" />
                <Star className="w-7 h-7" />
                <Star className="w-6 h-6" />
                <Star className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Card de boas-vindas */}
          <Card className="bg-gradient-to-r from-purple-900/60 to-[#2d1b4e]/60 backdrop-blur-xl border-2 border-[#d4af37] p-8 md:p-12 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-[#d4af37] rounded-2xl blur-xl opacity-30 animate-pulse"></div>
                <div className="relative w-48 h-64 rounded-2xl overflow-hidden border-4 border-[#d4af37] shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=400&h=600&fit=crop"
                    alt="Cartas de Tarot ATB"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white font-bold text-lg">ATB Taróloga</p>
                    <p className="text-[#d4af37] text-sm">Especialista em Tarot & Astrologia</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-8 h-8 text-[#d4af37] animate-pulse" />
                  <h2 className="text-3xl md:text-4xl font-bold text-white">
                    Olá, {clientData?.nome}! ✨
                  </h2>
                </div>

                <div className="space-y-3 text-lg">
                  <p className="text-purple-200 leading-relaxed">
                    É com imenso carinho e dedicação que preparei este material <span className="text-[#d4af37] font-semibold">exclusivamente para você</span>.
                    Cada palavra foi cuidadosamente canalizada após horas de conexão profunda com as energias cósmicas.
                  </p>

                  <p className="text-purple-100 leading-relaxed italic">
                    "Mergulhei nos mistérios do universo, interpretei os sinais das estrelas e decodifiquei
                    os números sagrados da sua existência. Este não é apenas um produto - é uma <span className="text-[#d4af37] font-bold">jornada de autoconhecimento</span>
                    que preparei especialmente para iluminar seu caminho."
                  </p>

                  <div className="flex items-start gap-3 bg-black/40 p-4 rounded-xl border border-[#d4af37]/30 mt-6">
                    <Eye className="w-6 h-6 text-[#d4af37] flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-white font-semibold mb-1">O que você vai descobrir:</p>
                      <ul className="text-purple-200 space-y-1 text-base">
                        <li>• Sua essência numerológica e propósito de vida</li>
                        <li>• Mapa astral completo com posições planetárias</li>
                        <li>• Ritual personalizado de limpeza energética</li>
                        <li>• Orientações práticas para sua jornada espiritual</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[#d4af37]/30">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#d4af37]">
                    <img
                      src="https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=100&h=100&fit=crop"
                      alt="Assinatura ATB"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[#d4af37] font-bold text-lg">Com amor e luz,</p>
                    <p className="text-purple-300 italic">ATB - Sua guia espiritual 💜</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Exibe o HTML gerado pelo gerar-combo */}
        {comboHtml && (
          <div className="max-w-7xl mx-auto mb-16">
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                srcDoc={comboHtml}
                className="w-full h-screen border-0"
                title="Seu Mapa Espiritual"
              />
            </div>
          </div>
        )}

        {/* Botão de download */}
        <div className="max-w-7xl mx-auto space-y-8 mb-16">
          <Card className="bg-gradient-to-br from-purple-900/60 to-[#2d1b4e]/60 backdrop-blur-xl border-2 border-[#d4af37] p-8 md:p-12 text-center shadow-2xl">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#d4af37] blur-2xl opacity-50 animate-pulse"></div>
                  <Download className="relative w-20 h-20 text-[#d4af37]" />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-3xl md:text-4xl font-bold text-white">
                  Baixe Seu Mapa Espiritual Completo
                </h3>
                <p className="text-xl text-purple-200 max-w-2xl mx-auto">
                  Receba todo o conteúdo exclusivo preparado pela ATB em um único arquivo
                  para consultar sempre que precisar
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 py-6">
                <Button
                  onClick={handleDownload}
                  disabled={!comboHtml}
                  size="lg"
                  className="bg-gradient-to-r from-[#d4af37] via-purple-600 to-[#d4af37] hover:from-[#e5c158] hover:via-purple-700 hover:to-[#e5c158] text-white font-bold text-xl px-16 py-8 rounded-full shadow-2xl hover:shadow-[#d4af37]/70 transition-all duration-300 hover:scale-105 border-2 border-white/20"
                >
                  <Download className="w-7 h-7 mr-3" />
                  Baixar Meu Mapa Espiritual Exclusivo
                </Button>

                <div className="flex items-center gap-2 text-[#d4af37] bg-black/40 px-6 py-3 rounded-full border border-[#d4af37]/30">
                  <Sparkles className="w-5 h-5" />
                  <p className="font-semibold">
                    Download único e exclusivo - Aproveite agora!
                  </p>
                </div>
              </div>

              <div className="bg-black/40 p-6 rounded-2xl border border-[#d4af37]/20 max-w-2xl mx-auto">
                <p className="text-purple-200 text-sm leading-relaxed">
                  ⚠️ <span className="font-bold text-[#d4af37]">IMPORTANTE:</span> Por questões de segurança
                  e exclusividade, este produto pode ser baixado apenas <span className="text-white font-bold">UMA ÚNICA VEZ</span>.
                  Certifique-se de salvar o arquivo em um local seguro após o download.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center space-y-6 pb-16">
          <div className="flex items-center justify-center gap-3">
            <Star className="w-5 h-5 text-[#d4af37] animate-pulse" />
            <Star className="w-6 h-6 text-[#d4af37] animate-pulse delay-100" />
            <Star className="w-8 h-8 text-[#d4af37] animate-pulse delay-200" />
            <Star className="w-6 h-6 text-[#d4af37] animate-pulse delay-100" />
            <Star className="w-5 h-5 text-[#d4af37] animate-pulse" />
          </div>

          <div className="space-y-2">
            <p className="text-2xl text-purple-200 italic font-semibold">
              "O universo conspira a favor daqueles que buscam a luz interior"
            </p>
            <p className="text-[#d4af37] text-lg">
              ✨ ATB Tarot - Guiando almas desde 2010 ✨
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-6">
            <Moon className="w-6 h-6 text-[#d4af37]" />
            <p className="text-gray-400">
              © 2024 ATB Tarot - Todos os direitos reservados
            </p>
            <Sun className="w-6 h-6 text-[#d4af37]" />
          </div>
        </div>
      </div>
    </div>
  );
}
