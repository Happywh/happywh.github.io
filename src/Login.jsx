import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import './login.css'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [showResend, setShowResend] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()

    setError('')
    setMessage('')
    setShowResend(false)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Login error:', error)

      // Supabase returns this when Confirm Email is enabled
      // and the user's email has not been confirmed.
      if (
        error.message.toLowerCase().includes('email not confirmed')
      ) {
        setError('Your email has not been confirmed yet.')
        setShowResend(true)
      } else {
        setError(error.message)
      }

      setLoading(false)
      return
    }

    navigate('/')
  }

  async function resendConfirmation() {
    setResending(true)
    setError('')
    setMessage('')

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage(
        'Confirmation email sent. Please check your inbox.'
      )
    }

    setResending(false)
  }

  return (
    <div className="login-page">
      <div className="login-container">

        <p className="login-eyebrow">
          WELCOME BACK
        </p>

        <h1 className="login-title">
          Log in.
        </h1>

        <p className="login-subtitle">
          Sign in to access your account.
        </p>

        <form
          className="login-form"
          onSubmit={handleLogin}
        >

          <div className="login-field">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>

        </form>

        {error && (
          <p className="login-error">
            {error}
          </p>
        )}

        {showResend && (
          <button
            className="login-resend"
            onClick={resendConfirmation}
            disabled={resending}
          >
            {resending
              ? 'Sending...'
              : 'Resend confirmation email'}
          </button>
        )}

        {message && (
          <p className="login-message">
            {message}
          </p>
        )}

        <div className="login-footer">
          Don't have an account?{' '}
          <Link to="/register">
            Create one
          </Link>
        </div>

        <Link
          to="/"
          className="login-back"
        >
          ← Back to home
        </Link>

      </div>
    </div>
  )
}

export default Login