# Private team data

Files in this folder (except this README and `*.example.json`) are **gitignored**.
Put full names, guardian phone numbers, emails, dates of birth, schools, and medical
notes here. The app merges `data/private/<team-slug>.contacts.json` over the public
seed in `data/teams/<team-slug>.json` at load time.

Copy `tottenham-fall-2026.contacts.example.json` to `tottenham-fall-2026.contacts.json`
and fill it in. Keep a copy somewhere safe (password manager, encrypted drive);
this repo is public, so this data must never be pushed.
