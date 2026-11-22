const styles = {
  error: "border-crimson-200 bg-crimson-50 text-crimson-800",
  notice: "border-navy-200 bg-navy-50 text-navy-800",
};

export function Alert({
  tone,
  children,
}: {
  tone: keyof typeof styles;
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles[tone]}`}
    >
      {children}
    </div>
  );
}