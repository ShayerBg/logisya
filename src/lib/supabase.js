import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en el archivo .env.local')
}

export const supabase = createClient(url, key)

// Llama una función de la base de datos y lanza el error en español si algo falla
export async function rpc(nombre, params = {}) {
  const { data, error } = await supabase.rpc(nombre, params)
  if (error) throw new Error(error.message)
  return data
}
