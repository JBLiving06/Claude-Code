import { Outlet, Link, useLocation } from 'react-router-dom'
import './Layout.css'

function Layout() {
  const location = useLocation()

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            RAISE THE CROWN
          </Link>
          <div className="navbar-links">
            <Link
              to="/workshop"
              className={`nav-link ${location.pathname.includes('workshop') ? 'active' : ''}`}
            >
              Workshop
            </Link>
            <Link
              to="/resources"
              className={`nav-link ${location.pathname === '/resources' ? 'active' : ''}`}
            >
              Resources
            </Link>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <p className="footer-credit">An EdSolutions Production</p>
            <blockquote className="footer-quote">
              "Hold the crown above their heads and dare them to grow into it."
              <cite>— Howard Thurman</cite>
            </blockquote>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
