'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail, Calendar, Sparkles, Moon, Sun, Star, Heart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { t, isValidLang, type Lang } from '@/lib/translations';

export default function AcessoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const langParam = searchParams.get('lang');
  const lang: Lang = isValidLang(langParam) ? langParam : 'pt';

  const [stage, setStage] = useState<'email' | 'data'>('email');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ nome: string; email: string } | null>(null);

  const handleValidarEmail = async () => {
    if (!email) {
      setError(t(lang, 'home.email.error.empty'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/validar-acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.acesso) {
        setError(t(lang, 'home.email.error.notfound'));
        setLoading(false);
        return;
      }

      setUserData({
        nome: data.usuario.nome || 'Cliente',
        email: data.usuario.customer_email || email,
      });

      setStage('data');
      setError(null);
    } catch (err) {
      setError(t(lang, 'home.email.error.generic'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGerarCombo = async () => {
    if (!dataNascimento) {
      setError(t(lang, 'home.date.error.empty'));
      return;
    }

    if (!userData) {
      setError(t(lang, 'home.date.error.data'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setLoading(false);
      router.push(
        `/entrega?email=${encodeURIComponent(userData.email)}&data=${encodeURIComponent(dataNascimento)}&nome=${encodeURIComponent(userData.nome)}&lang=${lang}`
      );
    } catch (err) {
      setError(t(lang, 'home.date.error.redirect'));
      console.error(err);
      setLoading(false);
    }
  };

  const handleVoltar = () => {
    setStage('email');
    setDataNascimento('');
    setUserData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0B0B] via-[#1a0933] to-[#2d1b4e] relative overflow-hidden p-4 flex items-center justify-center">
      {/* Partículas místicas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-2 h-2 bg-[#d4af37] rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-300 rounded-full animate-ping"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Moon className="w-10 h-10 text-[#d4af37] animate-pulse" />
            <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-purple-300 to-[#d4af37]">
              {t(lang, 'home.title')}
            </h1>
            <Sun className="w-10 h-10 text-[#d4af37] animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              {t(lang, 'home.subtitle')}
            </h2>
            <p className="text-purple-200 text-lg">
              {t(lang, 'home.description')}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-[#d4af37]">
            <Star className="w-5 h-5" />
            <Star className="w-6 h-6" />
            <Star className="w-7 h-7" />
            <Star className="w-6 h-6" />
            <Star className="w-5 h-5" />
          </div>
        </div>

        {/* Card Principal */}
        <Card className="bg-gradient-to-br from-purple-900/60 to-[#2d1b4e]/60 backdrop-blur-xl border-2 border-[#d4af37] p-8 md:p-12 shadow-2xl">
          <div className="space-y-8">
            {/* Título da seção */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <Sparkles className="w-12 h-12 text-[#d4af37] animate-pulse" />
              </div>
              <h3 className="text-3xl font-bold text-white">
                {stage === 'email' ? t(lang, 'home.stage.email.title') : t(lang, 'home.stage.data.title')}
              </h3>
              <p className="text-purple-200">
                {stage === 'email'
                  ? t(lang, 'home.stage.email.description')
                  : t(lang, 'home.stage.data.description')}
              </p>
            </div>

            {/* ESTÁGIO 1: EMAIL */}
            {stage === 'email' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-white font-semibold text-lg">
                    <Mail className="w-5 h-5 inline mr-2 text-[#d4af37]" />
                    {t(lang, 'home.email.label')}
                  </label>
                  <input
                    type="email"
                    placeholder={t(lang, 'home.email.placeholder')}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    disabled={loading}
                    className="w-full px-6 py-4 bg-black/40 border-2 border-[#d4af37]/50 rounded-2xl text-white placeholder-purple-400 focus:border-[#d4af37] focus:outline-none transition-all disabled:opacity-50"
                  />
                </div>

                {error && (
                  <div className="bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-red-300">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleValidarEmail}
                  disabled={loading || !email}
                  size="lg"
                  className="w-full bg-gradient-to-r from-[#d4af37] via-purple-600 to-[#d4af37] hover:from-[#e5c158] hover:via-purple-700 hover:to-[#e5c158] text-white font-bold text-lg py-6 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-white/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t(lang, 'home.email.loading')}
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      {t(lang, 'home.email.button')}
                    </>
                  )}
                </Button>

                <p className="text-center text-purple-300 text-sm">
                  {t(lang, 'home.email.hint')}
                </p>
              </div>
            )}

            {/* ESTÁGIO 2: DATA DE NASCIMENTO */}
            {stage === 'data' && userData && (
              <div className="space-y-6">
                <div className="bg-black/40 p-6 rounded-2xl border border-[#d4af37]/30">
                  <div className="flex items-center gap-3 mb-4">
                    <Heart className="w-6 h-6 text-[#d4af37]" />
                    <div>
                      <p className="text-purple-300 text-sm">{t(lang, 'home.welcome')}</p>
                      <p className="text-white font-bold text-lg">{userData.nome}</p>
                    </div>
                  </div>
                  <p className="text-purple-200 text-sm">{userData.email}</p>
                </div>

                <div className="space-y-3">
                  <label className="block text-white font-semibold text-lg">
                    <Calendar className="w-5 h-5 inline mr-2 text-[#d4af37]" />
                    {t(lang, 'home.date.label')}
                  </label>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => {
                      setDataNascimento(e.target.value);
                      setError(null);
                    }}
                    disabled={loading}
                    className="w-full px-6 py-4 bg-black/40 border-2 border-[#d4af37]/50 rounded-2xl text-white focus:border-[#d4af37] focus:outline-none transition-all disabled:opacity-50"
                  />
                  <p className="text-purple-300 text-sm">{t(lang, 'home.date.hint')}</p>
                </div>

                {error && (
                  <div className="bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-red-300">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={handleVoltar}
                    disabled={loading}
                    size="lg"
                    variant="outline"
                    className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10"
                  >
                    {t(lang, 'home.back')}
                  </Button>
                  <Button
                    onClick={handleGerarCombo}
                    disabled={loading || !dataNascimento}
                    size="lg"
                    className="bg-gradient-to-r from-[#d4af37] via-purple-600 to-[#d4af37] hover:from-[#e5c158] hover:via-purple-700 hover:to-[#e5c158] text-white font-bold py-6 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-white/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {t(lang, 'home.generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        {t(lang, 'home.generate')}
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-start gap-3 bg-purple-900/30 p-4 rounded-2xl border border-[#d4af37]/20">
                  <Eye className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-1" />
                  <p className="text-purple-200 text-sm">
                    {t(lang, 'home.combo.info')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-purple-300 italic text-lg">
            {t(lang, 'home.footer.quote')}
          </p>
          <p className="text-[#d4af37]">
            {t(lang, 'home.footer.brand')}
          </p>
          <p className="text-gray-500 text-sm">
            {t(lang, 'home.footer.copy')}
          </p>
        </div>
      </div>
    </div>
  );
}
