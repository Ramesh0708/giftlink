import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { loadRegion, regionById, saveRegion, type Experience, type RegionId } from '../data/regions'

type RegionContextValue = {
  region: RegionId | null
  experience: Experience | null
  picking: boolean
  choose: (id: RegionId) => void
  openPicker: () => void
  closePicker: () => void
}

const RegionContext = createContext<RegionContextValue | null>(null)

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegion] = useState<RegionId | null>(() => loadRegion())
  const [picking, setPicking] = useState(false)
  const experience = useMemo(() => (region ? regionById(region) : null), [region])

  const value = useMemo<RegionContextValue>(
    () => ({
      region,
      experience,
      picking,
      choose: (id) => {
        saveRegion(id)
        setRegion(id)
        setPicking(false)
      },
      openPicker: () => setPicking(true),
      closePicker: () => setPicking(false),
    }),
    [region, experience, picking],
  )

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>
}

export function useRegion() {
  const value = useContext(RegionContext)
  if (!value) throw new Error('useRegion must be used inside RegionProvider')
  return value
}
