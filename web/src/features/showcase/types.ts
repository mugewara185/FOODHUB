export type VerificationStatus =
  | 'Verified E2E'
  | 'Integration Verified'
  | 'Unit / Contract Tested'
  | 'Framework Architecture'
  | 'Client Observability'
  | 'Deterministic Simulation'
  | 'Dual Transport (Mock / API)'
  | 'Architectural Prototype'
  | 'Deferred Hardening';

export const GITHUB_REPO_BASE = 'https://github.com/mugewara185/FOODHUB/blob/dev/development';

export const getGitHubFileUrl = (filePath: string, lineRange?: string): string => {
  const base = `${GITHUB_REPO_BASE}/${filePath}`;
  return lineRange ? `${base}#${lineRange}` : base;
};

export interface DomainFeature {
  id: string;
  name: string;
  summary: string;
  technicalDetails: string;
  sourceFile: string;
  sourceLineRange?: string;
  status: VerificationStatus;
  keyConcepts: string[];
  routePath?: string;
}

export interface DomainShowcase {
  id: 'customer' | 'owner' | 'partner' | 'admin' | 'dev';
  title: string;
  roleBadge: string;
  tagline: string;
  description: string;
  status: VerificationStatus;
  primaryRoute: string;
  accentColor: string;
  gradient: string;
  keyActors: string[];
  features: DomainFeature[];
  realtimeEvents: string[];
}

export interface EngineeringTradeoff {
  id: string;
  title: string;
  problem: string;
  solution: string;
  impact: string;
  tradeoffConsideration: string;
  sourceFiles: string[];
  sourceLineRanges?: Record<string, string>;
  status: VerificationStatus;
}

export interface ArchitectureNode {
  id: string;
  label: string;
  subtitle: string;
  type: 'actor' | 'service' | 'transport' | 'database';
  color: string;
  portsOrChannels: string[];
}
