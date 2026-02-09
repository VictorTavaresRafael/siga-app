export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret || secret === 'changeme') {
    throw new Error('JWT_SECRET is required and cannot be "changeme"');
  }

  return secret;
}
