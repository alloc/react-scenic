import React, {
  cloneElement,
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
} from 'react'
import { isElement } from 'react-is'
import { ViewStyle } from 'react-native'
import { Box, BoxProps, useOnce } from 'ui'
import { useMemoOne as useMemo } from 'use-memo-one'
import { no, o, useAuto, withAuto } from 'wana'

type NoInfer<T> = [T][T extends any ? 0 : never]

type TransitionElement = ReactElement<TransitionProps>

export type TransitionProps = {
  content: ReactElement
}

/** Scene transitions are reactive and they receive implicit props */
export function createTransition<P = any>(config: {
  name: string
  render: (props: P & TransitionProps) => ReactElement
}): (props: P) => ReactElement {
  const View = withAuto(config.render)
  View.displayName = config.name
  return View as any
}

/** Config passed to "createScene" */
export interface SceneConfig<P = any> {
  path: string // TODO: | ((props: NoInfer<P>) => string)
  content: ReactElement<P> | ((props: P) => ReactElement<P>)
  transition?:
    | TransitionElement
    | ((props: NoInfer<P> & TransitionProps) => TransitionElement)
}

function asComponent<T>(value: T): T extends ReactElement ? null : T {
  return isElement(value) ? null : (value as any)
}

export interface SceneProps {
  style?: ViewStyle
  /** Render this scene immediately */
  preload?: boolean
  /** Keep this scene mounted when hidden */
  sustain?: boolean
}

// TODO: support "regexparam" paths
export function createScene<P extends object>(
  config: SceneConfig<Omit<P, keyof SceneProps>>
): (props: P & SceneProps) => JSX.Element {
  const TransitionView = asComponent(config.transition)!
  const ContentView = asComponent(config.content)
  const SceneView = withAuto(
    ({ style, preload, sustain, ...props }: P & SceneProps) => {
      const scenic = useScenic()

      const scene = useMemo(() => scenic.get(config.path), [])
      useEffect(() => scenic.match(scene), [])

      const canDismount = !(sustain || preload)
      useAuto(() => {
        if (canDismount && !scene.isVisible) {
          scene.isMounted = false
        }
      }, [canDismount])

      const isMounted = !!(preload || scene.isMounted)
      if (!isMounted) {
        return null
      }

      let content = ContentView ? (
        <ContentView {...props} />
      ) : (
        cloneElement(config.content as any, props)
      )

      if (config.transition) {
        content = TransitionView ? (
          <TransitionView {...props} content={content} />
        ) : (
          cloneElement(config.transition as any, { content })
        )
      }

      const visibleStyle: BoxProps = scene.isVisible
        ? {}
        : { opacity: 0, pointerEvents: 'none' }

      const { Provider } = Scene.Context

      console.debug('renderScene:', { ...no(scene) })
      return (
        <Provider value={scene}>
          <Box style={style} {...visibleStyle}>
            {content}
          </Box>
        </Provider>
      )
    }
  )

  return React.memo(SceneView) as any
}

export const useScene = () => {
  const scenic = useContext(Scene.Context)
  if (scenic) return scenic
  throw Error('Cannot call "useScene" outside a scene component')
}

export interface ScenicProps {
  children: ReactNode
  initialPath: string
}

export const Scenic = (props: ScenicProps) => {
  const scenic = useMemo(() => o(new ScenicState()), [])
  useOnce(() => {
    scenic.visit(props.initialPath || '/')
  })
  const { Provider } = ScenicState.Context
  return (
    <Provider value={scenic}>
      {props.children}
      {/** TODO: render the stack here */}
    </Provider>
  )
}

export const useScenic = () => {
  const scenic = useContext(ScenicState.Context)
  if (scenic) return scenic
  throw Error('Cannot call "useScenic" outside a <Scenic> provider')
}

export class ScenicState {
  /** The current path */
  path!: string
  /** The current scene */
  scene!: Scene
  /** Flat map of cached scenes */
  cache: { [path: string]: Scene } = Object.create(null)
  /** Flat list of visited scenes */
  visited: Scene[] = []
  /** Current position in `visited` history */
  index = -1

  /** Provided by the `<Scenic>` component */
  static Context = React.createContext<ScenicState | null>(null)

  /** Find a scene with the given path, else create one */
  get(path: string) {
    return this.cache[path] || (this.cache[path] = new Scene(path, null, this))
  }

  /** Ensure a matched scene is cached */
  match(scene: Scene) {
    this.cache[scene.path] = scene
    scene.matches++
    return () => {
      if (--scene.matches > 0) return
      delete this.cache[scene.path]
    }
  }

  push(path: string) {
    // TODO: find matching <Scene> and clone it onto the stack
    throw Error('todo')
  }

  visit(path: string) {
    if (this.path == path) return

    let scene = this.get(path)
    if (!scene.matches) {
      return console.warn(`Scene not found: "${path}"`)
    }

    if (this.index >= 0) {
      const prev = this.scene
      prev.isFocused = false
      prev.isVisible = false
    }

    this._truncate(this.index + 1)
    this.index = this.visited.push(scene) - 1
    this.scene = scene
    this.path = path

    scene.isFocused = true
    scene.isVisible = true
  }

  back() {
    if (this.index > 0) {
      const prev = this.scene
      prev.isFocused = false
      if (prev.index > 0) {
        prev.leave()
      } else {
        prev.isVisible = false
      }

      const curr = this.visited[--this.index]
      curr.isFocused = true

      this.scene = curr
      this.path = curr.path
    }
  }

  reset(path: string) {
    // TODO: Clear history and goto given path
    throw Error('todo')
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

export class Scene {
  /** Position in the stack */
  readonly index: number
  /** The number of scene elements that matched */
  matches = 0
  /** True after the first render and before dismount */
  isMounted = false
  /** True when the current scene */
  isFocused = false
  /** True when leaving the screen */
  isLeaving = false
  /** True when not hidden */
  isVisible = false

  constructor(
    /** The guid for this scene */
    readonly path: string,
    /** Shared between all scenes in the stack. Only exists when pushed. */
    readonly stack: Scene[] | null,
    /** The shared `<Scenic>` context */
    readonly context: ScenicState
  ) {
    // The scene is pushed to the stack once created.
    this.index = this.stack ? this.stack.length : -1
    return o(this)
  }

  /** The scene preceding us in the stack */
  get parent() {
    return this.index > 0 ? this.stack![this.index - 1] : null
  }

  /** Provided by scene components */
  static Context = React.createContext<Scene | null>(null)

  leave(): Promise<void> {
    // TODO: treat this like "back" call, or goto parent?
    throw Error('todo')
  }

  /** Called by transitions */
  didLeave() {
    if (this.isLeaving) {
      this.isLeaving = false
      this.isVisible = false
    }
  }
}
