import React, {
  ReactNode,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { useChannel } from 'react-ch'
import { Scene } from './Scene'
import { ScenicRoot } from './ScenicRoot'

export interface ScenicProps {
  children: ReactNode
  initialPath: string
  onFocus?: (scene: Scene) => void
}

export const Scenic = React.forwardRef(
  (props: ScenicProps, ref: React.Ref<ScenicRoot>) => {
    const [scenic] = useState(() => new ScenicRoot(props.initialPath))
    useImperativeHandle(ref, () => scenic, [])

    useChannel(scenic.onFocus, props.onFocus)

    useEffect(() => {
      const initialScene = scenic.get()
      initialScene.onFocus(initialScene)
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
