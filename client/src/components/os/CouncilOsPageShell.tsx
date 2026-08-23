import CouncilOsInnerNav from "./CouncilOsInnerNav";

/**
 * CouncilOsPageShell — drop-in wrapper for site pages that belong in the ONE OS rail.
 * Keeps inner nav consistent across intel, instruments, assess, agents, and tooling.
 */
export default function CouncilOsPageShell({
  title,
  subtitle,
  children,
  className = "min-h-screen",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <CouncilOsInnerNav title={title} subtitle={subtitle} />
      {children}
    </div>
  );
}
