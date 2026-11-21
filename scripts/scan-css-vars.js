#!/usr/bin/env node

/**
 * CSS 变量与设计令牌引用分析/冗余扫描工具
 * 用法: node scripts/scan-css-vars.js [--json]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const TOKEN_CSS_FILE = path.join(SRC_DIR, 'styles', 'md1.css');

function collectFiles(dir, extensions = ['.vue', '.ts', '.css', '.html']) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(collectFiles(fullPath, extensions));
    } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

// 1. 从 md1.css 中提取所有定义的 CSS 变量
function extractDeclaredTokens(cssPath) {
  if (!fs.existsSync(cssPath)) return [];
  const content = fs.readFileSync(cssPath, 'utf8');
  const declared = new Set();
  const regex = /(--[a-zA-Z0-9_-]+)\s*:/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    declared.add(match[1]);
  }
  return Array.from(declared);
}

// 2. 扫描项目中所有 var(...) 引用
function scanTokenUsage() {
  const allFiles = collectFiles(SRC_DIR);
  const declaredTokens = extractDeclaredTokens(TOKEN_CSS_FILE);
  const tokenStats = {};

  declaredTokens.forEach((token) => {
    tokenStats[token] = {
      isMd: token.startsWith('--md-'),
      isFluent: token.startsWith('--fluent-'),
      isRibbon: token.startsWith('--ribbon-'),
      isFont: token.startsWith('--font-'),
      totalUsages: 0,
      files: [],
    };
  });

  allFiles.forEach((filePath) => {
    const relativePath = path.relative(ROOT_DIR, filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    // 匹配 var(--token-name)
    declaredTokens.forEach((token) => {
      let count = 0;
      const varRegex = new RegExp(`var\\(\\s*${token}[\\s,)!]`, 'g');
      const matches = content.match(varRegex);
      if (matches) {
        count = matches.length;
      }

      if (count > 0) {
        tokenStats[token].totalUsages += count;
        tokenStats[token].files.push({ file: relativePath, count });
      }
    });
  });

  return tokenStats;
}

// 3. 执行分析与输出
function run() {
  const isJson = process.argv.includes('--json');
  const stats = scanTokenUsage();

  const unusedTokens = [];
  const mdTokens = [];
  const fluentTokens = [];
  const otherTokens = [];

  Object.entries(stats).forEach(([name, data]) => {
    if (data.totalUsages === 0) {
      unusedTokens.push({ name, ...data });
    }
    if (data.isMd) mdTokens.push({ name, ...data });
    else if (data.isFluent) fluentTokens.push({ name, ...data });
    else otherTokens.push({ name, ...data });
  });

  if (isJson) {
    console.log(JSON.stringify({ unusedTokens, mdTokens, fluentTokens, otherTokens }, null, 2));
    return;
  }

  console.log('\n======================================================');
  console.log('   🎨 CSS 变量与设计令牌分析报告 (CSS Var Audit)');
  console.log('======================================================\n');

  console.log(`📦 已声明变量总数: ${Object.keys(stats).length}`);
  console.log(`⚠️  完全未使用的孤立变量 (0 引用): ${unusedTokens.length}`);
  console.log(`🔄 传统 --md-* 兼容别名: ${mdTokens.length}`);
  console.log(`✨ Fluent 标准设计令牌: ${fluentTokens.length}\n`);

  if (unusedTokens.length > 0) {
    console.log('------------------------------------------------------');
    console.log('🚨 【0 引用冗余变量】(建议从 md1.css 中清除):');
    unusedTokens.forEach((item) => {
      console.log(`  • \x1b[31m${item.name}\x1b[0m (定义但无任何组件引用)`);
    });
    console.log('------------------------------------------------------\n');
  } else {
    console.log('✅ 没有检测到任何 0 引用的死代码变量！\n');
  }

  console.log('------------------------------------------------------');
  console.log('📋 【--md-* 兼容别名引用现状】:');
  mdTokens.forEach((item) => {
    const color = item.totalUsages === 0 ? '\x1b[31m' : '\x1b[33m';
    console.log(`  ${color}${item.name}\x1b[0m: ${item.totalUsages} 处引用 (分布在 ${item.files.length} 个文件中)`);
  });
  console.log('------------------------------------------------------\n');
}

run();
