/**
 * Avatar Service Factory - Unified interface for avatar providers
 */

import type { AvatarProvider } from '@avatar-workshop/shared';
import type { IAvatarService } from './base.service.js';
import { didService } from './did.service.js';
import { heygenService } from './heygen.service.js';

const services: Record<AvatarProvider, IAvatarService | null> = {
  'd-id': didService,
  'heygen': heygenService,
  'synthesia': null, // Not implemented - expensive and no Q&A support yet
  'colossyan': null, // Not implemented - Q&A in early access
};

/**
 * Get the avatar service for a specific provider
 */
export function getAvatarService(provider: AvatarProvider): IAvatarService {
  const service = services[provider];
  if (!service) {
    throw new Error(`Avatar provider not supported: ${provider}. Supported: d-id, heygen`);
  }
  return service;
}

/**
 * Get all available avatar services
 */
export function getAvailableServices(): IAvatarService[] {
  return Object.values(services).filter((s): s is IAvatarService => s !== null);
}

/**
 * List avatars from all available providers
 */
export async function listAllAvatars() {
  const availableServices = getAvailableServices();
  const results = await Promise.allSettled(
    availableServices.map(service => service.listAvatars())
  );

  return results
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<IAvatarService['listAvatars']>>> =>
      r.status === 'fulfilled'
    )
    .flatMap(r => r.value);
}

export { didService } from './did.service.js';
export { heygenService } from './heygen.service.js';
export type { IAvatarService, InteractiveKnowledgeConfig } from './base.service.js';
