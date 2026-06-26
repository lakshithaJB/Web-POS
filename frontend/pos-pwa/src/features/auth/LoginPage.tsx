import { useState } from 'react'
import apiClient from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handlePin = (digit: string) => {
    if (pin.length < 6) setPin((p) => p + digit)
  }

  const handleSubmit = async () => {
    if (pin.length < 4) return
    setLoading(true)
    setError('')
    try {
      const { data } = await apiClient.post('/auth/pin-login', { pin })
      login(data.user, data.token)
      navigate('/shift/open')
    } catch {
      setError('Invalid PIN. Please try again.')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-80">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Smart POS</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your PIN to continue</p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                i < pin.length ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key) => (
            <button
              key={key}
              onClick={() => {
                if (key === '⌫') setPin((p) => p.slice(0, -1))
                else if (key !== '') handlePin(key)
              }}
              disabled={!key || loading}
              className={`h-14 rounded-xl text-lg font-medium transition-colors ${
                key === '⌫'
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : key
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  : 'invisible'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={pin.length < 4 || loading}
          className="w-full mt-4 h-12 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}