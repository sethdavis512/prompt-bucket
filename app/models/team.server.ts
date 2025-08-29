import { prisma } from '~/lib/prisma';
import type { Team, TeamMember, TeamInvitation, TeamRole } from '@prisma/client';

// Team creation and management

export function getUserTeams(userId: string) {
  return prisma.team.findMany({
    where: {
      members: {
        some: { userId }
      }
    },
    include: {
      members: {
        include: { 
          user: { 
            select: { 
              id: true,
              name: true, 
              email: true,
              subscriptionStatus: true 
            } 
          } 
        }
      },
      _count: {
        select: {
          prompts: true,
          categories: true,
          chains: true,
          members: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export function getTeamBySlug(slug: string) {
  return prisma.team.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              subscriptionStatus: true
            }
          }
        }
      },
      _count: {
        select: {
          prompts: true,
          categories: true,
          chains: true
        }
      }
    }
  });
}

export function getTeamById(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              subscriptionStatus: true
            }
          }
        }
      }
    }
  });
}

export async function createTeam(data: {
  name: string;
  slug: string;
  ownerId: string;
}) {
  const team = await prisma.team.create({
    data: {
      name: data.name,
      slug: data.slug,
      subscriptionStatus: 'free'
    }
  });

  // Add the creator as an admin member
  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: data.ownerId,
      role: 'ADMIN'
    }
  });

  return team;
}

export function updateTeam(teamId: string, data: {
  name?: string;
  slug?: string;
  subscriptionStatus?: string;
}) {
  return prisma.team.update({
    where: { id: teamId },
    data
  });
}

export function deleteTeam(teamId: string) {
  return prisma.team.delete({
    where: { id: teamId }
  });
}

// Team membership management

export function getTeamMember(teamId: string, userId: string) {
  return prisma.teamMember.findFirst({
    where: { teamId, userId },
    include: {
      team: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          subscriptionStatus: true
        }
      }
    }
  });
}

export function addTeamMember(data: {
  teamId: string;
  userId: string;
  role: TeamRole;
}) {
  return prisma.teamMember.create({
    data
  });
}

export function updateTeamMemberRole(teamId: string, userId: string, role: TeamRole) {
  return prisma.teamMember.update({
    where: {
      teamId_userId: { teamId, userId }
    },
    data: { role }
  });
}

export function removeTeamMember(teamId: string, userId: string) {
  return prisma.teamMember.delete({
    where: {
      teamId_userId: { teamId, userId }
    }
  });
}

// Team content queries

export function getTeamPrompts(teamId: string, userId: string) {
  return prisma.prompt.findMany({
    where: {
      teamId,
      team: {
        members: {
          some: { userId } // Ensure user is team member
        }
      }
    },
    include: {
      categories: { include: { category: true } },
      user: { select: { name: true, email: true } }, // Show creator
      team: { select: { name: true, slug: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

export function getTeamCategories(teamId: string, userId: string) {
  return prisma.category.findMany({
    where: {
      teamId,
      team: {
        members: {
          some: { userId }
        }
      }
    },
    include: {
      user: { select: { name: true, email: true } },
      team: { select: { name: true, slug: true } },
      _count: {
        select: { prompts: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export function getTeamChains(teamId: string, userId: string) {
  return prisma.chain.findMany({
    where: {
      teamId,
      team: {
        members: {
          some: { userId }
        }
      }
    },
    include: {
      user: { select: { name: true, email: true } },
      team: { select: { name: true, slug: true } },
      prompts: {
        include: {
          prompt: {
            select: {
              id: true,
              title: true,
              description: true
            }
          }
        },
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

// Combined personal + team content queries

export function getUserAndTeamPrompts(userId: string, teamId?: string) {
  return prisma.prompt.findMany({
    where: {
      OR: [
        { userId, teamId: null },     // Personal prompts
        ...(teamId ? [{
          teamId,
          team: {
            members: {
              some: { userId }
            }
          }
        }] : [])
      ]
    },
    include: {
      categories: { include: { category: true } },
      user: { select: { name: true, email: true } },
      team: { select: { name: true, slug: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

export function getUserAndTeamCategories(userId: string, teamId?: string) {
  return prisma.category.findMany({
    where: {
      OR: [
        { userId, teamId: null },     // Personal categories
        ...(teamId ? [{
          teamId,
          team: {
            members: {
              some: { userId }
            }
          }
        }] : [])
      ]
    },
    include: {
      user: { select: { name: true, email: true } },
      team: { select: { name: true, slug: true } },
      _count: {
        select: { prompts: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export function getUserAndTeamChains(userId: string, teamId?: string) {
  return prisma.chain.findMany({
    where: {
      OR: [
        { userId, teamId: null },     // Personal chains
        ...(teamId ? [{
          teamId,
          team: {
            members: {
              some: { userId }
            }
          }
        }] : [])
      ]
    },
    include: {
      user: { select: { name: true, email: true } },
      team: { select: { name: true, slug: true } },
      prompts: {
        include: {
          prompt: {
            select: {
              id: true,
              title: true,
              description: true
            }
          }
        },
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

// Team invitations

export function createTeamInvitation(data: {
  teamId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  token: string;
  expiresAt: Date;
}) {
  return prisma.teamInvitation.create({
    data
  });
}

export function getTeamInvitations(teamId: string) {
  return prisma.teamInvitation.findMany({
    where: {
      teamId,
      acceptedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: {
      inviter: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export function getInvitationByToken(token: string) {
  return prisma.teamInvitation.findUnique({
    where: { token },
    include: {
      team: true,
      inviter: {
        select: { name: true, email: true }
      }
    }
  });
}

export function acceptInvitation(token: string) {
  return prisma.teamInvitation.update({
    where: { token },
    data: { acceptedAt: new Date() }
  });
}

export function cancelInvitation(invitationId: string) {
  return prisma.teamInvitation.delete({
    where: { id: invitationId }
  });
}

// Validation helpers

export async function canUserCreateTeam(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true }
  });
  
  return user?.subscriptionStatus === 'active';
}

export async function canUserAccessTeam(userId: string, teamId: string): Promise<boolean> {
  const membership = await prisma.teamMember.findFirst({
    where: { userId, teamId }
  });
  
  return !!membership;
}

export async function isTeamAdmin(userId: string, teamId: string): Promise<boolean> {
  const membership = await prisma.teamMember.findFirst({
    where: { userId, teamId, role: 'ADMIN' }
  });
  
  return !!membership;
}

export async function getTeamMemberRole(userId: string, teamId: string): Promise<TeamRole | null> {
  const membership = await prisma.teamMember.findFirst({
    where: { userId, teamId },
    select: { role: true }
  });
  
  return membership?.role || null;
}

// Team limits and feature gating

export async function getTeamMemberCount(teamId: string): Promise<number> {
  return prisma.teamMember.count({
    where: { teamId }
  });
}

export async function getTeamPromptCount(teamId: string): Promise<number> {
  return prisma.prompt.count({
    where: { teamId }
  });
}

export async function canTeamAddMember(teamId: string): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { subscriptionStatus: true }
  });
  
  if (team?.subscriptionStatus === 'active') {
    return true; // Pro teams have unlimited members
  }
  
  // Free teams limited to 3 members
  const memberCount = await getTeamMemberCount(teamId);
  return memberCount < 3;
}

export async function canTeamCreatePrompt(teamId: string): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { subscriptionStatus: true }
  });
  
  if (team?.subscriptionStatus === 'active') {
    return true; // Pro teams have unlimited prompts
  }
  
  // Free teams limited to 10 prompts
  const promptCount = await getTeamPromptCount(teamId);
  return promptCount < 10;
}