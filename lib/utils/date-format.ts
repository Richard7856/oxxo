/**
 * Format time consistently for display in messages
 * Uses a fixed format to avoid hydration mismatches between server and client
 */
export function formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    
    // Format as HH:MM AM/PM in a consistent way
    // This ensures server and client render the same string
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
}

