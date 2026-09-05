# Mobile room and motion

The phone screenshot shows a visual failure that the previous tap-target tests
did not catch: the computer covers the lamp and crowds the photos. This pass
uses a separate photo row on phones and restores the scene's original object
proportions. The enlarged computer remains available in its close-up.

The work uses the full orchestration profile because responsive composition,
pointer motion, and audio scheduling have separate risks and can be implemented
independently. The existing Next/React/browser stack needs no new dependency.

1. Recompose phone scenery and remove footer construction copy.
2. Add small pointer/touch responses and slow natural light movement. Use one
   interpolating animation frame loop that stops when settled, hidden, paused,
   or behind a dialog. CSS handles idle ambience.
3. Soften the soundscape's high notes, transitions, and nature sounds.
4. Verify photo/computer separation and visible desk details at phone sizes,
   including mobile WebKit, touch, high pixel density, and landscape. Exercise
   scrolling, startup, every close-up, pause, reduced motion, and cleanup.
5. Build, independently review, publish through the existing GitHub/Vercel
   integration, and run the browser flows on victorivanov.engineer.

Keep movement small enough that it does not move controls out from under a
pointer. Keep the original resume and unrelated CLAUDE.md deletion untouched.
Rollback uses a normal revert through the same deployment path.

The Buffalo Wild Wings mark comes from the brand's own site:
https://www.buffalowildwings.com/brands/bww/logo.svg (retrieved September 5, 2026).
Its path geometry and colors are preserved in the carton artwork and the public
logo asset. No promotional or alcohol tagline is included.

The follow-up direction makes discovery subtle: remove plus badges, object
labels, and the startup arrow. Keep quiet hover/focus effects over the artwork;
show names and stories after a click or tap. The room cat itself opens its
close-up, which retains the wake and sleep interaction.
