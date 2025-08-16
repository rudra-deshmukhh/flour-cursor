import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product, ProductVariant, OrderItem } from '../../../../shared/types';

export interface CartItem {
  productId: string;
  productName: string;
  variant: ProductVariant;
  quantity: number;
  price: number;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();

  private readonly CART_STORAGE_KEY = 'flour_delivery_cart';

  constructor() {
    this.loadCartFromStorage();
  }

  // Get cart items
  getCartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  // Add item to cart
  addToCart(product: Product, variant: ProductVariant, quantity: number = 1): void {
    const currentItems = this.getCartItems();
    const existingItemIndex = currentItems.findIndex(
      item => item.productId === product.id && item.variant.weight === variant.weight
    );

    if (existingItemIndex > -1) {
      // Update existing item quantity
      currentItems[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        variant: variant,
        quantity: quantity,
        price: variant.price,
        imageUrl: product.imageUrl
      };
      currentItems.push(newItem);
    }

    this.updateCart(currentItems);
  }

  // Remove item from cart
  removeFromCart(productId: string, variantWeight: number): void {
    const currentItems = this.getCartItems();
    const filteredItems = currentItems.filter(
      item => !(item.productId === productId && item.variant.weight === variantWeight)
    );
    this.updateCart(filteredItems);
  }

  // Update item quantity
  updateQuantity(productId: string, variantWeight: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId, variantWeight);
      return;
    }

    const currentItems = this.getCartItems();
    const itemIndex = currentItems.findIndex(
      item => item.productId === productId && item.variant.weight === variantWeight
    );

    if (itemIndex > -1) {
      currentItems[itemIndex].quantity = quantity;
      this.updateCart(currentItems);
    }
  }

  // Clear cart
  clearCart(): void {
    this.updateCart([]);
  }

  // Get cart total
  getCartTotal(): Observable<number> {
    return this.cartItems$.pipe(
      map(items => items.reduce((total, item) => total + (item.price * item.quantity), 0))
    );
  }

  // Get cart item count
  getCartItemCount(): Observable<number> {
    return this.cartItems$.pipe(
      map(items => items.reduce((total, item) => total + item.quantity, 0))
    );
  }

  // Check if cart is empty
  isCartEmpty(): Observable<boolean> {
    return this.cartItems$.pipe(
      map(items => items.length === 0)
    );
  }

  // Get cart items for order
  getCartItemsForOrder(): OrderItem[] {
    return this.getCartItems().map(item => ({
      productId: item.productId,
      productName: item.productName,
      variant: item.variant,
      quantity: item.quantity,
      price: item.price
    }));
  }

  // Apply discount to cart
  applyDiscount(discountPercentage: number): number {
    const currentTotal = this.getCartItems().reduce((total, item) => total + (item.price * item.quantity), 0);
    return currentTotal * (discountPercentage / 100);
  }

  // Get cart summary
  getCartSummary(): Observable<{
    items: CartItem[];
    total: number;
    itemCount: number;
    discountAmount: number;
    finalAmount: number;
  }> {
    return this.cartItems$.pipe(
      map(items => {
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const discountAmount = 0; // Will be calculated when discount is applied
        const finalAmount = total - discountAmount;

        return {
          items,
          total,
          itemCount,
          discountAmount,
          finalAmount
        };
      })
    );
  }

  // Check if product is in cart
  isProductInCart(productId: string, variantWeight: number): boolean {
    return this.getCartItems().some(
      item => item.productId === productId && item.variant.weight === variantWeight
    );
  }

  // Get product quantity in cart
  getProductQuantityInCart(productId: string, variantWeight: number): number {
    const item = this.getCartItems().find(
      item => item.productId === productId && item.variant.weight === variantWeight
    );
    return item ? item.quantity : 0;
  }

  // Update cart and save to storage
  private updateCart(items: CartItem[]): void {
    this.cartItemsSubject.next(items);
    this.saveCartToStorage(items);
  }

  // Save cart to localStorage
  private saveCartToStorage(items: CartItem[]): void {
    try {
      localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to storage:', error);
    }
  }

  // Load cart from localStorage
  private loadCartFromStorage(): void {
    try {
      const storedCart = localStorage.getItem(this.CART_STORAGE_KEY);
      if (storedCart) {
        const items = JSON.parse(storedCart);
        this.cartItemsSubject.next(items);
      }
    } catch (error) {
      console.error('Failed to load cart from storage:', error);
      this.cartItemsSubject.next([]);
    }
  }

  // Validate cart items
  validateCart(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const items = this.getCartItems();

    if (items.length === 0) {
      errors.push('Cart is empty');
      return { isValid: false, errors };
    }

    items.forEach(item => {
      if (item.quantity <= 0) {
        errors.push(`Invalid quantity for ${item.productName}`);
      }
      if (item.price <= 0) {
        errors.push(`Invalid price for ${item.productName}`);
      }
      if (!item.variant.isAvailable) {
        errors.push(`${item.productName} (${item.variant.weight}kg) is not available`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get cart items grouped by product
  getCartItemsGroupedByProduct(): Observable<{ [productId: string]: CartItem[] }> {
    return this.cartItems$.pipe(
      map(items => {
        const grouped: { [productId: string]: CartItem[] } = {};
        
        items.forEach(item => {
          if (!grouped[item.productId]) {
            grouped[item.productId] = [];
          }
          grouped[item.productId].push(item);
        });

        return grouped;
      })
    );
  }
}