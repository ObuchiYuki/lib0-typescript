
import * as map from 'lib0/map.js'
import * as array from 'lib0/array.js'

export class Observable<EventType extends { [Key: string]: readonly unknown[] }> {
    private _observers: Map<keyof EventType, Set<any>> = new Map()

    constructor() {}

    on<Name extends keyof EventType>(name: Name, observer: (..._: EventType[Name]) => void) {
        if (this._observers.get(name) == null) this._observers.set(name, new Set())

        this._observers.get(name)?.add(observer)
    }

    once<Name extends keyof EventType>(name: Name, observer: (..._: EventType[Name]) => void) {
        const _observer = (...args: EventType[Name]) => {
            this.off(name, _observer)
            observer(...args)
        }
        this.on(name, _observer)
    }

    off<Name extends keyof EventType>(name: Name, observer: (..._: EventType[Name]) => void) {
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
    emit<T extends keyof EventType>(name: T, args: EventType[T]) {
        // copy all listeners to an array first to make sure that no event is emitted to listeners that are subscribed while the event handler is called.
        const listeners = this._observers.get(name)
        if (listeners == null) return
        Array.from(listeners.values()).forEach(f => f(...args))
    }

    destroy() {
        this._observers = new Map()
    }
}
