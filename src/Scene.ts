import React from 'react'
import { Channel } from 'react-ch'
import { noto, o } from 'wana'
import { ScenicRoot } from './ScenicRoot'

let nextId = 1

/**
 * A scene can be visited multiple times, which means it has no
 * knowledge of where it is in history.
 */
export class Scene {
  readonly id = nextId++

  /** The number of scene elements that matched */
  matches = 0

  /** True after the first render and before dismount */
  isMounted: boolean

  /**
   * Called before this scene gains focus, and before the previous
   * scene has `onBlur` called.
   */
  willFocus = new Channel<Scene>('willFocus')

  /**
   * Called after this scene gains focus, and after the previous scene
   * resolves its `onBlur` call.
   */
  onFocus = new Channel<Scene>('onFocus')

  /**
   * Called before this scene loses focus.
   *
   * Effect promises will delay the `onFocus` call.
   */
  onBlur = new Channel<Scene>('onBlur')

  /**
   * Called after this scene loses focus.
   */
  didBlur = new Channel<Scene>('didBlur')

  constructor(
    /** The root context that we exist in. */
    readonly root: ScenicRoot,
    /** The path used when we're focused. */
    readonly path: string
  ) {
    this.isMounted = root.path == path
    return o(this)
  }

  /** Provided by the `<SceneMatch>` component */
  static Context = React.createContext<Scene | null>(null)

  /** True when this is the active scene of its context */
  get isFocused() {
    return this.root.path == this.path
  }

  /**
   * Focus this scene, if not already focused.
   */
  focus() {
    noto(() => {
      this.root.visit(this.path)
    })
  }

  /**
   * Return to the previous scene, if this scene is focused.
   */
  leave() {
    noto(() => {
      if (this.isFocused) {
        this.root.return()
      }
    })
  }
}
