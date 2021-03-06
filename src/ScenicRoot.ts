import { is } from '@alloc/is'
import React from 'react'
import { Channel } from 'react-ch'
import { noto, o } from 'wana'
import { Scene } from './Scene'

declare const console: any

export class ScenicRoot {
  /** Flat map of cached scenes */
  cache = new Map<string, Scene>()

  /** Flat list of visited scenes */
  visited: Scene[]

  /** The current position in `visited` array */
  index = 0

  /** When true, this `ScenicRoot` is mounted by a `<Scenic>` element. */
  isMounted = false

  /** The scene that will be focused once matched. */
  pendingScene?: Scene

  /** Called when the focused scene changes. */
  onFocus = new Channel<Scene>()

  constructor(
    /** The path of the currently focused scene. */
    public path: string
  ) {
    const self = o(this)
    this.visited = o([self.get(path)])
    return self
  }

  /** Provided by the `<Scenic>` component */
  static Context = React.createContext<ScenicRoot | null>(null)

  get prevPath() {
    const scene = this.visited[this.index - 1]
    return scene ? scene.path : null
  }

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
    if (scene == this.pendingScene) {
      this.visit(scene.path)
    }
    return () => {
      scene.matches--
      if (!scene.matches) {
        this.unmount(scene)
      }
    }
  }

  /**
   * Force a scene to unmount, causing it to lose focus and causing
   * any relevant `SceneMatch` elements to unmount.
   *
   * You usually call the `Scene#unmount` method instead.
   *
   * If the first scene in history is passed, this method is a no-op.
   */
  unmount(scene: Scene) {
    if (this.visited[0] !== scene) {
      if (scene.isMounted) {
        scene.isMounted = false
        if (this.isMounted) {
          scene.leave()
        }
      }
      return true
    }
    return false
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
        if (this._visit(curr)) {
          this._focus(curr, prev)
          this._clean()
        }
      }
    })
  }

  /** Return to the previous scene, if possible. */
  return() {
    return noto(async () => {
      if (this.index > 0) {
        this.index -= 1
        this._focus(this.get(), this.get(+1)!)
      }
    })
  }

  protected _focus(curr: Scene, prev: Scene) {
    const blurPromise = prev.isMounted
      ? (prev.blurPromise = prev.onBlur(curr).then(() => {
          prev.blurPromise = undefined
          if (prev !== this.get()) {
            prev.didBlur()
          }
        })).catch(console.error) // tslint:disable-line
      : Promise.resolve()

    this.path = curr.path
    this.onFocus(curr)
    curr.onFocus(prev, blurPromise)
  }

  // TODO: find matching scene and clone it onto the stack?
  // push(path: string) {}

  // TODO: Clear history and goto given path
  // reset(path: string) {}

  private _clean() {
    this.cache.forEach(scene => scene.matches || this.cache.delete(scene.path))
  }

  private _visit(scene: Scene) {
    this.pendingScene = scene.matches ? undefined : scene
    if (this.pendingScene) return false

    const scenes = this.visited
    const length = ++this.index

    // Truncate the scene history, removing scenes visited after the
    // current point in history.
    if (length < scenes.length) {
      for (let i = scenes.length - 1; i >= length; i--) {
        scenes[i].isMounted = scenes[i] == scene
      }
      scenes.length = length
    }

    this.visited.push(scene)
    return (scene.isMounted = true)
  }
}
