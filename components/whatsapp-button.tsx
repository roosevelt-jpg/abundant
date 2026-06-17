'use client';

import { Settings } from '@/lib/types';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';

interface WhatsAppButtonProps {
  settings: Settings;
}

export const WhatsAppButton = ({ settings }: WhatsAppButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!settings.socialLinks?.whatsapp) return null;

  // Extract phone number and format for WhatsApp
  const phoneNumber = settings.socialLinks.whatsapp.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${phoneNumber}?text=Hello! I would like to chat with Abundant Global Club.`;

  return (
    <>
      {/* Fixed WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => window.open(whatsappLink, '_blank')}
          className="bg-gradient-to-r from-[#B8973A] via-[#D4AF87] to-[#B8973A] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
          title="Chat with us on WhatsApp"
        >
          <MessageCircle size={24} />
        </button>
      </div>

      {/* Optional: Floating chat bubble */}
      <div className="fixed bottom-24 right-6 z-40 bg-white rounded-lg shadow-lg p-4 max-w-xs hidden sm:block">
        <p className="text-sm text-gray-700 mb-3">
          Hey! 👋 Need help? Chat with us on WhatsApp!
        </p>
        <button
          onClick={() => window.open(whatsappLink, '_blank')}
          className="btn-gradient w-full py-2 text-sm"
        >
          Start Chat
        </button>
      </div>
    </>
  );
};
