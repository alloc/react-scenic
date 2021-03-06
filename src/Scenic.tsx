import React, {
  ReactNode,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { useChannel } from 'react-ch'
import { useLayoutEffect } from 'react-layout-effect'
import { Scene } from './Scene'
import { ScenicRoot } from './ScenicRoot'

const noBlocking = Promise.resolve()

export interface ScenicProps {
  state?: ScenicRoot
  initialPath?: string
  onFocus?: (scene: Scene) => void
  children?: ReactNode
}

export const Scenic = React.forwardRef(
  (props: ScenicProps, ref: React.Ref<ScenicRoot>) => {
    const [scenic] = useState(
      props.state || (() => new ScenicRoot(props.initialPath || '/'))
    )
    useImperativeHandle(ref, () => scenic, [])

    useLayoutEffect(() => {
      scenic.isMounted = true
      return () => {
        scenic.isMounted = false
      }
    }, [])

    useChannel(scenic.onFocus, props.onFocus)

    useEffect(() => {
      const initialScene = scenic.get()
      initialScene.onFocus(null, noBlocking)
      scenic.onFocus(initialScene)
    }, [])

    const { Provider } = ScenicRoot.Context
    return (
      <Provider value={scenic}>
        {props.children}
        {/** TODO: render the stack here */}
      </Provider>
    )
  }
)
