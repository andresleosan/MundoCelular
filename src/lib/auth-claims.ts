export function esClaimAdmin(claims: Record<string, unknown>): boolean {
  return claims.admin === true;
}
