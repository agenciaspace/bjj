#!/usr/bin/env node

/**
 * Translation Validator
 * Automatically checks for English text in React components
 * Run: node validate-translations.js
 */

const fs = require('fs');
const path = require('path');

// English words that commonly appear in hardcoded text
const ENGLISH_PATTERNS = [
    /className="[^"]*">\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,  // Title Case words in JSX
    /(Members|Users|Academies|Total|Search|Refresh|Active|Pending)/g, // Common English words
    /(Loading|Error|Success|Cancel|Confirm|Delete|Edit|Save)/g,
];

// Exceptions (valid English that should stay)
const EXCEPTIONS = [
    'OSS',
    'BJJ',
    'No-Gi',
    'GitHub',
    'Google',
    'Vercel',
];

const issues = [];

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        // Skip imports, comments, and variable names
        if (line.trim().startsWith('import') ||
            line.trim().startsWith('//') ||
            line.trim().startsWith('const') ||
            line.trim().startsWith('let') ||
            line.trim().startsWith('function')) {
            return;
        }

        ENGLISH_PATTERNS.forEach(pattern => {
            const matches = line.matchAll(pattern);
            for (const match of matches) {
                const word = match[1] || match[0];

                // Skip exceptions
                if (EXCEPTIONS.includes(word)) continue;

                // Skip if it's a variable or function name
                if (/^[a-z]/.test(word)) continue;

                issues.push({
                    file: filePath,
                    line: index + 1,
                    text: word,
                    context: line.trim()
                });
            }
        });
    });
}

function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            scanDirectory(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            scanFile(filePath);
        }
    });
}

// Scan src directory
console.log('🔍 Scanning for English text...\n');
scanDirectory(path.join(__dirname, 'src'));

// Report results
if (issues.length === 0) {
    console.log('✅ No English text found! All translations look good.\n');
} else {
    console.log(`⚠️  Found ${issues.length} potential translation issues:\n`);

    const byFile = {};
    issues.forEach(issue => {
        if (!byFile[issue.file]) byFile[issue.file] = [];
        byFile[issue.file].push(issue);
    });

    Object.keys(byFile).forEach(file => {
        console.log(`📄 ${file}`);
        byFile[file].forEach(issue => {
            console.log(`   Line ${issue.line}: "${issue.text}"`);
            console.log(`   Context: ${issue.context.substring(0, 80)}...`);
        });
        console.log('');
    });

    console.log('\n💡 Tip: Add these to pt.json and use t() function instead.');
    process.exit(1);
}
