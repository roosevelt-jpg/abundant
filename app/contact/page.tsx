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
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">{t('contact.title', 'Contact Us')}</h1>
            <p className="text-lg text-muted-foreground">{t('contact.subtitle', "Have a question? We'd love to hear from you.")}</p>
          </div>
        </section>

        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="font-heading text-3xl font-bold mb-8">Get in Touch</h2>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <Mail className="w-6 h-6 text-accent flex-shrink-0" />
                    <div>
                      <h3 className="font-heading font-bold mb-2">Email</h3>
                      <a href={`mailto:${email}`} className="text-muted-foreground hover:text-accent transition-colors">
                        {email}
                      </a>
                    </div>
                  </div>
                  {phone && (
                    <div className="flex gap-4">
                      <Phone className="w-6 h-6 text-accent flex-shrink-0" />
                      <div>
                        <h3 className="font-heading font-bold mb-2">Phone</h3>
                        <a href={`tel:${phone.replace(/\D/g, '')}`} className="text-muted-foreground hover:text-accent transition-colors">
                          {phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {address && (
                    <div className="flex gap-4">
                      <MapPin className="w-6 h-6 text-accent flex-shrink-0" />
                      <div>
                        <h3 className="font-heading font-bold mb-2">Address</h3>
                        <p className="text-muted-foreground whitespace-pre-line">{address}</p>
                      </div>
                    </div>
                  )}
                </div>
                {settings && (
                  <div className="mt-12">
                    <h3 className="font-heading font-bold mb-6">Follow Us</h3>
                    <SocialLinks settings={settings} />
                  </div>
                )}
              </div>

              <div className="bg-card rounded-xl border border-border p-8">
                {customForm ? (
                  <CustomFormRenderer form={customForm} />
                ) : (
                  <>
                    <h2 className="font-heading text-3xl font-bold mb-8">Send us a Message</h2>
                    {submitted && (
                      <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm">
                        Thank you for your message! We&apos;ll get back to you soon.
                      </div>
                    )}
                    {error && (
                      <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                        {error}
                      </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {(['name', 'email', 'phone', 'subject'] as const).map((field) => (
                        <div key={field}>
                          <label className="block text-sm font-medium mb-2 capitalize">{field}</label>
                          <input
                            type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                            name={field}
                            value={formData[field]}
                            onChange={handleChange}
                            required={field !== 'phone'}
                            className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>
                      ))}
                      <div>
                        <label className="block text-sm font-medium mb-2">Message</label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          rows={5}
                          required
                          className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
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
