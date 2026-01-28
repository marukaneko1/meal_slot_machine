'use server';

import prisma from '@/lib/db';
import type { ProfileRules, SlotCategory } from '@/lib/types';
import { DEFAULT_PROFILE_RULES } from '@/lib/types';

export interface CustomerProfile {
  id: string;
  name: string;
  rulesJson: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Ensures the default profile exists
 */
export async function ensureDefaultProfile(): Promise<CustomerProfile> {
  const existing = await prisma.customerProfile.findFirst({
    where: { isDefault: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.customerProfile.create({
    data: {
      name: 'Standard Weekly',
      rulesJson: JSON.stringify(DEFAULT_PROFILE_RULES),
      isDefault: true,
    },
  });
}

/**
 * Gets all customer profiles
 */
export async function getProfiles(): Promise<CustomerProfile[]> {
  return prisma.customerProfile.findMany({
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });
}

/**
 * Gets a profile by ID
 */
export async function getProfileById(id: string): Promise<CustomerProfile | null> {
  return prisma.customerProfile.findUnique({
    where: { id },
  });
}

/**
 * Gets the default profile
 */
export async function getDefaultProfile(): Promise<CustomerProfile | null> {
  return prisma.customerProfile.findFirst({
    where: { isDefault: true },
  });
}

/**
 * Creates a new customer profile
 */
export async function createProfile(
  name: string,
  categories: SlotCategory[],
  description?: string
): Promise<CustomerProfile> {
  const rules: ProfileRules = {
    categories,
    name,
    description,
  };

  return prisma.customerProfile.create({
    data: {
      name,
      rulesJson: JSON.stringify(rules),
      isDefault: false,
    },
  });
}

/**
 * Updates a customer profile
 */
export async function updateProfile(
  id: string,
  data: {
    name?: string;
    categories?: SlotCategory[];
    description?: string;
  }
): Promise<CustomerProfile> {
  const existing = await prisma.customerProfile.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Profile not found');
  }

  const currentRules: ProfileRules = JSON.parse(existing.rulesJson);

  const newRules: ProfileRules = {
    categories: data.categories || currentRules.categories,
    name: data.name || currentRules.name,
    description: data.description !== undefined ? data.description : currentRules.description,
  };

  return prisma.customerProfile.update({
    where: { id },
    data: {
      name: data.name || existing.name,
      rulesJson: JSON.stringify(newRules),
    },
  });
}

/**
 * Deletes a profile (cannot delete default)
 */
export async function deleteProfile(id: string): Promise<void> {
  const profile = await prisma.customerProfile.findUnique({
    where: { id },
  });

  if (!profile) {
    throw new Error('Profile not found');
  }

  if (profile.isDefault) {
    throw new Error('Cannot delete the default profile');
  }

  await prisma.customerProfile.delete({ where: { id } });
}

/**
 * Sets a profile as the default (unsets current default)
 */
export async function setDefaultProfile(id: string): Promise<CustomerProfile> {
  return prisma.$transaction(async (tx) => {
    // Unset current default
    await tx.customerProfile.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    // Set new default
    return tx.customerProfile.update({
      where: { id },
      data: { isDefault: true },
    });
  });
}

