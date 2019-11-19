import React, { ReactNode, useState } from 'react'
import { ScenicRoot } from './ScenicRoot'

export interface ScenicProps {
  children: ReactNode
  initialPath: string
}

export const Scenic = React.forwardRef(
  (props: ScenicProps, ref: React.Ref<ScenicRoot>) => {
    const [scenic] = useState(() => new ScenicRoot(props.initialPath))
    React.useImperativeHandle(ref, () => scenic, [])

    const { Provider } = ScenicRoot.Context
    return (
      <Provider value={scenic}>
        {props.children}
        {/** TODO: render the stack here */}
      </Provider>
    )
  }
)
