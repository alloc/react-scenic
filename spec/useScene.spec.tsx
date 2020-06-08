import { render } from '@testing-library/react'
import React from 'react'
import { useChannel } from 'react-ch'
import { flushSync, o, withAuto } from 'wana'
import { Scenic, ScenicRef, useScene } from '../src'

describe('useScene', () => {
  describe('when unmounted', () => {
    it('avoids emitting an onBlur event', () => {
      const onFocus = jest.fn()
      const onBlur = jest.fn()
      const scenes = o([
        { path: '/', onFocus },
        { path: '/b', onBlur },
      ])

      const ref: ScenicRef = { current: null }
      render(<ScenicTest ref={ref} scenes={scenes} />)
      onFocus.mockReset()

      const scenic = ref.current!
      scenic.visit('/b')

      scenes.pop()
      flushSync()

      expect(onFocus).toBeCalled()
      expect(onBlur).not.toBeCalled()
    })
  })
})

const ScenicTest = withAuto(({ scenes }: any, ref: any) => (
  <Scenic ref={ref} initialPath="/">
    {scenes.map(props => (
      <SceneTest key={props.path} {...props} />
    ))}
  </Scenic>
))

const SceneTest = ({ path, onFocus, onBlur }: any) => {
  const scene = useScene(path)
  useChannel(scene.onFocus, onFocus)
  useChannel(scene.onBlur, onBlur)
  return null
}
