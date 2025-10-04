const page = `import TestConnection from '@/components/TestConnection';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Plataforma de Transmissão</h1>
      <TestConnection />
    </div>
  );
}`

require('fs').writeFileSync('d:/Downloads/transmission-platform/src/app/page.tsx', page);
