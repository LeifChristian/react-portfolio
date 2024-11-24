import React, { useEffect, useState } from 'react';
import { useThemeContext } from '../ThemeProvider';
import leif from '../assets/Leif-Christian.png';

export const Home: React.FC = () => {
  const { darkMode } = useThemeContext();
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    // Small delay to ensure the initial state is visible
    setTimeout(() => {
      setIsAnimated(true);
    }, 100);
  }, []);

  return (
    <div className={`text-center py-4 ${darkMode ? 'text-white': 'text-black'}`} style={{ margin: 'auto'}}>
      <h2 className="text-4xl font-bold mb-8">
        Leif Christian
      </h2>

      {/* Image container with animation trigger */}
      <div
        className={`inline-block ${
          darkMode
            ? 'drop-shadow-[0_10px_12px_rgba(255,255,255,1)]'
            : 'drop-shadow-[0_8px_24px_rgba(1,1,10,0.6)]'
        }`}
      >
        <img
          src={leif}
          alt="Leif Christian"
          className={`h-[40vh] object-contain transition-all duration-1000 ${
            isAnimated ? 'animate-slideInBoing' : 'transform -translate-x-full scale-90'
          }`} // Apply animation or initial state
        />
      </div>

      <p className="text-lg px-4 max-w-[800px] mx-auto mt-8 leading-relaxed">
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
  );
};

export default Home;
