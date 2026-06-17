'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { AdminProtectedLayout } from '@/components/admin-protected-layout';
import { Upload, Save, Image as ImageIcon, Check } from 'lucide-react';

export default function BrandingPage() {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [logos, setLogos] = useState({
    header: { url: '', preview: '', file: null as File | null },
    footer: { url: '', preview: '', file: null as File | null },
    login: { url: '', preview: '', file: null as File | null },
  });

  useEffect(() => {
    loadLogos();
  }, []);

  const loadLogos = async () => {
    try {
      setLoading(true);
      const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        if (data.logos) {
          setLogos(prev => ({
            header: { ...prev.header, url: data.logos.header || '', preview: data.logos.header || '' },
            footer: { ...prev.footer, url: data.logos.footer || '', preview: data.logos.footer || '' },
            login: { ...prev.login, url: data.logos.login || '', preview: data.logos.login || '' },
          }));
        }
      }
    } catch (error) {
      console.error('[v0] Error loading logos:', error);
      setMessage({ type: 'error', text: 'Failed to load logos' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, logoType: 'header' | 'footer' | 'login') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogos(prev => ({
        ...prev,
        [logoType]: {
          ...prev[logoType],
          file,
          preview: event.target?.result as string,
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const uploadToFirestore = async (file: File, logoType: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // Store base64 data URL directly in Firestore
          const dataUrl = e.target?.result as string;
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const updatedLogos: any = {};

      // Process each logo
      for (const logoType of ['header', 'footer', 'login'] as const) {
        if (logos[logoType].file) {
          // Upload new file
          const dataUrl = await uploadToFirestore(logos[logoType].file, logoType);
          updatedLogos[logoType] = dataUrl;
        } else if (logos[logoType].url) {
          // Keep existing URL
          updatedLogos[logoType] = logos[logoType].url;
        }
      }

      // Update Firestore settings
      const settingsRef = doc(db, 'settings', 'general');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        await setDoc(settingsRef, {
          ...settingsDoc.data(),
          logos: updatedLogos,
          updatedAt: Date.now(),
          updatedBy: currentUser?.email || 'unknown',
        });
      } else {
        await setDoc(settingsRef, {
          logos: updatedLogos,
          updatedAt: Date.now(),
          updatedBy: currentUser?.email || 'unknown',
        });
      }

      setMessage({ type: 'success', text: 'Logos updated successfully! Changes will appear on your site shortly.' });
      
      // Reset file inputs
      setLogos(prev => ({
        header: { ...prev.header, file: null },
        footer: { ...prev.footer, file: null },
        login: { ...prev.login, file: null },
      }));
    } catch (error) {
      console.error('[v0] Error saving logos:', error);
      setMessage({ type: 'error', text: 'Failed to save logos. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const LogoUploadSection = ({ title, type, description }: { title: string; type: 'header' | 'footer' | 'login'; description: string }) => (
    <div className="bg-background rounded-lg border border-border p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-heading font-bold text-lg mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ImageIcon className="w-6 h-6 text-accent/50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <div>
          <label className="block mb-3 text-sm font-medium">Upload New Logo</label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent transition-colors cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, type)}
              className="hidden"
              id={`logo-input-${type}`}
            />
            <label htmlFor={`logo-input-${type}`} className="cursor-pointer block">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, GIF (recommended: transparent background)</p>
            </label>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block mb-3 text-sm font-medium">Preview</label>
          <div className="bg-card border border-border rounded-lg p-6 flex items-center justify-center h-[200px]">
            {logos[type].preview ? (
              <img src={logos[type].preview} alt={`${type} logo preview`} className="max-h-full max-w-full object-contain" />
            ) : (
              <p className="text-muted-foreground text-sm">No logo selected</p>
            )}
          </div>
          {logos[type].file && (
            <p className="text-xs text-muted-foreground mt-2">
              New file: {logos[type].file?.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminProtectedLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading branding settings...</p>
        </div>
      </AdminProtectedLayout>
    );
  }

  return (
    <AdminProtectedLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">Branding Management</h1>
          <p className="text-muted-foreground">Manage your site logos for header, footer, and login page</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-600' 
              : 'bg-red-500/10 border-red-500/20 text-red-600'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' && <Check className="w-5 h-5" />}
              {message.text}
            </div>
          </div>
        )}

        <LogoUploadSection 
          title="Header Logo"
          type="header"
          description="Logo displayed in the website header/navigation"
        />

        <LogoUploadSection 
          title="Footer Logo"
          type="footer"
          description="Logo displayed in the website footer"
        />

        <LogoUploadSection 
          title="Login Page Logo"
          type="login"
          description="Logo displayed on the login/authentication page"
        />

        <button
          onClick={handleSave}
          disabled={saving || (!logos.header.file && !logos.footer.file && !logos.login.file)}
          className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save All Logos'}
        </button>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Your logos will be saved to Firestore and displayed across your site within seconds.
        </p>
      </div>
    </AdminProtectedLayout>
  );
}
