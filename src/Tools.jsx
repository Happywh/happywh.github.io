import { Link } from 'react-router-dom'
import './tools.css'

function Tools() {
  return (
    <div className="tools-page">
      <div className="tools-container">

        <div className="tools-header">
          <div>
            <p className="tools-eyebrow">
              04 — TOOLS
            </p>

            <h1 className="tools-title">
              Tools.
            </h1>

            <p className="tools-description">
              A collection of small tools and utilities I've built.
            </p>
          </div>

          <Link
            to="/"
            className="tools-back"
          >
            ← Back
          </Link>
        </div>

        <div className="tools-list">

          <div className="tool">
            <div className="tool-number">
              01
            </div>

            <div className="tool-content">
              <h2>
                Tool One
              </h2>

              <p>
                A short description of what this tool does.
              </p>

              <button className="tool-button">
                Open →
              </button>
            </div>
          </div>

          <div className="tool">
            <div className="tool-number">
              02
            </div>

            <div className="tool-content">
              <h2>
                Tool Two
              </h2>

              <p>
                Another useful tool or utility.
              </p>

              <button className="tool-button">
                Open →
              </button>
            </div>
          </div>

          <div className="tool">
            <div className="tool-number">
              03
            </div>

            <div className="tool-content">
              <h2>
                Tool Three
              </h2>

              <p>
                Something else you've built.
              </p>

              <button className="tool-button">
                Open →
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default Tools