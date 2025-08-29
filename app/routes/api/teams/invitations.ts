import type { Route } from './+types/invitations';
import { requireAuth } from '~/lib/session';
import { 
  createTeamInvitation, 
  getTeamInvitations,
  cancelInvitation,
  getTeamById,
  isTeamAdmin,
  canTeamAddMember
} from '~/models/team.server';
import { prisma } from '~/lib/prisma';
import crypto from 'crypto';

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requireAuth(request);
  const teamId = params.id as string;
  
  if (!teamId) {
    throw new Response('Team ID is required', { status: 400 });
  }
  
  // Check if user is team admin
  const isAdmin = await isTeamAdmin(user.id, teamId);
  if (!isAdmin) {
    throw new Response('Only team admins can view invitations', { status: 403 });
  }
  
  const invitations = await getTeamInvitations(teamId);
  
  return { invitations };
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
    throw new Response('Only team admins can manage invitations', { status: 403 });
  }
  
  if (request.method === 'POST') {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const role = formData.get('role') as 'ADMIN' | 'MEMBER';
    
    // Validation
    const errors: Record<string, string> = {};
    
    if (!email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Invalid email format';
    }
    
    if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
      errors.role = 'Invalid role selected';
    }
    
    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        error: 'Please fix the errors below',
        fieldErrors: errors
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
      
      // Check if user is already a team member
      const existingMember = await prisma.teamMember.findFirst({
        where: { 
          teamId,
          user: { email: email.trim().toLowerCase() }
        }
      });
      
      if (existingMember) {
        return {
          success: false,
          error: 'User is already a team member',
          fieldErrors: { email: 'This user is already on the team' }
        };
      }
      
      // Check if invitation already exists
      const existingInvitation = await prisma.teamInvitation.findFirst({
        where: {
          teamId,
          email: email.trim().toLowerCase(),
          acceptedAt: null,
          expiresAt: { gt: new Date() }
        }
      });
      
      if (existingInvitation) {
        return {
          success: false,
          error: 'Invitation already sent',
          fieldErrors: { email: 'An active invitation has already been sent to this email' }
        };
      }
      
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const invitation = await createTeamInvitation({
        teamId,
        email: email.trim().toLowerCase(),
        role,
        invitedBy: user.id,
        token,
        expiresAt
      });
      
      // TODO: Send invitation email here
      // For now, we'll just return success with the invitation link
      const invitationUrl = `${request.headers.get('origin')}/invitations/${token}`;
      
      return {
        success: true,
        message: 'Invitation sent successfully',
        invitationUrl // In production, this would be sent via email
      };
      
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      return {
        success: false,
        error: 'Failed to send invitation. Please try again.',
        fieldErrors: {}
      };
    }
  }
  
  if (request.method === 'DELETE') {
    const formData = await request.formData();
    const invitationId = formData.get('invitationId') as string;
    
    if (!invitationId) {
      throw new Response('Invitation ID is required', { status: 400 });
    }
    
    try {
      await cancelInvitation(invitationId);
      
      return {
        success: true,
        message: 'Invitation cancelled successfully'
      };
      
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      return {
        success: false,
        error: 'Failed to cancel invitation. Please try again.'
      };
    }
  }
  
  throw new Response('Method not allowed', { status: 405 });
}