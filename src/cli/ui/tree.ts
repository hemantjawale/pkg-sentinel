/**
 * Tree view renderer for dependency visualization.
 */

import chalk from 'chalk';

export interface TreeNode {
  label: string;
  children?: TreeNode[];
  badge?: string;
}

/**
 * Render a tree structure to string.
 */
export function renderTree(nodes: TreeNode[], prefix = ''): string {
  let output = '';

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    const isLast = i === nodes.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';

    const badge = node.badge ? ` ${node.badge}` : '';
    output += prefix + chalk.gray(connector) + node.label + badge + '\n';

    if (node.children && node.children.length > 0) {
      output += renderTree(node.children, prefix + chalk.gray(childPrefix));
    }
  }

  return output;
}
