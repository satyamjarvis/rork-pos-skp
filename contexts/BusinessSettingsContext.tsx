import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface BusinessSettings {
  storeName: string;
  address: string;
  postalCode: string;
  city: string;
  mvaNumber: string;
  storeNumber: string;
  registerNumber: string;
  productColumns: number;
  phone?: string;
  email?: string;
  vatRate?: number;
  logo?: string;
}

const DEFAULT_SETTINGS: BusinessSettings = {
  storeName: '',
  address: '',
  postalCode: '',
  city: '',
  mvaNumber: '',
  storeNumber: '',
  registerNumber: '',
  productColumns: 4,
  phone: '',
  email: '',
  vatRate: 25,
  logo: '',
};

export const [BusinessSettingsProvider, useBusinessSettings] = createContextHook(() => {
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const createDefaultSettings = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('business_settings')
        .insert({
          user_id: user.id,
          business_name: profile?.company_name || 'Min Butikk',
          address: '',
          postal_code: '',
          city: '',
          org_number: '',
          phone: '',
          email: user.email || '',
          vat_rate: 25,
          product_columns: 4,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          storeName: data.business_name || '',
          address: data.address || '',
          postalCode: data.postal_code || '',
          city: data.city || '',
          mvaNumber: data.org_number || '',
          storeNumber: '',
          registerNumber: '',
          productColumns: Number(data.product_columns) || 4,
          phone: data.phone || '',
          email: data.email || '',
          vatRate: Number(data.vat_rate) || 25,
          logo: data.logo_url || '',
        });
      }
    } catch (error) {
      console.error('Failed to create default settings:', error);
    }
  }, [user]);

  const loadSettings = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          await createDefaultSettings();
        } else {
          throw error;
        }
      } else if (data) {
        console.log('[loadSettings] Loaded data from database:', data);
        console.log('[loadSettings] Product columns from DB:', data.product_columns);
        
        const productColumns = data.product_columns ? Number(data.product_columns) : 4;
        console.log('[loadSettings] Product columns parsed:', productColumns);
        
        setSettings({
          storeName: data.business_name || '',
          address: data.address || '',
          postalCode: data.postal_code || '',
          city: data.city || '',
          mvaNumber: data.org_number || '',
          storeNumber: '',
          registerNumber: '',
          productColumns: productColumns,
          phone: data.phone || '',
          email: data.email || '',
          vatRate: Number(data.vat_rate) || 25,
          logo: data.logo_url || '',
        });
      }
    } catch (error) {
      console.error('Failed to load business settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, createDefaultSettings]);

  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setSettings(DEFAULT_SETTINGS);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const updateSettings = useCallback(async (newSettings: BusinessSettings) => {
    if (!user) return false;
    
    try {
      console.log('[updateSettings] Updating settings:', newSettings);
      console.log('[updateSettings] Product columns value:', newSettings.productColumns);
      console.log('[updateSettings] User ID:', user.id);
      
      // First check if record exists
      const { data: existingData, error: fetchError } = await supabase
        .from('business_settings')
        .select('id, product_columns')
        .eq('user_id', user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('[updateSettings] Error checking existing record:', fetchError);
        throw fetchError;
      }
      
      if (!existingData) {
        console.error('[updateSettings] No business_settings record found for user');
        return false;
      }
      
      console.log('[updateSettings] Current product_columns in DB:', existingData.product_columns);
      
      const { data: updatedData, error } = await supabase
        .from('business_settings')
        .update({
          business_name: newSettings.storeName,
          address: newSettings.address,
          postal_code: newSettings.postalCode || '',
          city: newSettings.city,
          org_number: newSettings.mvaNumber,
          phone: newSettings.phone || '',
          email: newSettings.email || '',
          vat_rate: newSettings.vatRate || 25,
          logo_url: newSettings.logo || '',
          product_columns: newSettings.productColumns,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('[updateSettings] Supabase error:', error);
        console.error('[updateSettings] Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('[updateSettings] Settings updated in database');
      console.log('[updateSettings] Updated data from DB:', updatedData);
      setSettings(newSettings);
      console.log('[updateSettings] Local state updated. New settings:', newSettings);
      return true;
    } catch (error) {
      console.error('[updateSettings] Failed to save business settings:', error);
      return false;
    }
  }, [user]);

  const uploadLogo = useCallback(async (imageUri: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const fileName = `${user.id}/logo_${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Failed to upload logo:', error);
      return null;
    }
  }, [user]);

  return useMemo(() => ({
    settings,
    isLoading,
    updateSettings,
    uploadLogo,
  }), [settings, isLoading, updateSettings, uploadLogo]);
});