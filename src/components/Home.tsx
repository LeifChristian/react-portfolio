import React, { useEffect, useState } from 'react';
import { useThemeContext } from '../ThemeProvider';
import leif from '../assets/Leif-Christian.png';
import background from '../assets/stock1.png';

let hasAnimated = false;

export const Home: React.FC = () => {
  const { darkMode } = useThemeContext();
  const [isAnimated, setIsAnimated] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState({
    width: window.innerWidth <= 360,
    height: window.innerHeight <= 600
  });

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen({
        width: window.innerWidth <= 360,
        height: window.innerHeight <= 600
      });
    };

    window.addEventListener('resize', handleResize);

  if (!hasAnimated) {
      setTimeout(() => {
        setIsAnimated(true);
        hasAnimated = true;
      }, 1000);
    }


    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const containerStyle: React.CSSProperties = {
    backgroundImage: `url(${background})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    width: '100%',
    position: 'relative'
  };

  const avatarContainerStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    top: isSmallScreen.height ? '15vh' : isSmallScreen.width ? '25vh' : '20vh',
    zIndex: 1,
    width: 'auto',
    height: isSmallScreen.height ? '25vh' : isSmallScreen.width ? '30vh' : '40vh'
  };

  const titleStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    top: isSmallScreen.height ? '2vh' : isSmallScreen.width ? '5vh' : '10vh',
    fontSize: (isSmallScreen.width || isSmallScreen.height) ? '1.875rem' : '2.25rem',
    textWrap: 'nowrap',
    zIndex: 1
  };

  const isMobile = isSmallScreen.width || isSmallScreen.height;

  return (
    <div style={containerStyle}>
      <div className={`text-center py-4 relative ${darkMode ? 'text-white bg-black/50' : 'text-black bg-white/50'} ${isMobile ? 'px-2' : ''}`}>
        <h2 style={titleStyle} className="font-bold">
          Leif Christian
        </h2>
        <div className={`${isSmallScreen.height ? 'h-[4vh]' : isMobile ? 'h-[6vh]' : 'h-[8vh]'}`} />

        <div style={avatarContainerStyle}
          className={`${
            darkMode
              ? 'drop-shadow-[0_10px_12px_rgba(255,255,255,1)]'
              : 'drop-shadow-[0_8px_24px_rgba(1,1,10,0.6)]'
          }`}
        >
          <img
            src={leif}
            alt="Leif Christian"
            className={`h-full w-auto object-contain transition-all duration-1000 ${
              isAnimated ? 'animate-slideInBoing' : 'transform translate-x-0 scale-90'
            }`}
          />
        </div>
        <div className={`${isSmallScreen.height ? 'h-[25vh]' : isMobile ? 'h-[30vh]' : 'h-[40vh]'}`} />

        <p className={`${isMobile ? 'text-base px-2' : 'text-lg px-4'} max-w-[800px] mx-auto mt-8 leading-relaxed`}>
          {/* Content remains the same */}
          <span className="block mb-4">
            Leif Christian grew up in Paradise Valley, Montana, and is a lover of
            music, culture, and the outdoors. Leif has a background in audio software
            and construction and transitioned into programming in 2018. Specializing
            in technologies like Node.js, Vue, React, React Native, Electron, and all
            things JavaScript.
          </span>
          
          <span className="block mb-4">
            Leif has collaborated with renowned companies such as Verizon, Magic
            Mountain Roadrunner Sports, Cedar Fair, and United Locating Services, a
            utility locating company serving all of Austin, Dallas, Houston, and
            Tulsa, Oklahoma.
          </span>
          
          <span className="block">
            Leif is passionate about music, the outdoors, Spanish language and
            culture, and music performance. Leif performs around Montana as a
            guitarist and vocalist in his rock power trio. Leif brings a wide range
            of technical skills and his passion for building engaging user
            experiences to the team.
          </span>
        </p>
      </div>
    </div>
  );
};

export default Home;