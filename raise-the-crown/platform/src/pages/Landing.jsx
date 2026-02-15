import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import { modules } from '../data/modules'
import './Landing.css'

function Landing() {
  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <h1 className="hero-title">RAISE THE CROWN</h1>
          <p className="hero-subtitle">An AI Literacy Workshop</p>
          <blockquote className="hero-quote">
            "Hold the crown above their heads and dare them to grow into it."
            <cite>— Howard Thurman</cite>
          </blockquote>
          <p className="hero-description">
            A video workshop series designed for African American students at Morehouse College
            and beyond. Four modules that transform how you think about and work with AI,
            plus office hours with an AI-generated W.E.B. Du Bois persona.
          </p>
          <Link to="/workshop" className="btn-primary hero-cta">
            Enter the Workshop
            <ArrowRight size={20} style={{ marginLeft: '8px' }} />
          </Link>
        </div>
      </section>

      {/* Modules Preview Section */}
      <section className="modules-section">
        <div className="modules-container">
          <h2 className="section-title">Workshop Modules</h2>
          <div className="modules-grid">
            {modules.map((module) => (
              <Link
                key={module.id}
                to={`/workshop/${module.id}`}
                className="module-card"
              >
                <div className="module-header">
                  <span className="module-subtitle">{module.subtitle}</span>
                  <span className="module-duration">
                    <Clock size={14} />
                    {module.duration}
                  </span>
                </div>
                <h3 className="module-title">{module.title}</h3>
                <p className="module-description">{module.description}</p>
                <div className="module-topics">
                  {module.topics.map((topic, index) => (
                    <span key={index} className="topic-tag">
                      {topic}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="about-container">
          <h2 className="section-title">What This Is</h2>
          <div className="about-content">
            <p>
              This platform delivers a cutting-edge AI literacy curriculum through video modules
              and an interactive chatbot experience. You'll learn:
            </p>
            <ul className="about-list">
              <li>How to engineer academic AI protocols that actually work</li>
              <li>Which AI tools to invest in (and which ones are free)</li>
              <li>How to build workflows that make you more effective, not dependent</li>
              <li>What the future of agentic AI means for your generation</li>
            </ul>
            <p>
              Plus: "Office Hours with Brother Du Bois" — an AI chatbot persona based on W.E.B. Du Bois,
              available throughout the workshop to discuss the protocols, education, and the future.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing
