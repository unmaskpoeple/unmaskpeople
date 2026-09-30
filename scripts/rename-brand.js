const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const ROOT_DIR = path.resolve(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.next', '.git']);
const VALID_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.prisma', '.env', '.env.example', '.md', '.html', '.css']);

const REPLACEMENTS = [
  // Specific logo spans
  { from: /UnMaskPeople<span className="text-cyan-400">\.com<\/span>/g, to: 'UnMaskPeople<span className="text-cyan-400">.in</span>' },
  { from: /UnMaskPeople<span className="text-violet-400">\.com<\/span>/g, to: 'UnMaskPeople<span className="text-violet-400">.in</span>' },
  // Brand name with TLD
  { from: /UnMaskPeople\.com/g, to: 'UnMaskPeople.in' },
  { from: /unmaskpeople\.com/g, to: 'unmaskpeople.in' },
  // Brand name standalone
  { from: /UnMaskPeople/g, to: 'UnMaskPeople' },
  { from: /unmaskpeople-saas/g, to: 'unmaskpeople-saas' },
  { from: /unmaskpeople_theme/g, to: 'unmaskpeople_theme' },
  { from: /unmaskpeople_session/g, to: 'unmaskpeople_session' },
  { from: /unmaskpeople/g, to: 'unmaskpeople' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const { from, to } of REPLACEMENTS) {
    if (from.test(content)) {
      content = content.replace(from, to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function traverse(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      traverse(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      const isEnv = entry.name.startsWith('.env');
      if (VALID_EXTENSIONS.has(ext) || isEnv) {
        processFile(fullPath);
      }
    }
  }
}

async function updateDatabase() {
  const prisma = new PrismaClient();
  try {
    const updated = await prisma.systemSetting.upsert({
      where: { key: 'site_name' },
      update: { value: 'UnMaskPeople.in' },
      create: { key: 'site_name', value: 'UnMaskPeople.in' }
    });
    console.log('Database systemSetting updated:', updated);

    // Update demo and admin emails if desired
    await prisma.user.updateMany({
      where: { email: 'admin@unmaskpeople.in' },
      data: { email: 'admin@unmaskpeople.in' }
    });
    await prisma.user.updateMany({
      where: { email: 'demo@unmaskpeople.in' },
      data: { email: 'demo@unmaskpeople.in' }
    });
    console.log('Database demo users updated with new domain.');
  } catch (err) {
    console.error('Database update error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('Renaming branding in files...');
  traverse(ROOT_DIR);
  console.log('Updating database records...');
  await updateDatabase();
  console.log('Done!');
}

main();
