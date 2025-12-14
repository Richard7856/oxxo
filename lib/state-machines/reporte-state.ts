/**
 * Reporte State Machine
 * 
 * Manages the lifecycle of a reporte from creation to completion.
 * Enforces valid state transitions and business rules.
 */

export type ReporteState =
    | 'draft'
    | 'submitted'
    | 'resolved_by_driver'
    | 'timed_out'
    | 'completed'
    | 'archived';

export type ReporteEvent =
    | 'SUBMIT'
    | 'DRIVER_CONFIRMS_RESOLUTION'
    | 'TIMEOUT'
    | 'ADMIN_COMPLETES'
    | 'ARCHIVE';

export interface ReporteContext {
    id: string;
    status: ReporteState;
    submittedAt?: Date;
    timeoutAt?: Date;
    ticketDataConfirmed: boolean;
    chatMessageCount: number;
}

interface StateTransition {
    from: ReporteState;
    to: ReporteState;
    event: ReporteEvent;
    guard?: (context: ReporteContext) => boolean;
    effect?: (context: ReporteContext) => void;
}

const TIMEOUT_MINUTES = 20;

const TRANSITIONS: StateTransition[] = [
    {
        from: 'draft',
        to: 'submitted',
        event: 'SUBMIT',
        guard: (ctx) => ctx.ticketDataConfirmed,
        effect: (ctx) => {
            ctx.submittedAt = new Date();
            ctx.timeoutAt = new Date(Date.now() + TIMEOUT_MINUTES * 60 * 1000);
        },
    },
    {
        from: 'submitted',
        to: 'resolved_by_driver',
        event: 'DRIVER_CONFIRMS_RESOLUTION',
    },
    {
        from: 'submitted',
        to: 'timed_out',
        event: 'TIMEOUT',
    },
    {
        from: 'resolved_by_driver',
        to: 'completed',
        event: 'ADMIN_COMPLETES',
    },
    {
        from: 'timed_out',
        to: 'completed',
        event: 'ADMIN_COMPLETES',
    },
    {
        from: 'completed',
        to: 'archived',
        event: 'ARCHIVE',
    },
];

export class ReporteStateMachine {
    constructor(private context: ReporteContext) { }

    /**
     * Check if a transition is valid from current state
     */
    canTransition(event: ReporteEvent): boolean {
        const transition = TRANSITIONS.find(
            (t) => t.from === this.context.status && t.event === event
        );

        if (!transition) return false;
        if (transition.guard && !transition.guard(this.context)) return false;

        return true;
    }

    /**
     * Execute a state transition
     * @throws Error if transition is invalid
     */
    transition(event: ReporteEvent): ReporteState {
        if (!this.canTransition(event)) {
            throw new Error(
                `Invalid transition: ${this.context.status} -> ${event}`
            );
        }

        const transition = TRANSITIONS.find(
            (t) => t.from === this.context.status && t.event === event
        )!;

        this.context.status = transition.to;

        if (transition.effect) {
            transition.effect(this.context);
        }

        return this.context.status;
    }

    /**
     * Get current state
     */
    getState(): ReporteState {
        return this.context.status;
    }

    /**
     * Get current context (immutable copy)
     */
    getContext(): ReporteContext {
        return { ...this.context };
    }

    /**
     * Check if reporte has timed out
     */
    isTimedOut(): boolean {
        if (!this.context.timeoutAt) return false;
        return new Date() > this.context.timeoutAt;
    }

    /**
     * Get valid transitions from current state
     */
    getValidTransitions(): ReporteEvent[] {
        return TRANSITIONS.filter(
            (t) =>
                t.from === this.context.status &&
                (!t.guard || t.guard(this.context))
        ).map((t) => t.event);
    }
}

/**
 * Create a state machine instance from a reporte
 */
export function createStateMachine(
    reporte: {
        id: string;
        status: ReporteState;
        submitted_at?: string | null;
        timeout_at?: string | null;
        ticket_extraction_confirmed: boolean;
    },
    chatMessageCount: number
): ReporteStateMachine {
    const context: ReporteContext = {
        id: reporte.id,
        status: reporte.status,
        submittedAt: reporte.submitted_at
            ? new Date(reporte.submitted_at)
            : undefined,
        timeoutAt: reporte.timeout_at ? new Date(reporte.timeout_at) : undefined,
        ticketDataConfirmed: reporte.ticket_extraction_confirmed,
        chatMessageCount,
    };

    return new ReporteStateMachine(context);
}
