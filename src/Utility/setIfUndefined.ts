export const setIfUndefined = <Key, Value>(map: Map<Key, Value>, key: Key, create: () => Value) => {
    let set = map.get(key)
    if (set === undefined) {
        map.set(key, set = create())
    }
    return set
}