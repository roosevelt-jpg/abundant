'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { SocialLinks } from '@/components/social-links';
import { useSettings } from '@/hooks/useSettings';
import { submitContactForm } from '@/lib/contact-service';
import { getFormByPlacement } from '@/lib/forms-service';
import { CustomFormRenderer } from '@/components/custom-form-renderer';
import { CustomForm } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { Mail, Phone, MapPin } from 'lucide-react';

const inputCls =
  'w-full px-3 py-1.5 text-sm bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent';

export default function Contact() {
  const { settings } = useSettings();
  const { t } = useLanguage();
  const [customForm, setCustomForm] = useState<CustomForm | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await submitContactForm(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFormByPlacement('contact').then(setCustomForm).catch(console.error);
  }, []);

  const email = settings?.contactEmail || 'hello@abundant.club';
  const phone = settings?.phone || '';
  const address = settings?.address || '';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">
              {t('contact.title', 'Contact Us')}
            </h1>
            <p className="text-muted-foreground">
              {t('contact.subtitle', "Have a question? We'd love to hear from you.")}
            </p>
          </div>
        </section>

        <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
              <div className="lg:col-span-2">
                <h2 className="font-heading text-xl font-bold mb-5">Get in Touch</h2>
                <div className="space-y-5">
                  <div className="flex gap-3">
                    <Mail className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Email</h3>
                      <a href={`mailto:${email}`} className="text-sm text-muted-foreground hover:text-accent transition-colors">
                        {email}
                      </a>
                    </div>
                  </div>
                  {phone && (
                    <div className="flex gap-3">
                      <Phone className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Phone</h3>
                        <a href={`tel:${phone.replace(/\D/g, '')}`} className="text-sm text-muted-foreground hover:text-accent transition-colors">
                          {phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {address && (
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold mb-1">Address</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{address}</p>
                      </div>
                    </div>
                  )}
                </div>
                {settings && (
                  <div className="mt-8">
                    <h3 className="text-sm font-semibold mb-3">Follow Us</h3>
                    <SocialLinks settings={settings} />
                  </div>
                )}
              </div>

              <div className="lg:col-span-3 bg-card rounded-xl border border-border p-5 md:p-6 max-w-lg lg:max-w-none lg:ml-auto w-full">
                {customForm ? (
                  <CustomFormRenderer form={customForm} compact />
                ) : (
                  <>
                    <h2 className="font-heading text-xl font-bold mb-4">Send us a Message</h2>
                    {submitted && (
                      <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm">
                        Thank you for your message! We&apos;ll get back to you soon.
                      </div>
                    )}
                    {error && (
                      <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                        {error}
                      </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Name</label>
                          <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Email</label>
                          <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputCls} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Phone</label>
                          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Subject</label>
                          <input type="text" name="subject" value={formData.subject} onChange={handleChange} required className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Message</label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          rows={3}
                          required
                          className={`${inputCls} resize-none`}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 text-sm bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Sending...' : 'Send Message'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      {settings && <WhatsAppButton settings={settings} />}
    </div>
  );
}
