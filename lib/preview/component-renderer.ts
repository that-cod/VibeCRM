/**
 * @fileoverview Generate React components in-memory for preview
 * 
 * Phase 1: Live Preview Infrastructure
 * Creates React component code strings that can be rendered in iframe
 */

import type { CRMSchema, TableDefinition } from "@/types/schema";
import type { PreviewComponent, MockTableData } from "./types";
import { convertSchemaToResources } from "@/lib/integration/schema-to-resource";
import type { Resource } from "@/lib/code-generator/schemas";

/**
 * Generate all preview components for a schema
 */
export function generatePreviewComponents(
  schema: CRMSchema,
  mockData: MockTableData[]
): PreviewComponent[] {
  const components: PreviewComponent[] = [];
  const resources = convertSchemaToResources(schema);

  // Generate home page
  components.push(generateHomePage(resources));

  // Generate page for each resource
  resources.forEach(resource => {
    const tableData = mockData.find(d => d.tableName === resource.name);
    if (tableData) {
      components.push(generateListPage(resource, tableData));
    }
  });

  return components;
}

/**
 * Generate home page component
 */
function generateHomePage(resources: Resource[]): PreviewComponent {
  const code = `
import React from 'react';

export default function HomePage() {
  const resources = ${JSON.stringify(resources.map(r => ({
    name: r.plural_name,
    label: r.plural_label,
    description: r.description,
    icon: r.icon,
    color: r.color,
  })))};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to Your CRM
          </h1>
          <p className="text-xl text-gray-600">
            Manage your business data efficiently
          </p>
        </div>

        {/* Resource Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <button
              key={resource.name}
              onClick={() => window.parent.postMessage({ type: 'NAVIGATE', path: '/' + resource.name }, '*')}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 p-6 text-left hover:scale-105 border-2 border-transparent hover:border-blue-500"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className={\`w-12 h-12 rounded-lg bg-\${resource.color}-100 flex items-center justify-center\`}>
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {resource.label}
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                {resource.description}
              </p>
            </button>
          ))}
        </div>

        {/* Preview Badge */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-100 border-2 border-yellow-400 rounded-full px-6 py-3">
            <span className="text-2xl">✨</span>
            <span className="font-semibold text-yellow-900">Preview Mode</span>
          </div>
          <p className="mt-3 text-gray-600">
            This is a live preview. Click "Provision" to create the real database.
          </p>
        </div>
      </div>
    </div>
  );
}
`;

  return {
    path: "/",
    code,
    type: "page",
  };
}

/**
 * Generate list page for a resource
 */
function generateListPage(resource: Resource, tableData: MockTableData): PreviewComponent {
  const visibleFields = resource.fields.slice(0, 5);

  const code = `
import React, { useState } from 'react';

export default function ${capitalize(resource.name)}ListPage() {
  const [data] = useState(${JSON.stringify(tableData.records)});
  const [search, setSearch] = useState('');

  const filteredData = data.filter(record => 
    Object.values(record).some(value => 
      String(value).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => window.parent.postMessage({ type: 'NAVIGATE', path: '/' }, '*')}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-2"
            >
              ← Back to Home
            </button>
            <h1 className="text-4xl font-bold text-gray-900">${resource.plural_label}</h1>
            <p className="text-gray-600 mt-2">${resource.description}</p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg">
            + Add ${resource.singular_label}
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  ${visibleFields.map(f => `
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    ${f.display_name}
                  </th>
                  `).join('')}
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="${visibleFields.length + 1}" className="px-6 py-12 text-center text-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  filteredData.map((record, idx) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      ${visibleFields.map(f => `
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatValue(record.${f.name})}
                      </td>
                      `).join('')}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                            View
                          </button>
                          <button className="text-green-600 hover:text-green-800 font-medium text-sm">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-800 font-medium text-sm">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 text-center text-gray-600">
          Showing {filteredData.length} of {data.length} records
        </div>

        {/* Preview Badge */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-100 border-2 border-yellow-400 rounded-full px-6 py-3">
            <span className="text-xl">✨</span>
            <span className="font-semibold text-yellow-900">Preview Mode - Sample Data</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatValue(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
}
`;

  return {
    path: `/${resource.plural_name}`,
    code,
    type: "page",
  };
}

/**
 * Generate the preview app wrapper
 */
export function generatePreviewApp(components: PreviewComponent[]): string {
  return `
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Import all generated components
${components.map((c, i) => `const Component${i} = ${c.code.match(/export default function (\w+)/)?.[0]?.replace('export default ', '') || 'null'};`).join('\n')}

function PreviewApp() {
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    // Listen for navigation messages from parent
    window.addEventListener('message', (event) => {
      if (event.data.type === 'NAVIGATE') {
        setCurrentPath(event.data.path);
      } else if (event.data.type === 'RELOAD') {
        window.location.reload();
      }
    });

    // Notify parent that preview is ready
    window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
  }, []);

  // Route to appropriate component
  ${components.map((c, i) => `
  if (currentPath === '${c.path}') {
    return <Component${i} />;
  }
  `).join('')}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">404 - Page Not Found</h1>
        <button
          onClick={() => setCurrentPath('/')}
          className="text-blue-600 hover:text-blue-800"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

// Mount the app
const root = createRoot(document.getElementById('root'));
root.render(<PreviewApp />);
`;
}

/**
 * Generate complete HTML for preview iframe
 */
export function generatePreviewHTML(
  components: PreviewComponent[],
  theme: "light" | "dark" = "light"
): string {
  const appCode = generatePreviewApp(components);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CRM Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    ${theme === "dark" ? `
    body {
      background-color: #1a1a1a;
      color: #ffffff;
    }
    ` : ''}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${appCode}
  </script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</body>
</html>
`;
}

// Helper function
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
