/** Handles named events. */
type Observer = (...values: unknown[]) => void;
export declare class Observable<EventType = string> {
    private _observers;
    constructor();
    on(name: EventType, observer: Observer): void;
    once(name: EventType, observer: Observer): void;
    off(name: EventType, observer: Observer): void;
    /**
     * Emit a named event. All registered event listeners that listen to the
     * specified name will receive the event.
     */
    emit(name: EventType, args: unknown[]): void;
    destroy(): void;
}
export {};
