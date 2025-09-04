import { Link } from 'react-router';
import { Lock, Home } from 'lucide-react';

export default function AccessDenied() {
    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center">
                        <Lock className="h-12 w-12 text-red-600" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-zinc-900">
                        Access Denied
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600">
                        This prompt is private and cannot be accessed publicly.
                    </p>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-zinc-900 mb-4">
                        What does this mean?
                    </h3>
                    <p className="text-zinc-700 mb-4">
                        The prompt you're trying to access has been marked as
                        private by its creator. Only the owner can view private
                        prompts.
                    </p>
                    <p className="text-zinc-700 mb-6">
                        If you believe this is an error, please contact the
                        prompt owner directly.
                    </p>

                    <div className="flex justify-center">
                        <Link
                            to="/"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Go to Home Page
                        </Link>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-sm text-zinc-500">
                        Want to create your own prompt library?{' '}
                        <Link
                            to="/"
                            className="text-primary-600 hover:text-primary-500"
                        >
                            Get started here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
