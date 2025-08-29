import type { Route } from './+types/index';
import { requireAuth } from '~/lib/session';
import { getUserTeams, createTeam, canUserCreateTeam } from '~/models/team.server';
import crypto from 'crypto';

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireAuth(request);
  
  const teams = await getUserTeams(user.id);
  
  return { teams };
}

export async function action({ request }: Route.ActionArgs) {
  const { user, isProUser } = await requireAuth(request);
  
  if (request.method === 'POST') {
    // Check if user is Pro (required for team creation)
    if (!isProUser) {
      return {
        success: false,
        error: 'Team creation requires a Pro subscription',
        fieldErrors: {}
      };
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;

    // Validation
    const fieldErrors: Record<string, string> = {};
    
    if (!name?.trim()) {
      fieldErrors.name = 'Team name is required';
    } else if (name.trim().length < 2) {
      fieldErrors.name = 'Team name must be at least 2 characters';
    } else if (name.trim().length > 50) {
      fieldErrors.name = 'Team name must be less than 50 characters';
    }

    if (!slug?.trim()) {
      fieldErrors.slug = 'Team URL slug is required';
    } else if (!/^[a-z0-9-]+$/.test(slug.trim())) {
      fieldErrors.slug = 'Team URL can only contain lowercase letters, numbers, and hyphens';
    } else if (slug.trim().length < 3) {
      fieldErrors.slug = 'Team URL must be at least 3 characters';
    } else if (slug.trim().length > 30) {
      fieldErrors.slug = 'Team URL must be less than 30 characters';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        error: 'Please fix the errors below',
        fieldErrors
      };
    }

    try {
      const team = await createTeam({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        ownerId: user.id
      });

      return {
        success: true,
        team: {
          id: team.id,
          name: team.name,
          slug: team.slug
        }
      };
      
    } catch (error: any) {
      // Handle unique constraint violation (duplicate slug)
      if (error.code === 'P2002') {
        return {
          success: false,
          error: 'Team URL already exists. Please choose a different one.',
          fieldErrors: { slug: 'This team URL is already taken' }
        };
      }

      console.error('Error creating team:', error);
      return {
        success: false,
        error: 'Failed to create team. Please try again.',
        fieldErrors: {}
      };
    }
  }
  
  throw new Response('Method not allowed', { status: 405 });
}