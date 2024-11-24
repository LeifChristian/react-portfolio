import React from 'react';
import leif from '../assets/Leif-Christian.png'

export const Home: React.FC = () => (

  <div className="text-center py-4">
    <h2 className="text-4xl font-bold mb-8">Leif Christian</h2>

    <img src={leif} alt="" style={{height: '40vh', margin: 'auto'}}/>
    <p className="text-lg px-4 pt-8 sm:px-2 xs:px-0 xl:px-[200px]">Leif Christian grew up in Paradise Valley, Montana, and is a lover of music, culture and the outdoors.  Leif has a background In audio software and construction, and transitioned into programming in 2018. Specializing in technologies like Node.js, Vue, React, React Native, Electron and all things JavaScript.

Leif has collaborated with renowned companies such as Verizon, Magic Mountain Roadrunner Sports, Cedar Fair and United locating Services, a utility locating company serving all of Austin, Dallas, Houston and Tulsa, Oklahoma.

Leif is passionate about music, the outdoors, Spanish language and culture, and music performance. Leif  performs around Montana as guitarist and vocalist in his rock power trio. Leif brings wide range of technical skills and his passion for building engaging user experiences to the team.</p>
  </div>

);
