'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ContentHero } from '@/components/content-page-hero';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/context/LanguageContext';
import { getDefaultCareersPage } from '@/lib/content-page-defaults';
import { JobPosting } from '@/lib/types';
import { MapPin, Briefcase, X } from 'lucide-react';

const EMPTY_FORM = {
  fullName: '',
  email: '',
  linkedinOrPortfolio: '',
  coverNote: '',
};

export default function CareersPage() {
  const { settings } = useSettings();
  const { t } = useLanguage();
  const page = settings?.careersPage ?? getDefaultCareersPage();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<JobPosting | null>(null);
  const [generalOpen, setGeneralOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/public/jobs')
      .then((r) => r.json())
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const openApply = (job: JobPosting | null) => {
    setActiveJob(job);
    setGeneralOpen(!job);
    setForm(EMPTY_FORM);
    setCvFile(null);
    setMessage('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const fd = new FormData();
      fd.set('fullName', form.fullName);
      fd.set('email', form.email);
      fd.set('linkedinOrPortfolio', form.linkedinOrPortfolio);
      fd.set('coverNote', form.coverNote);
      fd.set('isGeneral', String(!activeJob));
      if (activeJob) {
        fd.set('jobId', activeJob.id);
        fd.set('jobTitle', activeJob.title);
      }
      if (cvFile) fd.set('cv', cvFile);

      const res = await fetch('/api/careers/apply', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setMessage('Application submitted. Thank you!');
      setForm(EMPTY_FORM);
      setCvFile(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const showForm = !!activeJob || generalOpen;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ContentHero
          eyebrow={page.hero.eyebrow || t('careers.title', 'Careers')}
          headline={page.hero.headline || t('careers.title', 'Careers')}
          subtext={page.hero.subtext || t('careers.subtitle', 'Join the Abundant team')}
        />

        <section className="py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-4">
            {loading ? (
              <p className="text-center text-muted-foreground">{t('common.loading', 'Loading...')}</p>
            ) : jobs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t('careers.empty', 'No open positions right now.')}
              </p>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <h2 className="font-heading text-xl font-bold mb-1">{job.title}</h2>
                      <p className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> {job.department}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </span>
                        <span className="capitalize">{job.employmentType.replace('-', ' ')}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openApply(job)}
                      className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#001F3F] to-[#B8973A] text-white"
                    >
                      View & apply
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="py-10 px-4 sm:px-6 lg:px-8 bg-card/50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-2xl font-bold mb-3">{page.generalTitle}</h2>
            <p className="text-sm text-muted-foreground mb-5">{page.generalBody}</p>
            <button
              type="button"
              onClick={() => openApply(null)}
              className="inline-flex px-5 py-2.5 bg-gradient-to-r from-[#001F3F] to-[#B8973A] text-white rounded-lg text-sm font-semibold"
            >
              {page.generalCtaText}
            </button>
          </div>
        </section>
      </main>
      <Footer />

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-heading text-xl font-bold">
                  {activeJob ? activeJob.title : 'General application'}
                </h2>
                {activeJob && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeJob.department} · {activeJob.location} · {activeJob.employmentType}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => { setActiveJob(null); setGeneralOpen(false); }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeJob && (
              <div className="space-y-4 mb-6 text-sm">
                <div>
                  <h3 className="font-semibold mb-1">About the role</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{activeJob.about}</p>
                </div>
                {activeJob.responsibilities?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-1">What you&apos;ll do</h3>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      {activeJob.responsibilities.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {activeJob.requirements?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-1">What we&apos;re looking for</h3>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      {activeJob.requirements.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Full name</label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">LinkedIn / portfolio URL</label>
                <input
                  value={form.linkedinOrPortfolio}
                  onChange={(e) => setForm({ ...form, linkedinOrPortfolio: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg"
                  placeholder="https://"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">CV upload</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Cover note ({form.coverNote.length}/500)
                </label>
                <textarea
                  required
                  maxLength={500}
                  rows={4}
                  value={form.coverNote}
                  onChange={(e) => setForm({ ...form, coverNote: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg"
                />
              </div>
              {message && <p className="text-sm text-accent">{message}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-gradient-to-r from-[#001F3F] to-[#B8973A] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit application'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
