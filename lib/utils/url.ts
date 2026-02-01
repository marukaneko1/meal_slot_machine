/**
 * URL validation utility
 * Shared across components to avoid duplication
 */

/**
 * Validates and normalizes a URL string
 * @param url - The URL to validate
 * @returns Normalized URL string or null if invalid
 */
export function isValidUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  
  let normalized = url.trim();
  
  // Add protocol if missing
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    if (normalized.startsWith('www.')) {
      normalized = 'https://' + normalized;
    } else if (normalized.includes('.') && !normalized.includes(' ')) {
      normalized = 'https://www.' + normalized;
    } else {
      return null;
    }
  }
  
  // Validate URL structure
  try {
    const urlObj = new URL(normalized);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

/**
 * Extracts domain name from URL for display purposes
 * @param url - The URL to extract domain from
 * @returns Domain name or null if invalid
 */
export function getDomain(url: string | null | undefined): string | null {
  const validUrl = isValidUrl(url);
  if (!validUrl) return null;
  
  try {
    const urlObj = new URL(validUrl);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}
