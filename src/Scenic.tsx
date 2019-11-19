import React, { ReactNode, useEffect } from 'react'
import { useMemo } from './common'
import { ScenicRoot } from './ScenicRoot'

export interface ScenicProps {
  children: ReactNode
  initialPath: string
}

export const Scenic = React.forwardRef(
  (props: ScenicProps, ref: React.Ref<ScenicRoot>) => {
    const scenic = useMemo(() => new ScenicRoot(), [])
    React.useImperativeHandle(ref, () => scenic, [])
    useEffect(() => {
      scenic.visit(props.initialPath || '/')
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
