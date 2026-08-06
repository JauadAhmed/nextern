export const ROLE_DASHBOARDS = {
  student: '/student/dashboard',
  alumni: '/student/mentorship/dashboard',
  employer: '/employer/dashboard',
  advisor: '/advisor/dashboard',
  dept_head: '/dept/dashboard',
  admin: '/admin/dashboard',
} as const;

export type UserRole = keyof typeof ROLE_DASHBOARDS;
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

type RoutedUser = {
  role?: UserRole;
  verificationStatus?: VerificationStatus;
  mustChangePassword?: boolean;
};

const PENDING_APPROVAL_ROLES: UserRole[] = ['employer'];
const AUTH_ONLY_ROUTES = ['/login', '/register', '/verify-email', '/forgot-password'];
const ROLE_ROUTE_PREFIXES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: '/student', roles: ['student', 'alumni'] },
  { prefix: '/employer', roles: ['employer'] },
  { prefix: '/advisor', roles: ['advisor', 'dept_head'] },
  { prefix: '/dept', roles: ['dept_head'] },
  { prefix: '/admin', roles: ['admin'] },
];

export function getDashboardForRole(role?: UserRole) {
  return role ? ROLE_DASHBOARDS[role] : '/';
}

export function requiresAdminApproval(role?: UserRole) {
  return !!role && PENDING_APPROVAL_ROLES.includes(role);
}

export function roleSatisfiesRequirement(actualRole: UserRole | undefined, requiredRole: UserRole) {
  if (!actualRole) return false;
  if (requiredRole === 'advisor') {
    return actualRole === 'advisor' || actualRole === 'dept_head';
  }
  if (requiredRole === 'student') {
    return actualRole === 'student' || actualRole === 'alumni';
  }

  return actualRole === requiredRole;
}

export function getDefaultAuthenticatedRoute(user: RoutedUser) {
  if (user.mustChangePassword) {
    return '/setup-password';
  }

  if (!user.role) return '/';
  if (requiresAdminApproval(user.role) && user.verificationStatus !== 'approved') {
    return '/pending-approval';
  }

  return getDashboardForRole(user.role);
}

function isSafeInternalPath(path?: string | null) {
  return !!path && path.startsWith('/') && !path.startsWith('//');
}

function isAuthOnlyRoute(path: string) {
  return AUTH_ONLY_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

function canAccessCallbackPath(role: UserRole | undefined, path: string) {
  const matchedRoute = ROLE_ROUTE_PREFIXES.find(
    ({ prefix }) => path === prefix || path.startsWith(`${prefix}/`)
  );

  if (!matchedRoute) {
    return true;
  }

  return (
    !!role &&
    matchedRoute.roles.some((requiredRole) => roleSatisfiesRequirement(role, requiredRole))
  );
}

export function getPostLoginRedirect(user: RoutedUser, callbackUrl?: string | null) {
  const defaultRoute = getDefaultAuthenticatedRoute(user);
  const safeCallbackUrl = isSafeInternalPath(callbackUrl) ? callbackUrl : null;

  if (defaultRoute === '/pending-approval' || defaultRoute === '/setup-password') {
    return defaultRoute;
  }

  if (
    safeCallbackUrl &&
    !isAuthOnlyRoute(safeCallbackUrl) &&
    canAccessCallbackPath(user.role, safeCallbackUrl)
  ) {
    return safeCallbackUrl;
  }

  return defaultRoute;
}
