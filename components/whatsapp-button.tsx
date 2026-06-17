'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const WhatsAppButton = () => {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('Hi! I am interested in learning more about Abundant Global Club.');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.whatsappNumber) {
            setPhoneNumber(data.whatsappNumber);
          }
          if (data.whatsappMessage) {
            setMessage(data.whatsappMessage);
          }
        }
      } catch (error) {
        console.error('[v0] Error fetching WhatsApp settings:', error);
      }
    };

    fetchSettings();
  }, []);

  if (!phoneNumber) return null;

  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 flex items-center justify-center"
      title="Chat on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
};
