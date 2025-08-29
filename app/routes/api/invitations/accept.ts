import type { Route } from './+types/accept';
import { requireAuth } from '~/lib/session';
import { 
  getInvitationByToken,
  acceptInvitation,
  addTeamMember,
  canTeamAddMember
} from '~/models/team.server';
import { redirect } from 'react-router';

export async function loader({ params }: Route.LoaderArgs) {
  const token = params.token as string;
  
  if (!token) {
    throw new Response('Invalid invitation token', { status: 400 });
  }
  
  const invitation = await getInvitationByToken(token);
  
  if (!invitation) {
    return {
      error: 'Invitation not found or has expired',
      invitation: null
    };
  }
  
  // Check if invitation has expired
  if (new Date() > invitation.expiresAt) {
    return {
      error: 'This invitation has expired',
      invitation: null
    };
  }
  
  // Check if invitation has already been accepted
  if (invitation.acceptedAt) {
    return {
      error: 'This invitation has already been accepted',
      invitation: null
    };
  }
  
  return {
    error: null,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      team: {
        name: invitation.team.name,
        slug: invitation.team.slug
      },
      inviter: invitation.inviter
    }
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requireAuth(request);
  const token = params.token as string;
  
  if (!token) {
    throw new Response('Invalid invitation token', { status: 400 });
  }
  
  if (request.method === 'POST') {
    try {
      const invitation = await getInvitationByToken(token);
      
      if (!invitation) {
        return {
          success: false,
          error: 'Invitation not found or has expired'
        };
      }
      
      // Check if invitation has expired
      if (new Date() > invitation.expiresAt) {
        return {
          success: false,
          error: 'This invitation has expired'
        };
      }
      
      // Check if invitation has already been accepted
      if (invitation.acceptedAt) {
        return {
          success: false,
          error: 'This invitation has already been accepted'
        };
      }
      
      // Check if the invitation email matches the current user's email
      if (invitation.email !== user.email) {
        return {
          success: false,
          error: 'This invitation was sent to a different email address'
        };
      }
      
      // Check if team can still add members
      const canAddMember = await canTeamAddMember(invitation.teamId);
      if (!canAddMember) {
        return {
          success: false,
          error: 'Team has reached the maximum number of members'
        };
      }
      
      // Add user to team
      await addTeamMember({
        teamId: invitation.teamId,
        userId: user.id,
        role: invitation.role
      });
      
      // Mark invitation as accepted
      await acceptInvitation(token);
      
      // Redirect to team dashboard
      throw redirect(`/teams/${invitation.team.slug}/dashboard`);
      
    } catch (error: any) {
      if (error instanceof Response) {
        throw error;
      }
      
      console.error('Error accepting invitation:', error);
      return {
        success: false,
        error: 'Failed to accept invitation. Please try again.'
      };
    }
  }
  
  throw new Response('Method not allowed', { status: 405 });
}