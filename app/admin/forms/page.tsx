'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { getAllForms, createForm, updateForm, deleteForm, getFormSubmissions } from '@/lib/forms-service';
import { CustomForm, FormField, FormSubmission } from '@/lib/types';
import Link from 'next/link';

const FIELD_TYPES = ['text', 'email', 'phone', 'textarea', 'select', 'checkbox'] as const;
const PLACEMENTS = ['contact', 'membership', 'events', 'about', 'home', 'custom'];

export default function FormsAdminPage() {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [tab, setTab] = useState<'forms' | 'submissions'>('forms');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<CustomForm>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [f, s] = await Promise.all([getAllForms(), getFormSubmissions()]);
    setForms(f);
    setSubmissions(s);
    setLoading(false);
  };

  const handleCreate = async () => {
    await createForm({
      name: 'New Form',
      fields: [],
      placement: 'contact',
      active: false,
    });
    await load();
  };

  const handleSave = async () => {
    if (!editingId) return;
    await updateForm(editingId, editingData);
    setEditingId(null);
    setEditingData({});
    await load();
  };

  const addField = () => {
    const fields = [...(editingData.fields || []), {
      id: `f-${Date.now()}`,
      type: 'text' as const,
      label: 'New Field',
      required: false,
      order: (editingData.fields || []).length,
    }];
    setEditingData({ ...editingData, fields });
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Custom Forms</h1>
        <p className="text-muted-foreground">Build forms and manage submissions</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('forms')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'forms' ? 'bg-accent text-accent-foreground' : 'border border-border'}`}>Forms</button>
        <button onClick={() => setTab('submissions')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'submissions' ? 'bg-accent text-accent-foreground' : 'border border-border'}`}>
          Submissions ({submissions.length})
        </button>
      </div>

      {tab === 'forms' ? (
        <>
          <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold mb-6">
            <Plus className="w-4 h-4" /> Create Form
          </button>
          <div className="space-y-6">
            {forms.map((form) => (
              <div key={form.id} className="p-6 bg-card rounded-xl border border-border">
                {editingId === form.id ? (
                  <div className="space-y-4">
                    <input value={editingData.name || ''} onChange={(e) => setEditingData({ ...editingData, name: e.target.value })} placeholder="Form name" className="w-full px-4 py-2 bg-input border border-border rounded-lg" />
                    <select value={editingData.placement || 'contact'} onChange={(e) => setEditingData({ ...editingData, placement: e.target.value })} className="w-full px-4 py-2 bg-input border border-border rounded-lg">
                      {PLACEMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editingData.active ?? false} onChange={(e) => setEditingData({ ...editingData, active: e.target.checked })} />
                      Active
                    </label>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Fields</span>
                        <button onClick={addField} className="text-xs text-accent">+ Add Field</button>
                      </div>
                      {(editingData.fields || []).map((field, i) => (
                        <div key={field.id} className="flex flex-wrap gap-2 mb-2 p-3 bg-background rounded-lg">
                          <input value={field.label} onChange={(e) => {
                            const fields = [...(editingData.fields || [])];
                            fields[i] = { ...field, label: e.target.value };
                            setEditingData({ ...editingData, fields });
                          }} placeholder="Label" className="flex-1 min-w-[120px] px-2 py-1 bg-input border border-border rounded text-sm" />
                          <select value={field.type} onChange={(e) => {
                            const fields = [...(editingData.fields || [])];
                            fields[i] = { ...field, type: e.target.value as FormField['type'] };
                            setEditingData({ ...editingData, fields });
                          }} className="px-2 py-1 bg-input border border-border rounded text-sm">
                            {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <label className="flex items-center gap-1 text-xs">
                            <input type="checkbox" checked={field.required} onChange={(e) => {
                              const fields = [...(editingData.fields || [])];
                              fields[i] = { ...field, required: e.target.checked };
                              setEditingData({ ...editingData, fields });
                            }} /> Req
                          </label>
                          <button onClick={() => setEditingData({ ...editingData, fields: (editingData.fields || []).filter((_, j) => j !== i) })}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-lg text-sm font-semibold"><Save className="w-4 h-4" /> Save</button>
                      <button onClick={() => { setEditingId(null); setEditingData({}); }} className="px-4 py-2 border border-border rounded-lg text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-heading font-bold">{form.name}</h3>
                      <p className="text-sm text-muted-foreground">Placement: {form.placement} · {form.fields.length} fields</p>
                      <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-semibold rounded ${form.active ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-500'}`}>
                        {form.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(form.id); setEditingData(form); }} className="p-2 hover:bg-accent/10 rounded text-sm">Edit</button>
                      <button onClick={() => deleteForm(form.id).then(load)} className="p-2 hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div key={sub.id} className="p-4 bg-card rounded-xl border border-border">
              <div className="flex justify-between mb-2">
                <span className="font-medium text-sm">{sub.formName}</span>
                <span className="text-xs text-muted-foreground">{new Date(sub.submittedAt).toLocaleString()}</span>
              </div>
              <div className="text-sm space-y-1">
                {Object.entries(sub.data).map(([k, v]) => (
                  <p key={k}><span className="text-muted-foreground">{k}:</span> {v}</p>
                ))}
              </div>
            </div>
          ))}
          {submissions.length === 0 && <p className="text-center py-8 text-muted-foreground">No submissions yet</p>}
        </div>
      )}
    </div>
  );
}
