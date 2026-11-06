# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An interactive, browser-based terminal emulator that serves as a personal resume. Users interact with a simulated Unix shell to explore resume content. Zero dependencies — pure HTML/CSS/JavaScript.

Live at: [leofle.github.io/terminal](https://leofle.github.io/terminal)

## Development

No build step. Open `index.html` in a browser to run locally.

Deploy by pushing to `main` — GitHub Actions automatically deploys to GitHub Pages.

## Architecture

Everything lives in `index.html` (~3000 lines). `resume.html` is a static fallback view of the same resume data.

### Key Sections in `index.html`

Line numbers drift as the file grows — search for the named symbol rather than trusting the range.

| Approx. line | Purpose |
|-------|---------|
| ~800 | **Theme system** — 7 themes (`claude` default, matrix, dracula, monokai, retro-amber, catppuccin, ubuntu) stored as objects of CSS custom properties; `applyTheme()` applies and persists to `localStorage`; `currentTheme` holds the active one |
| ~910 | **Virtual file system** — `files` object maps filenames to string content (resume.txt, projects.txt, skills.txt, contact.txt, fun_facts.txt, secret.txt, joke.txt). Content uses light markdown (`# `, `## `, `- `) rendered by `renderFileText()` |
| ~1380 | **Command registry** — `commandDocs` (drives `help` + the `/` menu), `availableCommands` (tab-completion + did-you-mean) and `quickCommands` (footer chips, `{label, cmd}`) |
| ~1780 | **Command dispatcher** — `executeCommand()` with a `switch` statement routing to individual handlers |
| ~2470 | **lio-agent** — `agentIntents`, `planAnswer()`, `handleAsk()` (the `ask` command) |
| end | **Init** — `renderQuickbar()`/`renderStatusline()`, then session-based boot animation on first visit; `showWelcome()` renders the banner + welcome card; hash `#resume` auto-loads resume content |

Print-only resume lives in the `#printable` div in the HTML body (not in `<script>`); its styles are under the `@media print` block.

### Implemented Commands

`ls` (with `-a`, and a path arg), `cd`, `cat`, `grep`, `help`, `whoami`, `pwd`, `date`, `echo`, `neofetch`/`fetch`, `banner`, `theme [name]` (no name = clickable picker), `clear`, `contact`, `projects`, `skills`, `resume`, `download`/`print`, `email`, `open <linkedin|github|email|resume>`, `history`, `man <cmd>`, `tree`, `ask <question>`/`claude`, `cowsay`, `matrix`, `sudo`, `sl`, `exit`/`logout`. Any command can also be typed with a leading `/` (`/theme dracula`).

Conversion-focused commands (`download`, `email`, `open`) drive recruiters to a PDF, mailto, or live link. `download`/`print` triggers `window.print()` against the print-only `#printable` resume (a hand-formatted, black-on-white version in the HTML body — keep it in sync with `resume.txt` when experience changes).

### The modern / Claude Code-style layer

- **lio-agent (`ask`)**: an offline Q&A that imitates a coding agent's transcript — spinner with elapsed time, `● Grep(...)`/`● Read(...)` tool rows with real counts from `grepMatches()`, then a streamed answer. `planAnswer()` scores the question against `agentIntents` (keyword lists; the generic `about` intent is down-weighted so specific matches win). Answers are hand-written from the resume content — **keep them in sync with `resume.txt`**. No network, no LLM. `Esc`/`Ctrl+C` interrupts. While it runs `agentBusy` is true and `executeCommand()` ignores input.
- **Natural-language routing**: in the dispatcher's `default`, input that `looksLikeQuestion()` (or any multi-word input that isn't a near-miss of a real command) is sent to `handleAsk()`.
- **Slash menu**: typing `/` in the prompt (or anywhere on the page) opens an inline menu built from `commandDocs`; ↑↓ move, Enter runs (or fills in commands with `args: true`), Tab fills, Esc closes.
- **Prompt & scrollback**: starship-style prompt (`promptPrefixHTML()`), arrow turns red after an error (`lastStatus`, set by `addOutput*` with class `error`). On Enter the live prompt is removed (`retireLiveLine()`) and replaced by a frozen `echoLine()` with a right-aligned timestamp.
- **Clickable commands**: any element with `data-run="<cmd>"` runs that command via the delegated document click handler; `runLink()` builds them.
- **Footer**: chip bar (`renderQuickbar()`) and a status line (`renderStatusline()`, also updates the window title).
- **Styling**: colors are CSS vars; everything else is derived with `color-mix()`. Fonts are JetBrains Mono + Inter from Google Fonts with system fallbacks. The `theme-crt` body class (matrix, retro-amber) adds scan lines and glow. `prefers-reduced-motion` disables animations and agent/boot delays (`sleep()` returns immediately).

### Terminal authenticity features

- **Ghost autosuggestion** (fish-style): `.ghost` span under the input shows the likeliest completion (most recent matching history entry, else a known command). Accept with `→` (caret at end) or `Tab`. Kept aligned via monospace + a hidden `.typed` prefix span.
- **Emacs keybindings** in the input keydown handler: `Ctrl+L` clear, `Ctrl+C` cancel line, `Ctrl+A`/`Ctrl+E` line start/end, `Ctrl+U`/`Ctrl+K` clear to start/end, `Ctrl+W` delete word.
- **History expansion**: `!!` (last), `!<n>` (by number), `!<prefix>` — handled by `expandBang()` at the top of `executeCommand()`.
- **"Did you mean?"**: unknown commands run `didYouMean()` (Levenshtein) to suggest the closest match.
- **Quick-command bar** (`.quickbar`, `renderQuickbar()`): tappable chips from the `quickCommands` array — primarily for mobile, where there's no Tab key. Each chip runs `executeCommand()`.
- A single delegated document click listener keeps focus on the live prompt (tracked via `activeInput`), skipping links/text-selection/matrix overlay.

All terminal output that echoes user input is passed through `escapeHTML()` to avoid HTML injection from typed commands.

### Virtual filesystem & the amber games easter egg

The filesystem is no longer flat. The home directory (`~` = `/home/lio/resume`) is the existing `files` map; a nested `games/` directory is grafted on **only while the active theme is `retro-amber`** (`amberActive()` / `buildRoot()`).

- **Tree model**: directories are plain objects, files are strings, and a file can also be a **function** for live content (e.g. `SCORES.DAT` reads the saved high score). `isDir()` distinguishes them.
- **Navigation**: `cwd` is an array of path segments below `~`. `resolvePath()` handles `~`, absolute `/home/lio/resume/...`, and relative paths with `.`/`..`, matching keys **case-insensitively** (DOS-style). The prompt reflects `cwd` via `promptPrefixHTML()`/`cwdDisplay()`; `syncCwdToTheme()` ejects you from `games/` if you leave amber.
- **Launching games**: typing a `*.BAT` path falls through the dispatcher's `default` to `tryRunExecutable()`, which maps `SNAKE.BAT`/`TETRIS.BAT` to `launchSnake()`/`launchTetris()`.
- **Game engine**: both games render to `#gameCanvas` inside the `#gameOverlay` (amber-on-black, shown via `.active`), drive input through a capture-phase `keydown` listener, and are torn down by `closeGame()`. `beginGame()` sets `gameActive` (which suppresses prompt auto-focus) and blurs the input so keystrokes don't leak into the terminal. High scores persist in `localStorage` under `game-hi-<name>` (`hiScore()`/`saveHiScore()`).
- **Path-aware tab completion**: `completePath()` completes the final path segment for `cat`/`cd`/`ls` against the parent directory; bare-command completion also surfaces runnable `*.BAT` files in the cwd.
- **Known limitation**: the games are keyboard-only, so they're effectively desktop-only (no touch controls on mobile).

`GAMES_DIR` file contents use deliberately uppercase DOS 8.3 names (`SNAKE.BAT`, `README.TXT`, `SCORES.DAT`) as an intentional period contrast with the lowercase unix-style home files.

### Available Themes

`claude` (default), `matrix`, `dracula`, `monokai`, `retro-amber`, `catppuccin`, `ubuntu`

### Terminal UX Features

- Command history navigated with arrow keys
- Tab completion (single-tab completes, double-tab lists options)
- `addOutput()` for plain text, `addOutputHTML()` for HTML (links, styled content)
- Auto-scroll via `scrollToBottom()`
- Boot sequence (spinner checklist) on first session visit; `clear` wipes the screen completely

### Adding a New Command

1. Add a case to the `switch` in `executeCommand()`
2. Implement a `handle<Command>()` function using `addOutput()` or `addOutputHTML()`
3. Add it to `commandDocs` (help + `/` menu) and `availableCommands` (tab completion); optionally a `manPages` entry

### Adding a New Theme

1. Add an entry to the `themes` object — set **every** variable (including `--info`, `--ok`, `--wall`) so nothing falls back to the default palette — plus a line in `themeBlurbs`
2. The theme name becomes the argument to `theme <name>`
3. `applyTheme()` auto-resets all CSS vars from all themes before applying, so no bleed between themes
4. Use the special `_class` key to add a body CSS class for overrides that can't be done with CSS vars (e.g. background images/gradients, pseudo-element content like button icons). The `ubuntu` theme uses `theme-ubuntu` for its desktop gradient and GNOME-style window buttons
5. The welcome tips, `theme` picker, `man theme` and tab completion all read from `themes` automatically
