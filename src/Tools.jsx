import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './lib/supabase'
import './tools.css'

function Tools() {
  const [canView, setCanView] = useState(false)

  useEffect(() => {
    async function checkPermission() {

      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      const { data, error } = await supabase.rpc(
        'check_tool_permission'
      )

      if (error) {
        console.error('Error checking permission:', error)
        return
      }

      setCanView(data === true)
    }

    checkPermission()
  }, [])

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

          <div className="tools-header-actions">

            {canView && (
              <Link
                to="/tools/moment"
                className="special-button"
              >
                For You
              </Link>
            )}

            <Link
              to="/"
              className="tools-back"
            >
              ← Back
            </Link>

          </div>

        </div>

        <div className="tools-list">

          <div className="tool">
            <div className="tool-number">
              01
            </div>

            <div className="tool-content">
              <h2>
                Travel Calculator
              </h2>

              <p>
                Split trip expenses and calculate who owes who
                at the end of a trip.
              </p>

              <Link
                to="/tools/reconciliator"
                className="tool-button"
              >
                Open →
              </Link>
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