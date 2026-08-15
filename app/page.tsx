"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, UploadCloud, Loader2, AlertCircle, Sparkles } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFile = useCallback((candidate: File | undefined | null) => {
    if (!candidate) return;
    if (candidate.type !== "application/pdf") {
      setStatus("error");
      setErrorMessage("Only PDF files are supported. Please choose a .pdf resume.");
      return;
    }
    setStatus("idle");
    setErrorMessage("");
    setFile(candidate);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFile(e.dataTransfer.files?.[0]);
    },
    [handleFile]
  );

  const onAnalyze = async () => {
    if (!file) return;
    setStatus("loading");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Something went wrong while analyzing your resume.");
      }

      const targetId = data?.portfolioId || data?.id;
      if (targetId) {
        router.push(`/portfolio?id=${targetId}`);
      } else {
        router.push("/portfolio");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Unexpected error. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-ink text-paper">
      {/* nav */}
      <nav className="border-b border-surface-line/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-signal-amber/15 text-signal-amber">
              <Sparkles size={16} strokeWidth={2.25} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              Resume<span className="text-signal-amber">AI</span>
            </span>
          </div>
          <span className="font-mono text-xs text-paper-muted">
            {"{ resume.pdf } -> { portfolio.json }"}
          </span>
        </div>
      </nav>

      {/* hero */}
      <section className="grid-texture relative overflow-hidden border-b border-surface-line/70">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-surface-line bg-surface/60 px-3 py-1 font-mono text-xs text-signal-teal">
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-signal-teal" />
            01_upload → 02_analyze → 03_publish
          </div>
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            Turn Your Resume Into a{" "}
            <span className="text-signal-amber">Professional Portfolio</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-paper-muted">
            Drop in a PDF resume. Our AI reads it, extracts every meaningful detail,
            and builds a clean, structured portfolio page you can share in seconds.
          </p>

          {/* upload card */}
          <div className="mt-12 max-w-xl">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`group cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors duration-200 ${
                isDragging
                  ? "border-signal-teal bg-signal-teal/5"
                  : "border-surface-line bg-surface/40 hover:border-signal-amber/60 hover:bg-surface/60"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-signal-teal/15 text-signal-teal">
                    <FileText size={22} />
                  </span>
                  <p className="font-medium text-paper">{file.name}</p>
                  <p className="font-mono text-xs text-paper-muted">
                    {(file.size / 1024).toFixed(0)} KB · click or drop to replace
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-raised text-paper-muted transition-colors group-hover:text-signal-amber">
                    <UploadCloud size={22} />
                  </span>
                  <p className="font-medium text-paper">
                    Drag &amp; drop your resume here
                  </p>
                  <p className="text-sm text-paper-muted">
                    or{" "}
                    <span className="text-signal-amber underline underline-offset-4">
                      browse files
                    </span>{" "}
                    · PDF only
                  </p>
                </div>
              )}
            </div>

            {status === "error" && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={onAnalyze}
              disabled={!file || status === "loading"}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-signal-amber px-6 py-4 font-display font-semibold text-ink transition-all duration-200 hover:bg-signal-amber/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "loading" ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing your resume…
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Analyze Resume
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              tag: "01_extract",
              title: "We read the PDF",
              body: "Text is pulled straight from your resume, no manual re-typing required.",
            },
            {
              tag: "02_structure",
              title: "AI structures it",
              body: "Gemini organizes your experience, skills, and projects into clean JSON.",
            },
            {
              tag: "03_publish",
              title: "Portfolio, ready",
              body: "A polished, shareable portfolio page is generated automatically.",
            },
          ].map((step) => (
            <div
              key={step.tag}
              className="rounded-2xl border border-surface-line bg-surface/40 p-6"
            >
              <span className="font-mono text-xs text-signal-teal">{step.tag}</span>
              <h3 className="mt-3 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-paper-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-surface-line/70 py-8 text-center font-mono text-xs text-paper-muted">
        ResumeAI · your data stays yours
      </footer>
    </main>
  );
}
