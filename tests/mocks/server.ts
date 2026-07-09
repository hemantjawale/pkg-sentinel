import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Mock responses
const MOCK_NPM_METADATA = {
  name: 'chalk',
  description: 'Terminal string styling done right',
  'dist-tags': { latest: '5.3.0' },
  versions: {
    '5.3.0': {
      name: 'chalk',
      version: '5.3.0',
      description: 'Terminal string styling done right',
      dist: {
        tarball: 'https://registry.npmjs.org/chalk/-/chalk-5.3.0.tgz',
        shasum: 'a2ec5a818c3539828d11c75c879a83856d2cf93b',
        integrity: 'sha512-abc',
        unpackedSize: 32000,
      },
      scripts: {
        test: 'vitest',
      },
      dependencies: {},
    },
  },
  maintainers: [{ name: 'sindresorhus', email: 'sindresorhus@gmail.com' }],
  time: {
    created: '2014-03-09T03:36:11.838Z',
    modified: '2024-03-09T03:36:11.838Z',
    '5.3.0': '2024-03-09T03:36:11.838Z',
    '5.2.0': '2023-03-09T03:36:11.838Z',
  },
  repository: {
    type: 'git',
    url: 'git+https://github.com/chalk/chalk.git',
  },
};

const MOCK_NPM_DOWNLOADS = {
  downloads: 15000000,
  start: '2024-03-02',
  end: '2024-03-09',
  package: 'chalk',
};

const MOCK_GITHUB_REPO = {
  full_name: 'chalk/chalk',
  description: 'Terminal string styling done right',
  stargazers_count: 22000,
  forks_count: 1200,
  open_issues_count: 45,
  subscribers_count: 350,
  language: 'TypeScript',
  archived: false,
  disabled: false,
  fork: false,
  default_branch: 'main',
  created_at: '2014-03-09T03:36:11Z',
  updated_at: '2024-03-09T03:36:11Z',
  pushed_at: '2024-03-09T03:36:11Z',
  size: 450,
  license: {
    key: 'mit',
    name: 'MIT License',
    spdx_id: 'MIT',
  },
  owner: {
    login: 'chalk',
    type: 'Organization',
  },
  html_url: 'https://github.com/chalk/chalk',
  topics: ['terminal', 'color', 'formatting'],
  has_issues: true,
  has_wiki: false,
};

const MOCK_GITHUB_CONTRIBUTORS = [
  { login: 'sindresorhus', contributions: 850, type: 'User', avatar_url: '' },
  { login: 'jbnicolai', contributions: 120, type: 'User', avatar_url: '' },
];

const MOCK_GITHUB_COMMITS = [
  {
    sha: 'abcdef123456',
    commit: {
      author: { name: 'Sindre Sorhus', email: '', date: new Date().toISOString() },
      message: 'fix: typos',
    },
    author: { login: 'sindresorhus' },
  },
];

const MOCK_GITHUB_ISSUES_OPEN = [
  { number: 100, state: 'open', created_at: new Date().toISOString(), closed_at: null, labels: [] },
];

const MOCK_GITHUB_ISSUES_CLOSED = [
  {
    number: 99,
    state: 'closed',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    closed_at: new Date().toISOString(),
    labels: [],
  },
];

export const handlers = [
  // npm metadata
  http.get('https://registry.npmjs.org/:package', ({ params }) => {
    if (params.package === 'chalk') {
      return HttpResponse.json(MOCK_NPM_METADATA);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // npm downloads
  http.get('https://api.npmjs.org/downloads/point/:period/:package', ({ params }) => {
    if (params.package === 'chalk') {
      return HttpResponse.json(MOCK_NPM_DOWNLOADS);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // GitHub repository info
  http.get('https://api.github.com/repos/:owner/:repo', ({ params }) => {
    if (params.owner === 'chalk' && params.repo === 'chalk') {
      return HttpResponse.json(MOCK_GITHUB_REPO);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // GitHub contributors
  http.get('https://api.github.com/repos/:owner/:repo/contributors', ({ params }) => {
    if (params.owner === 'chalk' && params.repo === 'chalk') {
      return HttpResponse.json(MOCK_GITHUB_CONTRIBUTORS);
    }
    return HttpResponse.json([]);
  }),

  // GitHub commits
  http.get('https://api.github.com/repos/:owner/:repo/commits', ({ params }) => {
    if (params.owner === 'chalk' && params.repo === 'chalk') {
      return HttpResponse.json(MOCK_GITHUB_COMMITS);
    }
    return HttpResponse.json([]);
  }),

  // GitHub issues (state=open)
  http.get('https://api.github.com/repos/:owner/:repo/issues', ({ request, params }) => {
    const url = new URL(request.url);
    const state = url.searchParams.get('state');
    if (params.owner === 'chalk' && params.repo === 'chalk') {
      if (state === 'open') {
        return HttpResponse.json(MOCK_GITHUB_ISSUES_OPEN);
      }
      return HttpResponse.json(MOCK_GITHUB_ISSUES_CLOSED);
    }
    return HttpResponse.json([]);
  }),
];

export const server = setupServer(...handlers);
