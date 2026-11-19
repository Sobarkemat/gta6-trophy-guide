[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Sobarkemat/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Sobarkemat/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Platinum — GTA VI Trophy Guide & Tracker

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: every trophy with its official name, description and grade, a guide in our own words that cites its sources, a checklist saved in your browser (with export and import), filters by kind, grade, status and search, a spoiler setting that hides story trophies until you earn them, a four-stage roadmap to the platinum, and the missable trophies flagged.

The list is the official one as published on PlayStation Network on 18 November 2026: 1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them hidden. The game launched 19 November 2026, so methods that no published guide has confirmed yet are marked UNCONFIRMED instead of invented — see the Sources page in the app for where every fact comes from (Exophase, PSNProfiles, PowerPyx, Planet GTA 6, The Gamers Hub).

## Run it

```
node serve.ts
```

Then open http://localhost:8080. The app is plain static files under `app/` — it works with the network off and loads nothing from outside itself.

## Hand it in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's vendored library.

Built for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01): https://make.fun/?ref=1sfr27n0&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01
