import { useState, type FormEvent } from 'react'
import { signIn, signUp } from '@/services/supabase/auth'

type Mode = 'signin' | 'signup'

interface Props {
  onSkip?: () => void
}

export function AuthScreen({ onSkip }: Props) {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const result = await signUp(email, password, name || undefined)
        // Supabase may require email confirmation
        if (result.user && !result.session) {
          setCheckEmail(true)
        }
      } else {
        await signIn(email, password)
      }
      // On success, onAuthChange in AuthGuard will pick up the session
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (checkEmail) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-icon">✉️</div>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account.
          </p>
          <button
            className="auth-link"
            onClick={() => { setCheckEmail(false); setMode('signin') }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'signin'
              ? 'Sign in to sync your progress across devices'
              : 'Start tracking your memorization journey'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="auth-field">
              <label htmlFor="auth-name" className="auth-label">Name</label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="What should we call you?"
                className="auth-input"
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email" className="auth-label">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="auth-input"
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password" className="auth-label">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              className="auth-input"
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <div className="auth-error">{error}</div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
              : (mode === 'signin' ? 'Sign in' : 'Create account')}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'signin' ? (
            <p>
              Don't have an account?{' '}
              <button className="auth-link" onClick={() => { setMode('signup'); setError('') }}>
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button className="auth-link" onClick={() => { setMode('signin'); setError('') }}>
                Sign in
              </button>
            </p>
          )}
          {onSkip && (
            <p className="auth-skip">
              <button className="auth-link" onClick={onSkip}>
                Continue without account
              </button>
              <span className="auth-skip-note"> — data stays on this device</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
