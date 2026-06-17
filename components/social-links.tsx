'use client';

import { Settings } from '@/lib/types';
import {
  Mail,
  Phone,
  Send,
  Music,
  MessageCircle,
  Globe,
} from 'lucide-react';
import Link from 'next/link';

interface SocialLinksProps {
  settings: Settings;
  className?: string;
  iconSize?: number;
}

export const SocialLinks = ({ settings, className = 'flex gap-4', iconSize = 24 }: SocialLinksProps) => {
  if (!settings.socialLinks) return null;

  const socialIcons = [
    {
      key: 'email',
      label: 'Email',
      icon: Mail,
      href: settings.socialLinks?.email ? `mailto:${settings.socialLinks.email}` : undefined,
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      href: settings.socialLinks?.whatsapp,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon: Send,
      href: settings.socialLinks?.facebook,
    },
    {
      key: 'twitter',
      label: 'Twitter',
      icon: Globe,
      href: settings.socialLinks?.twitter,
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: Globe,
      href: settings.socialLinks?.linkedin,
    },
    {
      key: 'instagram',
      label: 'Instagram',
      icon: Globe,
      href: settings.socialLinks?.instagram,
    },
    {
      key: 'youtube',
      label: 'YouTube',
      icon: Globe,
      href: settings.socialLinks?.youtube,
    },
    {
      key: 'tiktok',
      label: 'TikTok',
      icon: Music,
      href: settings.socialLinks?.tiktok,
    },
    {
      key: 'telegram',
      label: 'Telegram',
      icon: Send,
      href: settings.socialLinks?.telegram,
    },
  ];

  const activeLinks = socialIcons.filter(social => social.href);

  if (activeLinks.length === 0) return null;

  return (
    <div className={className}>
      {activeLinks.map(social => {
        const Icon = social.icon;
        return (
          <a
            key={social.key}
            href={social.href}
            target={social.key === 'email' ? undefined : '_blank'}
            rel={social.key === 'email' ? undefined : 'noopener noreferrer'}
            title={social.label}
            className="text-gray-300 hover:text-[#B8973A] transition-colors duration-200"
          >
            <Icon size={iconSize} />
          </a>
        );
      })}
    </div>
  );
};
