'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    setTimeout(() => {
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setLoading(false);
      setTimeout(() => setSubmitted(false), 5000);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
            <p className="text-lg text-muted-foreground">Have a question? We'd love to hear from you.</p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div>
                <h2 className="font-heading text-3xl font-bold mb-8">Get in Touch</h2>
                
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <Mail className="w-6 h-6 text-accent flex-shrink-0" />
                    <div>
                      <h3 className="font-heading font-bold mb-2">Email</h3>
                      <a href="mailto:hello@abundant.club" className="text-muted-foreground hover:text-accent transition-colors">
                        hello@abundant.club
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Phone className="w-6 h-6 text-accent flex-shrink-0" />
                    <div>
                      <h3 className="font-heading font-bold mb-2">Phone</h3>
                      <a href="tel:+1234567890" className="text-muted-foreground hover:text-accent transition-colors">
                        +1 (234) 567-890
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <MapPin className="w-6 h-6 text-accent flex-shrink-0" />
                    <div>
                      <h3 className="font-heading font-bold mb-2">Address</h3>
                      <p className="text-muted-foreground">
                        Global Headquarters<br />
                        Dubai, UAE
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                  <h3 className="font-heading font-bold mb-6">Follow Us</h3>
                  <div className="flex gap-4">
                    {['LinkedIn', 'Twitter', 'Instagram'].map((social, i) => (
                      <a
                        key={i}
                        href="#"
                        className="w-10 h-10 rounded-lg border border-border hover:border-accent hover:bg-accent/10 transition-colors flex items-center justify-center"
                      >
                        {social.charAt(0)}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-card rounded-xl border border-border p-8">
                <h2 className="font-heading text-3xl font-bold mb-8">Send us a Message</h2>

                {submitted && (
                  <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm">
                    Thank you for your message! We'll get back to you soon.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Your name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="+1 (234) 567-890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="What is this about?"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      placeholder="Your message here..."
                      rows={5}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
