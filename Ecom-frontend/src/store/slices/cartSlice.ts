import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { CartDTO, CartState } from "@/types/cart.types";
import cartApi from "@/api/cart.api";
import { extractErrorMessage } from "@/api/client";
import { logout, sessionExpired } from "./authSlice";

const initialState: CartState = {
  cart: null,
  isLoading: false,
  isUpdating: false,
  error: null,
};

export const fetchCart = createAsyncThunk<CartDTO, void, { rejectValue: string }>(
  "cart/fetchCart",
  async (_, { rejectWithValue }) => {
    try {
      return await cartApi.getUserCart();
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const addToCart = createAsyncThunk<
  CartDTO,
  { productId: number; quantity?: number },
  { rejectValue: string }
>("cart/addToCart", async ({ productId, quantity = 1 }, { rejectWithValue }) => {
  try {
    return await cartApi.addProductToCart(productId, quantity);
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});

export const updateCartItem = createAsyncThunk<
  CartDTO,
  { productId: number; operation: "increment" | "decrement" | "delete" },
  { rejectValue: string }
>("cart/updateCartItem", async ({ productId, operation }, { rejectWithValue }) => {
  try {
    return await cartApi.updateProductQuantity(productId, operation);
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});

export const removeFromCart = createAsyncThunk<
  CartDTO,
  { cartId: number; productId: number },
  { rejectValue: string }
>("cart/removeFromCart", async ({ cartId, productId }, { rejectWithValue }) => {
  try {
    await cartApi.deleteProductFromCart(cartId, productId);
    // After deletion, re-fetch the updated user cart
    return await cartApi.getUserCart();
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCartState: (state) => {
      state.cart = null;
      state.isLoading = false;
      state.isUpdating = false;
      state.error = null;
    },
    clearCartError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchCart
    builder.addCase(fetchCart.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      state.isLoading = false;
      state.cart = action.payload;
      state.error = null;
    });
    builder.addCase(fetchCart.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || "Failed to load cart.";
    });

    // addToCart
    builder.addCase(addToCart.pending, (state) => {
      state.isUpdating = true;
      state.error = null;
    });
    builder.addCase(addToCart.fulfilled, (state, action) => {
      state.isUpdating = false;
      state.cart = action.payload;
      state.error = null;
    });
    builder.addCase(addToCart.rejected, (state, action) => {
      state.isUpdating = false;
      state.error = action.payload || "Failed to add to cart.";
    });

    // updateCartItem
    builder.addCase(updateCartItem.pending, (state) => {
      state.isUpdating = true;
      state.error = null;
    });
    builder.addCase(updateCartItem.fulfilled, (state, action) => {
      state.isUpdating = false;
      state.cart = action.payload;
      state.error = null;
    });
    builder.addCase(updateCartItem.rejected, (state, action) => {
      state.isUpdating = false;
      state.error = action.payload || "Failed to update item.";
    });

    // removeFromCart
    builder.addCase(removeFromCart.pending, (state) => {
      state.isUpdating = true;
      state.error = null;
    });
    builder.addCase(removeFromCart.fulfilled, (state, action) => {
      state.isUpdating = false;
      state.cart = action.payload;
      state.error = null;
    });
    builder.addCase(removeFromCart.rejected, (state, action) => {
      state.isUpdating = false;
      state.error = action.payload || "Failed to remove item.";
    });

    // Reset cart on logout and session expiration
    builder.addCase(logout.fulfilled, (state) => {
      state.cart = null;
      state.isLoading = false;
      state.isUpdating = false;
      state.error = null;
    });
    builder.addCase(sessionExpired, (state) => {
      state.cart = null;
      state.isLoading = false;
      state.isUpdating = false;
      state.error = null;
    });
  },
});

export const { clearCartState, clearCartError } = cartSlice.actions;
export default cartSlice.reducer;
