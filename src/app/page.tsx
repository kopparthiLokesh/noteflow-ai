import Link from "next/link";

const features = [
  {
    icon: "✦",
    title: "AI-Powered Notes",
    description:
      "Capture your thoughts and let AI help summarize and organize your notes.",
  },
  {
    icon: "⌕",
    title: "Smart Semantic Search",
    description:
      "Find information using natural language instead of exact keywords.",
  },
  {
    icon: "✓",
    title: "Task Management",
    description:
      "Turn your ideas into actionable tasks and keep your work organized.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080b1c] text-white">
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute -right-40 top-40 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-xl font-bold shadow-lg shadow-purple-500/20">
            N
          </div>

          <span className="text-xl font-bold tracking-tight">
            Note<span className="text-purple-400">Flow</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition hover:text-white"
          >
            Log in
          </Link>

          <Link
            href="/signup"
            className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2.5 text-sm font-semibold shadow-lg shadow-purple-500/20 transition hover:scale-105"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Centered Hero Section */}
      <section className="relative z-10 flex min-h-[75vh] items-center justify-center px-6 py-20 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-300">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            Your intelligent productivity workspace
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Your thoughts.
            <br />
            Your tasks.
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
              One smarter space.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-gray-400">
            Organize your ideas, manage your tasks, and discover your notes with
            AI-powered semantic search. Everything you need to stay focused, in
            one workspace.
          </p>

          {/* Buttons */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-7 py-4 font-semibold shadow-xl shadow-purple-600/25 transition hover:-translate-y-1 hover:shadow-purple-500/40"
            >
              Get Started Free →
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-white/15 bg-white/5 px-7 py-4 font-semibold text-gray-200 transition hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>

          {/* Feature checklist */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <span>✓ Smart note organization</span>
            <span>✓ AI-powered search</span>
            <span>✓ Task management</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 border-t border-white/10 bg-white/[0.02] px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-400">
              Everything in one place
            </p>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              A smarter way to organize your work
            </h2>

            <p className="mt-4 leading-7 text-gray-400">
              Spend less time searching and organizing, and more time focusing
              on what matters.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-[#11152b]/80 p-7 transition hover:-translate-y-1 hover:border-purple-400/40"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600/30 to-blue-600/30 text-2xl text-purple-300">
                  {feature.icon}
                </div>

                <h3 className="mt-6 text-xl font-semibold">{feature.title}</h3>

                <p className="mt-3 leading-7 text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold">
              Ready to organize your ideas?
            </h2>

            <p className="mt-3 text-gray-400">
              Start building your personal productivity workspace.
            </p>

            <Link
              href="/signup"
              className="mt-7 inline-flex rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 font-semibold shadow-lg shadow-purple-600/20 transition hover:scale-105"
            >
              Create Your Account →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} NoteFlow. All rights reserved.</p>
          <p>Think better. Organize smarter.</p>
        </div>
      </footer>
    </main>
  );
}
