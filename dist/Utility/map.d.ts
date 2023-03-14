export declare const setIfUndefined: <Key, Value>(map: Map<Key, Value>, key: Key, create: () => Value) => Value;
export declare const any: <K, V>(m: Map<K, V>, f: (arg0: V, arg1: K) => boolean) => boolean;
