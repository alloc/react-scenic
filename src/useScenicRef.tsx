import { useRef } from 'react'
import { ScenicRoot } from './ScenicRoot'

/**
 * Use the returned object as the `ref` prop of a `Scenic` element.
 */
export const useScenicRef = () => useRef<ScenicRoot>(null)

export type ScenicRef = ReturnType<typeof useScenicRef>
