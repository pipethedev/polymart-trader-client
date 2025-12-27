import { formatDistanceToNow, format, isValid, parseISO } from 'date-fns';

/**
 * Formats a date as a relative time string (e.g., "2 hours ago", "3 days ago")
 */
export function formatDate(date: string | Date): string {
  let d: Date;
  
  if (typeof date === 'string') {
    // Handle empty strings
    if (!date || date.trim() === '') {
      return 'Invalid date';
    }
    
    // Try parsing as ISO first, then fall back to Date constructor
    try {
      d = parseISO(date);
    } catch {
      d = new Date(date);
    }
  } else {
    d = date;
  }
  
  // Check if date is valid
  if (!isValid(d)) {
    console.warn('Invalid date:', date);
    return 'Invalid date';
  }
  
  // Use date-fns formatDistanceToNow for relative time
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Formats a date as a full date string (e.g., "January 15, 2024, 10:30 AM")
 */
export function formatDateFull(date: string | Date): string {
  let d: Date;
  
  if (typeof date === 'string') {
    if (!date || date.trim() === '') {
      return 'Invalid date';
    }
    
    try {
      d = parseISO(date);
    } catch {
      d = new Date(date);
    }
  } else {
    d = date;
  }
  
  if (!isValid(d)) {
    console.warn('Invalid date:', date);
    return 'Invalid date';
  }
  
  return format(d, 'MMMM d, yyyy, h:mm a');
}

