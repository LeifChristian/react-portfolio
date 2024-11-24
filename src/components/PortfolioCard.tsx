import React, { useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
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
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ title, images, videoUrls = [], link }) => {
  const swiperRef = useRef<SwiperType>();
  const autoplayTimeoutRef = useRef<NodeJS.Timeout>();
  
  const slides = [
    ...videoUrls.map(src => ({ type: 'video', src })),
    ...images.map(src => ({ type: 'image', src })),
  ];

  // Cleanup function to clear any pending timeouts
  useEffect(() => {
    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
    };
  }, []);

  const handleSwiperInit = (swiper: SwiperType) => {
    swiperRef.current = swiper;

    // Function to resume autoplay
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

    // Initialize swiper events
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

    // Handle touch start - pause autoplay
    swiper.on('touchStart', () => {
      if (swiperRef.current?.autoplay) {
        swiperRef.current.autoplay.stop();
      }
    });

    // Ensure navigation is properly initialized
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
    <div className="rounded-3xl shadow-lg overflow-hidden bg-white dark:bg-gray-800 p-4 hover:w-100vw hover:h-100vh">
      <div className="aspect-video w-full mb-4 relative">
        {/* <Swiper
          modules={[Navigation, EffectFade, EffectCreative, Autoplay, Mousewheel, Keyboard]}
          effect="fade"
          fadeEffect={{
            crossFade: true
          }}
          autoplay={{
            delay: 6000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
            waitForTransition: true
          }}
          loop={true}
          navigation={true}
          onSwiper={handleSwiperInit}
          className="h-full w-full !px-120"
          slidesPerView={1}
          speed={800}
          spaceBetween={0}
          grabCursor={true}
          watchSlidesProgress={true}
          preventInteractionOnTransition={false}
          allowTouchMove={true}
          mousewheel={{
            forceToAxis: true
          }}
          keyboard={{
            enabled: true,
            onlyInViewport: true
          }}
          touchRatio={1}
          resistance={true}
          resistanceRatio={0.85}
        >
          {slides.map((slide, idx) => (
            <SwiperSlide key={`slide-${idx}`}>
              <div className="w-full h-64">
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
                {slide.type === 'image' && (
                  <img 
                    src={slide.src} 
                    alt={`Slide ${idx}`} 
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper> */}

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
  className="relative h-full w-full !px-120" // Adding `relative` class here
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
        {slide.type === 'image' && (
          <img
            src={slide.src}
            alt={`Slide ${idx}`}
            className="w-full h-full object-contain"
            draggable={false}
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