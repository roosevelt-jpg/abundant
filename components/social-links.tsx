'use client';

import { Settings } from '@/lib/types';
import {
  Mail,
  Phone,
  Send,
  Music,
  Globe,
} from 'lucide-react';

interface SocialLinksProps {
  settings: Settings;
  className?: string;
  iconSize?: number;
  /** Social keys to omit (e.g. whatsapp shown only on About page) */
  hideKeys?: string[];
}

export const SocialLinks = ({
  settings,
  className = 'flex flex-wrap gap-4',
  iconSize = 24,
  hideKeys = ['whatsapp'],
}: SocialLinksProps) => {
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
      icon: Send,
      href: settings.socialLinks?.whatsapp
        ? `https://wa.me/${settings.socialLinks.whatsapp.replace(/\D/g, '')}`
        : undefined,
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

  const activeLinks = socialIcons.filter(
    (social) => social.href && !hideKeys.includes(social.key)
  );

  if (activeLinks.length === 0) return null;

  return (
    <div className={className}>
      {activeLinks.map((social) => {
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
