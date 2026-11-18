// Sesión del usuario y su rol (operador, trabajador o ninguno todavía)
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = cargando
  const [rol, setRol] = useState(undefined)         // { operador, trabajador }
  const uidRef = useRef(null)

  const cargarRol = useCallback(async s => {
    if (!s) { setRol(null); return }
    const [o, t] = await Promise.all([supabase.rpc('mi_operador'), supabase.rpc('mi_trabajador')])
    setRol({ operador: o.data || null, trabajador: t.data || null })
  }, [])

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSession(s)
      const uid = s?.user?.id || null
      // Solo recarga el rol cuando cambia el usuario (no en cada renovación del token)
      if (uid !== uidRef.current || uid === null) {
        uidRef.current = uid
        if (uid) setRol(undefined)
        setTimeout(() => cargarRol(s), 0)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [cargarRol])

  const refrescarRol = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    await cargarRol(data.session)
  }, [cargarRol])

  const salir = useCallback(() => supabase.auth.signOut(), [])

  return (
    <AuthCtx.Provider value={{ session, rol, refrescarRol, salir }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
