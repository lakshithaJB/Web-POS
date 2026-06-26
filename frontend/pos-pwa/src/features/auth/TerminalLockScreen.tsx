import { useState } from 'react'
import { Lock } from 'lucide-react'
import apiClient from '@/api/client'
import { useAuthStore } from '@/store/authStore'

export default function TerminalLockScreen() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, unlock, logout } = useAuthStore()

  const handleUnlock = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await apiClient.post('/auth/unlock', { pin, userId: user?.id })
      unlock(data.token)
    } catch {
      setError('Incorrect PIN')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-80 text-center">
        <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Terminal Locked</h2>
        <p className="text-gray-500 text-sm mt-1 mb-6">{user?.displayName}</p>

        <div className="flex justify-center gap-2 mb-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                i < pin.length ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key) => (
            <button
              key={key}
              onClick={() => {
                if (key === '⌫') setPin((p) => p.slice(0, -1))
                else if (key !== '' && pin.length < 6) setPin((p) => p + key)
              }}
              disabled={!key || loading}
              className={`h-14 rounded-xl text-lg font-medium transition-colors ${
                key === '⌫' ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : key ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' : 'invisible'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <button
          onClick={handleUnlock}
          disabled={pin.length < 4 || loading}
          className="w-full h-12 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          Unlock
        </button>

        <button onClick={logout} className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600">
          Switch User
        </button>
      </div>
    </div>
  )
}