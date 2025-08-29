# Error Handling Approach

## Overview

Comprehensive error handling strategy for Prompt Bucket, covering both server-side and client-side error management with consistent UI patterns. Based on React Router v7 architecture and Brooks Rules conventions.

## Server-Side Error Handling

### Route Error Boundaries (Brooks Rule Compliance)

Following Brooks Rule: "Only setup `ErrorBoundary`s for routes if the users explicitly asks. All errors bubble up to the `ErrorBoundary` in `root.tsx` by default."

```typescript
// app/root.tsx - Global error boundary (already exists)
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  console.error("Application Error:", error);
  
  if (isRouteErrorResponse(error)) {
    return (
      <html>
        <body>
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="text-red-500 w-8 h-8 mr-3" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {error.status} {error.statusText}
                  </h1>
                  <p className="text-gray-600">{error.data}</p>
                </div>
              </div>
              <Link 
                to="/" 
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Go Home
              </Link>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-amber-500 w-8 h-8 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Oops! Something went wrong</h1>
                <p className="text-gray-600">We're working to fix this issue.</p>
              </div>
            </div>
            <Link 
              to="/" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Go Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
```

### Loader Error Patterns

```typescript
// app/routes/prompts/$id.tsx - Throwing errors from loaders (Brooks Rule)
import type { Route } from "./+types/prompt-detail";
import { data } from "react-router";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { user } = await requireAuth(request);
  
  try {
    const prompt = await prisma.prompt.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: user.id },           // User owns it
          { public: true },              // Or it's public
          { teamId: { in: userTeamIds }} // Or shared via team
        ]
      },
      include: {
        categories: { include: { category: true } },
        user: { select: { name: true, email: true } },
        team: { select: { name: true, slug: true } }
      }
    });

    if (!prompt) {
      throw data("Prompt not found or access denied", { status: 404 });
    }

    return { prompt, user };
  } catch (error) {
    console.error("Error loading prompt:", error);
    
    if (error instanceof Response) throw error; // Re-throw Response errors
    
    // Database/unexpected errors
    throw data("Unable to load prompt. Please try again.", { status: 500 });
  }
}
```

### Action Error Patterns

```typescript
// app/routes/prompts/new.tsx - Action error handling
export async function action({ request }: Route.ActionArgs) {
  const { user, isProUser } = await requireAuth(request);
  
  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    
    // Validation
    if (!title?.trim()) {
      return {
        success: false,
        error: "Title is required",
        fieldErrors: { title: "Please enter a title" }
      };
    }
    
    // Feature gating
    if (!isProUser) {
      const promptCount = await getUserPromptCount(user.id);
      if (promptCount >= 5) {
        return {
          success: false,
          error: "Upgrade to Pro to create unlimited prompts",
          upgradeRequired: true
        };
      }
    }
    
    const prompt = await createPrompt({
      title: title.trim(),
      description: description?.trim(),
      userId: user.id,
      teamId: formData.get("teamId") as string || null
    });
    
    return redirect(href("/prompts/:id", { id: prompt.id }));
    
  } catch (error) {
    console.error("Error creating prompt:", error);
    
    // Prisma constraint violations
    if (error.code === 'P2002') {
      return {
        success: false,
        error: "A prompt with this title already exists"
      };
    }
    
    return {
      success: false,
      error: "Unable to create prompt. Please try again."
    };
  }
}
```

### API Route Error Patterns

```typescript
// app/routes/api/score-prompt.ts - API error responses
export async function action({ request }: Route.ActionArgs) {
  try {
    const { user, isProUser } = await requireAuth(request);
    
    if (!isProUser) {
      return Response.json(
        { error: "AI scoring requires a Pro subscription" },
        { status: 403 }
      );
    }
    
    const { promptId, content } = await request.json();
    
    if (!promptId || !content) {
      return Response.json(
        { error: "Missing required fields: promptId, content" },
        { status: 400 }
      );
    }
    
    const scores = await scorePromptWithAI(content);
    
    return Response.json({ success: true, scores });
    
  } catch (error) {
    console.error("Error scoring prompt:", error);
    
    if (error.message.includes('rate limit')) {
      return Response.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }
    
    if (error.message.includes('OpenAI')) {
      return Response.json(
        { error: "AI service temporarily unavailable" },
        { status: 503 }
      );
    }
    
    return Response.json(
      { error: "Unable to score prompt. Please try again." },
      { status: 500 }
    );
  }
}
```

## Client-Side Error Handling

### Form Error Display Component

```typescript
// app/components/FormError.tsx - Reusable error display
interface FormErrorProps {
  error?: string;
  fieldErrors?: Record<string, string>;
  upgradeRequired?: boolean;
}

export function FormError({ error, fieldErrors, upgradeRequired }: FormErrorProps) {
  if (!error && !fieldErrors) return null;
  
  return (
    <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-6">
      <div className="flex">
        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <div className="ml-3">
          {error && (
            <div className="text-sm text-red-800 font-medium mb-2">
              {error}
              {upgradeRequired && (
                <Link 
                  to="/pricing" 
                  className="ml-2 text-red-600 underline hover:text-red-800"
                >
                  Upgrade Now
                </Link>
              )}
            </div>
          )}
          
          {fieldErrors && Object.keys(fieldErrors).length > 0 && (
            <ul className="text-sm text-red-700 space-y-1">
              {Object.entries(fieldErrors).map(([field, message]) => (
                <li key={field}>• {message}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Form Component with Error Handling

```typescript
// app/routes/prompts/new.tsx - Component with form errors
import type { Route } from "./+types/new";

export default function NewPrompt({ actionData }: Route.ComponentProps) {
  const { user, teams } = useOutletContext<AuthLayoutData>();
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Prompt</h1>
      
      <Form method="post" className="space-y-6">
        <FormError 
          error={actionData?.error}
          fieldErrors={actionData?.fieldErrors}
          upgradeRequired={actionData?.upgradeRequired}
        />
        
        <TextField
          name="title"
          label="Title"
          required
          error={actionData?.fieldErrors?.title}
          autoFocus
        />
        
        <TextArea
          name="description"
          label="Description"
          rows={3}
          error={actionData?.fieldErrors?.description}
        />
        
        {/* Team selection for Pro users */}
        {teams?.length > 0 && (
          <div>
            <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 mb-1">
              Workspace
            </label>
            <select
              name="teamId"
              id="teamId"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Personal</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <Link 
            to="/prompts" 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Prompt
          </button>
        </div>
      </Form>
    </div>
  );
}
```

### Fetcher Error Handling

```typescript
// app/hooks/usePromptScoring.ts - Client-side API error handling
export function usePromptScoring() {
  const fetcher = useFetcher();
  const [scores, setScores] = useState<PromptScores | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scorePrompt = useCallback(async (promptId: string, content: string) => {
    setError(null);
    
    fetcher.submit(
      { promptId, content },
      {
        method: "post",
        action: "/api/score-prompt",
        encType: "application/json"
      }
    );
  }, [fetcher]);

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        setScores(fetcher.data.scores);
        setError(null);
      } else {
        setError(fetcher.data.error || "Failed to score prompt");
        setScores(null);
      }
    }
  }, [fetcher.data]);

  // Handle network/unexpected errors
  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data && fetcher.formData) {
      setError("Network error. Please check your connection and try again.");
    }
  }, [fetcher.state, fetcher.data, fetcher.formData]);

  return {
    scores,
    error,
    isLoading: fetcher.state !== "idle",
    scorePrompt
  };
}
```

### Toast Notification System

```typescript
// app/components/Toast.tsx - Error/success notifications
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onDismiss: () => void;
}

export function Toast({ type, title, message, onDismiss }: ToastProps) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  };
  
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  
  const Icon = icons[type];
  
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  return (
    <div className={`rounded-md border p-4 ${colors[type]} shadow-md`}>
      <div className="flex">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{title}</p>
          {message && <p className="text-sm mt-1">{message}</p>}
        </div>
        <button
          onClick={onDismiss}
          className="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// app/components/ToastProvider.tsx - Global toast context
interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'onDismiss'>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const showToast = useCallback((toast: Omit<ToastProps, 'onDismiss'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id, onDismiss: () => removeToast(id) }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
```

## Error Monitoring & Logging

### Server Error Logging

```typescript
// app/lib/logger.ts - Structured error logging
interface ErrorLogData {
  error: Error;
  context?: Record<string, any>;
  userId?: string;
  request?: {
    method: string;
    url: string;
    userAgent?: string;
  };
}

export function logError({ error, context, userId, request }: ErrorLogData) {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: error.message,
    stack: error.stack,
    userId,
    context,
    request
  };
  
  // Console for development
  if (process.env.NODE_ENV === 'development') {
    console.error('Application Error:', logData);
  }
  
  // TODO: Send to external logging service (Sentry, LogRocket, etc.)
  // await sendToLoggingService(logData);
}

// Usage in loaders/actions
export async function loader({ request }: Route.LoaderArgs) {
  try {
    // ... loader logic
  } catch (error) {
    logError({
      error,
      context: { loader: 'prompt-detail' },
      request: {
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent')
      }
    });
    throw data("Unable to load prompt", { status: 500 });
  }
}
```

### Client Error Boundary

```typescript
// app/components/ClientErrorBoundary.tsx - React error boundary for client-side errors
interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ClientErrorBoundary extends React.Component<
  Props,
  { hasError: boolean; error?: Error }
> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Client Error:', error, errorInfo);
    
    // TODO: Send to error monitoring service
    // sendErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return (
        <Fallback 
          error={this.state.error!} 
          resetError={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
      <div className="flex">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Something went wrong with this component
          </h3>
          <p className="text-sm text-red-700 mt-1">{error.message}</p>
          <button
            onClick={resetError}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
```

## UI Patterns & Best Practices

### Loading States

```typescript
// Consistent loading UI patterns
export function LoadingSpinner({ size = 'md', message }: { size?: 'sm' | 'md' | 'lg'; message?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };
  
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
}

// In components
function PromptList() {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  
  return (
    <div>
      {isLoading ? (
        <LoadingSpinner message="Loading prompts..." />
      ) : (
        <div>/* Prompt list */</div>
      )}
    </div>
  );
}
```

### Empty States

```typescript
// app/components/EmptyState.tsx
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      {action && (
        <div className="mt-6">
          <Link
            to={action.href}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            {action.label}
          </Link>
        </div>
      )}
    </div>
  );
}

// Usage
<EmptyState
  icon={FileText}
  title="No prompts yet"
  description="Get started by creating your first prompt template."
  action={{
    label: "Create Prompt",
    href: "/prompts/new"
  }}
/>
```

### Validation Error Patterns

```typescript
// app/lib/validation.ts - Centralized validation with Zod
import { z } from 'zod';

export const promptSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  taskContext: z.string().max(1000, "Task context too long").optional(),
  teamId: z.string().optional()
});

export function validatePromptData(data: unknown) {
  const result = promptSchema.safeParse(data);
  
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    result.error.issues.forEach(issue => {
      const field = issue.path[0] as string;
      fieldErrors[field] = issue.message;
    });
    
    return {
      success: false,
      fieldErrors,
      error: "Please fix the errors below"
    };
  }
  
  return { success: true, data: result.data };
}

// In actions
export async function action({ request }: Route.ActionArgs) {
  const formData = Object.fromEntries(await request.formData());
  const validation = validatePromptData(formData);
  
  if (!validation.success) {
    return validation; // Return validation errors to component
  }
  
  // Continue with validated data
  const prompt = await createPrompt(validation.data);
  return redirect(href("/prompts/:id", { id: prompt.id }));
}
```

## Implementation Checklist

### Phase 1: Core Error Infrastructure
- [ ] Update `root.tsx` ErrorBoundary with consistent UI
- [ ] Create `FormError` component for form validation display
- [ ] Implement `Toast` system for notifications
- [ ] Add `ClientErrorBoundary` for React errors
- [ ] Set up error logging utility

### Phase 2: Server Error Patterns
- [ ] Standardize loader error handling across routes
- [ ] Implement action validation with user-friendly errors  
- [ ] Add API route error responses with proper HTTP status codes
- [ ] Create authentication error patterns (`requireAuth`, `requireTeamAuth`)

### Phase 3: Client Error Patterns
- [ ] Update forms to display `actionData` errors consistently
- [ ] Implement fetcher error handling in hooks (`usePromptScoring`, `usePromptAPI`)
- [ ] Add loading states with `useNavigation` and `useFetcher`
- [ ] Create empty state components

### Phase 4: Advanced Error Handling
- [ ] Integrate external error monitoring (Sentry, LogRocket)
- [ ] Add retry mechanisms for failed API calls
- [ ] Implement offline detection and handling
- [ ] Add error analytics and reporting

## Success Metrics

- Reduced user-reported errors and confusion
- Improved error recovery rates (users successfully completing actions after errors)
- Decreased support tickets related to unclear error messages
- Faster debugging through structured error logging
- Consistent error experience across all application features