import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { LogIn, AlertCircle, Eye, EyeOff, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, isLoading, error, setError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    setError(null)

    if (!email || !password) {
      setLocalError('Please enter both email and password')
      return
    }

    try {
      await login(email, password)
      toast.success('Login successful!')
      navigate('/dashboard')
    } catch (err: any) {
      setLocalError(err.message || 'Login failed. Please try again.')
      toast.error(err.message || 'Login failed')
    }
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-blue-600 p-3 rounded-lg">
              <LogIn className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            WFM Schedule Portal
          </h1>
          <p className="text-gray-600">Agent Schedule & AUX Tracking System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Error Message */}
          {displayError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{displayError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address / Employee ID
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@company.com or AGT000123"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Login
                </>
              )}
            </button>
          </form>

          {/* Additional Links */}
          <div className="flex items-center justify-between text-sm">
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Forgot Password?
            </button>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Need Help?
            </button>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Demo Credentials</h3>
          <p className="text-xs text-blue-800 space-y-1">
            <div>Email: <span className="font-mono">agent@example.com</span></div>
            <div>Password: <span className="font-mono">demo123456</span></div>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
