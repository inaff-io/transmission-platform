import Image from 'next/image';

type BannerProps = {
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  overlayOpacityClass?: string; // e.g. "bg-black/60"
  fullBleed?: boolean; // força ocupar largura total do viewport mesmo dentro de containers
};

export default function Banner({
  imageUrl = 'https://meubanco.com/imagens/banner-forum-ba.jpg',
  title = 'Fórum Bahia',
  subtitle = 'Participe do nosso evento especial com palestras e networking.',
  ctaLabel = undefined,
  ctaHref = undefined,
  overlayOpacityClass = 'bg-black/50',
  fullBleed = true,
}: BannerProps) {
  const sectionClass = fullBleed
    // Full bleed: ocupa 100vw e centraliza no viewport, mesmo dentro de containers
    ? 'relative w-screen left-1/2 -translate-x-1/2 h-[300px] md:h-[450px] lg:h-[550px]'
    : 'relative w-full h-[300px] md:h-[450px] lg:h-[550px]';

  return (
    <section className={sectionClass}>
      {/* Imagem de fundo */}
      <Image
        src={imageUrl}
        alt={title}
        fill
        sizes="100vw"
        className="object-contain"
        priority
      />

      {/* Overlay escuro para legibilidade */}
      <div className={`absolute inset-0 ${overlayOpacityClass}`} />

      {/* Conteúdo centralizado */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-4 max-w-6xl mx-auto">
          <h1 className="text-white font-extrabold tracking-tight text-2xl sm:text-3xl md:text-4xl lg:text-5xl 2xl:text-6xl">
            {title}
          </h1>
          <p className="mt-3 text-white/90 max-w-3xl mx-auto text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl">
            {subtitle}
          </p>

          {/* Botão de ação */}
          {ctaHref && (
            <a
              href={ctaHref}
              className="mt-6 inline-block px-6 py-3 2xl:px-8 2xl:py-4 rounded-full border border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white transition-colors duration-200 backdrop-blur-sm 2xl:text-lg"
            >
              {ctaLabel}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}