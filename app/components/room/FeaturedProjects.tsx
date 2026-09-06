import { Icon } from "./RoomIcons";

export default function FeaturedProjects() {
  return (
    <div className="featured-projects" aria-label="Selected work">
      <article className="featured-project featured-project-main">
        <p className="featured-category">01 / Personal project</p>
        <h3>Billington <span>Make the shared trip simpler.</span></h3>
        <p>Groups need to keep track of expenses and work out who owes what. Billington connects a Flutter app, a Next.js viewer, and a Go API through shared tabs and member links, without requiring accounts.</p>
        <p className="featured-stack">Go · Flutter · Next.js · PostgreSQL</p>
        <div className="featured-links"><a href="https://youtube.com/shorts/T1GHR6JgOX8?feature=share" target="_blank" rel="noopener noreferrer">Early demo (Spliq v1) <Icon name="arrow" /></a><a href="https://github.com/LLRHook/checksinmyhead" target="_blank" rel="noopener noreferrer">Explore the source <Icon name="arrow" /></a></div>
      </article>
      <article className="featured-project">
        <p className="featured-category">02 / Developer-tool experiment</p>
        <h3>Citybase <span>A different view of a codebase.</span></h3>
        <p>An experimental desktop IDE that turns a Git repository into an isometric city. Git state, coding-agent runs, and diffs come together in an Electron and React workspace.</p>
        <p className="featured-stack">Electron · React · JavaScript</p>
        <div className="featured-links"><a href="https://github.com/LLRHook/citybase" target="_blank" rel="noopener noreferrer">Read the project notes <Icon name="arrow" /></a></div>
      </article>
      <article className="featured-project">
        <p className="featured-category">03 / Open-source contribution</p>
        <h3>Kilo <span>PR context beside the worktree.</span></h3>
        <p>I contributed GitHub PR status indicators for Kilo’s Agent Manager. My original implementation was incorporated into the maintainers’ merged work in April 2026, with further UI and polling refinements.</p>
        <p className="featured-stack">TypeScript · SolidJS · GitHub integration</p>
        <div className="featured-links"><a href="https://github.com/Kilo-Org/kilocode/pull/8524" target="_blank" rel="noopener noreferrer">Merged contribution <Icon name="arrow" /></a><a href="https://github.com/Kilo-Org/kilocode/pull/7988" target="_blank" rel="noopener noreferrer">Original PR <Icon name="arrow" /></a></div>
      </article>
    </div>
  );
}
