const encoder = new TextEncoder();

export async function hash(token: string): Promise<string> {
  return btoa(
    String.fromCharCode(
      ...new Uint8Array(
        await crypto.subtle.digest("SHA-512", encoder.encode(token))
      )
    )
  );
}
