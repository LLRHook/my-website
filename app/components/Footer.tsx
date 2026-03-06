export default function Footer() {
  return (
    <footer className="glass border-b-0 rounded-none border-l-0 border-r-0 mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted">
        <span>&copy; {new Date().getFullYear()} Victor Ivanov</span>
        <span>Built with Next.js &amp; Tailwind CSS</span>
        <a
          href="https://github.com/LLRHook"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text-secondary transition-colors"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
