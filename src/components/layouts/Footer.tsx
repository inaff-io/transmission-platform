import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 mt-8">
      <div className="container mx-auto px-4 text-center text-xs sm:text-sm">
        <div className="flex flex-col sm:flex-row justify-center items-center sm:gap-2">
          <span>© 2025 INAFF - Instituto Nacional de Assistência Farmacêutica e Farmacoeconomia</span>
          <span className="hidden sm:inline">|</span>
          <span>Todos os direitos reservados.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;