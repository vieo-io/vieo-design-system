# @vieo-io/ui

Vieo's components in Solid 2.0: `Button`, `Icon`, `Dialog`, `Popover`, `Tooltip`, `Menu`, `Tabs`, `Listbox`, and
`CommandPalette`. They're styled by `@vieo-io/tokens`, so they follow whichever design, palette, and theme the root
element carries.

```css
@import "@vieo-io/tokens/tokens.css";
@import "@vieo-io/tokens/designs.css";
@import "@vieo-io/tokens/palettes.css";
@import "@vieo-io/ui/styles.css";
```

```tsx
import { Button, Menu } from '@vieo-io/ui'

;<Menu
	label='Page actions'
	items={[{ label: 'Rename', icon: 'write', onSelect: rename }]}
	trigger={(trigger) => <Button {...trigger}>Page actions</Button>}
/>
```

The package ships JSX source under the `solid` export condition, which the app compiles with its own settings.
`@solidjs/vite-plugin` adds that condition. `solid-js` and `@solidjs/web` 2.0.3 or later are peer dependencies.

Components that open something take a `trigger` render function and hand it the props to spread on the trigger
element: its ref, ARIA state, and handlers. `Dialog` is controlled by `open` and `onOpenChange` instead, so any
button can open it.
