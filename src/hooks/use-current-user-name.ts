import { createClient } from "@/lib/database/supabase/client"
import { useEffect, useState } from 'react'

export const useCurrentUserName = () => {
  const [name, setName] = useState<string | null>(null)

  const fetchProfileName = async () => {
    const { data, error } = await createClient().auth.getSession()
    if (error) {
      console.error(error)
    }

    setName(data.session?.user.user_metadata.full_name ?? 'UNKNOWN')
  }
  useEffect(() => {
    fetchProfileName()
  }, [])

  return name || 'UNKNOWN'
}
