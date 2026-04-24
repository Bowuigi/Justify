import { useSignal, type Signal } from "@preact/signals";
import type { JSX } from "preact";

type EditableListProps<T> = {
  items: Array<T>,
  onInput: (items: Array<T>) => void,
  renderItem: (item: T, ix: number, update: (newItem: T) => void) => JSX.Element,
  createEmptyItem: () => T,
};

export function EditableList<T>({items, onInput, renderItem, createEmptyItem}: EditableListProps<T>) {
  const itemsS = useSignal(items);

  const updateItems = (newItems: Array<T>) => {
    itemsS.value = newItems;
    onInput(newItems);
  };

  const updateItem = (ix: number, newItem: T) => {
    const newItems = [...itemsS.value];
    newItems[ix] = newItem;
    updateItems(newItems);
  };

  const addItem = () => {
    updateItems([...itemsS.value, createEmptyItem()]);
  };

  const removeItem = (ix: number) => {
    updateItems(itemsS.value.filter((_, i) => i !== ix));
  };

  return (
    <div>
      {itemsS.value.map((item, ix) => (
        <div key={ix}>
          {renderItem(item, ix, (newItem) => updateItem(ix, newItem))}
          <button onClick={() => removeItem(ix)}>x</button>
        </div>
      ))}
      <button onClick={addItem}>+</button>
    </div>
  );
}
