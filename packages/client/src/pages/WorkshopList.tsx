/**
 * Workshop List Page - Browse available workshops
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

interface WorkshopSummary {
  id: string;
  title: string;
  description: string;
  status: string;
}

export function WorkshopList() {
  const [workshops, setWorkshops] = useState<WorkshopSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getWorkshops } = useApi();

  useEffect(() => {
    async function loadWorkshops() {
      try {
        const data = await getWorkshops();
        setWorkshops(data.filter(w => w.status === 'published'));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadWorkshops();
  }, [getWorkshops]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Workshops</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Interactive Workshops</h1>
        <p className="text-xl text-gray-400">
          Learn at your own pace with AI-powered avatar instructors
        </p>
      </header>

      {workshops.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-semibold mb-2">No Workshops Available</h2>
          <p className="text-gray-400">Check back later for new content</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workshops.map((workshop) => (
            <Link
              key={workshop.id}
              to={`/workshop/${workshop.id}`}
              className="block bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors group"
            >
              <div className="aspect-video bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center">
                <div className="text-6xl group-hover:scale-110 transition-transform">
                  🎓
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2 group-hover:text-primary-400 transition-colors">
                  {workshop.title}
                </h2>
                <p className="text-gray-400 line-clamp-2">{workshop.description}</p>
                <div className="mt-4 flex items-center text-sm text-primary-400">
                  <span>Start Learning</span>
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
