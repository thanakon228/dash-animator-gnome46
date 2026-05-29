# Dash Animator — เวอร์ชันพอร์ตสำหรับ GNOME 46

[![GNOME Shell 45 · 46](https://img.shields.io/badge/GNOME%20Shell-45%20%C2%B7%2046-4A86CF)](https://www.gnome.org/)
[![License: GPL-2.0-or-later](https://img.shields.io/badge/License-GPL--2.0--or--later-blue.svg)](LICENSE)
[![ต้องใช้ Dash to Dock](https://img.shields.io/badge/requires-Dash%20to%20Dock-success)](https://extensions.gnome.org/extension/307/dash-to-dock/)

🌐 [English](README.md) · **ไทย**

GNOME Shell extension ที่ทำให้ **ไอคอนบน [Dash to Dock](https://github.com/micheleg/dash-to-dock) เด้ง/ขยายตามเมาส์** — ไอคอนจะขยายและกระจายตัวรอบๆ เคอร์เซอร์ขณะเลื่อนผ่าน dock (สไตล์เดียวกับ macOS)

เป็นการพอร์ต [**icedman/dash-animator**](https://github.com/icedman/dash-animator) (ตัวเดิมรองรับ GNOME 40–43) ให้รันบน **GNOME 45/46** ซึ่งเปลี่ยนมาใช้ ES modules และถอด Clutter API บางตัวออก เครดิตตรรกะแอนิเมชันทั้งหมดเป็นของ [**icedman**](https://github.com/icedman) — รีโพนี้ทำแค่ส่วนพอร์ตเท่านั้น

> 💡 ถ้าอยากได้ **dock ตัวใหม่ทั้งตัว** ที่มีคนดูแลต่อเนื่องและมีแอนิเมชันในตัว ลองดู [**Dash2Dock Animated**](https://github.com/icedman/dash2dock-lite) ของผู้เขียนคนเดียวกัน ส่วนรีโพ *นี้* เหมาะกับคนที่อยากใช้ Dash to Dock เดิมอยู่ แล้วแค่เพิ่มแอนิเมชันตอน hover

## ฟีเจอร์

- 🔍 **ขยายไอคอน** ตามเคอร์เซอร์ พร้อมการกระจายตัว (fan-out) แบบนุ่มนวล
- 🟢 คง **จุดบอกแอปที่กำลังรัน** (dots) ไว้
- 🧭 ใช้ได้กับ dock **ทุกขอบจอ** (ล่าง / บน / ซ้าย / ขวา)
- 🖥️ รองรับ **Hi-DPI / fractional scaling**
- 🪶 **ไม่มีอะไรต้องตั้งค่า** — ติดตั้ง เปิดใช้ จบ

## ความต้องการของระบบ

- **GNOME Shell 45 หรือ 46** (เช็กด้วย `gnome-shell --version`)
- ติดตั้งและ **เปิดใช้งาน** [**Dash to Dock**](https://extensions.gnome.org/extension/307/dash-to-dock/) อยู่ — dock ของ Ubuntu / Pop!_OS ก็นับ เพราะเบื้องหลังคือ Dash to Dock

## การติดตั้ง

```bash
UUID="dash-animator@icedman.github.com"
git clone https://github.com/thanakon228/dash-animator-gnome46.git
mkdir -p ~/.local/share/gnome-shell/extensions/$UUID
cp dash-animator-gnome46/{extension.js,animator.js,utils.js,metadata.json,stylesheet.css,LICENSE} \
   ~/.local/share/gnome-shell/extensions/$UUID/
```

รีโหลด GNOME Shell เพื่อให้มันเห็น extension ที่เพิ่งเพิ่ม:

| เซสชัน | วิธีรีโหลด |
|--------|-----------|
| **Xorg** | กด `Alt`+`F2` → พิมพ์ `r` → กด `Enter` |
| **Wayland** | ออกจากระบบแล้วเข้าใหม่ |

> ไม่แน่ใจว่าอยู่เซสชันไหน? รัน `echo $XDG_SESSION_TYPE` (ถ้าได้ `x11` คือ Xorg)

จากนั้นเปิดใช้งาน แล้วลองเลื่อนเมาส์ไปบน dock:

```bash
gnome-extensions enable dash-animator@icedman.github.com
```

## แก้ปัญหาเบื้องต้น

**ดูสถานะ extension และ log สดๆ:**

```bash
gnome-extensions info dash-animator@icedman.github.com   # ต้องการ: State: ACTIVE
journalctl --user -b -o cat | grep "dash-animator:" | tail
```

| อาการ | สาเหตุ / วิธีแก้ |
|-------|------------------|
| ขึ้น `State: ERROR` ทันทีหลังเปิดใช้ | shell ยัง cache โค้ดเก่าไว้ ให้รีโหลด shell อีกครั้ง (`Alt`+`F2` → `r`) แล้วเช็กใหม่ |
| เปิดแล้ว แต่ **ไอคอนไม่ขยาย** | extension หา dock ไม่เจอ — log ควรขึ้น `dashtodockContainer found!` ถ้าไม่ขึ้น ให้แน่ใจว่า **เปิด Dash to Dock อยู่** แล้วรีโหลด shell (เวอร์ชันนี้ poll หา dock ทุก 500ms แล้ว ลำดับการเปิดจึงไม่สำคัญอีกต่อไป) |
| ขึ้น `found!` แล้วแต่ไอคอนยังแบนอยู่ | โครงสร้างไอคอนภายในของ Dash to Dock เวอร์ชันคุณอาจเปลี่ยน เปิด issue พร้อมแจ้งเวอร์ชัน Dash to Dock (`gnome-extensions info dash-to-dock@micxgx.gmail.com`) |

## สิ่งที่เปลี่ยนจากตัวเดิม (GNOME 40–43 → 46)

| ส่วน | ตัวเดิม | เวอร์ชันพอร์ตนี้ |
|------|---------|------------------|
| ระบบโมดูล | `imports.ui.*` / `imports.gi.*` แบบเก่า | ES modules: `import … from 'resource://…'`, `gi://…` |
| โมดูลภายใน | `Me.imports.animator` | `import { Animator } from './animator.js'` |
| จุดเริ่มต้น | `class Extension {}` + `init()` | `export default class … extends Extension` |
| `find_child_by_name()` | เมธอดของ Clutter actor | ถูกถอดใน GNOME 46 → เขียน helper `findChildByName()` ค้นแบบ recursive แทน |
| Race ตอนเริ่ม | retry แค่ตอนสัญญาณ `startup-complete` | เพิ่ม poll ทุก 500ms จนเจอ dock (กด `Alt`+`F2` `r` ไม่ทำให้ `startup-complete` ยิงซ้ำ และ Dash to Dock อาจเปิด *หลัง* extension นี้) |
| การ cleanup | `_displayEvents` ไม่เคยถูก disconnect | disconnect ใน `disable()` แล้ว |
| `metadata.json` | `shell-version: 40–43` | `shell-version: 45, 46` |

## เครดิต

- extension ต้นฉบับและตรรกะแอนิเมชันทั้งหมด: [**icedman/dash-animator**](https://github.com/icedman/dash-animator)
- ส่วนพอร์ต GNOME 46: ดูแลในรีโพนี้

## สัญญาอนุญาต

[GPL-2.0-or-later](LICENSE) เช่นเดียวกับตัวเดิม
