'use client';

import { useState } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminMembers() {
  const [searchTerm, setSearchTerm] = useState('');

  const members = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      tier: 'Elite',
      status: 'Approved',
      joinDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      tier: 'Member',
      status: 'Pending',
      joinDate: '2024-06-10'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      tier: 'Inner Circle',
      status: 'Approved',
      joinDate: '2023-11-20'
    }
  ];

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Members</h1>
          <p className="text-muted-foreground">Manage and review member accounts</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors">
          <Plus className="w-5 h-5" />
          Add Member
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search members..."
          className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Members Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-background/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Tier</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Join Date</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id} className="border-t border-border hover:bg-background/50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium">{member.name}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{member.email}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-block px-2 py-1 bg-accent/10 text-accent text-xs font-semibold rounded">
                    {member.tier}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                    member.status === 'Approved'
                      ? 'bg-green-500/10 text-green-600'
                      : 'bg-yellow-500/10 text-yellow-600'
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{member.joinDate}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors">
                      <Edit className="w-4 h-4 text-accent" />
                    </button>
                    <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
