// Public API của feature cart (FDD 4.1).
export {
  MAX_QUANTITY_PER_ITEM,
  addItem,
  cartReducer,
  clearCart,
  hydrateCart,
  removeItem,
  setAllSelected,
  toggleSelected,
  updateQuantity,
  initialCartState,
  type CartItem,
  type CartProduct,
  type CartState,
} from "./model/cartSlice";
export {
  selectCartCount,
  selectCartHydrated,
  selectCartItems,
  selectIsAllSelected,
  selectSelectedItems,
  selectSelectedSubtotal,
} from "./model/selectors";
export { CART_STORAGE_KEY, loadCart, saveCart } from "./cart.storage";
export { CartPersistence } from "./components/CartPersistence";
