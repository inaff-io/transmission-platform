import Banner from '@/components/Banner';

export default function BannerDemoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header de exemplo */}
      <header className="bg-white shadow border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-800">Header de Exemplo</h1>
          <p className="text-sm text-gray-500">Banner aparece logo abaixo</p>
        </div>
      </header>

      {/* Banner abaixo do header */}
      <Banner />

      {/* Conteúdo */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-gray-600">Conteúdo da página...</div>
      </main>
    </div>
  );
}