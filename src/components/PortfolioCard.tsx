import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-cube';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import { Autoplay as AutoplayModule } from 'swiper/modules';
import { EffectFade as EffectFadeModule } from 'swiper/modules';
import { EffectCube as EffectCubeModule } from 'swiper/modules';
import { Navigation as NavigationModule } from 'swiper/modules';

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

  return (
    <div className="rounded-lg shadow-lg overflow-hidden bg-white dark:bg-gray-800 p-4">
      <div className="aspect-video w-full mb-4">
        <Swiper
          modules={[EffectFadeModule, EffectCubeModule, NavigationModule, AutoplayModule]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={{ delay: 3000 }}
          loop={true}
          navigation={true}
          className="h-full w-full"
          slidesPerView={1}
          speed={800}
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