'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Pencil, X, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';
import {
  CareersPageContent,
  JobApplication,
  JobEmploymentType,
  JobPosting,
  Settings,
} from '@/lib/types';
import {
  getAllJobPostings,
  createJobPosting,
  updateJobPosting,
  deleteJobPosting,
  getAllJobApplications,
  updateJobApplication,
} from '@/lib/careers-service';
import { useSettings } from '@/hooks/useSettings';
import { useApiAuth } from '@/hooks/useApiAuth';
import { getDefaultCareersPage } from '@/lib/content-page-defaults';

const EMPTY_JOB = {
  title: '',
  department: '',
  location: '',
  employmentType: 'full-time' as JobEmploymentType,
  about: '',
  responsibilitiesText: '',
  requirementsText: '',
  isPublished: false,
};

export default function AdminCareersPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const { settings: live } = useSettings();
  const { authFetch } = useApiAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [tab, setTab] = useState<'page' | 'jobs' | 'applications'>('page');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<JobPosting | null>(null);
  const [form, setForm] = useState(EMPTY_JOB);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (userData && !hasPermission(userData, 'careers') && userData.role !== 'super_admin') {
      router.push('/admin/dashboard');
      return;
    }
    loadJobs();
    loadApps();
  }, [userData, router]);

  useEffect(() => {
    if (live && !dirty) setSettings(live);
  }, [live, dirty]);

  const page: CareersPageContent = settings?.careersPage ?? getDefaultCareersPage();

  const loadJobs = async () => {
    try {
      setJobs(await getAllJobPostings());
    } catch {
      setMsg('Failed to load jobs');
    }
  };

  const loadApps = async () => {
    try {
      setApps(await getAllJobApplications());
    } catch {
      /* ignore */
    }
  };

  const updatePage = (partial: Partial<CareersPageContent>) => {
    setDirty(true);
    setSettings((prev) =>
      prev ? { ...prev, careersPage: { ...page, ...partial, updatedAt: Date.now() } } : prev
    );
  };

  const savePage = async () => {
    if (!settings?.careersPage) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ careersPage: settings.careersPage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSettings((prev) => (prev ? { ...prev, careersPage: data.careersPage } : prev));
      setDirty(false);
      setMsg('Page content saved');
    } catch {
      setMsg('Error saving');
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_JOB);
    setShowModal(true);
  };

  const openEdit = (job: JobPosting) => {
    setEditing(job);
    setForm({
      title: job.title,
      department: job.department,
      location: job.location,
      employmentType: job.employmentType,
      about: job.about,
      responsibilitiesText: (job.responsibilities || []).join('\n'),
      requirementsText: (job.requirements || []).join('\n'),
      isPublished: job.isPublished,
    });
    setShowModal(true);
  };

  const handleSaveJob = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        department: form.department.trim(),
        location: form.location.trim(),
        employmentType: form.employmentType,
        about: form.about.trim(),
        responsibilities: form.responsibilitiesText.split('\n').map((s) => s.trim()).filter(Boolean),
        requirements: form.requirementsText.split('\n').map((s) => s.trim()).filter(Boolean),
        isPublished: form.isPublished,
      };
      if (editing) await updateJobPosting(editing.id, payload);
      else await createJobPosting(payload);
      setShowModal(false);
      await loadJobs();
    } catch {
      setMsg('Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  if (userData && !hasPermission(userData, 'careers') && userData.role !== 'super_admin') {
    return <div className="text-center py-12 text-muted-foreground">No permission</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-1">Careers</h1>
          <p className="text-muted-foreground text-sm">Edit /careers page, roles, and applications</p>
        </div>
        {tab === 'jobs' && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold">
            <Plus className="w-5 h-5" /> Add role
          </button>
        )}
        {tab === 'page' && (
          <button onClick={savePage} disabled={saving || !dirty} className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-50">
            <Save className="w-5 h-5" /> Save page
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {([
          ['page', 'Page content'],
          ['jobs', 'Open roles'],
          ['applications', 'Applications'],
        ] as const).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === t ? 'bg-accent text-accent-foreground' : 'border border-border'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {msg && <p className="mb-4 text-sm text-accent">{msg}</p>}

      {tab === 'page' && (
        <div className="space-y-4 max-w-2xl">
          <Field label="Eyebrow" value={page.hero.eyebrow} onChange={(v) => updatePage({ hero: { ...page.hero, eyebrow: v } })} />
          <Field label="Headline" value={page.hero.headline} onChange={(v) => updatePage({ hero: { ...page.hero, headline: v } })} />
          <TextArea label="Subtext" value={page.hero.subtext} onChange={(v) => updatePage({ hero: { ...page.hero, subtext: v } })} />
          <Field label="General block title" value={page.generalTitle} onChange={(v) => updatePage({ generalTitle: v })} />
          <TextArea label="General block body" value={page.generalBody} onChange={(v) => updatePage({ generalBody: v })} />
          <Field label="General CTA text" value={page.generalCtaText} onChange={(v) => updatePage({ generalCtaText: v })} />
        </div>
      )}

      {tab === 'jobs' && (
        <div className="space-y-3">
          {jobs.length === 0 && <p className="text-sm text-muted-foreground">No roles yet. Add e.g. Chapter Lead — Dubai.</p>}
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between gap-3 p-4 bg-card border border-border rounded-lg">
              <div className="min-w-0">
                <p className="font-semibold truncate">{job.title}</p>
                <p className="text-xs text-muted-foreground">
                  {job.department} · {job.location} · {job.employmentType} · {job.isPublished ? 'Published' : 'Draft'}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => updateJobPosting(job.id, { isPublished: !job.isPublished }).then(loadJobs)}>
                  {job.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => openEdit(job)}><Pencil className="w-4 h-4" /></button>
                <button type="button" onClick={() => confirm('Delete?') && deleteJobPosting(job.id).then(loadJobs)}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'applications' && (
        <div className="space-y-3">
          {apps.length === 0 && <p className="text-sm text-muted-foreground">No applications yet.</p>}
          {apps.map((app) => (
            <div key={app.id} className="p-4 bg-card border border-border rounded-lg">
              <div className="flex justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold">{app.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {app.email} · {app.isGeneral ? 'General' : app.jobTitle || app.jobId} · {app.status}
                  </p>
                </div>
                <select
                  value={app.status}
                  onChange={(e) =>
                    updateJobApplication(app.id, { status: e.target.value as JobApplication['status'] }).then(loadApps)
                  }
                  className="text-xs bg-input border border-border rounded px-2 h-8"
                >
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{app.coverNote}</p>
              {app.linkedinOrPortfolio && (
                <a href={app.linkedinOrPortfolio} target="_blank" rel="noopener noreferrer" className="text-xs text-accent mt-2 inline-block">
                  Portfolio / LinkedIn
                </a>
              )}
              {app.cvUrl && (
                <a href={app.cvUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent mt-1 ml-3 inline-block">
                  CV
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="font-heading font-bold">{editing ? 'Edit role' : 'New role'}</h2>
              <button type="button" onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <Field label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
              <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
              <label className="block text-sm">
                <span className="font-medium mb-1 block">Employment type</span>
                <select
                  value={form.employmentType}
                  onChange={(e) => setForm({ ...form, employmentType: e.target.value as JobEmploymentType })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </label>
              <TextArea label="About the role" value={form.about} onChange={(v) => setForm({ ...form, about: v })} />
              <TextArea label="What you'll do (one per line)" value={form.responsibilitiesText} onChange={(v) => setForm({ ...form, responsibilitiesText: v })} />
              <TextArea label="What we're looking for (one per line)" value={form.requirementsText} onChange={(v) => setForm({ ...form, requirementsText: v })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                Published
              </label>
              <button type="button" onClick={handleSaveJob} disabled={saving} className="w-full py-2 bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="font-medium mb-1 block">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 bg-input border border-border rounded-lg" />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="font-medium mb-1 block">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full px-3 py-2 bg-input border border-border rounded-lg" />
    </label>
  );
}
