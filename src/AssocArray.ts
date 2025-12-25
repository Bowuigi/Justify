export class AssocArray<K, V> {
    data: Array<{ key: K; value: V; }> = [];
    constructor(data: Array<{ key: K; value: V; }>) { this.data = data; }

    // Returns last element of the associative array whose key fullfills a predicate
    lastKey(predicate: (fromAssocArray: K) => boolean): V | null {
        for (let i = this.data.length - 1; i >= 0; i--) {
            if (predicate(this.data[i].key)) {
                return this.data[i].value;
            }
        }
        return null;
    }

    insert(key: K, value: V): AssocArray<K, V> {
        return new AssocArray(this.data.concat({ key, value }));
    }
}
