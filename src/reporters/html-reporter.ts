/**
 * HTML reporter — generates a styled HTML report.
 */

import { writeFile } from 'node:fs/promises';
import type { IReporter } from './interfaces.js';
import type { AnalysisResult } from '../types/analysis.js';
import { ReportFormat, Severity } from '../types/common.js';

export class HtmlReporter implements IReporter {
  readonly format = ReportFormat.Html;
  readonly name = 'html';

  async generate(result: AnalysisResult): Promise<string> {
    const severityColors: Record<Severity, string> = {
      [Severity.Critical]: '#dc2626',
      [Severity.High]: '#ea580c',
      [Severity.Medium]: '#ca8a04',
      [Severity.Low]: '#0891b2',
      [Severity.Info]: '#2563eb',
    };

    const trustColor = result.trustScore.overall >= 80 ? '#16a34a'
      : result.trustScore.overall >= 60 ? '#ca8a04'
      : result.trustScore.overall >= 40 ? '#ea580c'
      : '#dc2626';

    const findingsHtml = result.findings.map((f) => `
      <tr>
        <td><span class="badge" style="background:${severityColors[f.severity]}">${f.severity.toUpperCase()}</span></td>
        <td><code>${f.ruleId}</code></td>
        <td>${f.title}</td>
        <td>${f.description}</td>
        <td>${f.confidence}%</td>
      </tr>
    `).join('');

    const categoriesHtml = result.trustScore.categories.map((c) => {
      const barColor = c.score >= 80 ? '#16a34a' : c.score >= 60 ? '#ca8a04' : c.score >= 40 ? '#ea580c' : '#dc2626';
      return `
        <tr>
          <td>${c.label}</td>
          <td>${c.score}/100</td>
          <td><div class="bar"><div class="fill" style="width:${c.score}%;background:${barColor}"></div></div></td>
          <td>${c.explanation}</td>
        </tr>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>pkg-sentinel Report — ${result.packageName}</title>
  <style>
    :root { --bg: #0f172a; --surface: #1e293b; --text: #e2e8f0; --muted: #94a3b8; --border: #334155; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text); padding: 2rem; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.1rem; margin: 2rem 0 0.5rem; color: var(--muted); border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    .trust-score { text-align: center; padding: 2rem; background: var(--surface); border-radius: 12px; margin: 1rem 0; }
    .trust-score .score { font-size: 3rem; font-weight: 700; color: ${trustColor}; }
    .trust-score .label { color: var(--muted); margin-top: 0.25rem; }
    table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
    th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.85rem; }
    th { color: var(--muted); font-weight: 500; }
    .badge { padding: 2px 8px; border-radius: 4px; color: white; font-size: 0.7rem; font-weight: 600; }
    code { background: var(--surface); padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; }
    .bar { background: var(--surface); border-radius: 4px; height: 8px; width: 100%; }
    .fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
    .meta { color: var(--muted); font-size: 0.85rem; margin-bottom: 1rem; }
    .summary { background: var(--surface); padding: 1rem; border-radius: 8px; margin: 1rem 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🛡️ pkg-sentinel Report</h1>
    <div class="meta">
      <strong>${result.packageName}@${result.packageVersion}</strong> · 
      Analyzed ${new Date(result.analyzedAt).toLocaleString()} · 
      ${result.totalDurationMs}ms
    </div>

    <div class="trust-score">
      <div class="score">${result.trustScore.overall}</div>
      <div class="label">${result.trustScore.level}</div>
    </div>

    <div class="summary">${result.trustScore.summary}</div>

    <h2>Score Breakdown</h2>
    <table>
      <thead><tr><th>Category</th><th>Score</th><th>Bar</th><th>Explanation</th></tr></thead>
      <tbody>${categoriesHtml}</tbody>
    </table>

    <h2>Findings (${result.findings.length})</h2>
    ${result.findings.length > 0 ? `
    <table>
      <thead><tr><th>Severity</th><th>Rule</th><th>Title</th><th>Description</th><th>Confidence</th></tr></thead>
      <tbody>${findingsHtml}</tbody>
    </table>` : '<p style="color:var(--muted)">✅ No security findings detected.</p>'}
  </div>
</body>
</html>`;
  }

  async output(result: AnalysisResult, destination?: string): Promise<void> {
    const html = await this.generate(result);
    if (destination) {
      await writeFile(destination, html, 'utf-8');
    } else {
      process.stdout.write(html);
    }
  }
}
