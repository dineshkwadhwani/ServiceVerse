/**
 * Coworkers act within their associated SP's context but authenticate as themselves -
 * req.user.uid is the coworker's own uid, not the SP's. Resolve the SP id every
 * SP-scoped handler should actually operate against.
 */
export function resolveSpId(user: { uid: string; role?: string; spId?: string } | undefined): string | undefined {
  if (!user) return undefined;
  return user.role === 'COWORKER' ? user.spId : user.uid;
}
