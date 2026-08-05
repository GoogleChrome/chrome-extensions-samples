// Copyright 2026
// SPDX-License-Identifier: Apache-2.0

const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = process.cwd();
const SAMPLE_ROOTS = ['api-samples', 'functional-samples'];
const SKIP_DIRS = new Set(['node_modules', 'dist', 'third-party', '.git']);
const BUILD_OUTPUT_PREFIXES = ['dist/'];
const REFERENCE_FILE_FIELDS = [
  'default_popup',
  'default_path',
  'default_icon',
  'service_worker',
  'worker',
  'options_page',
  'devtools_page',
  'newtab',
  'page',
  'js',
  'script',
  'css'
];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function walkForManifests(dir, found = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.repo') continue;
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walkForManifests(fullPath, found);
      continue;
    }

    if (entry.isFile() && entry.name === 'manifest.json') {
      found.push(fullPath);
    }
  }

  return found;
}

function validateManifest(manifestPath) {
  const errors = [];
  const relativePath = path.relative(ROOT_DIR, manifestPath);
  const manifestDir = path.dirname(manifestPath);
  const raw = fs.readFileSync(manifestPath, 'utf8');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    errors.push(`${relativePath}: invalid JSON (${error.message})`);
    return errors;
  }

  if (!Number.isInteger(parsed.manifest_version)) {
    errors.push(`${relativePath}: missing or invalid "manifest_version"`);
  }
  if (!isNonEmptyString(parsed.name)) {
    errors.push(`${relativePath}: missing or invalid "name"`);
  }
  if (!isNonEmptyString(parsed.version)) {
    errors.push(`${relativePath}: missing or invalid "version"`);
  }

  const localeErrors = validateDefaultLocale(manifestDir, parsed.default_locale);
  for (const localeError of localeErrors) {
    errors.push(`${relativePath}: ${localeError}`);
  }

  const references = [];
  collectFileReferences(parsed, references);
  const missingFiles = getMissingFiles(manifestDir, references);
  for (const filePath of missingFiles) {
    errors.push(`${relativePath}: references missing file "${filePath}"`);
  }

  return errors;
}

function validateDefaultLocale(manifestDir, defaultLocale) {
  if (!isNonEmptyString(defaultLocale)) {
    return [];
  }

  const messagesPath = path.join(manifestDir, '_locales', defaultLocale, 'messages.json');
  if (fs.existsSync(messagesPath)) {
    return [];
  }

  return [
    `default_locale "${defaultLocale}" is set but _locales/${defaultLocale}/messages.json is missing`
  ];
}

function collectFileReferences(value, references) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectFileReferences(item, references);
    }
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (REFERENCE_FILE_FIELDS.includes(key)) {
      if (typeof nestedValue === 'string') {
        references.push(nestedValue);
      } else if (Array.isArray(nestedValue)) {
        for (const item of nestedValue) {
          if (typeof item === 'string') {
            references.push(item);
          }
        }
      }
    }

    collectFileReferences(nestedValue, references);
  }
}

function getMissingFiles(manifestDir, references) {
  const missing = [];

  for (const entry of references) {
    if (!isNonEmptyString(entry)) continue;
    if (/^https?:\/\//i.test(entry)) continue;
    if (/^\w+:/i.test(entry)) continue;
    if (entry.includes('*')) continue;

    const normalized = entry.replace(/^\/+/, '').split('?')[0].split('#')[0];
    if (!normalized || normalized.endsWith('/')) continue;
    if (BUILD_OUTPUT_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
      continue;
    }

    const resolvedPath = path.resolve(manifestDir, normalized);
    if (!resolvedPath.startsWith(manifestDir)) continue;

    if (!fs.existsSync(resolvedPath)) {
      missing.push(entry);
    }
  }

  return [...new Set(missing)];
}

function run() {
  const rootsToScan = SAMPLE_ROOTS.map((root) => path.join(ROOT_DIR, root)).filter((root) =>
    fs.existsSync(root)
  );

  if (rootsToScan.length === 0) {
    console.error('No sample roots found to validate.');
    process.exit(1);
  }

  const manifestPaths = rootsToScan.flatMap((root) => walkForManifests(root));
  if (manifestPaths.length === 0) {
    console.error('No manifests found under sample roots.');
    process.exit(1);
  }

  const errors = manifestPaths.flatMap(validateManifest);

  if (errors.length > 0) {
    console.error(`Manifest validation failed with ${errors.length} issue(s):`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Validated ${manifestPaths.length} manifest.json files successfully.`);
}

run();