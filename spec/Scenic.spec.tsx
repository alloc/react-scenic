import { render } from '@testing-library/react'
import React from 'react'
import { useChannel } from 'react-ch'
import { Scenic, ScenicRef, useScene } from '../src'

describe('Scenic', () => {
  describe('when unmounted', () => {
    it('avoids emitting an onBlur event', () => {
      const onFocus = jest.fn()
      const onBlur = jest.fn()

      const ref: ScenicRef = { current: null }
      const elem = render(
        <Scenic ref={ref} initialPath="/">
          <SceneTest path="/" onFocus={onFocus} />
          <SceneTest path="/b" onBlur={onBlur} />
        </Scenic>
      )
      onFocus.mockReset()

      // We must visit another scene before `onBlur` can be called,
      // because the initial scene cannot be blurred.
      const scenic = ref.current!
      scenic.visit('/b')

      elem.unmount()
      expect(scenic.isMounted).toBeFalsy()
      expect(onFocus).not.toBeCalled()
      expect(onBlur).not.toBeCalled()
    })
  })
})

const SceneTest = ({ path, onFocus, onBlur }: any) => {
  const scene = useScene(path)
  useChannel(scene.onFocus, onFocus)
  useChannel(scene.onBlur, onBlur)
  return null
}
