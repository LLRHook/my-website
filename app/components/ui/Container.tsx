interface ContainerProps {
  children: React.ReactNode;
  as?: "section" | "footer" | "div";
  id?: string;
  className?: string;
  /** Extra classes for the inner centering div (e.g. "text-center") */
  innerClassName?: string;
  /** data-testid for Playwright selectors */
  "data-testid"?: string;
  /** Full-bleed mode: keeps padding but removes max-width constraint */
  wide?: boolean;
}

export default function Container({
  children,
  as: Tag = "div",
  id,
  className = "",
  innerClassName = "",
  "data-testid": testId,
  wide = false,
}: ContainerProps) {
  return (
    <Tag id={id} className={className} data-testid={testId}>
      <div className={`${wide ? "" : "max-w-5xl"} mx-auto px-4 sm:px-6 lg:px-8 ${innerClassName}`}>
        {children}
      </div>
    </Tag>
  );
}
