'use client';

import { useRouter } from 'next/navigation';
import { Moon, Sun, Star, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { FLAGS, SUPPORTED_LANGS, type Lang } from '@/lib/translations';

const FLAG_SVGS: Record<Lang, string> = {
  pt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 504"><rect width="720" height="504" fill="#009c3b"/><polygon points="360,42 668,252 360,462 52,252" fill="#ffdf00"/><circle cx="360" cy="252" r="112" fill="#002776"/><path d="M232,252 Q360,186 488,252 Q360,210 232,252" fill="#fff"/></svg>`,
  en: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7410 3900"><rect width="7410" height="3900" fill="#b22234"/><path d="M0,450H7410m0,600H0m0,600H7410m0,600H0m0,600H7410m0,600H0" stroke="#fff" stroke-width="300"/><rect width="2964" height="2100" fill="#3c3b6e"/><g fill="#fff"><g id="s18"><g id="s9"><g id="s5"><g id="s4"><path id="s" d="M247,90 317.534230,307.082039 132.873218,172.917961H361.126782L176.465770,307.082039z"/><use href="#s" y="420"/><use href="#s" y="840"/><use href="#s" y="1260"/></g><use href="#s" y="1680"/></g><use href="#s4" x="247" y="210"/></g><use href="#s9" x="494"/></g><use href="#s18" x="988"/><use href="#s9" x="1976"/></g></svg>`,
  es: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 500"><rect width="750" height="500" fill="#c60b1e"/><rect width="750" height="250" y="125" fill="#ffc400"/></svg>`,
  de: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3"><rect width="5" height="3" y="0" fill="#000"/><rect width="5" height="2" y="1" fill="#D00"/><rect width="5" height="1" y="2" fill="#FFCE00"/></svg>`,
  it: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="1" height="2" fill="#009246"/><rect width="1" height="2" x="1" fill="#fff"/><rect width="1" height="2" x="2" fill="#ce2b37"/></svg>`,
};

export default function LanguageSelectPage() {
  const router = useRouter();

  const handleSelectLang = (lang: Lang) => {
    router.push(`/acesso?lang=${lang}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0B0B] via-[#1a0933] to-[#2d1b4e] relative overflow-hidden p-4 flex items-center justify-center">
      {/* Partículas místicas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-2 h-2 bg-[#d4af37] rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-300 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
        <div className="absolute top-60 left-1/2 w-1 h-1 bg-[#d4af37] rounded-full animate-ping"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Moon className="w-10 h-10 text-[#d4af37] animate-pulse" />
            <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-purple-300 to-[#d4af37]">
              ATB TAROT
            </h1>
            <Sun className="w-10 h-10 text-[#d4af37] animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Choose Your Language
            </h2>
            <p className="text-purple-200 text-lg">
              ✨ Selecione seu idioma / Select your language ✨
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

        {/* Card com Bandeiras */}
        <Card className="bg-gradient-to-br from-purple-900/60 to-[#2d1b4e]/60 backdrop-blur-xl border-2 border-[#d4af37] p-8 md:p-12 shadow-2xl">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <Sparkles className="w-12 h-12 text-[#d4af37] animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                Spiritual Map / Mapa Espiritual
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SUPPORTED_LANGS.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleSelectLang(lang)}
                  className="group flex items-center gap-4 p-5 bg-black/40 border-2 border-[#d4af37]/30 rounded-2xl hover:border-[#d4af37] hover:bg-[#d4af37]/10 transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  <div
                    className="w-14 h-10 rounded-lg overflow-hidden border border-white/20 shadow-lg flex-shrink-0"
                    dangerouslySetInnerHTML={{ __html: FLAG_SVGS[lang] }}
                  />
                  <div className="text-left">
                    <p className="text-white font-bold text-lg group-hover:text-[#d4af37] transition-colors">
                      {FLAGS[lang].label}
                    </p>
                    <p className="text-purple-300 text-sm">
                      {FLAGS[lang].country}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-purple-300 italic text-lg">
            &quot;The universe conspires in favor of those who seek the inner light&quot;
          </p>
          <p className="text-[#d4af37]">
            ✨ ATB Tarot - Guiding souls since 2010 ✨
          </p>
          <p className="text-gray-500 text-sm">
            © 2024 ATB Tarot - All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
