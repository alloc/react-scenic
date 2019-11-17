import { useContext } from 'react'
import { useLayoutEffect } from 'react-layout-effect'
import { Scene } from './Scene'
import { useScenic } from './useScenic'

/** Use the scene context. */
export function useScene(): Scene

/** Use a scene by path. */
export function useScene(path: string): Scene

/** @internal */
export function useScene(path?: string) {
  let scene: Scene

  if (typeof path !== 'string') {
    scene = useContext(Scene.Context)!
    if (!scene) {
      throw Error('Cannot call "useScene" outside a scene component')
    }
  } else {
    scene = useScenic().get(path)
    useLayoutEffect(() => {
      scene.matches++
      return () => {
        scene.matches--
      }
    })
  }

  return scene
}
