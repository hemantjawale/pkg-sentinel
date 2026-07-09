/**
 * Type definitions for npm registry API responses.
 */

/** Full npm package metadata (from GET https://registry.npmjs.org/{package}). */
export interface NpmPackageMetadata {
  /** Package name. */
  name: string;

  /** Description. */
  description?: string;

  /** Distribution tags (e.g., { latest: '1.2.3' }). */
  'dist-tags': Record<string, string>;

  /** All published versions. */
  versions: Record<string, NpmVersionMetadata>;

  /** Maintainers of the package. */
  maintainers: NpmUser[];

  /** Creation and modification timestamps. */
  time: Record<string, string>;

  /** Package author. */
  author?: NpmUser;

  /** Repository URL info. */
  repository?: {
    type: string;
    url: string;
    directory?: string;
  };

  /** Package home page. */
  homepage?: string;

  /** Keywords. */
  keywords?: string[];

  /** License. */
  license?: string;

  /** Readme content. */
  readme?: string;

  /** Bug tracker URL. */
  bugs?: { url: string };

  /** Users who starred the package. */
  users?: Record<string, boolean>;
}

/** Metadata for a specific version of a package. */
export interface NpmVersionMetadata {
  /** Package name. */
  name: string;

  /** Version string. */
  version: string;

  /** Description. */
  description?: string;

  /** Main entry point. */
  main?: string;

  /** Scripts defined in package.json. */
  scripts?: Record<string, string>;

  /** Dependencies. */
  dependencies?: Record<string, string>;

  /** Dev dependencies. */
  devDependencies?: Record<string, string>;

  /** Peer dependencies. */
  peerDependencies?: Record<string, string>;

  /** Optional dependencies. */
  optionalDependencies?: Record<string, string>;

  /** Distribution info. */
  dist: NpmDistInfo;

  /** Maintainers at the time of publish. */
  maintainers?: NpmUser[];

  /** npm user who published this version. */
  _npmUser?: NpmUser;

  /** Whether this version has an npm signature. */
  _hasShrinkwrap?: boolean;

  /** npm operation user. */
  _npmOperationalInternal?: {
    host: string;
    tmp: string;
  };

  /** Node.js version used to publish. */
  _nodeVersion?: string;

  /** npm version used to publish. */
  _npmVersion?: string;

  /** Repository info. */
  repository?: {
    type: string;
    url: string;
    directory?: string;
  };

  /** Engines requirements. */
  engines?: Record<string, string>;

  /** Deprecated message if any. */
  deprecated?: string;

  /** Has install scripts flag. */
  hasInstallScript?: boolean;

  /** License. */
  license?: string;
}

/** Distribution info for a package version. */
export interface NpmDistInfo {
  /** Integrity hash (SRI format, e.g., sha512-...). */
  integrity?: string;

  /** SHA-1 hash (legacy). */
  shasum: string;

  /** Tarball download URL. */
  tarball: string;

  /** Number of files in the tarball. */
  fileCount?: number;

  /** Unpacked size in bytes. */
  unpackedSize?: number;

  /** npm signatures. */
  signatures?: Array<{
    keyid: string;
    sig: string;
  }>;

  /** Attestations URL. */
  attestations?: {
    url: string;
    provenance: {
      predicateType: string;
    };
  };
}

/** npm user object. */
export interface NpmUser {
  name?: string;
  username?: string;
  email?: string;
  url?: string;
}

/** Download count response from npm API. */
export interface NpmDownloads {
  /** Total downloads in the period. */
  downloads: number;

  /** Start date of the period. */
  start: string;

  /** End date of the period. */
  end: string;

  /** Package name. */
  package: string;
}

/** Extract the npm username from an NpmUser. */
export function getNpmUsername(user: NpmUser): string {
  return user.username ?? user.name ?? 'unknown';
}
