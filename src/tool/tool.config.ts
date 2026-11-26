const toolConfig = {
  id: 'uuid-generator',
  name: 'UUID Generator',
  category: 'Developer',
  description: 'Generate UUID v4 identifiers instantly, securely and client-side.',
  version: '1.0.0',
  exportFormats: ['json', 'png', 'jpeg', 'webp', 'pdf'] as (
    'json' | 'png' | 'jpeg' | 'webp' | 'pdf'
  )[],
  features: {
    sidebar: true,
    statusBar: true,
    export: true,
    autoSave: true,
    undoRedo: true,
    darkMode: true,
  },
  theme: { brand: 'UUID Generator' },
};

export default toolConfig;
