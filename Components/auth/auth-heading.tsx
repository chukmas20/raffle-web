export function AuthHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-3xl font-bold tracking-tight text-navy-900">{title}</h1>
      {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-navy-500">{subtitle}</p>}
    </div>
  );
}