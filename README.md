# Poolpad

A personal Chrome extension that adds a Poolsuite-style notepad window to
[poolsuite.net](https://poolsuite.net), with a matching "Poolpad" button in the
desktop dock.

<div align="center">
  <img width="1000" alt="poolpad-1" src="https://github.com/user-attachments/assets/703b20aa-b57f-4030-80f2-e96857aa6b58" />
</div>

## Features

- Window chrome reuses Poolsuite's own compiled Tailwind classes, so it looks
  native (same title bar, close button, fonts, shadow).
- Plain-text editor in Pixolde — Poolsuite's own body-text font — with
  `A-` / `A+` font-size controls (9–40px, default 16px).
- Autosaves to `localStorage` on every keystroke (`poolpad:text`), along with
  font size, window position, and open/closed state.
- "Download .txt" button exports your notes as `poolpad.txt`.
- Draggable via the title bar; position persists across reloads.

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this folder
4. Reload poolsuite.net — the Poolpad button appears at the end of the dock
   once the desktop finishes booting.


## iPad / Safari

iPadOS doesn't support Chrome extensions, but `poolpad.user.js` is the same
script packaged as a userscript (regenerate it after editing `content.js`
with: `cat` the userscript header + `content.js` into `poolpad.user.js`).

1. Install the free open-source **Userscripts** app from the App Store
2. Enable it under Settings → Apps → Safari → Extensions
3. Save `poolpad.user.js` into the `Userscripts` folder in iCloud Drive
4. Open poolsuite.net in Safari, tap the extension icon, and enable Poolpad

Note: notes live in each browser's localStorage, so iPad and desktop notes
don't sync — use Download .txt to move text between devices.


## How it works

`content.js` polls until the Poolsuite desktop has booted, then:

- appends a window layer into `#injection-wrapper > div` (where all native
  windows live), using the same structure: an absolute `pointer-events-none`
  layer containing a `bg-secondary border-black rounded-md p-1.5
  shadow-is-component` window div;
- appends a `li > button` to the dock `ul`, widening the fixed-width dock bar
  from 722px to 802px to fit the extra 80px slot.

Notes are stored in poolsuite.net's `localStorage`, so clearing site data
clears your notes — use Download to back them up.
