import is from '@alloc/is'
import React, { ReactNode } from 'react'
import { withAuto } from 'wana'
import { Scene } from './Scene'
import { useScene } from './useScene'

type Props = ({ path: string } | { scene: Scene }) & {
  match?: boolean | ((scene: Scene) => boolean)
  children?: ReactNode
}

const isMounted = (scene: Scene) => scene.isMounted
const { Provider: SceneProvider } = Scene.Context

/** Mount children only when the relevant scene is mounted. */
export const SceneMatch = withAuto((props: Props) => {
  const scene = 'scene' in props ? props.scene : useScene(props.path)

  const match = is.boolean(props.match)
    ? props.match
    : (props.match || isMounted)(scene)

  if (match) {
    return <SceneProvider value={scene}>{props.children}</SceneProvider>
  }

  return null
})
