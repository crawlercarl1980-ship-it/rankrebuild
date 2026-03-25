'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import type { SupabaseClient } from '@supabase/supabase-js'

export default function AuthPage() {
  const [origin, setOrigin] = useState('')
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
    setSupabase(
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    )
  }, [])

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="font-black text-3xl tracking-tight text-white mb-2">
          Rank<span className="text-teal-400">Rebuild</span>
        </div>
        <p className="text-slate-400 text-sm">Update your website with AI</p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        {supabase && origin ? (
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#14b8a6',
                    brandAccent: '#0d9488',
                    inputBackground: '#1e293b',
                    inputBorder: '#334155',
                    inputBorderFocus: '#14b8a6',
                    inputText: '#f1f5f9',
                    inputPlaceholder: '#64748b',
                    messageText: '#94a3b8',
                    anchorTextColor: '#14b8a6',
                    dividerBackground: '#334155',
                  },
                  borderWidths: {
                    buttonBorderWidth: '0px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '8px',
                    buttonBorderRadius: '8px',
                    inputBorderRadius: '8px',
                  },
                },
              },
              style: {
                button: {
                  background: '#14b8a6',
                  color: '#0f172a',
                  fontWeight: '700',
                },
                anchor: {
                  color: '#14b8a6',
                },
                container: {
                  color: '#f1f5f9',
                },
                label: {
                  color: '#94a3b8',
                  fontSize: '13px',
                },
                input: {
                  background: '#1e293b',
                  color: '#f1f5f9',
                  border: '1px solid #334155',
                },
                message: {
                  color: '#f87171',
                },
              },
            }}
            providers={[]}
            redirectTo={origin + '/auth/callback'}
          />
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-600">
        14-day free trial · No credit card required
      </p>
    </div>
  )
}
