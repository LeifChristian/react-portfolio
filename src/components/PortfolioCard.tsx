import React, { useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { useThemeContext } from '../ThemeProvider';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-creative';
import 'swiper/css/autoplay';
// Import required modules
import { 
  Navigation, 
  EffectFade, 
  EffectCreative, 
  Autoplay,
  Mousewheel,
  Keyboard
} from 'swiper/modules';

interface PortfolioCardProps {
  title: string;
  images: string[];
  videoUrls?: string[];
  link: string;
  description: string;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ title, images, videoUrls = [], link, description }) => {
  const {darkMode} = useThemeContext();
  const swiperRef = useRef<SwiperType>();
  const autoplayTimeoutRef = useRef<NodeJS.Timeout>();

  const getVideoEmbed = (url: string) => {
    const youtubeMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^?&]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&mute=1`;
    }
    return url;
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };
  
  const slides = [
    ...videoUrls.map(src => ({ type: 'video', src: getVideoEmbed(src) })),
    ...images.map(src => ({ type: 'image', src })),
  ];

  useEffect(() => {
    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
    };
  }, [darkMode]);

  const handleSwiperInit = (swiper: SwiperType) => {
    swiperRef.current = swiper;

    const resumeAutoplay = () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
      
      autoplayTimeoutRef.current = setTimeout(() => {
        if (swiperRef.current?.autoplay) {
          swiperRef.current.autoplay.start();
        }
      }, 300);
    };

    const events = [
      'slideChange',
      'touchEnd',
      'navigationNext',
      'navigationPrev',
      'slideChangeTransitionEnd'
    ];

    events.forEach(event => {
      // @ts-ignore - Swiper types don't include all events
      swiper.on(event, resumeAutoplay);
    });

    swiper.on('touchStart', () => {
      if (swiperRef.current?.autoplay) {
        swiperRef.current.autoplay.stop();
      }
    });

    if (swiper.navigation) {
      const { nextEl, prevEl } = swiper.navigation;
      
      if (nextEl) {
        nextEl.addEventListener('click', () => {
          if (swiperRef.current?.slideNext) {
            swiperRef.current.slideNext();
            resumeAutoplay();
          }
        });
      }
      
      if (prevEl) {
        prevEl.addEventListener('click', () => {
          if (swiperRef.current?.slidePrev) {
            swiperRef.current.slidePrev();
            resumeAutoplay();
          }
        });
      }
    }
  };

  return (
    <div className="group relative z-0 hover:z-50">
      <div className="rounded-3xl shadow-lg overflow-hidden bg-white dark:bg-gray-800 p-4 transition-all duration-300 ease-in-out transform group-hover:scale-[1.2] group-hover:shadow-2xl group-hover:mt-10 h-[100%] flex flex-col">
        <div className="aspect-video w-full mb-4 relative flex-shrink-0">
          <Swiper
            modules={[Navigation, EffectFade, EffectCreative, Autoplay, Mousewheel, Keyboard]}
            effect="fade"
            fadeEffect={{
              crossFade: true,
            }}
            autoplay={{
              delay: 6000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
              waitForTransition: true,
            }}
            loop={true}
            navigation={true}
            onSwiper={handleSwiperInit}
            className="relative h-full w-full !px-120"
            slidesPerView={1}
            speed={800}
            spaceBetween={0}
            grabCursor={true}
            watchSlidesProgress={true}
            preventInteractionOnTransition={false}
            allowTouchMove={true}
            mousewheel={{
              forceToAxis: true,
            }}
            keyboard={{
              enabled: true,
              onlyInViewport: true,
            }}
            touchRatio={1}
            resistance={true}
            resistanceRatio={0.85}
          >
            {slides.map((slide, idx) => (
              <SwiperSlide key={`slide-${idx}`}>
                <div className="w-full h-64">
                  {slide.type === 'video' && isYouTubeUrl(slide.src) ? (
                    <iframe
                    title="project previews"
                      src={slide.src}
                      className="w-full h-full object-contain"
                      style={{ borderRadius: '2em' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : slide.type === 'video' ? (
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls
                      src={slide.src}
                      className="w-full h-full object-contain"
                      style={{ borderRadius: '2em' }}
                    />
                  ) : (
                    <img
                      src={slide.src}
                      alt={`Slide ${idx}`}
                      className="w-full h-full object-contain"
                      style={{ borderRadius: '2em' }}
                      draggable={false}
                    />
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <div className="flex flex-col h-full">
          <a 
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 text-lg font-bold hover:text-blue-700 block text-center mt-2 no-underline"
          >
            {title}
          </a>
          <p className={`${darkMode ? 'text-white' : 'text-black'} text-center mt-2 line-clamp-3 overflow-hidden`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PortfolioCard;