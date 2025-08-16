import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Product, ProductVariant } from '../../../../../shared/types';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() showAddToCart: boolean = true;
  @Input() showVariants: boolean = true;
  @Output() addToCart = new EventEmitter<{ product: Product; variant: ProductVariant; quantity: number }>();
  @Output() productClick = new EventEmitter<Product>();

  selectedVariant: ProductVariant | null = null;
  quantity: number = 1;

  ngOnInit() {
    if (this.product.variants.length > 0) {
      this.selectedVariant = this.product.variants[0];
    }
  }

  onVariantSelect(variant: ProductVariant) {
    this.selectedVariant = variant;
  }

  onQuantityChange(change: number) {
    const newQuantity = this.quantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) {
      this.quantity = newQuantity;
    }
  }

  onAddToCart() {
    if (this.selectedVariant) {
      this.addToCart.emit({
        product: this.product,
        variant: this.selectedVariant,
        quantity: this.quantity
      });
    }
  }

  onProductClick() {
    this.productClick.emit(this.product);
  }

  getPriceRange(): string {
    if (this.product.variants.length === 0) return 'N/A';
    
    const prices = this.product.variants.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return `₹${minPrice}`;
    }
    
    return `₹${minPrice} - ₹${maxPrice}`;
  }

  getWeightRange(): string {
    if (this.product.variants.length === 0) return '';
    
    const weights = this.product.variants.map(v => v.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    
    if (minWeight === maxWeight) {
      return `${minWeight}kg`;
    }
    
    return `${minWeight}kg - ${maxWeight}kg`;
  }

  isVariantAvailable(variant: ProductVariant): boolean {
    return variant.isAvailable;
  }
}