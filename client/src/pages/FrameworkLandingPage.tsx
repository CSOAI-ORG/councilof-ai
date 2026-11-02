import { Link } from "wouter";

type FrameworkReferenceProps = {
  region: string;
  introduction: string;
  sources: { title: string; status: string; description: string; href: string }[];
};

export function FrameworkReferencePage({ region, introduction, sources }: FrameworkReferenceProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="border-b bg-primary/5 py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">Official references · reviewed 9 October 2026</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{region}: AI governance references</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">{introduction}</p>
        </div>
      </section>
      <div className="container mx-auto max-w-5xl space-y-10 px-4 py-12">
        <section aria-labelledby="sources-heading">
          <h2 id="sources-heading" className="text-2xl font-bold">Check the primary sources</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {sources.map(({ title, status, description, href }) => (
              <article key={href} className="flex flex-col rounded-xl border p-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">{status}</p>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
                <a href={href} target="_blank" rel="noopener noreferrer" className="mt-5 text-sm font-semibold text-primary underline underline-offset-4">Read the official source →</a>
              </article>
            ))}
          </div>
        </section>
        <section aria-labelledby="scope-heading" className="rounded-xl border bg-muted/30 p-6">
          <h2 id="scope-heading" className="text-2xl font-bold">Use each reference within its scope</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">A proposal, guidance document and binding law have different status. Identify the instrument, version, jurisdiction and use case before relying on it. This page offers references; it does not set a compliance deadline, certify a system or offer an unpublished training programme.</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">CSOAI measurements describe a specific observation under a published method. Inspect the source, date, sample and limits of any record you use.</p>
          <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold">
            <Link href="/methodology" className="text-primary underline underline-offset-4">Published measurement methods</Link>
            <Link href="/gspc-verify" className="text-primary underline underline-offset-4">Verify a record</Link>
            <Link href="/contact" className="text-primary underline underline-offset-4">Discuss a specific evidence need</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
