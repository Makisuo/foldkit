export const mockGitHubRepository = {
  stargazers_count: 342,
  forks_count: 18,
  watchers_count: 342,
  open_issues_count: 15,
  pushed_at: '2026-06-21T19:20:00Z',
  default_branch: 'main',
}

export const mockNpmDownloads = {
  downloads: [
    { day: '2026-06-01', downloads: 10 },
    { day: '2026-06-02', downloads: 12 },
    { day: '2026-06-08', downloads: 20 },
    { day: '2026-06-15', downloads: 30 },
  ],
}

export const mockNpmPackument = {
  name: 'foldkit',
  time: {
    '0.115.0': '2026-06-20T12:00:00Z',
  },
  versions: {
    '0.115.0': {
      dependencies: {},
      peerDependencies: {
        effect: '^4.0.0',
      },
    },
  },
  'dist-tags': {
    latest: '0.115.0',
  },
}
