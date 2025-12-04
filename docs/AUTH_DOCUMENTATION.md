# Authentication Setup Documentation

## Overview

Your SwiftTasks app now has complete authentication with:

- Microsoft OAuth login
- Email/password authentication
- Protected routes with middleware
- Session management
- Loading states to prevent errors

## How It Works

### 1. **Middleware** (`src/middleware.ts`)

- Runs on every request BEFORE pages load
- Checks if user has a valid session token
- Redirects unauthenticated users to `/signup`
- Allows access to public routes: `/signin`, `/signup`, `/api/*`, static files

### 2. **Auth Provider** (`src/components/auth-provider.tsx`)

- Wraps your entire app in `layout.tsx`
- Provides authentication state to all components
- Uses `useSession()` from better-auth to track logged-in user

### 3. **Protected Route Component** (`src/components/protected-route.tsx`)

- Shows loading spinner while checking authentication
- Prevents flash of unauthenticated content
- Redirects to signup if not logged in
- Only renders children when authenticated

## How to Use

### Access User Data Anywhere

```tsx
"use client";
import { useAuth } from "@/components/auth-provider";

export default function MyComponent() {
  const { user, session, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Hello, {user?.name}!</p>
      <p>Email: {user?.email}</p>
    </div>
  );
}
```

### Protect a Page

```tsx
"use client";
import { ProtectedRoute } from "@/components/protected-route";

export default function MyPage() {
  return (
    <ProtectedRoute>
      {/* Your protected content here */}
      <div>Only authenticated users see this</div>
    </ProtectedRoute>
  );
}
```

### Sign Out

```tsx
"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/signin");
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

## Routes

### Public Routes (No Auth Required)

- `/signin` - Sign in page
- `/signup` - Sign up page
- `/api/*` - All API routes
- Static files (images, etc.)

### Protected Routes (Auth Required)

- `/dashboard` - Main dashboard
- `/settings` - User settings
- `/tasks/*` - Task management
- Any other routes not listed as public

## User Object Structure

```typescript
{
  id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified: boolean;
}
```

## Session Flow

1. **User visits protected route** → Middleware checks session
2. **No session?** → Redirect to `/signup`
3. **Has session?** → Validate with API
4. **Valid session?** → Allow access, load page
5. **Invalid session?** → Redirect to `/signup`

## Loading States

The system prevents errors by:

1. **Middleware** validates session server-side first
2. **ProtectedRoute** shows loading spinner while checking auth
3. **useAuth** hook provides `isLoading` state
4. Only renders content after auth is confirmed


## Environment Variables Required

```env
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
DB_FILE=file:sqlite.db
```

## Common Patterns

### Conditional Rendering Based on Auth

```tsx
const { user } = useAuth();

return <div>{user ? <p>Welcome, {user.name}!</p> : <p>Please sign in</p>}</div>;
```

### Loading State

```tsx
const { isLoading } = useAuth();

if (isLoading) {
  return <LoadingSpinner />;
}
```

### Check Email Verification

```tsx
const { user } = useAuth();

if (!user?.emailVerified) {
  return <VerifyEmailBanner />;
}
```


*AI Generated for simplicity - all documentation*