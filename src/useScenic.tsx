import { useContext } from 'react'
import { ScenicRoot } from './ScenicRoot'

export function useScenic() {
  const scenic = useContext(ScenicRoot.Context)
  if (scenic) return scenic
  throw Error('Cannot call "useScenic" outside a <Scenic> provider')
}
