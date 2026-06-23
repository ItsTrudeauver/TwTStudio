// app/guide/page.tsx
import fs from 'fs/promises'; // Standard promise-based import
import path from 'path';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default async function PlayerGuide() {
  let markdownContent = "*No manual found. Save your masterdoc as guide.md inside app/guide/ directory.*";

  try {
    // Resolve path and read file directly using camelCase
    const filePath = path.join(process.cwd(), 'app', 'guide', 'guide.md');
    markdownContent = await fs.readFile(filePath, 'utf8');
  } catch (err) {
    console.error("Failed to load local guide markdown file:", err);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-300 font-sans antialiased selection:bg-neutral-800 selection:text-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-white tracking-wider">⭐ TwT Studio</span>
          <span className="text-xs text-neutral-500 font-mono">/ player_manual.md</span>
        </div>
        <Link 
          href="/" 
          className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 py-1.5 px-3 rounded text-xs font-semibold transition-all border border-neutral-800/40"
        >
          ← Return to Console
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <article className="space-y-6">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase border-b border-neutral-900 pb-4 mb-6">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-bold text-white mt-8 mb-3 border-b border-neutral-800/40 pb-2">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xs uppercase font-bold text-neutral-400 mt-6 mb-2 tracking-wider">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-xs md:text-sm text-neutral-400 leading-relaxed mb-4">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside text-xs md:text-sm text-neutral-400 space-y-1.5 pl-2 mb-4">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside text-xs text-neutral-400 space-y-1.5 mb-4 pl-1">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              code: ({ children }) => (
                <code className="bg-neutral-900 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-xs border border-neutral-850">
                  {children}
                </code>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-neutral-200">
                  {children}
                </strong>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto bg-neutral-950 border border-neutral-900 rounded-lg my-6">
                  <table className="w-full text-left text-xs border-collapse">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="border-b border-neutral-900 bg-neutral-900/30">
                  {children}
                </thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-neutral-900/40">
                  {children}
                </tbody>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-neutral-900/20 transition-all">
                  {children}
                </tr>
              ),
              th: ({ children }) => (
                <th className="p-3 font-bold uppercase text-neutral-400 text-[10px]">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="p-3 text-neutral-400 leading-relaxed">
                  {children}
                </td>
              ),
            }}
          >
            {markdownContent}
          </ReactMarkdown>
        </article>
      </main>
    </div>
  );
}