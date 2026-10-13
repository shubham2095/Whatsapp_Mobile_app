// Mirrors the web app's access rules (frontend/lib/nav.ts + components/PlanGate.tsx).

export function can(user, permission) {
  if (!user) return false;
  return (user.permissions ?? []).includes(permission);
}

// Plan features: null/undefined list = no gating (everything available).
export function hasFeature(user, feature) {
  if (!user || user.plan_features == null) return true;
  return user.plan_features.includes(feature);
}

// A limit is only "blocked" when the plan explicitly sets it to 0.
export function planAllows(user, key) {
  const limits = user?.plan_limits;
  if (!limits) return true;
  return limits[key] !== 0;
}

export function hasActivePlan(user) {
  if (!user) return false;
  if (user.is_super_admin) return true;
  const status = user.subscription?.status;
  return status === 'active' || status === 'trialing';
}

export function isPlanExpired(user) {
  return !!user && !hasActivePlan(user) && user.subscription?.status === 'expired';
}

const ROLE_LABELS = {
  'super-admin': 'Super Admin',
  'tenant-owner': 'Admin',
  manager: 'Admin',
  agent: 'Agent',
  user: 'Agent',
};

export function roleLabel(role) {
  return ROLE_LABELS[role] ?? role;
}
