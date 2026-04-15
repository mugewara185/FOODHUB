export interface DocItem {
  id: string;
  title: string;
  path: string;
  category: string;
  domain: string;
  loadContent: () => Promise<string>;
}

// Vite glob covering everything from Vite root (*.md)
// This excludes node_modules by default.
// Use '?raw' to fetch the markdown file as a raw text string, and import: 'default' to resolve properly.
// The cast Record<string, () => Promise<string>> is needed because import doesn't perfectly infer dynamic query params natively
const docModules = import.meta.glob('/**/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;

export const getDocumentationRegistry = (): DocItem[] => {
  return Object.keys(docModules).map((filePath) => {
    // filePath is like "/src/features/auth/docs/flow.md" or "/README.md"
    const isRoot = !filePath.startsWith('/src/');
    
    let domain = 'Root';
    let category = 'General';
    let title = filePath.split('/').pop()?.replace('.md', '') || 'Untitled';
    
    // Capitalize and clean title (e.g. "auth-flow" -> "Auth Flow")
    title = title.replace(/[-_]/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());

    if (isRoot) {
      domain = 'Repository Root';
      category = 'Global Docs';
    } else if (filePath.includes('/features/')) {
      domain = 'Features';
      const parts = filePath.split('/');
      const featureIndex = parts.indexOf('features');
      if (featureIndex !== -1 && parts.length > featureIndex + 1) {
        // e.g. ["", "src", "features", "auth", ...]
        category = parts[featureIndex + 1];
        category = category.charAt(0).toUpperCase() + category.slice(1);
      }
    } else if (filePath.includes('/core/')) {
      domain = 'Core Architecture';
      const parts = filePath.split('/');
      const coreIndex = parts.indexOf('core');
      if (coreIndex !== -1 && parts.length > coreIndex + 1) {
        category = parts[coreIndex + 1];
        category = category.charAt(0).toUpperCase() + category.slice(1);
      }
    } else if (filePath.includes('/pages/')) {
      domain = 'UI & Routing';
      category = 'Pages';
    } else if (filePath.includes('/shared/')) {
      domain = 'Shared Hub';
      category = 'Components & Layouts';
    } else {
      domain = 'Miscellaneous';
      category = 'Uncategorized';
    }

    return {
      id: filePath,
      title,
      path: filePath,
      category,
      domain,
      loadContent: docModules[filePath]
    };
  });
};

export const getCategorizedDocs = (): Record<string, Record<string, DocItem[]>> => {
  const docs = getDocumentationRegistry();
  const grouped: Record<string, Record<string, DocItem[]>> = {};

  docs.forEach(doc => {
    if (!grouped[doc.domain]) {
      grouped[doc.domain] = {};
    }
    if (!grouped[doc.domain][doc.category]) {
      grouped[doc.domain][doc.category] = [];
    }
    grouped[doc.domain][doc.category].push(doc);
  });

  return grouped;
};
