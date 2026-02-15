import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { modules } from '../data/modules'
import VideoPlayer from '../components/VideoPlayer'
import DuBoisChat from '../components/DuBoisChat'
import './Workshop.css'

function Workshop() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const [currentModule, setCurrentModule] = useState(null)

  useEffect(() => {
    // If no moduleId in URL, default to module 1
    if (!moduleId) {
      navigate('/workshop/1', { replace: true })
      return
    }

    const module = modules.find((m) => m.id === parseInt(moduleId))
    if (module) {
      setCurrentModule(module)
    } else {
      // Invalid module ID, redirect to module 1
      navigate('/workshop/1', { replace: true })
    }
  }, [moduleId, navigate])

  const handleModuleSelect = (id) => {
    navigate(`/workshop/${id}`)
  }

  const handlePrevious = () => {
    const currentIndex = modules.findIndex((m) => m.id === currentModule.id)
    if (currentIndex > 0) {
      navigate(`/workshop/${modules[currentIndex - 1].id}`)
    }
  }

  const handleNext = () => {
    const currentIndex = modules.findIndex((m) => m.id === currentModule.id)
    if (currentIndex < modules.length - 1) {
      navigate(`/workshop/${modules[currentIndex + 1].id}`)
    }
  }

  if (!currentModule) {
    return null
  }

  const currentIndex = modules.findIndex((m) => m.id === currentModule.id)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < modules.length - 1

  return (
    <div className="workshop">
      <div className="workshop-container">
        {/* Module Selector Sidebar (Desktop) */}
        <aside className="module-selector-desktop">
          <h3 className="selector-title">Workshop Modules</h3>
          <div className="module-list">
            {modules.map((module) => (
              <button
                key={module.id}
                className={`module-item ${module.id === currentModule.id ? 'active' : ''}`}
                onClick={() => handleModuleSelect(module.id)}
              >
                <span className="module-item-subtitle">{module.subtitle}</span>
                <span className="module-item-title">{module.title}</span>
                <span className="module-item-duration">{module.duration}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Module Selector (Mobile) */}
        <div className="module-selector-mobile">
          <select
            className="module-select"
            value={currentModule.id}
            onChange={(e) => handleModuleSelect(parseInt(e.target.value))}
          >
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.subtitle}: {module.title}
              </option>
            ))}
          </select>
        </div>

        {/* Main Content */}
        <main className="workshop-main">
          {/* Video Player */}
          <VideoPlayer module={currentModule} />

          {/* Module Info */}
          <div className="module-info">
            <div className="module-info-header">
              <div>
                <span className="module-info-subtitle">{currentModule.subtitle}</span>
                <h2 className="module-info-title">{currentModule.title}</h2>
              </div>
              <span className="module-info-duration">{currentModule.duration}</span>
            </div>

            <p className="module-info-description">{currentModule.description}</p>

            <div className="module-info-topics">
              <h4>Topics Covered:</h4>
              <ul>
                {currentModule.topics.map((topic, index) => (
                  <li key={index}>{topic}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navigation */}
          <div className="module-navigation">
            <button
              className="btn-secondary nav-btn"
              onClick={handlePrevious}
              disabled={!hasPrevious}
            >
              <ChevronLeft size={20} />
              Previous Module
            </button>
            <button
              className="btn-secondary nav-btn"
              onClick={handleNext}
              disabled={!hasNext}
            >
              Next Module
              <ChevronRight size={20} />
            </button>
          </div>
        </main>
      </div>

      {/* Du Bois Chat */}
      <DuBoisChat />
    </div>
  )
}

export default Workshop
