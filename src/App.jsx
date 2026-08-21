import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Login from './Login'
import Register from './Register'
import Tools from './Tools'
import Reconciliator from './Reconciliator'
import ReconciliatorTrip from './ReconciliatorTrip'

function Home() {
  const [user, setUser] = useState(null)
  const [siteContent, setSiteContent] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadContent() {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')

      if (error) {
        console.error('Error loading site content:', error)
        setLoading(false)
        return
      }

      console.log('Supabase data:', data)

      const content = {}

      data.forEach((item) => {
        content[item.section] = item
      })

      console.log('Formatted content:', content)

      setSiteContent(content)
      setLoading(false)
    }

    loadContent()
  }, [])
  
  useEffect(() => { //to display user after login
    async function getUser() {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      setUser(user)
    }

    getUser()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
    }, [])

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="site">

      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-name">
          {siteContent.hero?.title}
        </div>

        <div className="nav-links">

          <a href="#about">
            About
          </a>

          <a href="#work">
            Work
          </a>

          <a href="#contact">
            Contact
          </a>

          {user ? (
            <>
              <span className="login-link">
                Welcome, {user.email.split('@')[0]}
              </span>

              <Link
                to="/tools"
                className="login-link"
              >
                Tools
              </Link>

              <button
                onClick={handleLogout}
                className="logout-button"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="login-link"
            >
              Login
            </Link>
          )}
        </div>
      </nav>


      {/* Hero */}
      <main>

        <section className="hero-section">
          <div className="hero-content">

            <p className="eyebrow">
              HELLO, I'M
            </p>

            <h1>
              {siteContent.hero.title}
            </h1>

            <p className="subtitle">
              Developer · Designer · Problem Solver
            </p>

            <p className="hero-description">
              I enjoy building things, solving interesting problems,
              and turning ideas into something people can actually use.
            </p>

            <div className="hero-buttons">
              <a href="#about" className="primary-button">
                About me
              </a>

              <a href="#work" className="secondary-button">
                View my work →
              </a>
            </div>

          </div>
        </section>


        {/* About */}
        <section id="about" className="section">
          <div className="section-label">
            01 — ABOUT
          </div>

          <div className="section-content">
            <h2>
              A little about me.
            </h2>

            <p>
              I'm someone who enjoys learning new things and
              working on projects that combine creativity with
              technology.
            </p>

            <p>
              When I'm not working, you'll probably find me
              exploring somewhere new, working on a side project,
              or spending time with the people who matter to me.
            </p>
          </div>
        </section>


        {/* Work */}
        <section id="work" className="section">
          <div className="section-label">
            02 — WORK
          </div>

          <div className="section-content">

            <h2>
              Things I've worked on.
            </h2>

            <div className="projects">

              <div className="project">
                <div className="project-number">01</div>

                <div>
                  <h3>Project One</h3>

                  <p>
                    A short description of the project and
                    what you built.
                  </p>

                  <span>React · Python · SQL</span>
                </div>
              </div>

              <div className="project">
                <div className="project-number">02</div>

                <div>
                  <h3>Project Two</h3>

                  <p>
                    Another project that demonstrates some of
                    your interests and skills.
                  </p>

                  <span>Java · Spring Boot · MySQL</span>
                </div>
              </div>

              <div className="project">
                <div className="project-number">03</div>

                <div>
                  <h3>Project Three</h3>

                  <p>
                    Something else you've built or worked on.
                  </p>

                  <span>Python · Automation · Data</span>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* Contact */}
        <section id="contact" className="section contact">
          <div className="section-label">
            03 — CONTACT
          </div>

          <div className="section-content">
            <h2>
              Let's connect.
            </h2>

            <p>
              Interested in working together or just want to say hi?
            </p>

            <a
              href="mailto:you@example.com"
              className="email"
            >
              you@example.com →
            </a>
          </div>
        </section>

      </main>


      {/* Footer */}
      <footer>
        <span>© 2026 Your Name</span>

        {/* Very subtle Easter egg */}
        <a href="/login" className="footer-login">
          •
        </a>
      </footer>

    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/tools" element={<Tools />} />

        <Route path="/tools/reconciliator" element={<Reconciliator />} />

        <Route path="/reconciliator/:tripId" element={<ReconciliatorTrip />}/>

      </Routes>
    </BrowserRouter>
  )
}

export default App