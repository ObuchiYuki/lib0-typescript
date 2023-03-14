interface Map<K, V> {
    setIfUndefined(key: K, make: () => V): V;
}
