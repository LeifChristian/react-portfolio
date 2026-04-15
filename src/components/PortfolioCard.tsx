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
  link?: string;
  stack?: string;
  description: string;
  variant?: 'grid' | 'showcase';
  showMeta?: boolean;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({
  title,
  images,
  videoUrls = [],
  link,
  stack,
  description,
  variant = 'grid',
  showMeta = true
}) => {
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

  const mediaHeightClass =
    variant === 'showcase'
      ? 'h-[320px] sm:h-[380px] md:h-[440px] lg:h-[520px]'
      : 'h-64';

  return (
    <div className="group relative">
      <div
        className={`rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out group-hover:-translate-y-1 ${
          variant === 'showcase' ? 'p-6 sm:p-7' : 'p-5'
        }`}
      >
        <div className="aspect-video w-full mb-4 relative flex-shrink-0">
          {slides.length > 0 ? (
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
              className="relative h-full w-full"
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
                  <div className={`w-full ${mediaHeightClass}`}>
                    {slide.type === 'video' && isYouTubeUrl(slide.src) ? (
                      <iframe
                        title="project previews"
                        src={slide.src}
                        className="w-full h-full object-contain"
                        style={{ borderRadius: '1.25em' }}
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
                        style={{ borderRadius: '1.25em' }}
                      />
                    ) : (
                      <img
                        src={slide.src}
                        alt={`Slide ${idx}`}
                        className="w-full h-full object-contain"
                        style={{ borderRadius: '1.25em' }}
                        draggable={false}
                      />
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div
              className={`h-full w-full rounded-2xl border ${
                darkMode ? 'border-white/10' : 'border-black/10'
              } relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_55%)]" />
              <div className={`absolute inset-0 flex items-center justify-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Add screenshot(s) / clip
              </div>
            </div>
          )}
        </div>

        {showMeta && (
          <div className="flex flex-col gap-2">
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold tracking-tight text-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 no-underline"
              >
                {title}
              </a>
            ) : (
              <div className={`text-lg font-semibold tracking-tight text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </div>
            )}

            {stack && (
              <div className="text-center">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${darkMode ? 'bg-white/10 text-gray-200' : 'bg-black/5 text-gray-700'}`}>
                  {stack}
                </span>
              </div>
            )}

            <p className={`${darkMode ? 'text-gray-200' : 'text-gray-800'} text-center text-sm leading-relaxed line-clamp-4`}>
              {description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioCard;