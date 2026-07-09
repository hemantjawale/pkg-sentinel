import { describe, it, expect } from 'vitest';
import { NpmProvider } from '../../../src/providers/npm/npm-provider.js';

describe('NpmProvider', () => {
  it('fetches full package metadata successfully', async () => {
    const provider = new NpmProvider();
    const metadata = await provider.getPackageMetadata('chalk');

    expect(metadata.name).toBe('chalk');
    expect(metadata['dist-tags'].latest).toBe('5.3.0');
    expect(metadata.versions['5.3.0']?.dist.shasum).toBe('a2ec5a818c3539828d11c75c879a83856d2cf93b');
  });

  it('fetches weekly download statistics successfully', async () => {
    const provider = new NpmProvider();
    const downloads = await provider.getDownloads('chalk');

    expect(downloads.package).toBe('chalk');
    expect(downloads.downloads).toBe(15000000);
  });

  it('throws NpmPackageNotFoundError for invalid packages', async () => {
    const provider = new NpmProvider();
    await expect(provider.getPackageMetadata('nonexistent-pkg')).rejects.toThrow(
      'Package "nonexistent-pkg" not found on npm registry',
    );
  });
});
