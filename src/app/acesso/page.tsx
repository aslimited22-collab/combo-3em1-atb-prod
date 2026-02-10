import { Suspense } from 'react';
import AcessoContent from './acesso-content';

export default function AcessoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#0B0B0B] via-[#1a0933] to-[#2d1b4e] flex items-center justify-center"><div className="text-[#d4af37] text-xl animate-pulse">Loading...</div></div>}>
      <AcessoContent />
    </Suspense>
  );
}
