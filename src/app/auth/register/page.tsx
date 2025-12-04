'use client'

// Some parts are commented out because they can be readded later if my mind changed ^_^
import { AuthForm } from '@/components/auth'
import React, { Suspense } from 'react'

export default function Login() {
  return (
    <>
        <main className="flex h-screen items-center justify-center">
          <Suspense fallback={<div>Loading...</div>}>
            <AuthForm />
          </Suspense>
        </main>
    </>
  )
}
