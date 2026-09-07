export class AssocArray<K, V> {
  public data: Array<{ key: K; value: V }> = [];

  public constructor(data: Array<{ key: K; value: V }>) {
    this.data = data;
  }

  // Returns last element of the associative array whose key fullfills a predicate
  public lastKey(predicate: (fromAssocArray: K) => boolean): V | null {
    for (let i = this.data.length - 1; i >= 0; i--) {
      const entry = this.data[i]!;
      if (predicate(entry.key)) {
        return entry.value;
      }
    }
    return null;
  }

  public insert(key: K, value: V): AssocArray<K, V> {
    return new AssocArray([...this.data, { key, value }]);
  }
}
