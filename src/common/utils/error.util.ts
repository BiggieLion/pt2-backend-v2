/**
 * Extracts the error name from an unknown Cognito (or generic AWS SDK) error.
 * Returns undefined if the value is not an object with a string 'name' property.
 */
export function getCognitoErrorName(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'name' in err) {
    const name = (err as Record<string, unknown>).name;
    return typeof name === 'string' ? name : undefined;
  }
  return undefined;
}
