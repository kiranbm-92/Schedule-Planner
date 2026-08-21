import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/services/supabase'
import { Loader } from 'lucide-react'

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRoles?: string[] }> = ({
  children,
  requiredRoles = [],
}) => {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    const verifySession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session) {
          navigate('/login')
          return
        }

        // Fetch user profile if not in store
        if (!user) {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single()

          if (profileError || !profile) {
            navigate('/login')
            return
          }

          setUser(profile)

          // Check role-based access
          if (requiredRoles.length > 0 && !requiredRoles.includes(profile.role)) {
            navigate('/unauthorized')
            return
          }
        } else if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
          navigate('/unauthorized')
          return
        }

        setIsVerifying(false)
      } catch (error) {
        console.error('Session verification failed:', error)
        navigate('/login')
      }
    }

    verifySession()
  }, [navigate, user, setUser, requiredRoles])

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying session...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute
