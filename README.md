# Dash Animator — GNOME 46 port

[![GNOME Shell 45 · 46](https://img.shields.io/badge/GNOME%20Shell-45%20%C2%B7%2046-4A86CF)](https://www.gnome.org/)
[![License: GPL-2.0-or-later](https://img.shields.io/badge/License-GPL--2.0--or--later-blue.svg)](LICENSE)
[![Requires Dash to Dock](https://img.shields.io/badge/requires-Dash%20to%20Dock-success)](https://extensions.gnome.org/extension/307/dash-to-dock/)

A GNOME Shell extension that **animates the icons of [Dash to Dock](https://github.com/micheleg/dash-to-dock)** — icons magnify and "fan out" under the cursor as you move along the dock, macOS-style.

This is a port of [**icedman/dash-animator**](https://github.com/icedman/dash-animator) (which targeted GNOME 40–43) to **GNOME 45/46**, where extensions moved to ES modules and several Clutter APIs were removed. All credit for the original animation logic goes to [**icedman**](https://github.com/icedman); this repo only does the porting work.

> 💡 If you'd rather have a fully maintained **dock replacement** that's also animated, check out the original author's successor: [**Dash2Dock Animated**](https://github.com/icedman/dash2dock-lite). Use *this* repo if you want to keep your existing Dash to Dock and just add the hover animation.

## Features

- 🔍 Cursor-following icon **magnification** with a smooth fan-out falloff
- 🟢 Running-app **dots** preserved
- 🧭 Works with the dock on **any edge** (bottom / top / left / right)
- 🖥️ Hi-DPI / fractional-scaling aware
- 🪶 No settings to configure — install, enable, done

## Requirements

- **GNOME Shell 45 or 46** (check with `gnome-shell --version`)
- [**Dash to Dock**](https://extensions.gnome.org/extension/307/dash-to-dock/) installed **and enabled** — the Ubuntu / Pop!_OS dock counts, since it's Dash to Dock under the hood

## Install

```bash
UUID="dash-animator@icedman.github.com"
git clone https://github.com/thanakon228/dash-animator-gnome46.git
mkdir -p ~/.local/share/gnome-shell/extensions/$UUID
cp dash-animator-gnome46/{extension.js,animator.js,utils.js,metadata.json,stylesheet.css,LICENSE} \
   ~/.local/share/gnome-shell/extensions/$UUID/
```

Reload GNOME Shell so it discovers the newly added extension:

| Session | How to reload |
|---------|---------------|
| **Xorg** | press `Alt`+`F2`, type `r`, press `Enter` |
| **Wayland** | log out and back in |

> Not sure which you're on? Run `echo $XDG_SESSION_TYPE` (`x11` = Xorg).

Then enable it and hover over the dock:

```bash
gnome-extensions enable dash-animator@icedman.github.com
```

## Troubleshooting

**Check the extension state and live logs:**

```bash
gnome-extensions info dash-animator@icedman.github.com   # want: State: ACTIVE
journalctl --user -b -o cat | grep "dash-animator:" | tail
```

| Symptom | Cause / fix |
|---------|-------------|
| `State: ERROR` right after enabling | The shell cached the old code. Reload the shell again (`Alt`+`F2` → `r`), then re-check. |
| Enabled, but **icons don't magnify** | The extension couldn't find the dock. The log should show `dashtodockContainer found!`. If not, make sure **Dash to Dock is enabled**, then reload the shell. This build polls for the dock every 500 ms, so order of enabling no longer matters. |
| Icons still flat after `found!` | Your Dash to Dock version may have changed its internal icon layout. Open an issue with your Dash to Dock version (`gnome-extensions info dash-to-dock@micxgx.gmail.com`). |

## What changed from the original (GNOME 40–43 → 46)

| Area | Original | This port |
|------|----------|-----------|
| Module system | legacy `imports.ui.*` / `imports.gi.*` | ES modules: `import … from 'resource://…'`, `gi://…` |
| Internal modules | `Me.imports.animator` | `import { Animator } from './animator.js'` |
| Entry point | `class Extension {}` + `init()` | `export default class … extends Extension` |
| `find_child_by_name()` | Clutter actor method | removed in GNOME 46 → reimplemented as a recursive `findChildByName()` helper |
| Startup race | retried only on `startup-complete` | also polls every 500 ms until the dock appears (a manual `Alt`+`F2` `r` reload doesn't re-fire `startup-complete`, and Dash to Dock may enable *after* this extension) |
| Cleanup | `_displayEvents` were never disconnected | disconnected in `disable()` |
| `metadata.json` | `shell-version: 40–43` | `shell-version: 45, 46` |

## Credits

- Original extension & all animation logic: [**icedman/dash-animator**](https://github.com/icedman/dash-animator)
- GNOME 46 port: maintained in this repository

## License

[GPL-2.0-or-later](LICENSE), same as the original.

---

🇹🇭 **หมายเหตุ (ภาษาไทย):** extension นี้ทำให้ไอคอนบน Dash to Dock เด้ง/ขยายตามเมาส์ (สไตล์ macOS) เป็นการพอร์ตของ icedman/dash-animator ให้รันบน GNOME 46 — ต้องเปิด Dash to Dock อยู่ก่อน ติดตั้งตามขั้นตอนด้านบน แล้วกด `Alt`+`F2` → `r` เพื่อรีโหลด shell อยากได้ README ฉบับภาษาไทยเต็ม บอกได้เลย
