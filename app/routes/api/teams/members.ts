import type { Route } from './+types/members';
import { requireAuth } from '~/lib/session';
import { 
  getTeamById,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  isTeamAdmin,
  canTeamAddMember
} from '~/models/team.server';
import type { TeamRole } from '@prisma/client';

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
  
  return { 
    members: team.members.map(member => ({
      id: member.id,
      role: member.role,
      user: member.user
    }))
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requireAuth(request);
  const teamId = params.id as string;
  
  if (!teamId) {
    throw new Response('Team ID is required', { status: 400 });
  }
  
  // Check if user is team admin (required for member management)
  const isAdmin = await isTeamAdmin(user.id, teamId);
  if (!isAdmin) {
    throw new Response('Only team admins can manage members', { status: 403 });
  }
  
  if (request.method === 'POST') {
    // Add new team member
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const role = formData.get('role') as TeamRole;
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        fieldErrors: { userId: 'User ID is required' }
      };
    }
    
    if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
      return {
        success: false,
        error: 'Invalid role',
        fieldErrors: { role: 'Role must be either ADMIN or MEMBER' }
      };
    }
    
    try {
      // Check if team can add more members
      const canAddMember = await canTeamAddMember(teamId);
      if (!canAddMember) {
        return {
          success: false,
          error: 'Team has reached the maximum number of members. Upgrade to Pro for unlimited members.',
          fieldErrors: {}
        };
      }
      
      const newMember = await addTeamMember({
        teamId,
        userId,
        role
      });
      
      return {
        success: true,
        member: newMember
      };
      
    } catch (error: any) {
      if (error.code === 'P2002') {
        return {
          success: false,
          error: 'User is already a team member',
          fieldErrors: { userId: 'This user is already on the team' }
        };
      }
      
      console.error('Error adding team member:', error);
      return {
        success: false,
        error: 'Failed to add team member. Please try again.',
        fieldErrors: {}
      };
    }
  }
  
  if (request.method === 'PUT' || request.method === 'PATCH') {
    // Update member role
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const role = formData.get('role') as TeamRole;
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required'
      };
    }
    
    if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
      return {
        success: false,
        error: 'Invalid role'
      };
    }
    
    // Prevent removing the last admin
    if (role === 'MEMBER') {
      const team = await getTeamById(teamId);
      const adminCount = team?.members.filter(m => m.role === 'ADMIN').length || 0;
      const isCurrentUserAdmin = team?.members.find(m => m.userId === userId)?.role === 'ADMIN';
      
      if (adminCount <= 1 && isCurrentUserAdmin) {
        return {
          success: false,
          error: 'Cannot remove the last team admin. Promote another member to admin first.'
        };
      }
    }
    
    try {
      await updateTeamMemberRole(teamId, userId, role);
      
      return {
        success: true,
        message: 'Member role updated successfully'
      };
      
    } catch (error: any) {
      console.error('Error updating member role:', error);
      return {
        success: false,
        error: 'Failed to update member role. Please try again.'
      };
    }
  }
  
  if (request.method === 'DELETE') {
    // Remove team member
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required'
      };
    }
    
    // Prevent removing the last admin
    const team = await getTeamById(teamId);
    const adminCount = team?.members.filter(m => m.role === 'ADMIN').length || 0;
    const isTargetUserAdmin = team?.members.find(m => m.userId === userId)?.role === 'ADMIN';
    
    if (adminCount <= 1 && isTargetUserAdmin) {
      return {
        success: false,
        error: 'Cannot remove the last team admin. Promote another member to admin first.'
      };
    }
    
    try {
      await removeTeamMember(teamId, userId);
      
      return {
        success: true,
        message: 'Member removed successfully'
      };
      
    } catch (error: any) {
      console.error('Error removing team member:', error);
      return {
        success: false,
        error: 'Failed to remove team member. Please try again.'
      };
    }
  }
  
  throw new Response('Method not allowed', { status: 405 });
}