"use client";

function parseMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/\n/g, "<br />");
}

export default function TermsOfService({ content }: { content: string }) {
  return (
    <div
      className="min-h-screen py-12 px-6"
      style={{ backgroundColor: "oklch(0.9244 0.1203 95.85)" }}
    >
      <main className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="border-b border-gray-200 pb-6 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Terms of Service
            </h1>
            <p className="text-gray-600">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="prose prose-gray max-w-none">
            <div
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: `<p class="mb-4">${parseMarkdown(content)}</p>`,
              }}
            />
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <button
              onClick={() => window.print()}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
            >
              Print Terms
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg transition-colors font-medium"
            >
              Back to App
            </button>
          </div>
        </div>
        <div className="mt-8 bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Questions about our terms of service?
          </h2>
          <p className="text-gray-600 mb-4">
            If you have any questions or concerns, please don't hesitate to
            contact us.
          </p>
          <a
            href="mailto:legal@swifttasks.com"
            className="text-yellow-600 hover:text-yellow-700 font-medium inline-flex items-center"
          >
            legal@swifttasks.com
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        </div>
      </main>
    </div>
  );
}
