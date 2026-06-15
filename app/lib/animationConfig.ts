// Centralized animation / interaction tunables.
// Pure constants extracted from across the component tree (FEAT-1781502127);
// values are unchanged — this is a behavior-preserving refactor.

// HeroSection scroll-driven parallax + fade (motion useTransform input/output ranges).
export const HERO_PARALLAX_SCROLL_RANGE: [number, number] = [0, 600];
export const HERO_PARALLAX_Y_RANGE: [number, number] = [0, -150];
export const HERO_FADE_SCROLL_RANGE: [number, number] = [0, 400];
export const HERO_FADE_OPACITY_RANGE: [number, number] = [1, 0];

// BackToTop: reveal the button after this many pixels scrolled.
export const BACK_TO_TOP_THRESHOLD = 600;

// FadeInOnScroll reveal animation.
export const REVEAL_OFFSET = 40;
export const REVEAL_VIEWPORT_MARGIN = "-80px";
export const REVEAL_DURATION = 0.5;

// TimelineCard cascading reveal: per-card delay = index * this step.
export const TIMELINE_STAGGER_STEP = 0.05;

// ParticlesBackground tunables.
export const PARTICLE_COUNT = 70;
export const PARTICLE_LINK_DISTANCE = 150;
export const PARTICLE_GRAB_DISTANCE = 200;
export const PARTICLE_SPEED = 0.8;

// Skill-badge entrance stagger (FEAT-1781502130).
export const SKILL_STAGGER_STEP = 0.04;
