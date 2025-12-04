import { createClient } from "@/lib/database/supabase/server"
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/auth/register?error=auth_error`)
    }

    // Check if user has a valid username
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      // // If no profile username then redirect to set-username
      // I removed set-username because i fix the issue with the auth flow 
      if (!profile?.username) {
        return NextResponse.redirect(`${origin}`) // may add another url in future (meh im bored rn)
      }
    }
  }
  
  return NextResponse.redirect(`${origin}/home/publisher`)
}