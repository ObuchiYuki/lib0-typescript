"use strict";
if (Map.prototype.setIfUndefined != null) {
    console.error("Map.prototype.setIfUndefined is already non null.");
}
Map.prototype.setIfUndefined = function (key, make) {
    const value = this.get(key);
    if (value != null)
        return value;
    const newValue = make();
    this.set(key, newValue);
    return newValue;
};
