# Project decisions
- Use the shared bottom action dock on mobile and on empty desktop views; reserve the desktop side rail for generated content so navigation never competes with the study input.
- Collapse result navigation to its reopen control when completed content appears; generation events must not automatically reopen it, so the study stays unobstructed.
- Render the chalkboard before other lesson sections from structured AI content, falling back to steps or summary for saved studies; classroom presentations show it first, so every subject retains a visual explanation.
- Mount manual AdSense placements only beside substantial completed learning content, since navigation and empty states must not request ads.
- Deduplicate resolved Gemini key/model pairs and abort unfinished race losers; respect cooldowns because duplicate requests waste shared provider quotas.