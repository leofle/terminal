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

| Lines | Purpose |
|-------|---------|
| ~360–408 | **Theme system** — 5 themes (matrix, dracula, monokai, retro-amber, catppuccin) stored as objects of CSS custom properties; `applyTheme()` applies and persists to `localStorage` |
| ~410–660 | **Virtual file system** — `files` object maps filenames to string content (resume.txt, projects.txt, skills.txt, contact.txt, fun_facts.txt, secret.txt, joke.txt) |
| ~845–926 | **Command dispatcher** — `executeCommand()` with a `switch` statement routing to individual handlers |
| ~1296–1301 | **Init** — session-based boot animation on first visit; hash `#resume` auto-loads resume content |

### Implemented Commands

`ls` (with `-a`), `cat`, `grep`, `help`, `whoami`, `pwd`, `date`, `echo`, `neofetch`/`fetch`, `banner`, `theme <name>`, `clear`, `contact`, `projects`, `skills`, `resume`

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
3. Update the welcome/hint message if listing available themes
