import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import 'swiper/css/autoplay';
// Import required modules
import { Navigation, EffectFade, Autoplay } from 'swiper/modules';

interface PortfolioCardProps {
  title: string;
  images: string[];
  videoUrls?: string[];
  link: string;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ title, images, videoUrls = [], link }) => {
  const slides = [
    ...images.map(src => ({ type: 'image', src })),
    ...videoUrls.map(src => ({ type: 'video', src }))
  ];

  const handleInit = (swiper: SwiperType) => {
    console.log('Swiper initialized', swiper);
  };

  const handleSlideChange = () => {
    console.log('Slide changed');
  };

  return (
    <div className="rounded-lg shadow-lg overflow-hidden bg-white dark:bg-gray-800 p-4">
      <div className="aspect-video w-full mb-4 relative">
        <Swiper
          modules={[Navigation, EffectFade, Autoplay]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={{ 
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }}
          loop={true}
          navigation={{
            enabled: true
          }}
          onSwiper={handleInit}
          onSlideChange={handleSlideChange}
          className="h-full w-full"
          slidesPerView={1}
          speed={1000}
          spaceBetween={30}
        >
          {slides.map((slide, idx) => (
            <SwiperSlide key={`slide-${idx}`}>
              <div className="w-full h-64">
                {slide.type === 'image' && (
                  <img 
                    src={slide.src} 
                    alt={`Slide ${idx}`} 
                    className="w-full h-full object-contain"
                  />
                )}
                {slide.type === 'video' && (
                  <video 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                    controls 
                    src={slide.src} 
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <h3 className="text-xl font-bold mt-2 text-center">{title}</h3>
      <a 
        href={link} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-500 hover:text-blue-700 underline block text-center mt-2"
      >
        View Project
      </a>
    </div>
  );
};

export default PortfolioCard;