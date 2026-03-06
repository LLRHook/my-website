interface ContainerProps {
  children: React.ReactNode;
  as?: "section" | "footer" | "div";
  id?: string;
  className?: string;
  /** Full-bleed mode: keeps padding but removes max-width constraint */
  wide?: boolean;
}

export default function Container({
  children,
  as: Tag = "div",
  id,
  className = "",
  wide = false,
}: ContainerProps) {
  return (
    <Tag
      id={id}
      className={`${wide ? "" : "max-w-5xl"} mx-auto px-6 sm:px-10 lg:px-16 ${className}`}
    >
      {children}
    </Tag>
  );
}
