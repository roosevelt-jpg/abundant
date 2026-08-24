'use client';

import { SideBySideCard, TeamMember, AboutHighlightCard } from '@/lib/types';
import { Globe, Share2, Mail, Phone, MessageCircle, User } from 'lucide-react';

export function HighlightCardsGrid({ cards }: { cards: AboutHighlightCard[] }) {
  const sorted = [...cards].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return null;

  return (
    <div className={`grid grid-cols-1 gap-6 sm:gap-8 ${sorted.length >= 3 ? 'md:grid-cols-3' : sorted.length === 2 ? 'md:grid-cols-2' : ''}`}>
      {sorted.map((card) => (
        <div key={card.id} className="text-center p-4 sm:p-6">
          <h3 className="font-heading text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{card.title}</h3>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{card.text}</p>
        </div>
      ))}
    </div>
  );
}

export function SideBySideSection({ card }: { card: SideBySideCard }) {
  const imageEl = card.imageUrl ? (
    <img
      src={card.imageUrl}
      alt={card.title}
      className="w-full max-w-md mx-auto aspect-[3/4] object-cover rounded-xl"
    />
  ) : (
    <div className="w-full max-w-md mx-auto aspect-[3/4] bg-accent/10 rounded-xl flex items-center justify-center">
      <span className="text-4xl text-accent opacity-50">✦</span>
    </div>
  );

  const textEl = (
    <div className="min-w-0">
      <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">{card.title}</h2>
      <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">{card.text}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
      {card.imagePosition === 'left' ? (
        <>{imageEl}{textEl}</>
      ) : (
        <>{textEl}{imageEl}</>
      )}
    </div>
  );
}

const SOCIAL_ICONS: Record<string, typeof Globe> = {
  linkedin: Share2,
  twitter: Globe,
  instagram: Share2,
  facebook: Globe,
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle,
};

function TeamMemberBio({ bio }: { bio: string }) {
  const paragraphs = bio.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return null;

  return (
    <div className="text-left text-sm text-muted-foreground mb-4 space-y-3">
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  );
}

export function TeamGrid({ members }: { members: TeamMember[] }) {
  const visible = members.filter((m) => !m.suspended).sort((a, b) => a.order - b.order);
  if (visible.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {visible.map((m) => (
        <div key={m.id} className="text-center p-6 bg-card rounded-xl border border-border">
          {m.photoUrl ? (
            <img
              src={m.photoUrl}
              alt={m.name}
              className="w-24 h-24 rounded-full object-cover object-top mx-auto mb-4"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-accent/20 mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-accent">
              {m.name.charAt(0)}
            </div>
          )}
          <h3 className="font-heading font-bold text-lg">{m.name}</h3>
          <p className="text-sm text-accent mb-2">{m.title}</p>
          {m.bio && <TeamMemberBio bio={m.bio} />}
          <div className="flex justify-center gap-3">
            {Object.entries(m.social).filter(([, v]) => v).map(([key, url]) => {
              const Icon = SOCIAL_ICONS[key] || User;
              const href = key === 'email' ? `mailto:${url}` : key === 'phone' ? `tel:${url}` : key === 'whatsapp' ? `https://wa.me/${url.replace(/\D/g, '')}` : url!;
              return (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent">
                  <Icon className="w-4 h-4" />
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
