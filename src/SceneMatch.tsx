import { is } from '@alloc/is'
import React, { ReactNode, useEffect } from 'react'
import { withAuto } from 'wana'
import { Scene } from './Scene'
import { useScene } from './useScene'

type Props = ({ path: string } | { scene: Scene }) & {
  match?: boolean | ((scene: Scene) => boolean)
  onMatch?: (scene: Scene) => void
  children?: ReactNode
}

const isMounted = (scene: Scene) => scene.isMounted
const { Provider: SceneProvider } = Scene.Context

/**
 * Mount children only when the relevant scene is mounted.
 *
 * Use `match={true}` to render children immediately.
 */
export const SceneMatch = withAuto((props: Props) => {
  const scene = 'scene' in props ? props.scene : useScene(props.path)

  const match = is.boolean(props.match)
    ? props.match
    : (props.match || isMounted)(scene)

  useEffect(() => {
    if (props.onMatch && match) {
      props.onMatch(scene)
    }
  }, [scene, match])

  if (match) {
    return <SceneProvider value={scene}>{props.children}</SceneProvider>
  }

  return null
})
