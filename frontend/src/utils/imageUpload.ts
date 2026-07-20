const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

// Browser-detected file.type is unreliable for some images (screenshots, images
// forwarded via chat apps, etc. can arrive with an empty or generic type even
// with a normal-looking extension), which then fails Storage rules that check
// contentType server-side. Resolve a real image/* type ourselves instead of
// trusting the browser's sniffing.
export function resolveImageContentType(file: File): string {
  if (file.type && file.type.startsWith('image/')) {
    return file.type;
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return EXTENSION_CONTENT_TYPES[ext] || 'image/jpeg';
}

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}
