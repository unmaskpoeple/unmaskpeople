const fs = require('fs');
const path = require('path');

const files = [
  'app/terms/page.tsx',
  'app/privacy/page.tsx',
  'app/refund/page.tsx',
  'app/contact/page.tsx',
  'app/verify-email/page.tsx',
];

const targetPattern = /<Link href="\/" className="flex items-center gap-3[\s\S]*?group">[\s\S]*?<Sparkles className="w-5 h-5 text-white" \/>[\s\S]*?<\/Link>/g;

for (const relPath of files) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping missing file: ${relPath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Add BrandLogo import if not present
  if (!content.includes('import { BrandLogo }')) {
    content = content.replace(/(import \{[^\}]*\} from "lucide-react";)/, '$1\nimport { BrandLogo } from "@/components/brand-logo";');
  }

  if (targetPattern.test(content)) {
    content = content.replace(targetPattern, '<BrandLogo href="/" size="md" />');
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated logo in: ${relPath}`);
  } else {
    console.log(`Pattern not matched in: ${relPath}`);
  }
}
