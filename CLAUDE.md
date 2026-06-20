# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An interactive, browser-based terminal emulator that serves as a personal resume. Users interact with a simulated Unix shell to explore resume content. Zero dependencies — pure HTML/CSS/JavaScript.

Live at: [leofle.github.io/terminal](https://leofle.github.io/terminal)

## Development

No build step. Open `index.html` in a browser to run locally.

Deploy by pushing to `main` — GitHub Actions automatically deploys to GitHub Pages.

## Architecture

Everything lives in `index.html` (1300+ lines). `resume.html` is a static fallback view of the same resume data.

### Key Sections in `index.html`

Line numbers drift as the file grows — search for the named symbol rather than trusting the range.

| Approx. line | Purpose |
|-------|---------|
| ~639 | **Theme system** — 6 themes (matrix, dracula, monokai, retro-amber, catppuccin, ubuntu) stored as objects of CSS custom properties; `applyTheme()` applies and persists to `localStorage` |
| ~716 | **Virtual file system** — `files` object maps filenames to string content (resume.txt, projects.txt, skills.txt, contact.txt, fun_facts.txt, secret.txt, joke.txt) |
| ~985 | **Command registry** — `availableCommands` (tab-completion + did-you-mean) and `quickCommands` (mobile chips) |
| ~1253 | **Command dispatcher** — `executeCommand()` with a `switch` statement routing to individual handlers |
| ~2063 | **Init** — `renderQuickbar()`, then session-based boot animation on first visit; hash `#resume` auto-loads resume content |

Print-only resume lives in the `#printable` div in the HTML body (not in `<script>`); its styles are under the `@media print` block.

### Implemented Commands

`ls` (with `-a`), `cat`, `grep`, `help`, `whoami`, `pwd`, `date`, `echo`, `neofetch`/`fetch`, `banner`, `theme <name>`, `clear`, `contact`, `projects`, `skills`, `resume`, `download`/`print`, `email`, `open <linkedin|github|email|resume>`, `history`, `man <cmd>`, `tree`, `cowsay`, `matrix`, `sudo`, `sl`, `exit`/`logout`

Conversion-focused commands (`download`, `email`, `open`) drive recruiters to a PDF, mailto, or live link. `download`/`print` triggers `window.print()` against the print-only `#printable` resume (a hand-formatted, black-on-white version in the HTML body — keep it in sync with `resume.txt` when experience changes).

### Terminal authenticity features

- **Ghost autosuggestion** (fish-style): `.ghost` span under the input shows the likeliest completion (most recent matching history entry, else a known command). Accept with `→` (caret at end) or `Tab`. Kept aligned via monospace + a hidden `.typed` prefix span.
- **Emacs keybindings** in the input keydown handler: `Ctrl+L` clear, `Ctrl+C` cancel line, `Ctrl+A`/`Ctrl+E` line start/end, `Ctrl+U`/`Ctrl+K` clear to start/end, `Ctrl+W` delete word.
- **History expansion**: `!!` (last), `!<n>` (by number), `!<prefix>` — handled by `expandBang()` at the top of `executeCommand()`.
- **"Did you mean?"**: unknown commands run `didYouMean()` (Levenshtein) to suggest the closest match.
- **Quick-command bar** (`.quickbar`, `renderQuickbar()`): tappable chips from the `quickCommands` array — primarily for mobile, where there's no Tab key. Each chip runs `executeCommand()`.
- A single delegated document click listener keeps focus on the live prompt (tracked via `activeInput`), skipping links/text-selection/matrix overlay.

All terminal output that echoes user input is passed through `escapeHTML()` to avoid HTML injection from typed commands.

### Available Themes

`matrix` (default), `dracula`, `monokai`, `retro-amber`, `catppuccin`, `ubuntu`

### Terminal UX Features

- Command history navigated with arrow keys
- Tab completion (single-tab completes, double-tab lists options)
- `addOutput()` for plain text, `addOutputHTML()` for HTML (links, styled content)
- Auto-scroll via `scrollToBottom()`
- Boot sequence animation using async typewriter on first session visit

### Adding a New Command

1. Add a case to the `switch` in `executeCommand()`
2. Implement a `handle<Command>()` function using `addOutput()` or `addOutputHTML()`
3. Add it to the `help` output and tab-completion list

### Adding a New Theme

1. Add an entry to the `themes` object with CSS custom property overrides
2. The theme name becomes the argument to `theme <name>`
3. `applyTheme()` auto-resets all CSS vars from all themes before applying, so no bleed between themes
4. Use the special `_class` key to add a body CSS class for overrides that can't be done with CSS vars (e.g. background images/gradients, pseudo-element content like button icons). The `ubuntu` theme uses `theme-ubuntu` for its desktop gradient and GNOME-style window buttons
5. Update welcome/hint messages (in `runBootSequence`, `showWelcomeOnly`) and `handleHelp` to list the new theme
