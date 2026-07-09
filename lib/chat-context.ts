import { getAdminDb } from '@/lib/firebase-admin';
import { SETTINGS_DOC_ID } from '@/lib/constants';
import { Settings } from '@/lib/types';

export async function buildChatContext(): Promise<string> {
  const db = getAdminDb();
  const settingsSnap = await db.collection('settings').doc(SETTINGS_DOC_ID).get();
  const settings = settingsSnap.data() as Settings | undefined;

  const [pagesSnap, eventsSnap, plansSnap, faqsSnap] = await Promise.all([
    db.collection('pages').where('isPublished', '==', true).limit(15).get(),
    db.collection('events').where('isPublic', '==', true).limit(8).get(),
    db.collection('membershipPlans').where('active', '==', true).limit(5).get(),
    db.collection('faqs').where('isPublished', '==', true).limit(20).get(),
  ]);

  const lines: string[] = [];

  if (settings) {
    lines.push(`Site: ${settings.siteName} — ${settings.description}`);
    if (settings.contactEmail) lines.push(`Contact email: ${settings.contactEmail}`);
    if (settings.phone) lines.push(`Phone: ${settings.phone}`);
    if (settings.address) lines.push(`Address: ${settings.address}`);

    const chatbot = settings.chatbot;
    if (chatbot?.shareEmail) lines.push(`Share email when asked: ${chatbot.shareEmail}`);
    if (chatbot?.sharePhone) lines.push(`Share phone when asked: ${chatbot.sharePhone}`);
    if (chatbot?.shareAddress) lines.push(`Share address when asked: ${chatbot.shareAddress}`);

    if (chatbot?.whatsappGroups?.length) {
      lines.push('WhatsApp community groups (share the full link when user wants to join):');
      chatbot.whatsappGroups.forEach((g) => {
        lines.push(`- ${g.name}: ${g.link}${g.description ? ` (${g.description})` : ''}`);
      });
    }

    if (chatbot?.resources?.length) {
      lines.push('Additional resources:');
      chatbot.resources.forEach((r) => lines.push(`[${r.title}] ${r.content}`));
    }

    if (settings.aboutContent) {
      const about = settings.aboutContent;
      if (about.pageTitle) lines.push(`About page: ${about.pageTitle} — ${about.pageSubtitle || ''}`);
      about.highlightCards?.forEach((c) => lines.push(`${c.title}: ${c.text}`));
      if (about.foundersMessage?.text) lines.push(`Founder's message: ${about.foundersMessage.text.slice(0, 400)}`);
      if (about.missionVision?.text) lines.push(`Mission/Vision: ${about.missionVision.text.slice(0, 400)}`);
      about.coreValues?.forEach((v) => lines.push(`Value ${v.title}: ${v.description}`));
    }

    if (settings.homePage) {
      const home = settings.homePage;
      lines.push(`Homepage events section: ${home.eventsSection.title} — ${home.eventsSection.subtitle}`);
      home.featuresSection.cards.forEach((c) => lines.push(`${c.title}: ${c.description}`));
    }
  }

  faqsSnap.docs.forEach((d) => {
    const f = d.data();
    lines.push(`FAQ Q: ${f.question} A: ${f.answer}`);
  });

  pagesSnap.docs.forEach((d) => {
    const p = d.data();
    lines.push(`Page "${p.title}" (${p.slug}): ${(p.content || '').slice(0, 400)}`);
  });

  eventsSnap.docs.forEach((d) => {
    const e = d.data();
    lines.push(
      `Event "${e.title}" on ${new Date(e.date).toLocaleDateString()} at ${e.location} (${e.pricingType || 'free'})`
    );
  });

  plansSnap.docs.forEach((d) => {
    const p = d.data();
    lines.push(`Membership "${p.name}": $${p.price}/${p.interval} — ${(p.benefits || []).join(', ')}`);
  });

  if (settings?.chatbot?.knowledgeSnippets?.length) {
    settings.chatbot.knowledgeSnippets.forEach((s) => {
      lines.push(`Q: ${s.question} A: ${s.answer}`);
    });
  }

  return lines.join('\n');
}

export function buildChatSystemPrompt(settings: Settings, context: string): string {
  const chatbot = settings.chatbot!;
  const name = chatbot.assistantName || settings.siteName || 'Abundant Assistant';

  return `${chatbot.systemPrompt}

You are ${name}. Persona: ${chatbot.persona}

RULES:
- Be helpful, warm, and concise.
- When users ask to join the community, WhatsApp groups, or how to connect — immediately provide the relevant WhatsApp group link(s) from the knowledge below. Paste the full URL.
- When users ask for contact info, phone, or email — provide the exact details from the knowledge below.
- Answer using the platform knowledge below. If unsure, say you'll connect them with the team.
- Never mention AI providers, APIs, or underlying technology.

Platform knowledge:
${context}`;
}
