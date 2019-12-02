import React from 'react'
import { o } from 'wana'
import { ScenicRoot } from './ScenicRoot'

let nextId = 1

export class Scene {
  readonly id = nextId++

  /** The number of scene elements that matched */
  matches = 0

  /** True after the first render and before dismount */
  isMounted: boolean

  /** True when animating into focus */
  isEntering = false

  /** True when animating out of focus */
  isLeaving = false

  /** True when this is the active scene of its context */
  get isFocused() {
    return this.root.path == this.path
  }

  constructor(
    /** The root context */
    readonly root: ScenicRoot,
    /** The unique identifier that usually starts with `/` */
    readonly path: string
  ) {
    this.isMounted = root.path == path
    return o(this)
  }

  /** Provided by scene components */
  static Context = React.createContext<Scene | null>(null)

  /**
   * Animate after gaining focus.
   *
   * This won't be called until the previous scene has finished
   * leaving, which is useful when they both share the same space,
   * instead of being stacked.
   */
  async enter() {
    this.isEntering = true
    await Promise.resolve() // this.getEnterPromise()
    this.isEntering = false
  }

  /**
   * Animate after losing focus.
   *
   * The next scene won't execute its enter animation until this
   * scene has finished leaving, which is useful when they both
   * share the same space, instead of being stacked.
   */
  async leave() {
    this.isLeaving = true
    await Promise.resolve() // this.getLeavePromise()
    this.isLeaving = false
  }
}
