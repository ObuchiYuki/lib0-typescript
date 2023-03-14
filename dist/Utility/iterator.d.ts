export declare const mapIterator: <T, R>(iterator: Iterator<T, any, undefined>, body: (value: T) => R) => IterableIterator<R>;
export declare const filterIterator: <T>(iterator: Iterator<T, any, undefined>, filter: (value: T) => boolean) => IterableIterator<T>;
