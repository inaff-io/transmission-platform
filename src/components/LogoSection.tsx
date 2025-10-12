'use client';

import { useState } from 'react';
import Image from 'next/image';

export function LogoSection() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="w-full h-full text-center">
      <div className="relative mx-auto w-full h-full">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        <Image
          src="/logo-evento.png"
          alt="Logo do Evento"
          className={`object-contain w-full h-full transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          fill
          priority
          quality={100}
          sizes="100vw"
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    </div>
  );
}