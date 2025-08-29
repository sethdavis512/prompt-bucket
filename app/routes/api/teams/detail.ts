import type { Route } from './+types/detail';
import { requireAuth } from '~/lib/session';
import { getTeamById, updateTeam, deleteTeam, isTeamAdmin } from '~/models/team.server';

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requireAuth(request);
  const teamId = params.id as string;
  
  if (!teamId) {
    throw new Response('Team ID is required', { status: 400 });
  }
  
  const team = await getTeamById(teamId);
  
  if (!team) {
    throw new Response('Team not found', { status: 404 });
  }
  
  // Check if user is a team member
  const isMember = team.members.some(member => member.userId === user.id);
  if (!isMember) {
    throw new Response('Access denied', { status: 403 });
  }
  
  return { team };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requireAuth(request);
  const teamId = params.id as string;
  
  if (!teamId) {
    throw new Response('Team ID is required', { status: 400 });
  }
  
  // Check if user is team admin
  const isAdmin = await isTeamAdmin(user.id, teamId);
  if (!isAdmin) {
    throw new Response('Only team admins can modify team settings', { status: 403 });
  }
  
  if (request.method === 'PUT' || request.method === 'PATCH') {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const subscriptionStatus = formData.get('subscriptionStatus') as string;
    
    const updateData: any = {};
    
    if (name !== null) {
      if (!name?.trim()) {
        return {
          success: false,
          error: 'Team name is required',
          fieldErrors: { name: 'Team name is required' }
        };
      }
      updateData.name = name.trim();
    }
    
    if (subscriptionStatus !== null) {
      updateData.subscriptionStatus = subscriptionStatus;
    }
    
    try {
      const updatedTeam = await updateTeam(teamId, updateData);
      
      return {
        success: true,
        team: updatedTeam
      };
      
    } catch (error: any) {
      console.error('Error updating team:', error);
      return {
        success: false,
        error: 'Failed to update team. Please try again.',
        fieldErrors: {}
      };
    }
  }
  
  if (request.method === 'DELETE') {
    try {
      await deleteTeam(teamId);
      
      return {
        success: true,
        message: 'Team deleted successfully'
      };
      
    } catch (error: any) {
      console.error('Error deleting team:', error);
      return {
        success: false,
        error: 'Failed to delete team. Please try again.'
      };
    }
  }
  
  throw new Response('Method not allowed', { status: 405 });
}