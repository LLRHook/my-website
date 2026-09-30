import { Icon } from "./RoomIcons";

export default function FeaturedProjects() {
  return (
    <div className="featured-projects" aria-label="Selected work">
      <article className="featured-project featured-project-main">
        <p className="featured-category">01 / PERSONAL PROJECT</p>
        <h3>MailIt <span>Email infrastructure you can run yourself.</span></h3>
        <p>A self-hosted email platform: REST APIs, async workers, inbound SMTP, direct MX delivery, DKIM, replay-safe sends, and signed webhooks, with a Next.js dashboard and 523 tests.</p>
        <p className="featured-stack">Go · Next.js · PostgreSQL · Redis · Kubernetes</p>
        <div className="featured-links"><a href="https://github.com/LLRHook/mailit" target="_blank" rel="noopener noreferrer">Explore the source <Icon name="arrow" /></a></div>
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
