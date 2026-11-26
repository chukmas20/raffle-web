"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Alert } from "@/Components/ui/alert";
import { buttonClass } from "@/Components/ui/styles";

type ImportReport = {
  dry_run: boolean;
  total_rows: number;
  valid_rows: number;
  created: number;
  newly_sold: number;
  updated_existing: number;
  error_count: number;
  errors: { row: number; ticket: string | null; message: string }[];
};

type Step = "idle" | "checking" | "checked" | "importing" | "done";

function messageFrom(data: unknown): string {
  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
  }
  return "Something went wrong. Please try again.";
}

const number = (value: number) => value.toLocaleString("en-NG");

export function TicketImport({ orgId, drawId }: { orgId: string; drawId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = step === "checking" || step === "importing";

  async function send(dryRun: boolean): Promise<ImportReport | null> {
    if (!file) return null;
    const form = new FormData();
    form.append("file", file);
    form.append("dry_run", dryRun ? "true" : "false");
    try {
      const response = await fetch(`/orgs/${orgId}/draws/${drawId}/tickets/import`, {
        method: "POST",
        body: form,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(messageFrom(data));
        return null;
      }
      return data as ImportReport;
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      return null;
    }
  }

  async function check() {
    setError(null);
    setReport(null);
    setStep("checking");
    const result = await send(true);
    if (result) {
      setReport(result);
      setStep("checked");
    } else {
      setStep("idle");
    }
  }

  async function runImport() {
    setError(null);
    setStep("importing");
    const result = await send(false);
    if (result) {
      setReport(result);
      setStep("done");
      router.refresh(); // show the updated ticket list
    } else {
      setStep("checked");
    }
  }

  function reset() {
    setFile(null);
    setReport(null);
    setError(null);
    setStep("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="rounded-2xl border border-navy-100 bg-white p-6">
      <h2 className="font-display text-lg font-bold text-navy-900">Import sold tickets from Excel</h2>
      <p className="mt-1 text-sm text-navy-500">
        Upload an .xlsx or .csv file with the columns <strong>Ticket Number</strong>, Holder Name, Phone and
        Email. Tickets are marked as sold, and numbers not yet in this draw are added. Blank cells never
        erase details that are already saved.
      </p>

      <div className="mt-4 space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        {step !== "done" && (
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.csv"
              disabled={busy}
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setReport(null);
                setError(null);
                setStep("idle");
              }}
              className="block max-w-full rounded-xl border border-navy-200 bg-white text-sm text-navy-700 file:mr-4 file:cursor-pointer file:border-0 file:bg-navy-900 file:px-4 file:py-3 file:font-semibold file:text-white hover:file:bg-navy-800"
            />
            {step === "idle" || step === "checking" ? (
              <button
                type="button"
                onClick={check}
                disabled={!file || busy}
                className={buttonClass("primary", "md")}
              >
                {step === "checking" ? "Checking…" : "Check file"}
              </button>
            ) : null}
          </div>
        )}

        {report && (step === "checked" || step === "importing") && (
          <div className="space-y-4">
            <div className="rounded-xl bg-navy-50 p-4 text-sm text-navy-800">
              <p className="font-semibold">
                {number(report.valid_rows)} of {number(report.total_rows)} rows are ready to import.
              </p>
              <ul className="mt-1 list-disc pl-5 text-navy-600">
                <li>{number(report.created)} new tickets will be added as sold</li>
                <li>{number(report.newly_sold)} existing tickets will be marked as sold</li>
                <li>{number(report.updated_existing)} already-sold tickets will get updated details</li>
                {report.error_count > 0 && (
                  <li className="font-semibold text-crimson-700">
                    {number(report.error_count)} rows have problems and will be skipped
                  </li>
                )}
              </ul>
            </div>

            {report.errors.length > 0 && (
              <div className="max-h-64 overflow-auto rounded-xl border border-crimson-200">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-crimson-50 text-xs uppercase tracking-wide text-crimson-800">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Row</th>
                      <th className="px-3 py-2 font-semibold">Ticket</th>
                      <th className="px-3 py-2 font-semibold">Problem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-crimson-100">
                    {report.errors.map((item) => (
                      <tr key={`${item.row}-${item.message}`}>
                        <td className="px-3 py-2 tabular-nums">{item.row}</td>
                        <td className="px-3 py-2 font-semibold tabular-nums">{item.ticket ?? "—"}</td>
                        <td className="px-3 py-2 text-navy-700">{item.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {report.error_count > report.errors.length && (
                  <p className="border-t border-crimson-100 px-3 py-2 text-xs text-navy-500">
                    …and {number(report.error_count - report.errors.length)} more.
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={runImport}
                disabled={report.valid_rows === 0 || busy}
                className={buttonClass("primary", "md")}
              >
                {step === "importing" ? "Importing…" : `Import ${number(report.valid_rows)} tickets`}
              </button>
              <button type="button" onClick={reset} disabled={busy} className={buttonClass("outline", "md")}>
                Choose another file
              </button>
            </div>
          </div>
        )}

        {report && step === "done" && (
          <div className="space-y-4">
            <Alert tone="notice">
              Done. {number(report.created)} new tickets were added as sold,{" "}
              {number(report.newly_sold)} existing tickets were marked as sold and{" "}
              {number(report.updated_existing)} already-sold tickets were updated.
              {report.error_count > 0 && ` ${number(report.error_count)} rows were skipped.`}
            </Alert>
            <button type="button" onClick={reset} className={buttonClass("outline", "md")}>
              Import another file
            </button>
          </div>
        )}
      </div>
    </section>
  );
}