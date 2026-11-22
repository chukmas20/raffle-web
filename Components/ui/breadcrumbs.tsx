import Link from "next/link";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-navy-500">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden>/</span>}
          {item.href ? (
            <Link href={item.href} className="transition hover:text-crimson-600">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-navy-900">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}