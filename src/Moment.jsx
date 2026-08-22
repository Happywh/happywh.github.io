import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import shiba from './assets/shiba.png'
import './moment.css'

function Moment() {
  const navigate = useNavigate()

  const [checking, setChecking] = useState(true)
  const [content, setContent] = useState({})

  useEffect(() => {
    async function loadPage() {
      // Check that the user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        navigate('/tools', { replace: true })
        return
      }

      // Check access using the protected RPC
      const { data: allowed, error: accessError } =
        await supabase.rpc('check_tool_permission')

      if (accessError) {
        console.error(
          'Error checking permission:',
          accessError
        )

        navigate('/tools', { replace: true })
        return
      }

      if (allowed !== true) {
        navigate('/tools', { replace: true })
        return
      }

      // User is authorized.
      // Now load the page content.
      const { data, error: contentError } = await supabase
        .from('moment_content')
        .select('section, content')

      if (contentError) {
        console.error(
          'Error loading moment content:',
          contentError
        )

        setChecking(false)
        return
      }

      const contentMap = {}

      data.forEach((item) => {
        contentMap[item.section] = item.content
      })

      setContent(contentMap)
      setChecking(false)
    }

    loadPage()
  }, [navigate])

  // Don't render anything while access is being checked
  if (checking) {
    return null
  }

  return (
    <div className="moment-page">

      <div className="accent-mark mark-one">
        ♡
      </div>

      <div className="accent-mark mark-two">
        ♡
      </div>

      <div className="accent-mark mark-three">
        ♡
      </div>


      {/* HERO */}

      <div className="moment-container">

        <section className="moment-hero">

          <div className="shiba shiba-top">
            <img
              src={shiba}
              alt=""
            />
          </div>

          <p className="moment-eyebrow">
            {content.eyebrow}
          </p>

          <h1 className="moment-title">
            {content.title
              ?.split('\n')
              .map((line, index, lines) => (
                <span key={index}>
                  {line}

                  {index < lines.length - 1 && (
                    <br />
                  )}
                </span>
              ))}
          </h1>

          <p className="moment-subtitle">
            {content.subtitle}
          </p>

          <div className="moment-divider">
            <span>♡</span>
          </div>

        </section>


        {/* MESSAGE */}

        <section className="moment-message">

          <p className="message-intro">
            {content.message_intro}
          </p>

          <p>
            {content.message_1}
          </p>

          <p>
            {content.message_2}
          </p>

          <p className="message-highlight">
            {content.message_highlight}
          </p>

        </section>


        {/* SHIBA */}

        <section className="shiba-section">

          <div className="shiba-card">

            <div className="shiba-drawing">
              <img
                src={shiba}
                alt=""
              />
            </div>

            <div className="shiba-text">

              <span className="shiba-small">
                {content.shiba_label}
              </span>

              <h2>
                {content.shiba_title}
              </h2>

              <p>
                {content.shiba_text}
              </p>

            </div>

          </div>

        </section>


        {/* ENDING */}

        <section className="moment-ending">

          <div className="ending-line">
            <span></span>
            <span>♡</span>
            <span></span>
          </div>

          <p className="ending-small">
            {content.ending_label}
          </p>

          <h2>
            {content.ending_title
              ?.split('\n')
              .map((line, index, lines) => (
                <span key={index}>
                  {line}

                  {index < lines.length - 1 && (
                    <br />
                  )}
                </span>
              ))}
          </h2>

          <p>
            {content.ending_text}
          </p>

          <div className="ending-shiba">
            <img
              src={shiba}
              alt=""
            />
          </div>

          <p className="signoff">
            {content.signoff}
          </p>

        </section>


        {/* BACK */}

        <div className="moment-back">
          <button
            onClick={() => navigate('/tools')}
          >
            ← Back
          </button>
        </div>

      </div>

    </div>
  )
}

export default Moment