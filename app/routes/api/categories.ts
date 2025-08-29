import { data } from 'react-router';
import { getCategoryByUserIdAndName, createCategory, getCategoryByIdForAPI, deleteCategory } from '~/models/category.server';
import { auth } from '~/lib/auth';
import type { Route } from './+types/categories';

export async function action({ request }: Route.ActionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        throw new Response('Unauthorized', { status: 401 });
    }

    // Handle both JSON and form data
    let intent: 'create' | 'delete';
    let _data: {
        id?: string;
        name?: string;
        description?: string;
        color?: string;
    };

    const contentType = request.headers.get('Content-Type');
    if (contentType?.includes('application/json')) {
        const body = await request.json();
        intent = body.intent;
        _data = body;
    } else {
        const formData = await request.formData();
        intent = formData.get('intent') as 'create' | 'delete';
        _data = {
            id: formData.get('id') as string,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            color: formData.get('color') as string
        };
    }

    try {
        switch (intent) {
            case 'create': {
                if (!data.name?.trim()) {
                    return new Response(
                        JSON.stringify({ error: 'Category name is required' }),
                        {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }

                // Check if category already exists for this user
                const existing = await prisma.category.findUnique({
                    where: {
                        name_userId: {
                            name: data.name.trim(),
                            userId: session.user.id
                        }
                    }
                });

                if (existing) {
                    return new Response(
                        JSON.stringify({ error: 'Category already exists' }),
                        {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }

                const category = await prisma.category.create({
                    data: {
                        name: _data.name?.trim() || '',
                        description: _data.description?.trim() || null,
                        color: _data.color || '#6B7280',
                        userId: session.user.id
                    }
                });

                return data({ category });
            }

            case 'delete': {
                if (!_data.id) {
                    return new Response(
                        JSON.stringify({ error: 'Category ID is required' }),
                        {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }

                // Verify the category belongs to the user
                const category = await prisma.category.findUnique({
                    where: { id: _data.id },
                    include: { _count: { select: { prompts: true } } }
                });

                if (!category || category.userId !== session.user.id) {
                    return new Response(
                        JSON.stringify({
                            error: 'Category not found or unauthorized'
                        }),
                        {
                            status: 404,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }

                // Check if category is in use
                if (category._count.prompts > 0) {
                    return new Response(
                        JSON.stringify({
                            error: 'Cannot delete category that is in use by prompts'
                        }),
                        {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }

                await prisma.category.delete({
                    where: { id: _data.id }
                });

                return data({ success: true });
            }

            default:
                return new Response(
                    JSON.stringify({ error: 'Invalid intent' }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
        }
    } catch (error) {
        console.error('Categories API error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
