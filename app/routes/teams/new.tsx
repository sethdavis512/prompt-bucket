import type { Route } from './+types/new';
import { Form, Link, redirect } from 'react-router';
import { requireAuth } from '~/lib/session';
import { createTeam, canUserCreateTeam } from '~/models/team.server';
import { useOutletContext } from 'react-router';
import type { AuthenticatedUser } from '~/lib/session';

export async function loader({ request }: Route.LoaderArgs) {
  const { user, isProUser } = await requireAuth(request);
  
  // Check if user can create teams (Pro only)
  if (!isProUser) {
    return {
      user,
      canCreateTeam: false,
      error: 'Team creation requires a Pro subscription'
    };
  }

  const canCreate = await canUserCreateTeam(user.id);
  
  return {
    user,
    canCreateTeam: canCreate,
    error: null
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { user, isProUser } = await requireAuth(request);
  
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

    return redirect(`/teams/${team.slug}/dashboard`);
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

export default function NewTeam({ loaderData, actionData }: Route.ComponentProps) {
  const { user } = useOutletContext<{ user: AuthenticatedUser }>();
  
  if (!loaderData.canCreateTeam) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Team</h1>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Pro Subscription Required
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>Team creation is available for Pro subscribers only. Upgrade to Pro to create teams and collaborate with your colleagues.</p>
              </div>
              <div className="mt-4">
                <Link
                  to="/pricing"
                  data-cy="upgrade-link"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Team</h1>
      
      <Form method="post" className="space-y-6">
        {actionData?.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {actionData.error}
                </h3>
                {actionData.fieldErrors && Object.keys(actionData.fieldErrors).length > 0 && (
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {Object.entries(actionData.fieldErrors).map(([field, message]) => (
                      <li key={field}>{message}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Team Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="name"
              id="name"
              required
              autoFocus
              data-cy="team-name"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                actionData?.fieldErrors?.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Acme Corp Marketing"
            />
            {actionData?.fieldErrors?.name && (
              <p className="mt-1 text-sm text-red-600">{actionData.fieldErrors.name}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
            Team URL
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              /teams/
            </span>
            <input
              type="text"
              name="slug"
              id="slug"
              required
              data-cy="team-slug"
              className={`flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                actionData?.fieldErrors?.slug ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="acme-corp"
              pattern="[a-z0-9-]+"
              title="Lowercase letters, numbers, and hyphens only"
            />
          </div>
          {actionData?.fieldErrors?.slug && (
            <p className="mt-1 text-sm text-red-600">{actionData.fieldErrors.slug}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Choose a unique URL for your team. Use lowercase letters, numbers, and hyphens only.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                What happens next?
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>You'll be the team admin and can invite members</li>
                  <li>Team members can create and share prompts, chains, and categories</li>
                  <li>All team content is private by default</li>
                  <li>You can manage permissions and settings after creation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            to="/teams"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            data-cy="create-team-btn"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Team
          </button>
        </div>
      </Form>
    </div>
  );
}