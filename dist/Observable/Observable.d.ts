export declare class Observable<EventType extends {
    [Key: string]: readonly unknown[];
}> {
    private _observers;
    constructor();
    on<Name extends keyof EventType>(name: Name, observer: (..._: EventType[Name]) => void): void;
    once<Name extends keyof EventType>(name: Name, observer: (..._: EventType[Name]) => void): void;
    off<Name extends keyof EventType>(name: Name, observer: (..._: EventType[Name]) => void): void;
    /**
     * Emit a named event. All registered event listeners that listen to the
     * specified name will receive the event.
     */
    emit<T extends keyof EventType>(name: T, args: EventType[T]): void;
    destroy(): void;
}
