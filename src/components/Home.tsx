import React from 'react';
import leif from '../assets/Leif-Christian.png';
import { useThemeContext } from '../ThemeProvider'; 

export const Home: React.FC = () => 

  {
    const { darkMode } = useThemeContext();

return (
  <div
  style={{
    textAlign: 'center',
    padding: '1rem 0',
  }}
>
  <h2
    style={{
      fontSize: '2.5rem',
      fontWeight: 'bold',
      marginBottom: '2rem',
    }}
  >
    Leif Christian
  </h2>

  {/* Image with more pronounced shadow */}
  <div
    style={{
      display: 'inline-block',
      filter: `${!darkMode ? 'drop-shadow(0 8px 24px rgba(1, 1, 10, 2.6))' : 'drop-shadow(0 10px 12px white'}`, // Darker and more pronounced shadow
    }}
  >
    <img
      src={leif}
      alt="Leif Christian"
      style={{
        height: '40vh',
        display: 'block',
        objectFit: 'contain', // Ensures proper scaling
      }}
    />
  </div>

  <p
    style={{
      fontSize: '1.125rem',
      padding: '2rem 1rem',
      maxWidth: '800px',
      margin: '2rem auto 0',
      lineHeight: '1.6',
    }}
  >
    Leif Christian grew up in Paradise Valley, Montana, and is a lover of
    music, culture, and the outdoors. Leif has a background in audio software
    and construction and transitioned into programming in 2018. Specializing
    in technologies like Node.js, Vue, React, React Native, Electron, and all
    things JavaScript.
    <br />
    <br />
    Leif has collaborated with renowned companies such as Verizon, Magic
    Mountain Roadrunner Sports, Cedar Fair, and United Locating Services, a
    utility locating company serving all of Austin, Dallas, Houston, and
    Tulsa, Oklahoma.
    <br />
    <br />
    Leif is passionate about music, the outdoors, Spanish language and
    culture, and music performance. Leif performs around Montana as a
    guitarist and vocalist in his rock power trio. Leif brings a wide range
    of technical skills and his passion for building engaging user
    experiences to the team.
  </p>
</div>
)
  }
export default Home;
