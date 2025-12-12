import { Suspense } from 'react';
import EntregaContent from './entrega-content';

export default function EntregaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EntregaContent />
    </Suspense>
  );
}