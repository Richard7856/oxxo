'use client';

// Shared countdown timer for chat interfaces (conductor + comercial)
// Counts down to timeoutAt; marks expired once remaining seconds reach 0
import { useState, useEffect } from 'react';

export function usePersistentTimer(timeoutAt: string | null | undefined) {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!timeoutAt) {
            setIsExpired(false);
            setTimeLeft(0);
            return;
        }

        const calculateTimeLeft = () => {
            const end = new Date(timeoutAt).getTime();
            const now = new Date().getTime();
            const remaining = Math.max(0, Math.floor((end - now) / 1000));

            setTimeLeft(remaining);
            setIsExpired(remaining === 0);
        };

        calculateTimeLeft();

        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [timeoutAt]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return { formatted, isExpired, timeLeft };
}
