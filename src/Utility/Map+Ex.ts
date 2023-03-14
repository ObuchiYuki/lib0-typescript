
interface Map<K, V> {
    setIfUndefined(key: K, make: () => V): V;
}

Map.prototype.setIfUndefined = function<K, V>(key: K, make: () => V): V {
    const value = this.get(key)
    if (value != null) return value
    const newValue = make()
    this.set(key, newValue)
    return newValue
}
