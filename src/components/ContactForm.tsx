import React, { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { useThemeContext } from '../ThemeProvider'; 

const ContactForm: React.FC = () => {

  const formRef = useRef<HTMLFormElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSending(true);
    setStatusMessage(null);

    try {
      await emailjs.sendForm(
        'service_lfh2gq2', // EmailJS service ID
        'template_ia2g5do', // EmailJS template ID
        formRef.current!,
        'KMatYE8Uceuc1tja4' //  EmailJS public key
      );
      setStatusMessage('Message sent successfully!');
      formRef.current?.reset();
    } catch (error) {
      setStatusMessage('Failed to send the message. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center dark:text-white">Let's connect!</h2>
      <form ref={formRef} onSubmit={sendEmail} className="space-y-4">
        <div>
          <label htmlFor="user_name" className="block font-medium text-gray-700 dark:text-gray-200">
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
          <label htmlFor="user_email" className="block font-medium text-gray-700 dark:text-gray-200">
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
          <label htmlFor="message" className="block font-medium text-gray-700 dark:text-gray-200">
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
            disabled={isSending}
            className="w-full py-2 px-4 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
        {statusMessage && (
          <p className={`text-center font-medium mt-2 ${statusMessage.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>
            {statusMessage}
          </p>
        )}
      </form>
    </div>
  );
};

export default ContactForm;
