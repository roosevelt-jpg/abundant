'use client';

import { useState } from 'react';
import { CustomForm, FormField } from '@/lib/types';
import { submitForm } from '@/lib/forms-service';

interface CustomFormRendererProps {
  form: CustomForm;
  compact?: boolean;
}

export function CustomFormRenderer({ form, compact = false }: CustomFormRendererProps) {
  const [data, setData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const fields = [...form.fields].sort((a, b) => a.order - b.order);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await submitForm(form.id, form.name, data);
      setSubmitted(true);
      setData({});
    } catch {
      setError('Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm">
        Thank you! Your submission has been received.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
      <h3 className={`font-heading font-bold ${compact ? 'text-xl mb-1' : 'text-lg'}`}>{form.name}</h3>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {fields.map((field) => (
        <FieldInput
          key={field.id}
          field={field}
          value={data[field.id] || ''}
          onChange={(v) => setData({ ...data, [field.id]: v })}
          compact={compact}
        />
      ))}
      <button
        type="submit"
        disabled={loading}
        className={`w-full bg-accent text-accent-foreground rounded-lg font-semibold disabled:opacity-50 ${compact ? 'py-2 text-sm' : 'py-2'}`}
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  compact,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const cls = compact
    ? 'w-full px-3 py-1.5 text-sm bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent'
    : 'w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent';
  const labelCls = compact ? 'block text-xs font-medium mb-1' : 'block text-sm font-medium mb-2';

  if (field.type === 'textarea') {
    return (
      <div>
        <label className={labelCls}>{field.label}{field.required && ' *'}</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          placeholder={field.placeholder}
          rows={compact ? 3 : 4}
          className={`${cls} resize-none`}
        />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div>
        <label className={labelCls}>{field.label}{field.required && ' *'}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)} required={field.required} className={cls}>
          <option value="">Select...</option>
          {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value === 'true'} onChange={(e) => onChange(e.target.checked ? 'true' : 'false')} required={field.required} />
        {field.label}
      </label>
    );
  }

  return (
    <div>
      <label className={labelCls}>{field.label}{field.required && ' *'}</label>
      <input
        type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        placeholder={field.placeholder}
        className={cls}
      />
    </div>
  );
}
