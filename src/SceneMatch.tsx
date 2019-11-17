import React, { ReactNode } from 'react'
import { withAuto } from 'wana'
import { Scene } from './Scene'
import { useScene } from './useScene'

type Props = ({ path: string } | { scene: Scene }) & {
  force?: boolean
  children: ReactNode
}

/** Mount children only when the relevant scene is mounted. */
export const SceneMatch = withAuto((props: Props) => {
  const scene = 'scene' in props ? props.scene : useScene(props.path)
  if (props.force || scene.isMounted) {
    const { Provider } = Scene.Context
    return <Provider value={scene}>{props.children}</Provider>
  }
  return null
})
