# Dash Animator (GNOME 46 port)

A GNOME Shell extension that animates the icons of [Dash to Dock](https://github.com/micheleg/dash-to-dock) — icons magnify and "fan out" as the cursor moves over the dock (macOS-style).

This is a port of [**icedman/dash-animator**](https://github.com/icedman/dash-animator) (which targeted GNOME 40–43) to **GNOME 45/46**, which switched extensions to ES modules. All credit for the original animation logic goes to [icedman](https://github.com/icedman).

> If you'd rather have a full dock replacement that's actively maintained, see the original author's successor project [**Dash2Dock Animated**](https://github.com/icedman/dash2dock-lite).

## Requirements

- GNOME Shell **45 or 46**
- [Dash to Dock](https://extensions.gnome.org/extension/307/dash-to-dock/) installed and enabled (the Ubuntu/Pop dock counts)

## Install

```bash
UUID="dash-animator@icedman.github.com"
git clone https://github.com/thanakon228/dash-animator-gnome46.git
mkdir -p ~/.local/share/gnome-shell/extensions/$UUID
cp dash-animator-gnome46/{extension.js,animator.js,utils.js,metadata.json,stylesheet.css,LICENSE} \
   ~/.local/share/gnome-shell/extensions/$UUID/
```

Then reload GNOME Shell so it picks up the new extension:

- **Xorg:** press `Alt`+`F2`, type `r`, press `Enter`
- **Wayland:** log out and back in

Enable it:

```bash
gnome-extensions enable dash-animator@icedman.github.com
```

Hover over the dock — the icons should now magnify under the cursor.

## What changed from the original (GNOME 40–43 → 46)

| Area | Original | This port |
|------|----------|-----------|
| Module system | legacy `imports.ui.*` / `imports.gi.*` | ES modules: `import … from 'resource://…'`, `gi://…` |
| Internal modules | `Me.imports.animator` | `import { Animator } from './animator.js'` |
| Entry point | `class Extension {}` + `init()` | `export default class … extends Extension` |
| `find_child_by_name()` | Clutter actor method | removed in GNOME 46 → reimplemented as a recursive `findChildByName()` helper |
| Startup race | retried only on `startup-complete` | also polls every 500 ms until the dock appears (a manual `Alt`+`F2` `r` reload does not re-fire `startup-complete`, and dash-to-dock may enable after this extension) |
| Cleanup | `_displayEvents` were never disconnected | disconnected in `disable()` |
| `metadata.json` | `shell-version: 40–43` | `shell-version: 45, 46` |

## License

GPL-2.0-or-later, same as the original. See [LICENSE](LICENSE).
