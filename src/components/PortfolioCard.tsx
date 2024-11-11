import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-cube';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
// Import required modules - correct import syntax
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
  return (
    <div className="rounded-lg shadow-lg overflow-hidden bg-white dark:bg-gray-800 p-4">
      <Swiper
        modules={[EffectFadeModule, EffectCubeModule, NavigationModule, AutoplayModule]}
        effect="fade"
        autoplay={{ delay: 3000 }}
        loop={true}
        navigation={true}
        breakpoints={{
          320: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
      >
        {images.map((imgSrc, idx) => (
          <SwiperSlide key={`img-${idx}`}>
            <img src={imgSrc} alt={`Slide ${idx}`} className="w-full h-48 object-cover" />
          </SwiperSlide>
        ))}
        {videoUrls.map((videoUrl, idx) => (
          <SwiperSlide key={`video-${idx}`}>
            <video 
              controls 
              src={videoUrl} 
              className="w-full h-48 object-cover"
            />
          </SwiperSlide>
        ))}
      </Swiper>
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