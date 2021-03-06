import React from 'react'
import { Channel } from 'react-ch'
import { noto, o } from 'wana'
import { ScenicRoot } from './ScenicRoot'

declare const console: any

let nextId = 1

/**
 * A scene can be visited multiple times, which means it has no
 * knowledge of where it is in history.
 */
export class Scene {
  readonly id = nextId++

  /** The number of scene elements that matched */
  matches = 0

  /**
   * True after the first render and before unmount.
   *
   * Always use the `unmount` method instead of mutating this
   * property directly.
   */
  isMounted: boolean

  /**
   * Called after this scene gains focus, and after the previous scene
   * resolves its `onBlur` call.
   *
   * The 1st argument is the previous scene, which equals `null` as
   * the initial scene is being focused.
   *
   * The 2nd argument is a `Promise` that resolves when the previous
   * scene's `onBlur` handlers have finished.
   */
  onFocus = new Channel<[Scene | null, Promise<void>]>('onFocus')

  /**
   * Called before this scene loses focus.
   *
   * Effect promises will delay the `onFocus` call.
   */
  onBlur = new Channel<Scene>('onBlur')

  /**
   * Called after this scene loses focus.
   */
  didBlur = new Channel<void>('didBlur')

  /**
   * Exists after `onBlur` is called, until resolved.
   */
  blurPromise?: Promise<void>

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

  /** True between `onFocus` and `didBlur` */
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

  /**
   * Unmount any `SceneMatch` elements that are observing this
   * scene's `isMounted` property.
   *
   * Always call this from within a `didBlur` handler to avoid
   * unmounting before exit animations can finish.
   *
   * When this scene is focused, its root is forced to return to
   * the previous scene.
   */
  unmount() {
    noto(() => {
      this.root.unmount(this)
    })
  }

  /**
   * Schedule a function to be invoked once this scene is finished
   * blurring. When already blurred, your function is invoked by
   * the microtask loop.
   */
  onceBlurred(fn: () => void) {
    if (this.isFocused) {
      this.didBlur.once(fn)
    } else {
      Promise.resolve(this.blurPromise)
        .then(fn)
        .catch(console.error) // tslint:disable-line
    }
  }
}
