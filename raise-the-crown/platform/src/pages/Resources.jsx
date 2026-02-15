import { ExternalLink, Award } from 'lucide-react'
import { tiers, discountPaths } from '../data/resources'
import './Resources.css'

function Resources() {
  return (
    <div className="resources">
      <div className="resources-container">
        {/* Header */}
        <header className="resources-header">
          <h1 className="resources-title">Your AI Toolkit</h1>
          <p className="resources-subtitle">
            You don't need $100/month to build powerful AI workflows. Start free, upgrade intentionally.
          </p>
        </header>

        {/* Tiers Grid */}
        <section className="tiers-section">
          <div className="tiers-grid">
            {tiers.map((tier, index) => (
              <div
                key={index}
                className={`tier-card ${tier.recommended ? 'recommended' : ''}`}
              >
                {tier.recommended && (
                  <div className="recommended-badge">
                    <Award size={16} />
                    Recommended
                  </div>
                )}
                <div className="tier-header">
                  <h3 className="tier-name">{tier.name}</h3>
                  <p className="tier-price">{tier.price}</p>
                </div>
                <p className="tier-description">{tier.description}</p>
                <div className="tier-tools">
                  {tier.tools.map((tool, toolIndex) => (
                    <div key={toolIndex} className="tool-item">
                      <div className="tool-header">
                        <span className="tool-name">{tool.name}</span>
                        <span className="tool-category">{tool.category}</span>
                      </div>
                      <p className="tool-notes">{tool.notes}</p>
                      {tool.studentDiscount && (
                        <div className="student-discount-tag">
                          {typeof tool.studentDiscount === 'string'
                            ? tool.studentDiscount
                            : 'Student discount available'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Student Discounts Section */}
        <section className="discounts-section">
          <h2 className="section-title">Student Discount Paths</h2>
          <p className="section-description">
            Many platforms offer free or discounted access for students. Here's where to start:
          </p>
          <div className="discounts-grid">
            {discountPaths.map((path, index) => (
              <div key={index} className="discount-card">
                <div className="discount-header">
                  <h4 className="discount-provider">{path.provider}</h4>
                  <a
                    href={`https://${path.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="discount-link"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
                <p className="discount-benefit">{path.benefit}</p>
                <p className="discount-url">{path.url}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Note */}
        <section className="resources-note">
          <p>
            Remember: The goal is not to subscribe to everything. Start with free tools,
            identify where you're hitting limits, then upgrade strategically. Most students
            can build powerful workflows with just $20-30/month in paid tools.
          </p>
        </section>
      </div>
    </div>
  )
}

export default Resources
