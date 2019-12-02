import is from '@alloc/is'
import React from 'react'
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

  constructor(
    /** The current scene path */
    public path: string
  ) {
    this.visited = o([this.get(path)])
    return o(this)
  }

  /** Provided by the `<Scenic>` component */
  static Context = React.createContext<ScenicRoot | null>(null)

  /** The current scene */
  get scene() {
    return this.cache.get(this.path)!
  }

  /** Find a scene with the given path, else create one */
  get(index?: number): Scene | null
  get(path: string): Scene
  get(arg?: string | number) {
    let scene: Scene | undefined
    if (is.string(arg)) {
      scene = this.cache.get(arg)
      if (!scene) {
        scene = new Scene(this, arg)
        this.cache.set(arg, scene)
      }
    } else {
      scene = this.visited[this.index + (arg || 0)]
    }
    return scene || null
  }

  visit(path: string) {
    if (this.path !== path) {
      const scene = this.get(path)
      if (scene.matches) {
        // Remove scenes that were visited after the current scene.
        this._truncate(this.index + 1)

        this.path = path
        this.index = this.visited.push(scene) - 1
      } else {
        // tslint:disable-next-line
        console.error(`Scene not found: "${path}"`)
      }
      this._clean()
    }
  }

  back() {
    return noto(async () => {
      if (this.index > 0) {
        const prev = this.scene
        const curr = this.visited[--this.index]
        this.path = curr.path

        if (prev) {
          await prev.leave()
        }
        if (curr.isFocused) {
          await curr.enter()
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
