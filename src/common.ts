import { useMemoOne } from 'use-memo-one'

// @see https://github.com/alexreardon/use-memo-one/pull/10
export const useMemo: typeof useMemoOne = (create, deps) =>
  useMemoOne(create, deps || [{}])
