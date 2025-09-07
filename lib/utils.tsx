import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEmailString(
  userEmail: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  },
  opts: { includeFullEmail: boolean } = { includeFullEmail: false },
) {
  if (userEmail.firstName && userEmail.lastName) {
    return `${userEmail.firstName} ${userEmail.lastName} ${
      opts.includeFullEmail ? `<${userEmail.email}>` : ''
    }`;
  }
  return userEmail.email;
}

export function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, function (txt: string) {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
}

export function highlightText(text: string, query: string | undefined) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 text-black">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}


/**
 * Formats a duration in seconds to a MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "3:45")
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
