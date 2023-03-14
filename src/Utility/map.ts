export const setIfUndefined = <Key, Value>(map: Map<Key, Value>, key: Key, create: () => Value) => {
    let set = map.get(key)
    if (set === undefined) {
        map.set(key, set = create())
    }
    return set
}

export const any = <K, V>(m: Map<K, V>, f: (arg0: V, arg1: K) => boolean): boolean => {
    for (const [key, value] of m) {
        if (f(value, key)) {
            return true
        }
    }
    return false
}