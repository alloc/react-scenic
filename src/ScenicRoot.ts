import { is } from '@alloc/is'
import React from 'react'
import { noto, o } from 'wana'
import { Scene } from './Scene'

export class ScenicRoot {
  /** Flat map of cached scenes */
  cache = new Map<string, Scene>()

  /** Flat list of visited scenes */
  visited: Scene[]

  /** The current position in `visited` array */
  index = 0

  /** The scene that will be focused once matched. */
  nextScene?: Scene

  constructor(
    /** The path of the currently focused scene. */
    public path: string
  ) {
    this.visited = o([o(this).get(path)])
    return o(this)
  }

  /** Provided by the `<Scenic>` component */
  static Context = React.createContext<ScenicRoot | null>(null)

  /** Get the current scene */
  get(): Scene
  /** Get the scene relative to the current `index` */
  get(index: number): Scene | null
  /** Get the scene for a new or existing path */
  get(path: string): Scene
  /** @internal */
  get(arg?: string | number) {
    let scene: Scene | undefined
    if (is.string(arg)) {
      noto(() => {
        scene = this.cache.get(arg)
        if (!scene) {
          scene = new Scene(this, arg)
          this.cache.set(arg, scene)
        }
      })
    } else {
      scene = this.visited[this.index + (arg || 0)]
    }
    return scene || null
  }

  /**
   * Increment the scene's `matches` count, which tracks how many
   * components are related to the scene.
   */
  mount(scene: Scene) {
    scene.matches++
    if (scene == this.nextScene) {
      this.visit(scene.path)
    }
    return () => {
      scene.matches--
    }
  }

  /**
   * Render the given path (if not already the current path) and forget
   * any scenes we previously called `back` on.
   */
  visit(path: string) {
    return noto(async () => {
      if (this.path !== path) {
        const prev = this.get()
        const curr = this.get(path)

        this.nextScene = curr.matches ? undefined : curr
        if (this.nextScene) return

        // Remove scenes that were visited after the current scene.
        this._truncate(++this.index)
        this.visited.push(curr)

        curr.willFocus(curr)
        await prev.onBlur(prev)

        if (curr == this.get()) {
          this.path = path
          prev.didBlur(prev)
          curr.onFocus(curr)
        }

        this._clean()
      }
    })
  }

  /** Return to the previous scene, if possible. */
  return() {
    return noto(async () => {
      if (this.index > 0) {
        const prev = this.get()
        this.index--

        const curr = this.get()
        curr.willFocus(curr)
        await prev.onBlur(prev)

        // The user may have navigated elsewhere while "onBlur" was pending.
        if (curr == this.get()) {
          this.path = curr.path
          prev.didBlur(prev)
          curr.onFocus(curr)
        }
      }
    })
  }

  // TODO: find matching scene and clone it onto the stack?
  // push(path: string) {}

  // TODO: Clear history and goto given path
  // reset(path: string) {}

  private _clean() {
    this.cache.forEach(scene => scene.matches || this.cache.delete(scene.path))
  }

  /** Truncate the scene history */
  private _truncate(length: number) {
    const scenes = this.visited
    if (length < scenes.length) {
      for (let i = scenes.length - 1; i >= length; i--) {
        scenes[i].isMounted = false
      }
      scenes.length = length
    }
  }
}
