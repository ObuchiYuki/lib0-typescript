export const mapIterator = <T, R>(iterator: Iterator<T>, body: (value: T) => R): IterableIterator<R> => ({
    [Symbol.iterator]() { return this },
    next(): IteratorResult<R> {
        const { done, value } = iterator.next()
        return { value: body(value), done: done  }
    }
})

export const filterIterator = <T>(iterator: Iterator<T>, filter: (value: T) => boolean): IterableIterator<T> => ({
    [Symbol.iterator]() { return this },
    next(): IteratorResult<T> {
        let res
        do { res = iterator.next() } while (!res.done && !filter(res.value))
        return res
    }
})