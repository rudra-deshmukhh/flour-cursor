import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { collections } from '../config/firebase';
import { logger } from '../utils/logger';
import { ApiResponse, Product, PaginatedResponse } from '../../../shared/types';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Get all products with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['wheat', 'rice', 'millet', 'pulse', 'other']).withMessage('Invalid category'),
  query('search').optional().isString().withMessage('Search must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    } as ApiResponse<null>);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const category = req.query.category as string;
  const search = req.query.search as string;

  let query = collections.products.where('isAvailable', '==', true);

  // Apply category filter
  if (category) {
    query = query.where('category', '==', category);
  }

  // Get total count
  const totalSnapshot = await query.get();
  const total = totalSnapshot.size;

  // Apply pagination
  const offset = (page - 1) * limit;
  const productsSnapshot = await query
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .offset(offset)
    .get();

  const products: Product[] = [];
  productsSnapshot.forEach(doc => {
    const productData = doc.data();
    const product: Product = {
      id: doc.id,
      ...productData
    } as Product;

    // Apply search filter if provided
    if (!search || 
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase())) {
      products.push(product);
    }
  });

  const paginatedResponse: PaginatedResponse<Product> = {
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

  res.status(200).json({
    success: true,
    data: paginatedResponse
  } as ApiResponse<PaginatedResponse<Product>>);
}));

// Get product by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const productDoc = await collections.products.doc(id).get();
  
  if (!productDoc.exists) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    } as ApiResponse<null>);
  }

  const productData = productDoc.data();
  const product: Product = {
    id: productDoc.id,
    ...productData
  } as Product;

  res.status(200).json({
    success: true,
    data: product
  } as ApiResponse<Product>);
}));

// Get products by category
router.get('/category/:category', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    } as ApiResponse<null>);
  }

  const { category } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  if (!['wheat', 'rice', 'millet', 'pulse', 'other'].includes(category)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid category'
    } as ApiResponse<null>);
  }

  const query = collections.products
    .where('category', '==', category)
    .where('isAvailable', '==', true);

  // Get total count
  const totalSnapshot = await query.get();
  const total = totalSnapshot.size;

  // Apply pagination
  const offset = (page - 1) * limit;
  const productsSnapshot = await query
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .offset(offset)
    .get();

  const products: Product[] = [];
  productsSnapshot.forEach(doc => {
    const productData = doc.data();
    const product: Product = {
      id: doc.id,
      ...productData
    } as Product;
    products.push(product);
  });

  const paginatedResponse: PaginatedResponse<Product> = {
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

  res.status(200).json({
    success: true,
    data: paginatedResponse
  } as ApiResponse<PaginatedResponse<Product>>);
}));

// Search products
router.get('/search/:query', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    } as ApiResponse<null>);
  }

  const { query: searchQuery } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  // Get all available products and filter by search query
  const productsSnapshot = await collections.products
    .where('isAvailable', '==', true)
    .get();

  const allProducts: Product[] = [];
  productsSnapshot.forEach(doc => {
    const productData = doc.data();
    const product: Product = {
      id: doc.id,
      ...productData
    } as Product;
    allProducts.push(product);
  });

  // Filter products by search query
  const filteredProducts = allProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply pagination
  const total = filteredProducts.length;
  const offset = (page - 1) * limit;
  const paginatedProducts = filteredProducts.slice(offset, offset + limit);

  const paginatedResponse: PaginatedResponse<Product> = {
    data: paginatedProducts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

  res.status(200).json({
    success: true,
    data: paginatedResponse
  } as ApiResponse<PaginatedResponse<Product>>);
}));

// Get featured products (most popular)
router.get('/featured/limit', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;

  // In a real application, you would calculate popularity based on sales
  // For now, we'll return the most recently added products
  const productsSnapshot = await collections.products
    .where('isAvailable', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  const products: Product[] = [];
  productsSnapshot.forEach(doc => {
    const productData = doc.data();
    const product: Product = {
      id: doc.id,
      ...productData
    } as Product;
    products.push(product);
  });

  res.status(200).json({
    success: true,
    data: products
  } as ApiResponse<Product[]>);
}));

export default router;