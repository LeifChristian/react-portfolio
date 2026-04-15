import React, { useEffect, useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { useThemeContext } from '../ThemeProvider';

const ContactForm: React.FC = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusKind, setStatusKind] = useState<'success' | 'error' | null>(null);
  const { darkMode } = useThemeContext();
  const [animate, setAnimate] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const emailjsPublicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || '';
  const emailjsServiceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || '';
  const emailjsTemplateId =
    process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_ia2g5do';

  const isEmailConfigured = Boolean(
    emailjsPublicKey && emailjsServiceId && emailjsTemplateId
  );

  useEffect(() => {
    if (emailjsPublicKey) {
      emailjs.init(emailjsPublicKey);
    }
    
    setTimeout(() => {
      setAnimate(true);
    }, 100);

    const timer = setTimeout(() => {
      setAnimate(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [emailjsPublicKey]);

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setStatusMessage(null);
    setStatusKind(null);

    try {
      if (!isEmailConfigured) {
        setStatusKind('error');
        setStatusMessage(
          'Contact form is not configured right now. Please email me directly or try again later.'
        );
        return;
      }

      await emailjs.sendForm(
        emailjsServiceId,
        emailjsTemplateId,
        formRef.current!,
        emailjsPublicKey
      );
      setStatusKind('success');
      setStatusMessage('Message sent! Chat soon');
      formRef.current?.reset();
    } catch (error) {
      console.error('EmailJS Error:', error);
      setStatusKind('error');
      setStatusMessage('Failed to send the message. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`container mx-auto p-4 max-w-md mt-4`}>
      <h2 className="text-2xl font-bold mb-4 text-center dark:text-white pb-6">Let's connect!</h2>
      
      <div 
        className={`contact-form-3d-container ${!isHovered ? 'contact-form-3d' : ''}`}
        style={{ 
          animation: animate ? 'spinY 3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          transform: isHovered ? 'none' : undefined,
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <form 
          ref={formRef} 
          onSubmit={sendEmail} 
          className="space-y-4"
          style={{ 
            border: '2px solid white',
            transform: isHovered ? 'none' : undefined,
            transition: 'all 0.3s ease',
            filter: darkMode 
              ? 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))' 
              : 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.5))'
          }}
        >
          <div>
            <label htmlFor="user_name" className={`block font-medium text-gray-400 dark:text-white`}>
              Name
            </label>
            <input
              type="text"
              id="user_name"
              name="user_name"
              required
              className="w-full p-2 mt-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="user_email" className="block font-medium text-gray-400 dark:text-gray-200">
              Email
            </label>
            <input
              type="email"
              id="user_email"
              name="user_email"
              required
              className="w-full p-2 mt-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="message" className="block font-medium text-gray-400 dark:text-gray-200">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              required
              className="w-full p-2 mt-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            ></textarea>
          </div>
          <div>
            <button
              type="submit"
              disabled={isSending || !isEmailConfigured}
              className="w-full py-2 px-4 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
          {statusMessage && (
            <p
              className={`text-center font-medium mt-2 ${
                statusKind === 'success' ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {statusMessage}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ContactForm;