
import * as map from 'lib0/map.js'
import * as array from 'lib0/array.js'

/** Handles named events. */
type Observer = (...values: unknown[]) => void

export class Observable<EventType = string> {
    private _observers: Map<EventType, Set<Observer>> = new Map()

    constructor() {}

    on(name: EventType, observer: Observer) {
        if (this._observers.get(name) == null) this._observers.set(name, new Set())

        this._observers.get(name)?.add(observer)
    }

    once(name: EventType, observer: Observer) {
        const _observer = (...args: unknown[]) => {
            this.off(name, _observer)
            observer(...args)
        }
        this.on(name, _observer)
    }

    off(name: EventType, observer: Observer) {
        const observers = this._observers.get(name)
        if (observers !== undefined) {
            observers.delete(observer)
            if (observers.size === 0) {
                this._observers.delete(name)
            }
        }
    }

    /**
     * Emit a named event. All registered event listeners that listen to the
     * specified name will receive the event.
     */
    emit(name: EventType, args: unknown[]) {
        // copy all listeners to an array first to make sure that no event is emitted to listeners that are subscribed while the event handler is called.
        const listeners = this._observers.get(name)
        if (listeners == null) return
        Array.from(listeners.values()).forEach(f => f(...args))
    }

    destroy() {
        this._observers = new Map()
    }
}