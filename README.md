# react-scenic

The best observable router for React. 🌋

## API

### Scenic

The `<Scenic>` component decides which scenes are mounted, which scene is focused, and which scenes have been visited.

```tsx
<Scenic>
  {children}
</Scenic>
```

&nbsp;

### ScenicRoot

The context of a `<Scenic>` component. It tracks the current scene as well as past scenes. Its properties can be used in a `withAuto` component (eg: to render elements conditionally).

When the `visit` method is passed a component, a new `ScenicRoot` is created and then rendered over the children of its parent `<Scenic>` component.

```ts
const root = scenic.visit('/page/1', <SomePage />)
```

&nbsp;

### useScenic

Use the `ScenicRoot` of the nearest `<Scenic>` ancestor.

```ts
const scenic = useScenic()
scenic.visit('/')
```

&nbsp;

### useScene

Use the `Scene` of the nearest `<SceneMatch>` ancestor.

```ts
const scene = useScene()
```

Or get the `Scene` for a path, creating one if necessary:

```ts
const scene = useScene(path)
```

&nbsp;

### Scene

Scenes are used to conditionally render elements based on the current path (or the history of paths) of the nearest `<Scenic>` component ancestor. Its properties can be observed by any `withAuto` component.

To create a `Scene`, you can call `ScenicRoot#get` or the `useScene` hook.

```ts
const scene = useScene('/')
// ..same as..
const scenic = useScenic()
const scene = scenic.get('/')
```

Both calls are idempotent, meaning they will always return the same `Scene` if you ever pass the same path multiple times.

&nbsp;

### SceneMatch

Render children if a given `path` or `scene` is mounted.

```tsx
// with a path:
<SceneMatch path="/">
  {children}
</SceneMatch>

// or with a Scene object:
<SceneMatch scene={scene}>
  {children}
</SceneMatch>
```
