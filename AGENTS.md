# Project instructions

Use the existing checkout; do not create a worktree unless requested.
Read GAME_DESIGN.md before changing game rules; distinguish confirmed rules from proposals and prototype values.
Read DEPLOYMENT.md before shipping. The user requests deployment after substantial completed changes, with version increments, verification and main push. Vercel Git integration deploys main when configured; verify remote deployment instead of assuming push means deployment succeeded. Never request secret values in chat.

For substantial visual changes, the user explicitly requests independent agent reviews. Assign separate reviewers for character art, direction/camera, and mobile interaction; review actual rendered frames, fix findings, and request another review. Record failures as well as passes in QUALITY_REVIEW.md. Functional tests do not establish visual or commercial quality. Ship reviewed functional fixes as such; never label an art-failed build commercially complete.
