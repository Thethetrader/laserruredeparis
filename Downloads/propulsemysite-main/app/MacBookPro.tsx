interface MacBookProProps {
  siteUrl: string;
  siteName: string;
}

export default function MacBookPro({ siteUrl, siteName }: MacBookProProps) {
  return (
    <a 
      href={siteUrl} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="flex-shrink-0 relative scale-[1.25] md:scale-150 p-8 block hover:scale-[1.3] md:hover:scale-[1.55] transition-transform duration-300"
    >
      <img src="/macframe.avif" alt="Mac frame" className="w-[20rem] md:w-96 h-auto mix-blend-multiply filter brightness-110" />
              <div className="absolute top-10 md:top-8 left-0 right-0 bottom-16 flex items-center justify-center">
          <div className="w-[61%] md:w-[63%] h-[52%] md:h-1/2 bg-black rounded-lg overflow-hidden">
            <iframe 
              src={siteUrl} 
              title={siteName}
              className="w-full h-full border-0 pointer-events-none"
              loading="lazy"
              style={{ 
                width: '333%', 
                height: '333%', 
                transform: 'scale(0.3) translateX(8px)', 
                transformOrigin: 'top left' 
              }}
            />
          </div>
      </div>
    </a>
  );
} 