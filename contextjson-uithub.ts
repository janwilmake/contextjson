/**
 * Context.json Explorer Worker
 * Fetches and displays context.json data from GitHub repositories
 */

interface Env {
  CONTEXTS_KV: KVNamespace;
  UITHUB_SECRET: string;
}

interface ContextEntry {
  summary: string;
  prompt?: string;
  pluginId?: string;
  basePath?: string[];
  pathPatterns?: string[];
  excludePathPatterns?: string[];
  maxFileSize?: number;
}

interface ContextJson {
  $schema?: string;
  extends?: string | string[];
  context: Record<string, ContextEntry>;
  attribution?: string;
}

interface EnrichedContextEntry extends ContextEntry {
  slug: string;
  uithubUrl: string;
  context?: string;
  tokenCount?: number;
  promptUrl?: string;
  error?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const refresh = url.searchParams.has("refresh");
    const pathMatch = path.split("/").slice(1);

    const [owner, repo, page, branch] = pathMatch;
    const cacheKey = `${owner}/${repo}/tree/${branch || "main"}`;
    console.log({ owner, repo, page, branch, cacheKey });
    // Check cache first unless refresh is requested
    if (!refresh) {
      const cachedResponse = await env.CONTEXTS_KV.get(cacheKey);
      if (cachedResponse) {
        return new Response(cachedResponse, {
          headers: { "Content-Type": "text/html" },
        });
      }
    }

    // Fetch context.json from GitHub
    const githubUrl = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${
      branch || "main"
    }/context.json`;
    const response = await fetch(githubUrl);

    if (!response.ok) {
      return new Response(`Context file not found at ${githubUrl}`, {
        status: 404,
      });
    }

    let contextJson: ContextJson;
    let parseWarning = "";

    try {
      contextJson = await response.json();

      // Check if it follows the schema (basic validation)
      if (!contextJson.context || typeof contextJson.context !== "object") {
        parseWarning =
          "Warning: The context.json file does not follow the expected schema.";
        contextJson = { context: {} };
      }
    } catch (error) {
      return new Response("Error parsing context.json file: " + error.message, {
        status: 400,
      });
    }

    // Enrich context entries with additional data
    const enrichedContexts: EnrichedContextEntry[] = [];

    for (const [slug, contextEntry] of Object.entries(contextJson.context)) {
      const enriched: EnrichedContextEntry = {
        ...contextEntry,
        slug,
        uithubUrl: buildUithubUrl(owner, repo, contextEntry),
      };

      try {
        // Fetch context from UIThub
        const uithubResponse = await fetch(enriched.uithubUrl, {
          headers: { Authorization: `Bearer ${env.UITHUB_SECRET}` },
        });
        if (uithubResponse.ok) {
          enriched.context = await uithubResponse.text();
          enriched.tokenCount = Math.round(enriched.context.length / 5);

          if (enriched.prompt) {
            const encodedPrompt = encodeURIComponent(
              `${enriched.uithubUrl}\n\n${enriched.prompt}`,
            );
            enriched.promptUrl = `https://lmpify.com/?q=${encodedPrompt}`;
          }
        } else {
          enriched.error = `Failed to fetch from UIThub: ${uithubResponse.status}`;
        }
      } catch (error) {
        enriched.error = `Error fetching context: ${error.message}`;
      }

      enrichedContexts.push(enriched);
    }

    // Generate HTML
    const html = generateHtml(
      owner,
      repo,
      enrichedContexts,
      parseWarning,
      githubUrl,
    );

    // Store in KV
    await env.CONTEXTS_KV.put(cacheKey, html);

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  },
};

function buildUithubUrl(
  owner: string,
  repo: string,
  contextEntry: ContextEntry,
): string {
  const baseUrl = `https://uuithub.com/${owner}/${repo}/tree/main`;
  const params = new URLSearchParams();

  if (contextEntry.basePath) {
    contextEntry.basePath.forEach((path) => {
      params.append("basePath", path);
    });
  }

  if (contextEntry.pathPatterns) {
    contextEntry.pathPatterns.forEach((pattern) => {
      params.append("pathPatterns", pattern);
    });
  }

  if (contextEntry.excludePathPatterns) {
    contextEntry.excludePathPatterns.forEach((pattern) => {
      params.append("excludePathPatterns", pattern);
    });
  }

  if (contextEntry.maxFileSize) {
    params.append("maxFileSize", contextEntry.maxFileSize.toString());
  }

  return `${baseUrl}?${params.toString()}`;
}

function generateHtml(
  owner: string,
  repo: string,
  contexts: EnrichedContextEntry[],
  warning: string = "",
  githubUrl: string,
): string {
  const markdown = `| Summary | Prompt it |
|---------|-----------|
${contexts
  .map((item) => {
    const encodedPrompt = encodeURIComponent(
      `${item.uithubUrl}\n\n${item.prompt}`,
    );
    const linkMd = `[![](https://b.lmpify.com/${item.slug.replaceAll(
      "-",
      "_",
    )})](https://lmpify.com?q=${encodedPrompt})`;
    return `| ${item.summary} | ${linkMd} |`;
  })
  .join("\n")}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Context Explorer: ${owner}/${repo}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      border-bottom: 1px solid #eaecef;
      padding-bottom: 10px;
    }
    .warning {
      background-color: #fff3cd;
      color: #856404;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
      font-weight: 600;
    }
    .actions {
      display: flex;
      gap: 8px;
    }
    .btn {
      padding-left: 5px;
      padding-right: 5px;
      padding-top: 3px;
      padding-bottom: 3px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      font-size: 9px;
      display: inline-flex;
      align-items: center;
    }
    .btn-copy {
      background-color: #e9ecef;
      color: #495057;
    }
    .summary {
      max-width: 300px;
    }
    .tokens {
      text-align: right;
    }
    
    /* Split view styles */
    .markdown-section {
      margin-top: 30px;
    }
    .markdown-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .page-header h1 {
      margin: 0;
      border: none;
      padding: 0;
    }
    .markdown-header h2 {
      margin: 0;
      font-size: 1.25rem;
    }
    .btn-copy-markdown {
      padding: 6px 12px;
      background-color: #0969da;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
    }
    .btn-copy-markdown:hover {
      background-color: #0860ca;
    }
    .btn-refresh {
      padding: 8px 16px;
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-refresh:hover {
      background-color: #218838;
    }
    .btn-refresh:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }
    .split-view {
      display: flex;
      border: 1px solid #d1d9e0;
      border-radius: 6px;
      overflow: hidden;
      min-height: 400px;
    }
    .markdown-raw {
      flex: 1;
      background-color: #f6f8fa;
      padding: 16px;
      border-right: 1px solid #d1d9e0;
      overflow-x: auto;
    }
    .markdown-raw pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 12px;
      line-height: 1.45;
      color: #24292f;
    }
    .markdown-rendered {
      flex: 1;
      padding: 16px;
      background-color: white;
      overflow-x: auto;
    }
    .markdown-rendered table {
      margin: 0;
      border-collapse: collapse;
      width: 100%;
    }
    .markdown-rendered th,
    .markdown-rendered td {
      padding: 8px 12px;
      border: 1px solid #d1d9e0;
      text-align: left;
    }
    .markdown-rendered th {
      background-color: #f6f8fa;
      font-weight: 600;
    }
    .markdown-rendered img {
      max-width: 100%;
      height: auto;
    }
    @media (max-width: 768px) {
      .split-view {
        flex-direction: column;
      }
      .markdown-raw {
        border-right: none;
        border-bottom: 1px solid #d1d9e0;
      }
    }
  </style>
</head>
<body>
  <div class="page-header">
    <h1>Context Explorer: ${owner}/${repo}</h1>
    <button class="btn-refresh" onclick="refreshData()">
      <span id="refresh-icon">🔄</span>
      <span id="refresh-text">Refresh</span>
    </button>
  </div>
  
  ${warning ? `<div class="warning">${warning}</div>` : ""}
  
  <p>Found ${contexts.length} context${
    contexts.length !== 1 ? "s" : ""
  } in this repository (<a href="${githubUrl}">view raw context.json</a>).</p>
  
  <table>
    <thead>
      <tr>
        <th>Slug</th>
        <th>Summary</th>
        <th>Tokens</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${contexts
        .map(
          (ctx) => `
        <tr>
          <td><strong>${ctx.slug}</strong></td>
          <td class="summary">${ctx.summary}</td>
          <td class="tokens">${
            ctx.tokenCount || "N/A"
          }  <button class="btn btn-copy" onclick="copyContext('${
            ctx.slug
          }')">Copy</button></td>
          <td class="actions">
            ${
              ctx.context
                ? `
              <a href="${
                ctx.uithubUrl
              }" target="_blank"><img src="https://img.shields.io/badge/open-blue" /></a>
              ${
                ctx.promptUrl
                  ? `<a href="${
                      ctx.promptUrl
                    }" target="_blank"><img src="https://b.lmpify.com/${ctx.slug.replaceAll(
                      "-",
                      "_",
                    )}" /></a>`
                  : ""
              }
            `
                : `<span>Error: ${ctx.error || "Failed to load context"}</span>`
            }
          </td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>

  <div class="markdown-section">
    <div class="markdown-header">
      <h2>README Markdown Snippet</h2>
      <button class="btn-copy-markdown" onclick="copyMarkdown()">Copy Markdown</button>
    </div>
    
    <div class="split-view">
      <div class="markdown-raw">
        <pre id="markdown-content">${escapeHtml(markdown)}</pre>
      </div>
      <div class="markdown-rendered">
        <table>
          <thead>
            <tr>
              <th>Summary</th>
              <th>Prompt it</th>
            </tr>
          </thead>
          <tbody>
            ${contexts
              .map((item) => {
                const encodedPrompt = encodeURIComponent(
                  `${item.uithubUrl}\n\n${item.prompt}`,
                );
                const badgeUrl = `https://b.lmpify.com/${item.slug.replaceAll(
                  "-",
                  "_",
                )}`;
                const linkUrl = `https://lmpify.com?q=${encodedPrompt}`;
                return `
                <tr>
                  <td>${item.summary}</td>
                  <td><a href="${linkUrl}" target="_blank"><img src="${badgeUrl}" alt="Prompt it" /></a></td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div id="contexts-data" style="display:none;">
    ${contexts
      .map((ctx) =>
        ctx.context
          ? `<div id="context-${ctx.slug}">${escapeHtml(ctx.context)}</div>`
          : "",
      )
      .join("")}
  </div>

  <script>
    function copyContext(slug) {
      const contextElement = document.getElementById('context-' + slug);
      if (contextElement) {
        navigator.clipboard.writeText(contextElement.textContent)
          .then(() => {
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
              button.textContent = originalText;
            }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy context');
          });
      }
    }

    function copyMarkdown() {
      const markdownElement = document.getElementById('markdown-content');
      if (markdownElement) {
        navigator.clipboard.writeText(markdownElement.textContent)
          .then(() => {
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.style.backgroundColor = '#28a745';
            setTimeout(() => {
              button.textContent = originalText;
              button.style.backgroundColor = '#0969da';
            }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy markdown: ', err);
            alert('Failed to copy markdown');
          });
      }
    }

    async function refreshData() {
      const refreshButton = document.querySelector('.btn-refresh');
      const refreshIcon = document.getElementById('refresh-icon');
      const refreshText = document.getElementById('refresh-text');
      
      // Disable button and show loading state
      refreshButton.disabled = true;
      refreshIcon.style.animation = 'spin 1s linear infinite';
      refreshText.textContent = 'Refreshing...';
      
      // Add CSS for spin animation if not already present
      if (!document.getElementById('spin-style')) {
        const style = document.createElement('style');
        style.id = 'spin-style';
        style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
      }
      
      try {
        // Fetch with refresh parameter
        const response = await fetch(window.location.pathname + '?refresh=true');
        
        if (response.ok) {
          // Wait a moment for the server to process, then reload
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          throw new Error('Failed to refresh data');
        }
      } catch (error) {
        console.error('Refresh failed:', error);
        
        // Reset button state on error
        refreshButton.disabled = false;
        refreshIcon.style.animation = '';
        refreshText.textContent = 'Refresh';
        
        alert('Failed to refresh data. Please try again.');
      }
    }
  </script>
</body>
</html>`;
}
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
