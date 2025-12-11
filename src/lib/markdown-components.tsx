import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { prism } from "react-syntax-highlighter/dist/esm/styles/prism";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";

export const createMarkdownComponents = (isDark: boolean): Components => ({
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";

    return !inline && match ? (
      <div className="border border-black/10 dark:border-neutral-700 rounded-lg my-4 overflow-hidden">
        <SyntaxHighlighter
          style={isDark ? vscDarkPlus : prism}
          language={language}
          PreTag="div"
          className="m-0!"
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code
        className="bg-gray-100 dark:bg-neutral-800 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold mb-4 mt-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-neutral-700 pb-2">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-bold mb-3 mt-5 text-gray-900 dark:text-gray-100">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-bold mb-2 mt-4 text-gray-900 dark:text-gray-100">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-lg font-semibold mb-2 mt-3 text-gray-900 dark:text-gray-100">
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-base font-semibold mb-2 mt-3 text-gray-800 dark:text-gray-200">
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-sm font-semibold mb-2 mt-2 text-gray-700 dark:text-gray-200">
      {children}
    </h6>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-gray-700 dark:text-gray-200 leading-relaxed">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-200 ml-4">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-200 ml-4">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-gray-700 dark:text-gray-200">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-amber-500 pl-4 italic text-gray-600 dark:text-gray-300 mb-4 bg-amber-50 dark:bg-amber-900/20 py-2">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-amber-600 hover:text-amber-700 underline font-medium"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  img: ({ src, alt }) => (
    <img src={src} alt={alt} className="max-w-full rounded-lg my-4 shadow-md" />
  ),
  hr: () => <hr className="my-6 border-gray-300 dark:border-neutral-700" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full divide-y divide-gray-300 dark:divide-neutral-700 border border-gray-300 dark:border-neutral-700">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gray-100 dark:bg-neutral-800">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-gray-200 dark:divide-neutral-700 bg-white dark:bg-neutral-900">
      {children}
    </tbody>
  ),
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
      {children}
    </td>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-gray-900 dark:text-gray-100">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-700 dark:text-gray-200">{children}</em>
  ),
  del: ({ children }) => (
    <del className="line-through text-gray-500 dark:text-gray-400">
      {children}
    </del>
  ),
  pre: ({ children }) => <pre className="overflow-x-auto">{children}</pre>,
  span: ({ children, style, ...props }: any) => {
    if (style) {
      return (
        <span style={style} {...props}>
          {children}
        </span>
      );
    }
    return <span {...props}>{children}</span>;
  },
  // Custom component to handle HTML comments - they should be invisible in read mode
  // This handles the rehype-raw parsed HTML comments
  comment: () => null,
  // Also handle any HTML comments that come through as text nodes
  text: ({ value }: any) => {
    // Filter out HTML comment syntax if it somehow gets through
    if (typeof value === "string" && value.trim().startsWith("<!--")) {
      return null;
    }
    return <>{value}</>;
  },
});
