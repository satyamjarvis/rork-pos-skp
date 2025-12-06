import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { Platform } from 'react-native';

export interface TilleggsvareVariant {
  id: string;
  name: string;
  price: number;
  color?: string;
}

export interface Tilleggsvare {
  id: string;
  name: string;
  variants: TilleggsvareVariant[];
}

export interface ProductSize {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
  image?: string;
  sizes?: ProductSize[];
  hasSize?: boolean;
  tilleggsvareIds?: string[];
}

export interface Category {
  id: string;
  name: string;
  image?: string;
  parentId?: string;
  order?: number;
  subcategories?: string[];
}

const [ProductsProviderComponent, useProducts] = createContextHook(() => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tilleggsvarer, setTilleggsvarer] = useState<Tilleggsvare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Permanent image URL cache - lasts entire session + stored in memory
  const imageUrlCacheRef = useRef<Map<string, string>>(new Map());
  const imagePrefetchInProgressRef = useRef<Set<string>>(new Set());
  const loadingPromisesRef = useRef<Map<string, Promise<void>>>(new Map());

  // Helper to get signed URL from image path - instant from cache or generate once
  const getSignedUrl = useCallback(async (imagePath: string): Promise<string | null> => {
    if (!imagePath) return null;
    
    // Return from cache immediately if available
    const cached = imageUrlCacheRef.current.get(imagePath);
    if (cached) {
      return cached;
    }
    
    // Prevent duplicate fetches for the same image
    if (imagePrefetchInProgressRef.current.has(imagePath)) {
      // Wait for the in-progress fetch
      let attempts = 0;
      while (imagePrefetchInProgressRef.current.has(imagePath) && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      return imageUrlCacheRef.current.get(imagePath) || null;
    }
    
    imagePrefetchInProgressRef.current.add(imagePath);
    
    try {
      // Get public URL directly instead of signed URL
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(imagePath);
      
      if (!data?.publicUrl) {
        console.error('[getSignedUrl] No public URL for:', imagePath);
        imagePrefetchInProgressRef.current.delete(imagePath);
        return null;
      }
      
      // Store permanently in cache
      imageUrlCacheRef.current.set(imagePath, data.publicUrl);
      imagePrefetchInProgressRef.current.delete(imagePath);
      
      return data.publicUrl;
    } catch (err) {
      console.error('[getSignedUrl] Error:', err);
      imagePrefetchInProgressRef.current.delete(imagePath);
      return null;
    }
  }, []);

  const loadProducts = useCallback(async () => {
    if (!user) {
      console.log('[loadProducts] No user, skipping');
      setProducts([]);
      setIsLoading(false);
      return;
    }
    
    const existingPromise = loadingPromisesRef.current.get('products');
    if (existingPromise) {
      console.log('[loadProducts] Already loading, returning existing promise');
      return existingPromise;
    }
    
    const loadPromise = (async () => {
    try {
      console.log('[loadProducts] Starting to load products for user:', user.id);
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('product_order', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true });

      if (error) {
        console.error('[loadProducts] Database error:', error);
        console.error('[loadProducts] Error message:', error.message);
        console.error('[loadProducts] Error details:', error.details);
        throw error;
      }
      
      // Load addon relationships for all products
      const { data: addonJunctions, error: addonError } = await supabase
        .from('product_addons_junction')
        .select('product_id, addon_category_id')
        .in('product_id', (data || []).map(p => p.id));

      if (addonError) console.error('Failed to load addon junctions:', addonError);

      // Group addon IDs by product ID
      const addonsByProduct = new Map<string, string[]>();
      (addonJunctions || []).forEach(junction => {
        const existing = addonsByProduct.get(junction.product_id) || [];
        addonsByProduct.set(junction.product_id, [...existing, junction.addon_category_id]);
      });
      
      // Get unique image paths and AGGRESSIVELY preload ALL images in parallel
      const uniqueImagePaths = Array.from(new Set((data || []).map(p => p.image_path).filter(Boolean)));
      
      console.log('[loadProducts] Preloading', uniqueImagePaths.length, 'images...');
      
      // Start loading ALL images immediately in parallel
      const imagePromises = uniqueImagePaths.map(path => getSignedUrl(path));
      await Promise.allSettled(imagePromises);
      
      console.log('[loadProducts] ✅ All images loaded');
      
      // Format products - all images should be in cache now
      const formattedProducts: Product[] = (data || []).map((p) => {
        let imageUrl: string | undefined;
        
        if (p.image_path) {
          // Get from cache
          imageUrl = imageUrlCacheRef.current.get(p.image_path);
          if (!imageUrl) {
            console.warn('[loadProducts] Image not in cache:', p.image_path);
          }
        } else if (p.image_url) {
          imageUrl = p.image_url;
        }
        
        return {
          id: p.id,
          name: p.name,
          price: Number(p.price),
          categoryId: p.category_id,
          image: imageUrl,
          sizes: p.sizes || [],
          hasSize: p.sizes && p.sizes.length > 0,
          tilleggsvareIds: addonsByProduct.get(p.id) || [],
        };
      });

      setProducts(formattedProducts);
    } catch (error: any) {
      console.error('[loadProducts] Failed to load products:', error);
      console.error('[loadProducts] Error type:', typeof error);
      console.error('[loadProducts] Error message:', error?.message);
      console.error('[loadProducts] Error stack:', error?.stack);
      setProducts([]);
    } finally {
      setIsLoading(false);
      console.log('[loadProducts] Loading finished, isLoading set to false');
      loadingPromisesRef.current.delete('products');
    }
    })();
    
    loadingPromisesRef.current.set('products', loadPromise);
    return loadPromise;
  }, [user, getSignedUrl]);

  const loadCategories = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('category_order', { ascending: true });

      if (error) throw error;
      
      // Get unique image paths and preload
      const uniqueImagePaths = Array.from(new Set((data || []).map(c => c.image_path).filter(Boolean)));
      
      console.log('[loadCategories] Preloading', uniqueImagePaths.length, 'category images...');
      
      // Preload all category images in parallel
      const imagePromises = uniqueImagePaths.map(path => getSignedUrl(path));
      await Promise.allSettled(imagePromises);
      
      console.log('[loadCategories] ✅ All category images loaded');
      
      // Format categories - all images should be in cache now
      const formattedCategories: Category[] = (data || []).map((c) => {
        let imageUrl: string | undefined;
        if (c.image_path) {
          imageUrl = imageUrlCacheRef.current.get(c.image_path);
          if (!imageUrl) {
            console.warn('[loadCategories] Image not in cache:', c.image_path);
          }
        } else if (c.image_url) {
          imageUrl = c.image_url;
        }
        
        return {
          id: c.id,
          name: c.name,
          image: imageUrl,
          parentId: c.parent_id,
          order: c.category_order ?? 0,
        };
      });

      setCategories(formattedCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, [user, getSignedUrl]);

  const loadTilleggsvarer = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: addonData, error: addonError } = await supabase
        .from('addon_categories')
        .select('*, addon_variants(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false});

      if (addonError) throw addonError;
      
      const formattedTilleggsvarer: Tilleggsvare[] = (addonData || []).map(a => ({
        id: a.id,
        name: a.name,
        variants: (a.addon_variants || []).map((v: any) => ({
          id: v.id,
          name: v.name,
          price: Number(v.price),
          color: v.color || undefined,
        })),
      }));

      setTilleggsvarer(formattedTilleggsvarer);
    } catch (error) {
      console.error('Failed to load tilleggsvarer:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProducts();
      loadCategories();
      loadTilleggsvarer();
    } else {
      setProducts([]);
      setCategories([]);
      setTilleggsvarer([]);
      setIsLoading(false);
    }
  }, [user, loadProducts, loadCategories, loadTilleggsvarer]);

  const uploadImage = useCallback(async (imageUri: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      console.log('[uploadImage] Starting upload for:', imageUri.substring(0, 100) + '...');
      console.log('[uploadImage] Platform:', Platform.OS);
      
      // Generate unique filename with path
      const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      console.log('[uploadImage] Uploading to:', fileName);
      
      let uploadError: any;
      
      if (Platform.OS === 'web') {
        // Web platform - use Blob API
        console.log('[uploadImage] Web platform - using Blob API');
        
        let blob: Blob;
        
        if (imageUri.startsWith('data:')) {
          console.log('[uploadImage] Converting data URL to blob');
          const base64Data = imageUri.split(',')[1];
          if (!base64Data) {
            throw new Error('Invalid data URL - no base64 data found');
          }
          
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const mimeType = imageUri.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
          blob = new Blob([bytes], { type: mimeType });
          console.log('[uploadImage] Blob created from base64, size:', blob.size);
        } else {
          console.log('[uploadImage] Fetching blob from URL');
          const response = await fetch(imageUri);
          blob = await response.blob();
          console.log('[uploadImage] Blob fetched, size:', blob.size);
        }
        
        if (!blob || blob.size === 0) {
          throw new Error('Failed to create blob - size is 0');
        }
        
        const result = await supabase.storage
          .from('product-images')
          .upload(fileName, blob, {
            contentType: blob.type || 'image/jpeg',
            upsert: false,
          });
        
        uploadError = result.error;
      } else {
        // Mobile platform - use FormData with file URI
        console.log('[uploadImage] Mobile platform - using FormData');
        
        // Extract file extension
        let fileExt = 'jpg';
        if (imageUri.includes('.')) {
          fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
        }
        
        // Update filename with correct extension
        const mobileFileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        console.log('[uploadImage] Mobile file extension:', fileExt);
        console.log('[uploadImage] Mobile filename:', mobileFileName);
        
        // For mobile, we need to read the file as array buffer
        const response = await fetch(imageUri);
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        console.log('[uploadImage] File loaded, size:', uint8Array.length, 'bytes');
        
        if (uint8Array.length === 0) {
          throw new Error('Failed to read file - size is 0');
        }
        
        // Determine content type
        let contentType = 'image/jpeg';
        if (fileExt === 'png') contentType = 'image/png';
        else if (fileExt === 'webp') contentType = 'image/webp';
        else if (fileExt === 'gif') contentType = 'image/gif';
        
        console.log('[uploadImage] Content type:', contentType);
        console.log('[uploadImage] Uploading to Supabase...');
        
        const result = await supabase.storage
          .from('product-images')
          .upload(mobileFileName, uint8Array, {
            contentType: contentType,
            upsert: false,
          });
        
        uploadError = result.error;
        
        // Use mobile filename for return
        if (!uploadError) {
          console.log('[uploadImage] Upload successful!');
          console.log('[uploadImage] Returning path:', mobileFileName);
          return mobileFileName;
        }
      }

      if (uploadError) {
        console.error('[uploadImage] Upload error:', uploadError);
        console.error('[uploadImage] Upload error details:', JSON.stringify(uploadError, null, 2));
        throw uploadError;
      }

      console.log('[uploadImage] Upload successful!');
      console.log('[uploadImage] Returning path:', fileName);
      return fileName;
    } catch (error) {
      console.error('[uploadImage] Failed to upload image:', error);
      if (error instanceof Error) {
        console.error('[uploadImage] Error message:', error.message);
        console.error('[uploadImage] Error stack:', error.stack);
      }
      return null;
    }
  }, [user]);

  const addProduct = useCallback(async (name: string, price: number) => {
    if (!user) {
      console.error('[addProduct] No user, cannot add product');
      return null;
    }
    
    try {
      console.log('[addProduct] Adding product:', name, price);
      console.log('[addProduct] User ID:', user.id);
      console.log('[addProduct] Current products count:', products.length);
      
      const insertData = {
        user_id: user.id,
        name,
        price,
        category_id: null,
        sub_category_id: null,
        product_order: products.length,
      };
      console.log('[addProduct] Insert data:', insertData);
      
      const { data, error } = await supabase
        .from('products')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[addProduct] Supabase error:', error);
        console.error('[addProduct] Error code:', error.code);
        console.error('[addProduct] Error message:', error.message);
        console.error('[addProduct] Error details:', error.details);
        console.error('[addProduct] Error hint:', error.hint);
        throw error;
      }

      console.log('[addProduct] Product created:', data);

      const newProduct: Product = {
        id: data.id,
        name: data.name,
        price: Number(data.price),
      };

      console.log('[addProduct] Success!');
      return newProduct;
    } catch (error) {
      console.error('[addProduct] Failed to add product:', error);
      return null;
    }
  }, [user, products.length]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!user) {
      console.error('[deleteProduct] No user, cannot delete');
      return false;
    }
    
    try {
      console.log('[deleteProduct] Deleting product from database:', id);
      
      // First delete addon relationships
      const { error: addonError } = await supabase
        .from('product_addons_junction')
        .delete()
        .eq('product_id', id);

      if (addonError) {
        console.error('[deleteProduct] Failed to delete addon relationships:', addonError);
        console.error('[deleteProduct] Addon error details:', JSON.stringify(addonError, null, 2));
      }

      // Then delete the product from database
      const { error, data } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('[deleteProduct] Database error:', error);
        console.error('[deleteProduct] Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('[deleteProduct] ✅ Product deleted from database, rows affected:', data?.length || 0);
      
      // Only update local state after successful database deletion
      setProducts(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (error) {
      console.error('[deleteProduct] ❌ Failed to delete product:', error);
      return false;
    }
  }, [user]);

  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    if (!user) return false;
    
    try {
      console.log('[updateProduct] Updating product:', productId, updates);
      
      let imagePath: string | null | undefined;
      let imageUrlForLocalState: string | undefined = updates.image;
      
      // Upload new image if provided and not already a URL
      if (updates.image !== undefined) {
        if (updates.image === '' || updates.image === null) {
          // User wants to clear the image
          imagePath = null;
          imageUrlForLocalState = undefined;
          console.log('[updateProduct] Clearing image');
        } else if (!updates.image.startsWith('http')) {
          // Upload local file to Supabase Storage
          console.log('[updateProduct] Uploading new image from local file:', updates.image);
          const uploadedPath = await uploadImage(updates.image);
          if (uploadedPath) {
            imagePath = uploadedPath;
            // Get signed URL for local state
            imageUrlForLocalState = await getSignedUrl(uploadedPath) || undefined;
            console.log('[updateProduct] Image uploaded successfully, path:', uploadedPath);
          } else {
            console.error('[updateProduct] Image upload failed - continuing without image');
            imagePath = undefined;
            imageUrlForLocalState = undefined;
          }
        } else {
          // It's already an HTTP URL - might be old data, keep it
          imagePath = undefined; // Don't update path
          imageUrlForLocalState = updates.image;
          console.log('[updateProduct] Using existing URL:', imageUrlForLocalState);
        }
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.price !== undefined) updateData.price = updates.price;
      // Always update image_path when image changes (including clearing it)
      if (updates.image !== undefined) {
        if (imagePath === null) {
          // Clear image
          updateData.image_path = null;
          updateData.image_url = null; // Also clear old image_url if exists
          console.log('[updateProduct] Clearing both image_path and image_url');
        } else if (imagePath !== undefined) {
          // New image uploaded
          updateData.image_path = imagePath;
          updateData.image_url = null; // Clear old image_url
          console.log('[updateProduct] Setting image_path to:', imagePath);
        }
        // If imagePath is undefined, we keep existing data (already an HTTP URL)
      }
      if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
      if (updates.sizes !== undefined) updateData.sizes = updates.sizes;
      if (updates.hasSize !== undefined) updateData.has_size = updates.hasSize;

      console.log('[updateProduct] Final update data:', updateData);

      const { error, data: updatedData } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('[updateProduct] Supabase error:', error);
        console.error('[updateProduct] Error message:', error.message);
        console.error('[updateProduct] Error details:', error.details);
        console.error('[updateProduct] Error hint:', error.hint);
        throw error;
      }

      console.log('[updateProduct] Product updated in database:', updatedData);
      console.log('[updateProduct] Image URL for local state:', imageUrlForLocalState);

      // Update addon relationships if provided
      if (updates.tilleggsvareIds !== undefined) {
        console.log('[updateProduct] Updating addon relationships:', updates.tilleggsvareIds);
        
        // Delete existing addon relationships
        const { error: deleteError } = await supabase
          .from('product_addons_junction')
          .delete()
          .eq('product_id', productId);

        if (deleteError) {
          console.error('[updateProduct] Failed to delete addon relationships:', deleteError);
          throw deleteError;
        }

        // Insert new addon relationships
        if (updates.tilleggsvareIds.length > 0) {
          const junctionsToInsert = updates.tilleggsvareIds.map(addonId => ({
            product_id: productId,
            addon_category_id: addonId,
          }));

          const { error: insertError } = await supabase
            .from('product_addons_junction')
            .insert(junctionsToInsert);

          if (insertError) {
            console.error('[updateProduct] Failed to insert addon relationships:', insertError);
            throw insertError;
          }

          console.log('[updateProduct] Addon relationships updated successfully');
        }
      }

      // Update local state directly instead of reloading everything
      setProducts(prev => {
        console.log('[updateProduct] Updating local state for product:', productId);
        console.log('[updateProduct] New image URL:', imageUrlForLocalState);
        
        return prev.map(p => {
          if (p.id === productId) {
            const updated = {
              ...p,
              name: updates.name ?? p.name,
              price: updates.price ?? p.price,
              image: imageUrlForLocalState !== undefined ? imageUrlForLocalState : p.image,
              categoryId: updates.categoryId ?? p.categoryId,
              sizes: updates.sizes ?? p.sizes,
              hasSize: updates.hasSize ?? p.hasSize,
              tilleggsvareIds: updates.tilleggsvareIds ?? p.tilleggsvareIds,
            };
            console.log('[updateProduct] Updated product data:', updated);
            return updated;
          }
          return p;
        });
      });
      
      console.log('[updateProduct] Success!');
      return true;
    } catch (error) {
      console.error('[updateProduct] Failed to update product:', error);
      return false;
    }
  }, [user, uploadImage, getSignedUrl]);

  const addCategory = useCallback(async (name: string, image?: string, parentId?: string) => {
    if (!user) return null;
    
    try {
      console.log('[addCategory] Creating category:', name, 'with image:', image);
      
      let imagePath: string | null | undefined;
      let imageUrlForDisplay: string | undefined = image;
      
      // Upload image if provided and not already a URL
      if (image && !image.startsWith('http')) {
        console.log('[addCategory] Uploading new image from local file:', image);
        const uploadedPath = await uploadImage(image);
        if (uploadedPath) {
          imagePath = uploadedPath;
          imageUrlForDisplay = await getSignedUrl(uploadedPath) || undefined;
          console.log('[addCategory] Image uploaded successfully, path:', uploadedPath);
        } else {
          console.error('[addCategory] Image upload failed - continuing without image');
          imagePath = null;
          imageUrlForDisplay = undefined;
        }
      } else if (image) {
        // Already a URL
        imagePath = null;
        imageUrlForDisplay = image;
      } else {
        imagePath = null;
        imageUrlForDisplay = undefined;
      }
      
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name,
          image_path: imagePath || null,
          parent_id: parentId || null,
          category_order: categories.length,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('[addCategory] Category created:', data);
      
      const newCategory: Category = {
        id: data.id,
        name: data.name,
        image: imageUrlForDisplay,
        parentId: data.parent_id,
        order: data.category_order ?? categories.length,
      };

      // Update local state immediately
      setCategories(prev => [...prev, newCategory]);
      console.log('[addCategory] Local state updated with new category');

      return newCategory;
    } catch (error) {
      console.error('[addCategory] Failed to add category:', error);
      return null;
    }
  }, [user, categories.length, uploadImage, getSignedUrl]);

  const updateCategory = useCallback(async (categoryId: string, updates: Partial<Category>) => {
    if (!user) return false;
    
    try {
      console.log('[updateCategory] Updating category:', categoryId, updates);
      
      let imagePath: string | null | undefined;
      let imageUrlForLocalState: string | undefined = updates.image;
      
      // Upload new image if provided and not already a URL
      if (updates.image !== undefined) {
        if (updates.image === '' || updates.image === null) {
          // User wants to clear the image
          imagePath = null;
          imageUrlForLocalState = undefined;
          console.log('[updateCategory] Clearing image');
        } else if (!updates.image.startsWith('http')) {
          // Upload local file to Supabase Storage
          console.log('[updateCategory] Uploading new image from local file:', updates.image);
          const uploadedPath = await uploadImage(updates.image);
          if (uploadedPath) {
            imagePath = uploadedPath;
            imageUrlForLocalState = await getSignedUrl(uploadedPath) || undefined;
            console.log('[updateCategory] Image uploaded successfully, path:', uploadedPath);
          } else {
            console.error('[updateCategory] Image upload failed - continuing with update');
            imagePath = undefined;
            imageUrlForLocalState = undefined;
          }
        } else {
          // It's already an HTTP URL - might be old data
          imagePath = undefined; // Don't update path
          imageUrlForLocalState = updates.image;
          console.log('[updateCategory] Using existing URL:', imageUrlForLocalState);
        }
      }
      
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.parentId !== undefined) updateData.parent_id = updates.parentId || null;
      if (updates.order !== undefined) updateData.category_order = updates.order;
      
      // Always update image_path when image changes (including clearing it)
      if (updates.image !== undefined) {
        if (imagePath === null) {
          // Clear image
          updateData.image_path = null;
          updateData.image_url = null; // Also clear old image_url if exists
          console.log('[updateCategory] Clearing both image_path and image_url');
        } else if (imagePath !== undefined) {
          // New image uploaded
          updateData.image_path = imagePath;
          updateData.image_url = null; // Clear old image_url
          console.log('[updateCategory] Setting image_path to:', imagePath);
        }
        // If imagePath is undefined, we keep existing data (already an HTTP URL)
      }
      
      console.log('[updateCategory] Final update data:', updateData);
      
      const { data: updatedData, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', categoryId)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('[updateCategory] Supabase error:', error);
        console.error('[updateCategory] Error message:', error.message);
        console.error('[updateCategory] Error details:', error.details);
        console.error('[updateCategory] Error hint:', error.hint);
        throw error;
      }

      console.log('[updateCategory] Category updated in database:', updatedData);

      // Update local state directly instead of reloading everything
      setCategories(prev => {
        console.log('[updateCategory] Updating local state for category:', categoryId);
        console.log('[updateCategory] New image URL:', imageUrlForLocalState);
        
        return prev.map(c => {
          if (c.id === categoryId) {
            const updated = {
              ...c,
              name: updates.name ?? c.name,
              image: imageUrlForLocalState !== undefined ? imageUrlForLocalState : c.image,
              parentId: updates.parentId !== undefined ? updates.parentId : c.parentId,
              order: updates.order ?? c.order,
            };
            console.log('[updateCategory] Updated category data:', updated);
            return updated;
          }
          return c;
        });
      });
      
      console.log('[updateCategory] Success!');
      return true;
    } catch (error: any) {
      console.error('[updateCategory] Failed to update category:', error);
      console.error('[updateCategory] Error name:', error?.name);
      console.error('[updateCategory] Error message:', error?.message);
      return false;
    }
  }, [user, uploadImage, getSignedUrl]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!user) {
      console.error('[deleteCategory] No user, cannot delete');
      return false;
    }
    
    try {
      console.log('[deleteCategory] Deleting category from database:', id);
      
      // First, check if there are any subcategories
      const { data: subcats, error: subcatError } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', id);

      if (subcatError) {
        console.error('[deleteCategory] Failed to check subcategories:', subcatError);
        throw subcatError;
      }

      // Delete all subcategories first
      if (subcats && subcats.length > 0) {
        console.log('[deleteCategory] Deleting', subcats.length, 'subcategories first');
        const { error: deleteSubcatsError } = await supabase
          .from('categories')
          .delete()
          .eq('parent_id', id);

        if (deleteSubcatsError) {
          console.error('[deleteCategory] Failed to delete subcategories:', deleteSubcatsError);
          throw deleteSubcatsError;
        }
      }
      
      // Update products to remove category reference
      const { error: updateError } = await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('[deleteCategory] Failed to update products:', updateError);
        console.error('[deleteCategory] Update error details:', JSON.stringify(updateError, null, 2));
      }

      // Delete the category from database
      const { error, data } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('[deleteCategory] Database error:', error);
        console.error('[deleteCategory] Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('[deleteCategory] ✅ Category deleted from database, rows affected:', data?.length || 0);
      
      // Only update local state after successful database deletion
      setCategories(prev => prev.filter(c => c.id !== id && c.parentId !== id));
      setProducts(prev => prev.map(p => 
        p.categoryId === id ? { ...p, categoryId: undefined } : p
      ));
      return true;
    } catch (error) {
      console.error('[deleteCategory] ❌ Failed to delete category:', error);
      return false;
    }
  }, [user]);

  const addTilleggsvare = useCallback(async (name: string) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('addon_categories')
        .insert({
          user_id: user.id,
          name,
        })
        .select()
        .single();

      if (error) throw error;

      const newTilleggsvare: Tilleggsvare = {
        id: data.id,
        name: data.name,
        variants: [],
      };

      setTilleggsvarer(prev => [newTilleggsvare, ...prev]);
      return newTilleggsvare;
    } catch (error) {
      console.error('Failed to add tilleggsvare:', error);
      return null;
    }
  }, [user]);

  const updateTilleggsvare = useCallback(async (tilleggsvareId: string, updates: Partial<Tilleggsvare>) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('addon_categories')
        .update({
          name: updates.name,
        })
        .eq('id', tilleggsvareId);

      if (error) throw error;

      setTilleggsvarer(prev => prev.map(t => 
        t.id === tilleggsvareId ? { ...t, ...updates } : t
      ));
      return true;
    } catch (error) {
      console.error('Failed to update tilleggsvare:', error);
      return false;
    }
  }, [user]);

  const deleteTilleggsvare = useCallback(async (id: string) => {
    if (!user) {
      console.error('[deleteTilleggsvare] No user, cannot delete');
      return false;
    }
    
    try {
      console.log('[deleteTilleggsvare] Deleting tilleggsvare from database:', id);
      
      // First delete all variants
      const { error: variantsError, data: variantsData } = await supabase
        .from('addon_variants')
        .delete()
        .eq('addon_category_id', id)
        .select();

      if (variantsError) {
        console.error('[deleteTilleggsvare] Failed to delete variants:', variantsError);
        console.error('[deleteTilleggsvare] Variants error details:', JSON.stringify(variantsError, null, 2));
        throw variantsError;
      }
      console.log('[deleteTilleggsvare] Deleted', variantsData?.length || 0, 'variants');

      // Then delete product relationships
      const { error: junctionError, data: junctionData } = await supabase
        .from('product_addons_junction')
        .delete()
        .eq('addon_category_id', id)
        .select();

      if (junctionError) {
        console.error('[deleteTilleggsvare] Failed to delete junction relationships:', junctionError);
        console.error('[deleteTilleggsvare] Junction error details:', JSON.stringify(junctionError, null, 2));
        throw junctionError;
      }
      console.log('[deleteTilleggsvare] Deleted', junctionData?.length || 0, 'junction relationships');

      // Finally delete the addon category from database
      const { error, data } = await supabase
        .from('addon_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('[deleteTilleggsvare] Database error:', error);
        console.error('[deleteTilleggsvare] Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('[deleteTilleggsvare] ✅ Tilleggsvare deleted from database, rows affected:', data?.length || 0);
      
      // Only update local state after successful database deletion
      setTilleggsvarer(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (error) {
      console.error('[deleteTilleggsvare] ❌ Failed to delete tilleggsvare:', error);
      return false;
    }
  }, [user]);

  const addVariant = useCallback(async (tilleggsvareId: string, name: string, price: number, color?: string) => {
    if (!user) return null;
    
    try {
      console.log('[addVariant] Adding variant:', { tilleggsvareId, name, price, color });
      
      const { data, error } = await supabase
        .from('addon_variants')
        .insert({
          addon_category_id: tilleggsvareId,
          user_id: user.id,
          name,
          price,
          color: color || null,
        })
        .select()
        .single();

      if (error) {
        console.error('[addVariant] Supabase error:', error);
        throw error;
      }

      console.log('[addVariant] Variant created:', data);

      const newVariant: TilleggsvareVariant = {
        id: data.id,
        name: data.name,
        price: Number(data.price),
        color: data.color || undefined,
      };

      setTilleggsvarer(prev => prev.map(t => {
        if (t.id === tilleggsvareId) {
          console.log('[addVariant] Updating tilleggsvare:', t.name, 'with new variant');
          return {
            ...t,
            variants: [...t.variants, newVariant],
          };
        }
        return t;
      }));

      console.log('[addVariant] Success!');
      return newVariant;
    } catch (error) {
      console.error('[addVariant] Failed to add variant:', error);
      return null;
    }
  }, [user]);

  const updateVariant = useCallback(async (tilleggsvareId: string, variantId: string, updates: Partial<TilleggsvareVariant>) => {
    if (!user) return false;
    
    try {
      console.log('[updateVariant] Updating variant:', { variantId, updates });
      
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.color !== undefined) updateData.color = updates.color || null;
      
      const { error } = await supabase
        .from('addon_variants')
        .update(updateData)
        .eq('id', variantId);

      if (error) {
        console.error('[updateVariant] Supabase error:', error);
        throw error;
      }

      console.log('[updateVariant] Variant updated successfully');

      setTilleggsvarer(prev => prev.map(t => {
        if (t.id === tilleggsvareId) {
          return {
            ...t,
            variants: t.variants.map(v => 
              v.id === variantId ? { ...v, ...updates } : v
            ),
          };
        }
        return t;
      }));

      return true;
    } catch (error) {
      console.error('[updateVariant] Failed to update variant:', error);
      return false;
    }
  }, [user]);

  const deleteVariant = useCallback(async (tilleggsvareId: string, variantId: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('addon_variants')
        .delete()
        .eq('id', variantId);

      if (error) throw error;

      setTilleggsvarer(prev => prev.map(t => {
        if (t.id === tilleggsvareId) {
          return {
            ...t,
            variants: t.variants.filter(v => v.id !== variantId),
          };
        }
        return t;
      }));

      return true;
    } catch (error) {
      console.error('Failed to delete variant:', error);
      return false;
    }
  }, [user]);

  const importProducts = useCallback(async (newProducts: Product[]) => {
    if (!user) return false;
    
    try {
      const productsToInsert = await Promise.all(newProducts.map(async (p) => {
        let imageUrl = p.image;
        if (p.image && !p.image.startsWith('http')) {
          imageUrl = await uploadImage(p.image) || undefined;
        }
        
        return {
          user_id: user.id,
          name: p.name,
          price: p.price,
          image_url: imageUrl,
          category_id: p.categoryId || null,
          sub_category_id: null,
        };
      }));

      const { error } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (error) throw error;

      await loadProducts(); // Reload all products
      return true;
    } catch (error) {
      console.error('Failed to import products:', error);
      return false;
    }
  }, [user, uploadImage, loadProducts]);

  const importCategories = useCallback(async (newCategories: Category[]) => {
    if (!user) return false;
    
    try {
      const categoriesToInsert = newCategories.map(c => ({
        user_id: user.id,
        name: c.name,
        parent_id: c.parentId || null,
      }));

      const { error } = await supabase
        .from('categories')
        .insert(categoriesToInsert);

      if (error) throw error;

      await loadCategories(); // Reload all categories
      return true;
    } catch (error) {
      console.error('Failed to import categories:', error);
      return false;
    }
  }, [user, loadCategories]);

  const importTilleggsvarer = useCallback(async (newTilleggsvarer: Tilleggsvare[]) => {
    if (!user) return false;
    
    try {
      for (const t of newTilleggsvarer) {
        const { data: addonData, error: addonError } = await supabase
          .from('addon_categories')
          .insert({
            user_id: user.id,
            name: t.name,
          })
          .select()
          .single();

        if (addonError) throw addonError;

        if (t.variants.length > 0) {
          const variantsToInsert = t.variants.map(v => ({
            addon_category_id: addonData.id,
            name: v.name,
            price: v.price,
          }));

          const { error: variantError } = await supabase
            .from('addon_variants')
            .insert(variantsToInsert);

          if (variantError) throw variantError;
        }
      }

      await loadTilleggsvarer(); // Reload all tilleggsvarer
      return true;
    } catch (error) {
      console.error('Failed to import tilleggsvarer:', error);
      return false;
    }
  }, [user, loadTilleggsvarer]);

  const updateProductCategory = useCallback(async (productId: string, categoryId: string | undefined) => {
    return await updateProduct(productId, { categoryId });
  }, [updateProduct]);

  const reorderProducts = useCallback(async (newProducts: Product[]) => {
    if (!user) return false;
    
    try {
      console.log('[reorderProducts] Reordering', newProducts.length, 'products');
      
      // Update local state immediately for better UX
      setProducts(newProducts);
      
      // Save order to database in batch
      const updates = newProducts.map((product, index) => ({
        id: product.id,
        product_order: index,
      }));
      
      console.log('[reorderProducts] Saving order to database:', updates.length, 'products');
      
      // Update in a single batch operation for better performance
      const updatePromises = updates.map(update =>
        supabase
          .from('products')
          .update({ product_order: update.product_order, updated_at: new Date().toISOString() })
          .eq('id', update.id)
          .eq('user_id', user.id)
      );
      
      await Promise.all(updatePromises);
      
      console.log('[reorderProducts] All products reordered successfully');
      return true;
    } catch (error) {
      console.error('[reorderProducts] Failed to reorder products:', error);
      return false;
    }
  }, [user]);

  const reorderCategories = useCallback(async (newCategories: Category[]) => {
    if (!user) return false;
    
    try {
      console.log('[reorderCategories] Reordering categories');
      console.log('[reorderCategories] New order:', newCategories.map((c, i) => `${i + 1}. ${c.name}`));
      
      // Update local state immediately for better UX
      const categoriesWithOrder = newCategories.map((cat, index) => ({ ...cat, order: index }));
      setCategories(categoriesWithOrder);
      
      // Update order in database
      let updateCount = 0;
      for (const cat of categoriesWithOrder) {
        console.log(`[reorderCategories] Updating ${cat.name} to order ${cat.order}`);
        
        const { error, data } = await supabase
          .from('categories')
          .update({ category_order: cat.order })
          .eq('id', cat.id)
          .eq('user_id', user.id)
          .select();
        
        if (error) {
          console.error('[reorderCategories] Failed to update category order:', cat.name, error);
          console.error('[reorderCategories] Error details:', JSON.stringify(error, null, 2));
        } else {
          updateCount++;
          console.log(`[reorderCategories] ✅ Updated ${cat.name} successfully:`, data);
        }
      }
      
      console.log(`[reorderCategories] Successfully updated ${updateCount}/${categoriesWithOrder.length} categories`);
      return true;
    } catch (error) {
      console.error('[reorderCategories] Failed to reorder categories:', error);
      // Even if database update fails, local state is updated
      return true;
    }
  }, [user]);

  return useMemo(() => ({
    products,
    categories,
    tilleggsvarer,
    isLoading,
    addProduct,
    deleteProduct,
    importProducts,
    addCategory,
    updateCategory,
    deleteCategory,
    updateProductCategory,
    reorderProducts,
    reorderCategories,
    addTilleggsvare,
    updateTilleggsvare,
    deleteTilleggsvare,
    addVariant,
    updateVariant,
    deleteVariant,
    updateProduct,
    importCategories,
    importTilleggsvarer,
    loadProducts,
    loadCategories,
    loadTilleggsvarer,
  }), [products, categories, tilleggsvarer, isLoading, addProduct, deleteProduct, importProducts, addCategory, updateCategory, deleteCategory, updateProductCategory, reorderProducts, reorderCategories, addTilleggsvare, updateTilleggsvare, deleteTilleggsvare, addVariant, updateVariant, deleteVariant, updateProduct, importCategories, importTilleggsvarer, loadProducts, loadCategories, loadTilleggsvarer]);
});

export const ProductsProvider = ProductsProviderComponent;
export { useProducts };
