import { useCallback, useState } from 'react'
import { useToast } from './toast'

// Ejecuta una acción contra la base de datos, muestra el mensaje y recarga los datos
export function useAccion(recargar) {
  const toast = useToast()
  const [ocupado, setOcupado] = useState(false)
  const run = useCallback(async (fn, mensaje) => {
    setOcupado(true)
    try {
      const r = await fn()
      const m = typeof mensaje === 'function' ? mensaje(r) : mensaje
      if (m) toast(m)
      await recargar()
      return r
    } catch (e) {
      toast(e.message)
    } finally {
      setOcupado(false)
    }
  }, [recargar, toast])
  return { run, ocupado }
}
