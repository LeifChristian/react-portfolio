import React, { useRef } from 'react';
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
  const isTransitioning = useRef(false);
  const isDragging = useRef(false);
  const currentEffect = useRef<'fade' | 'creative'>('fade');
  
  const slides = [
    ...videoUrls.map(src => ({ type: 'video', src })),
    ...images.map(src => ({ type: 'image', src })),
  ];

  const restartAutoplay = () => {
    if (swiperRef.current?.autoplay) {
      swiperRef.current.autoplay.stop();
      setTimeout(() => {
        swiperRef.current?.autoplay?.start();
      }, 100);
    }
  };

  const handleInit = (swiper: SwiperType) => {
    swiperRef.current = swiper;
    
    swiper.on('slideChangeTransitionStart', () => {
      if (!isDragging.current) {
        isTransitioning.current = true;
      }
    });

    swiper.on('slideChangeTransitionEnd', () => {
      isTransitioning.current = false;
      if (!isDragging.current) {
        handleEffectChange();
      }
      restartAutoplay();
    });

    swiper.on('touchStart', () => {
      isDragging.current = true;
      swiper.params.effect = 'creative';
      swiper.creativeEffect = getCreativeEffect();
    });

    swiper.on('touchEnd', () => {
      setTimeout(() => {
        isDragging.current = false;
        handleEffectChange();
        restartAutoplay();
      }, 100);
    });

    // swiper.on('dragEnd', () => {
    //   setTimeout(() => {
    //     isDragging.current = false;
    //     handleEffectChange();
    //     restartAutoplay();
    //   }, 100);
    // });

    // @ts-ignore
    swiper.on('navigationNext navigationPrev', () => {
        setTimeout(restartAutoplay, 100);
    });

     // @ts-ignore
    swiper.on('touchCancel', () => {
        setTimeout(() => {
          isDragging.current = false;
          handleEffectChange();
          restartAutoplay();
          swiper.update();
        }, 100);
      });

    swiper.on('transitionEnd', () => {
      if (isDragging.current) {
        setTimeout(() => {
          restartAutoplay();
        }, 100);
      }
    });

    const navigation = swiper.navigation;
    if (navigation) {
      const { nextEl, prevEl } = navigation;
      if (nextEl) {
        nextEl.addEventListener('click', () => {
          setTimeout(restartAutoplay, 100);
        });
      }
      if (prevEl) {
        prevEl.addEventListener('click', () => {
          setTimeout(restartAutoplay, 100);
        });
      }
    }

    swiper.on('wheel', () => {
      setTimeout(restartAutoplay, 100);
    });
  };

  const getSlideType = (index: number) => {
    if (index < 0 || !slides[index]) return null;
    return slides[index % slides.length].type;
  };

  const handleEffectChange = () => {
    if (!swiperRef.current || !slides.length || isDragging.current) return;
    
    const swiper = swiperRef.current;
    const currentIndex = swiper.activeIndex;
    const nextIndex = (currentIndex + 1) % slides.length;

    const currentType = getSlideType(currentIndex);
    const nextType = getSlideType(nextIndex);

    if (!currentType || !nextType) return;

    if (currentType === 'video' || nextType === 'video') {
      currentEffect.current = 'fade';
      swiper.params.effect = 'fade';
      swiper.fadeEffect = getFadeEffect();
    } else {
      currentEffect.current = currentEffect.current === 'fade' ? 'creative' : 'fade';
      swiper.params.effect = currentEffect.current;
      
      if (currentEffect.current === 'creative') {
        swiper.creativeEffect = getCreativeEffect();
      } else {
        swiper.fadeEffect = getFadeEffect();
      }
    }
  };

  const getFadeEffect = () => ({
    crossFade: true
  });

  const getCreativeEffect = () => ({
    prev: {
      translate: ['-100%', 0, -1],
      scale: 1,
      opacity: 1
    },
    next: {
      translate: ['100%', 0, 0],
      scale: 1,
      opacity: 1
    }
  });

  const handleSlideChange = () => {
    if (!swiperRef.current || isTransitioning.current || isDragging.current) return;
    handleEffectChange();
    restartAutoplay();
  };

  return (
    <div className="rounded-3xl shadow-lg overflow-hidden bg-white dark:bg-gray-800 p-4">
      <div className="aspect-video w-full mb-4 relative">
        <Swiper
          modules={[Navigation, EffectFade, EffectCreative, Autoplay, Mousewheel, Keyboard]}
          effect="fade"
          fadeEffect={getFadeEffect()}
          creativeEffect={getCreativeEffect()}
          autoplay={{ 
            delay: 6000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
            waitForTransition: false
          }}
          loop={true}
          navigation={{
            enabled: true
          }}
          onSwiper={handleInit}
          onSlideChange={handleSlideChange}
          onTouchEnd={() => {
            setTimeout(() => {
              isDragging.current = false;
              handleEffectChange();
              restartAutoplay();
            }, 100);
          }}
          onTouchMove={() => {
            isDragging.current = true;
          }}
          onSliderMove={() => {
            isDragging.current = true;
          }}
          onSliderFirstMove={() => {
            isDragging.current = true;
          }}
          className="h-full w-full !px-120"
          slidesPerView={1}
          speed={800}
          spaceBetween={0}
          watchSlidesProgress={true}
          observer={true}
          observeParents={true}
          allowTouchMove={true}
          grabCursor={true}
          mousewheel={true}
          keyboard={{
            enabled: true,
            onlyInViewport: true,
          }}
          touchRatio={1}
          resistance={false}
          touchStartPreventDefault={false}
          preventInteractionOnTransition={false}
          touchMoveStopPropagation={true}
          momentumRatio={0.8}
          momentumVelocityRatio={0.8}
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