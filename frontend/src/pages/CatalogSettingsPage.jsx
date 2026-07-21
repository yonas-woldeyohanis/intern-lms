import { useState } from 'react';
import { Tags, UserSquare2, Building2, Warehouse } from 'lucide-react';
import LookupCrudPage from '../components/common/LookupCrudPage';
import { categoriesApi, authorsApi, publishersApi, shelvesApi } from '../api/endpoints';

const TABS = [
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'authors', label: 'Authors', icon: UserSquare2 },
  { id: 'publishers', label: 'Publishers', icon: Building2 },
  { id: 'shelves', label: 'Shelves', icon: Warehouse }
];

export default function CatalogSettingsPage() {
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Catalog Data</h1>
        <p className="page-subtitle">Manage library classification data, authors, publishers, and physical shelves.</p>
      </div>

      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 hide-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? 'border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {activeTab === 'categories' && (
          <LookupCrudPage
            title="Categories"
            description="Organize books into browsable subject categories."
            api={categoriesApi}
            queryKey="categories"
            primaryField="name"
            fields={[
              { name: 'name', label: 'Category Name', required: true },
              { name: 'description', label: 'Description' }
            ]}
            columns={[{ header: 'Description', cell: ({ row }) => row.original.description || '—' }]}
          />
        )}

        {activeTab === 'authors' && (
          <LookupCrudPage
            title="Authors"
            description="Manage the roster of book authors."
            api={authorsApi}
            queryKey="authors"
            primaryField="full_name"
            fields={[
              { name: 'full_name', label: 'Full Name', required: true },
              { name: 'nationality', label: 'Nationality' },
              { name: 'bio', label: 'Short Bio' }
            ]}
            columns={[{ header: 'Nationality', cell: ({ row }) => row.original.nationality || '—' }]}
          />
        )}

        {activeTab === 'publishers' && (
          <LookupCrudPage
            title="Publishers"
            description="Manage the list of book publishers."
            api={publishersApi}
            queryKey="publishers"
            primaryField="name"
            fields={[
              { name: 'name', label: 'Publisher Name', required: true },
              { name: 'contact_email', label: 'Contact Email', type: 'email' },
              { name: 'website', label: 'Website' },
              { name: 'address', label: 'Address' }
            ]}
            columns={[{ header: 'Contact', cell: ({ row }) => row.original.contact_email || '—' }]}
          />
        )}

        {activeTab === 'shelves' && (
          <LookupCrudPage
            title="Shelves"
            description="Manage physical shelf locations for shelving books."
            api={shelvesApi}
            queryKey="shelves"
            primaryField="code"
            fields={[
              { name: 'code', label: 'Shelf Code', required: true },
              { name: 'location_description', label: 'Location Description' },
              { name: 'capacity', label: 'Capacity', type: 'number' }
            ]}
            columns={[
              { header: 'Location', cell: ({ row }) => row.original.location_description || '—' },
              { header: 'Capacity', cell: ({ row }) => row.original.capacity ?? '—' }
            ]}
          />
        )}
      </div>
    </div>
  );
}
