/**
 * Admin Dashboard - Workshop management interface
 */

import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';

interface Workshop {
  id: string;
  title: string;
  description: string;
  status: string;
  segments: Array<{ id: string; title: string }>;
  createdAt: string;
}

export function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="text-xl font-bold text-primary-400">
              Workshop Admin
            </Link>
            <div className="flex gap-4">
              <Link to="/admin/workshops" className="text-gray-300 hover:text-white transition-colors">
                Workshops
              </Link>
              <Link to="/admin/knowledge-bases" className="text-gray-300 hover:text-white transition-colors">
                Knowledge Bases
              </Link>
              <Link to="/admin/avatars" className="text-gray-300 hover:text-white transition-colors">
                Avatars
              </Link>
            </div>
          </div>
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            View Site
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<AdminHome />} />
          <Route path="/workshops" element={<WorkshopManager />} />
          <Route path="/workshops/new" element={<WorkshopEditor />} />
          <Route path="/workshops/:id" element={<WorkshopEditor />} />
          <Route path="/knowledge-bases" element={<KnowledgeBaseManager />} />
          <Route path="/avatars" element={<AvatarManager />} />
        </Routes>
      </main>
    </div>
  );
}

function AdminHome() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <DashboardCard
        title="Workshops"
        description="Create and manage interactive workshops"
        link="/admin/workshops"
        icon="📚"
      />
      <DashboardCard
        title="Knowledge Bases"
        description="Upload and organize content for Q&A"
        link="/admin/knowledge-bases"
        icon="🧠"
      />
      <DashboardCard
        title="Avatars"
        description="Configure AI avatar presenters"
        link="/admin/avatars"
        icon="🎭"
      />
    </div>
  );
}

function DashboardCard({
  title,
  description,
  link,
  icon,
}: {
  title: string;
  description: string;
  link: string;
  icon: string;
}) {
  return (
    <Link
      to={link}
      className="block bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-400">{description}</p>
    </Link>
  );
}

function WorkshopManager() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/workshops')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWorkshops(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading workshops...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Workshops</h1>
        <button
          onClick={() => navigate('/admin/workshops/new')}
          className="px-4 py-2 bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Create Workshop
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Segments</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workshops.map(workshop => (
              <tr key={workshop.id} className="border-t border-gray-700">
                <td className="px-4 py-3">{workshop.title}</td>
                <td className="px-4 py-3">{workshop.segments?.length || 0}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    workshop.status === 'published'
                      ? 'bg-green-900 text-green-300'
                      : workshop.status === 'draft'
                      ? 'bg-yellow-900 text-yellow-300'
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {workshop.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {new Date(workshop.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/admin/workshops/${workshop.id}`)}
                    className="text-primary-400 hover:text-primary-300"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorkshopEditor() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Workshop Editor</h1>
      <form className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
            placeholder="Workshop title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500 h-24"
            placeholder="Workshop description"
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Save Workshop
          </button>
          <Link
            to="/admin/workshops"
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function KnowledgeBaseManager() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Knowledge Bases</h1>
      <p className="text-gray-400">
        Upload documents to create knowledge bases for avatar Q&A.
      </p>
      {/* Knowledge base management UI would go here */}
    </div>
  );
}

function AvatarManager() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Avatars</h1>
      <p className="text-gray-400">
        Configure AI avatars for your workshops.
      </p>
      {/* Avatar management UI would go here */}
    </div>
  );
}
