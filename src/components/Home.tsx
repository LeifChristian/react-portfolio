import React, { useEffect, useState } from 'react';
import { useThemeContext } from '../ThemeProvider';
import { useNavigate } from 'react-router-dom';
import leif from '../assets/Leif-Christian.png';
import background from '../assets/stock1.png';

let hasAnimated = false;

export const Home: React.FC = () => {
  const navigate = useNavigate();
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

    // Set up redirect timer
    const redirectTimer = setTimeout(() => {
      navigate('/portfolio');
    }, 14000);

    // Clean up timers and event listeners
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  // Rest of the component remains the same...
  const containerStyle: React.CSSProperties = {
    backgroundImage: `url(${background})`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    overflow: 'hidden'
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
    <div className="relative w-full">
      <div style={containerStyle}>
      <div className={`text-center py-4 relative ${darkMode ? 'text-white bg-black/50' : 'text-black bg-gray-400/70'} ${isMobile ? 'px-2' : ''}`}>
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

          <p className={`${isMobile ? 'text-base px-2' : 'text-lg px-4'} max-w-[800px] mx-auto mt-8 leading-relaxed ${!darkMode && 'text-shadow-light'}`}>
            <span className="block mb-4 font-bold">
            Leif began his career as a software developer in 2018 specializing in React, Node.js, Vue, React Native, Electron and all things JavaScript and has since built hundreds of full stack websites, microservices, tools and interactive applications.{"\n"}

            </span>
            
            <span className="block mb-4 font-bold">
            Leif has collaborated with renowned companies such as Verizon, Magic Mountain, Roadrunner Sports, Cedar Fair and many others to build robust, performant client facing apps to exacting specifications, working teams to refine and deliver high quality software solutions. Leif led a redesign of the client dashboard for United locating Services, a utility locating company handling all 811 tickets for the cities of Austin, Dallas, Houston and Tulsa, Oklahoma. Leif is active in the LLM space, and pioneered a voice based LLM chatbot many months before the release of popular voice mode LLM systems. 
            </span>
            
            <span className="block font-bold">
            Leif Christian grew up in Paradise Valley, Montana, and is a lover of music, culture and the outdoors.  
            He is passionate about music, and is a professionally trained classical pianist and electric guitarist. 
            In his free time, he performs with various ensembles, and with his rock power trio, Ticket Sauce Trio.
            </span>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Home;