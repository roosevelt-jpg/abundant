import { AdminIntegrationsEditor } from './editor';

export const metadata = {
  title: 'Integrations - Admin Dashboard',
  description: 'Manage all external integrations and API configurations',
};

export default function AdminIntegrationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Integrations</h1>
          <p className="text-muted-foreground">
            Configure and manage all external integrations including Firebase, payments, calendars, and more.
          </p>
        </div>
        <AdminIntegrationsEditor />
      </div>
    </div>
  );
}
