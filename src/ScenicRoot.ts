import React from 'react'
import { noto, o } from 'wana'
import { Scene } from './Scene'

export class ScenicRoot {
  /** The current scene */
  scene!: Scene

  /** Flat map of cached scenes */
  cache = new Map<string, Scene>()

  /** Flat list of visited scenes */
  visited: Scene[] = o([])

  /** Current position in `visited` history */
  index = -1

  constructor() {
    return o(this)
  }

  /** Provided by the `<Scenic>` component */
  static Context = React.createContext<ScenicRoot | null>(null)

  /** The current path */
  get path() {
    return this.scene.path
  }

  /** Find a scene with the given path, else create one */
  get(path: string) {
    let scene = this.cache.get(path)
    if (!scene) {
      scene = new Scene(this, path)
      this.cache.set(path, scene)
    }
    return scene
  }

  visit(path: string) {
    if (this.path !== path) {
      const scene = this.get(path)
      if (scene.matches) {
        // Remove scenes that were visited after the current scene.
        this._truncate(this.index + 1)

        this.scene = scene
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
        this.scene = curr

        await prev.leave()
        if (curr.isFocused) {
          await prev.enter()
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
