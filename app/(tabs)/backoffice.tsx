import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
  PanResponder,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Trash2, FolderPlus, X, Check, ImageIcon, Edit3, Ruler, Grid3x3, Grid2x2, Package, Printer, Power, Activity, GripVertical, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, User, LogOut, Search, Wifi, Filter } from 'lucide-react-native';
import ColorPicker from '@/components/ColorPicker';
import { useProducts, Product, ProductSize, Tilleggsvare, Category, TilleggsvareVariant } from '@/contexts/ProductsContext';
import { useBusinessSettings } from '@/contexts/BusinessSettingsContext';
import { usePrinter, type Printer as PrinterType, type PrinterType as PrinterTypeEnum, type PaperWidth } from '@/contexts/PrinterContext';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';




type ProductSizeView = 'small' | 'medium' | 'large';

export default function BackofficeScreen() {
  const insets = useSafeAreaInsets();
  
  const { products, categories, tilleggsvarer, addProduct, deleteProduct, addCategory, updateCategory, deleteCategory, updateProduct, addTilleggsvare, updateTilleggsvare, deleteTilleggsvare, addVariant, updateVariant, deleteVariant, reorderProducts, reorderCategories, importProducts, importCategories, importTilleggsvarer } = useProducts();
  const { settings, updateSettings } = useBusinessSettings();
  const { user, signOut, deleteAccount } = useAuth();
  
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedParentCategory, setSelectedParentCategory] = useState<string | undefined>(undefined);
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [showEditTilleggsvare, setShowEditTilleggsvare] = useState(false);
  const [editingTilleggsvare, setEditingTilleggsvare] = useState<Tilleggsvare | null>(null);
  const [showAddTilleggsvare, setShowAddTilleggsvare] = useState(false);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [selectedTilleggsvare, setSelectedTilleggsvare] = useState<Tilleggsvare | null>(null);

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categorySelectionMode, setCategorySelectionMode] = useState(false);
  const [selectedTilleggsvareIdsForDelete, setSelectedTilleggsvareIdsForDelete] = useState<string[]>([]);
  const [tilleggsvareSelectionMode, setTilleggsvareSelectionMode] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderType, setReorderType] = useState<'products' | 'categories' | null>(null);
  const [draggingProductId, setDraggingProductId] = useState<string | null>(null);
  const [isDraggingProduct, setIsDraggingProduct] = useState(false);
  const [draggedProductOverIndex, setDraggedProductOverIndex] = useState<number | null>(null);
  const [isDraggingCategory, setIsDraggingCategory] = useState(false);
  const [reorderMode, setReorderMode] = useState<'products' | 'categories'>('products');
  const [selectedParentForSubcatReorder, setSelectedParentForSubcatReorder] = useState<string | null>(null);
  const [editingSubcatPositionId, setEditingSubcatPositionId] = useState<string | null>(null);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [tempPositionValue, setTempPositionValue] = useState<string>('');
  const [selectedCategoryForReorder, setSelectedCategoryForReorder] = useState<string | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productCategoryId, setProductCategoryId] = useState<string | undefined>(undefined);
  const [productSizes, setProductSizes] = useState<ProductSize[]>([]);
  const [hasSize, setHasSize] = useState(false);
  const [selectedTilleggsvareIds, setSelectedTilleggsvareIds] = useState<string[]>([]);
  
  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState<string | undefined>(undefined);
  
  const [tilleggsvareNavn, setTilleggsvareNavn] = useState('');
  const [variantNavn, setVariantNavn] = useState('');
  const [variantPris, setVariantPris] = useState('');
  const [variantColor, setVariantColor] = useState<string | undefined>(undefined);
  const [customColor, setCustomColor] = useState('');
  const [editingVariant, setEditingVariant] = useState<TilleggsvareVariant | null>(null);
  const [showEditVariant, setShowEditVariant] = useState(false);

  const [newSizeName, setNewSizeName] = useState('');
  const [newSizePrice, setNewSizePrice] = useState('');

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'tilleggsvarer' | 'printers' | 'import' | 'settings' | 'profile' | 'reorder'>('products');


  const { printers, printLogs, addPrinter, updatePrinter, deletePrinter, selectUSBPrinter, printToUSB, scanForPrinters, isScanning, discoveredPrinters, scanProgress, scanDebugLog } = usePrinter();
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [printerName, setPrinterName] = useState('');
  const [printerIP, setPrinterIP] = useState('');
  const [printerType, setPrinterType] = useState<PrinterTypeEnum>('kitchen');
  const [printerPaperWidth, setPrinterPaperWidth] = useState<PaperWidth>(58);
  const [connectionType, setConnectionType] = useState<'network' | 'usb'>('network');
  const [testingPrinter, setTestingPrinter] = useState<string | null>(null);
  const [showDiscoveredPrinters, setShowDiscoveredPrinters] = useState(false);
  const [showScanDebug, setShowScanDebug] = useState(false);

  const [importFile, setImportFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [parsedImportData, setParsedImportData] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState<string>('');

  const pickImage = async (setImageFunc: (uri: string) => void) => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Velg bildekilde',
        'Hvor vil du hente bildet fra?',
        [
          {
            text: 'Velg fil',
            onPress: () => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = async (e: any) => {
                const file = e.target?.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) {
                      setImageFunc(event.target.result as string);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            },
          },
          { text: 'Avbryt', style: 'cancel' },
        ]
      );
      return;
    }

    Alert.alert(
      'Velg bildekilde',
      'Hvor vil du hente bildet fra?',
      [
        {
          text: 'Bildebibliotek',
          onPress: async () => {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (!permissionResult.granted) {
              Alert.alert('Tillatelse nødvendig', 'Vi trenger tillatelse til å få tilgang til bildene dine');
              return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              setImageFunc(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Ta bilde',
          onPress: async () => {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            
            if (!permissionResult.granted) {
              Alert.alert('Tillatelse nødvendig', 'Vi trenger tillatelse til å bruke kameraet');
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              setImageFunc(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Velg fil',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*'],
                copyToCacheDirectory: true,
              });

              if (!result.canceled && result.assets[0]) {
                setImageFunc(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Error picking file:', error);
              Alert.alert('Feil', 'Kunne ikke hente fil');
            }
          },
        },
        { text: 'Avbryt', style: 'cancel' },
      ]
    );
  };

  const handleAddProduct = async () => {
    const price = parseFloat(productPrice);
    if (!productName.trim()) {
      Alert.alert('Feil', 'Produktnavn er påkrevd');
      return;
    }
    if (!productCategoryId) {
      Alert.alert('Feil', 'Du må velge en kategori');
      return;
    }
    
    const selectedCategory = categories.find(c => c.id === productCategoryId);
    const hasSubcategories = categories.some(c => c.parentId === productCategoryId);
    if (hasSubcategories) {
      Alert.alert('Feil', `Kategorien "${selectedCategory?.name}" har underkategorier. Du kan bare legge produkter på underkategorier eller kategorier uten underkategorier.`);
      return;
    }
    
    if (!hasSize && (!price || price <= 0)) {
      Alert.alert('Feil', 'Fyll inn pris');
      return;
    }
    if (hasSize && productSizes.length === 0) {
      Alert.alert('Feil', 'Legg til minst én størrelse');
      return;
    }
    
    console.log('[handleAddProduct] Creating product:', productName);
    
    // First create the product in database
    const createdProduct = await addProduct(productName.trim(), hasSize ? 0 : price);
    
    if (!createdProduct) {
      Alert.alert('Feil', 'Kunne ikke lagre produkt til database');
      return;
    }

    console.log('[handleAddProduct] Product created, updating with details');
    
    // Then update it with the full details
    const success = await updateProduct(createdProduct.id, {
      name: productName.trim(),
      price: hasSize ? 0 : price,
      image: productImage.trim() || undefined,
      categoryId: productCategoryId,
      sizes: hasSize ? productSizes : undefined,
      hasSize: hasSize,
      tilleggsvareIds: selectedTilleggsvareIds.length > 0 ? selectedTilleggsvareIds : undefined,
    });
    
    if (success) {
      console.log('[handleAddProduct] Product saved successfully');
      setProductName('');
      setProductPrice('');
      setProductImage('');
      setProductCategoryId(undefined);
      setProductSizes([]);
      setHasSize(false);
      setSelectedTilleggsvareIds([]);
      setShowAddProduct(false);
      Alert.alert('Suksess', 'Produkt lagt til og lagret i database');
    } else {
      Alert.alert('Feil', 'Kunne ikke lagre produktdetaljer');
    }
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductPrice(product.price.toString());
    setProductImage(product.image || '');
    setProductCategoryId(product.categoryId);
    setProductSizes(product.sizes || []);
    setHasSize(!!product.hasSize);
    setSelectedTilleggsvareIds(product.tilleggsvareIds || []);
    setShowEditProduct(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    
    const price = parseFloat(productPrice);
    if (!productName.trim()) {
      Alert.alert('Feil', 'Produktnavn er påkrevd');
      return;
    }
    if (!productCategoryId) {
      Alert.alert('Feil', 'Du må velge en kategori');
      return;
    }
    
    const selectedCategory = categories.find(c => c.id === productCategoryId);
    const hasSubcategories = categories.some(c => c.parentId === productCategoryId);
    if (hasSubcategories) {
      Alert.alert('Feil', `Kategorien "${selectedCategory?.name}" har underkategorier. Du kan bare legge produkter på underkategorier eller kategorier uten underkategorier.`);
      return;
    }
    
    if (!hasSize && (!price || price <= 0)) {
      Alert.alert('Feil', 'Fyll inn pris');
      return;
    }
    if (hasSize && productSizes.length === 0) {
      Alert.alert('Feil', 'Legg til minst én størrelse');
      return;
    }

    const success = await updateProduct(editingProduct.id, {
      name: productName.trim(),
      price: hasSize ? 0 : price,
      image: productImage.trim() || undefined,
      categoryId: productCategoryId,
      sizes: hasSize ? productSizes : undefined,
      hasSize: hasSize,
      tilleggsvareIds: selectedTilleggsvareIds.length > 0 ? selectedTilleggsvareIds : undefined,
    });
    
    if (success) {
      setEditingProduct(null);
      setProductName('');
      setProductPrice('');
      setProductImage('');
      setProductCategoryId(undefined);
      setProductSizes([]);
      setHasSize(false);
      setSelectedTilleggsvareIds([]);
      setShowEditProduct(false);
      Alert.alert('Suksess', 'Produkt oppdatert');
    } else {
      Alert.alert('Feil', 'Kunne ikke oppdatere produkt');
    }
  };

  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      'Slett produkt',
      'Er du sikker på at du vil slette dette produktet?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(productId);
          },
        },
      ]
    );
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Slett valgte produkter',
      `Er du sikker på at du vil slette ${selectedProductIds.length} produkter?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            for (const id of selectedProductIds) {
              await deleteProduct(id);
            }
            setSelectedProductIds([]);
            setSelectionMode(false);
          },
        },
      ]
    );
  };

  const toggleProductSelection = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
    } else {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map(p => p.id));
    }
  };

  const toggleCategorySelection = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== categoryId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
    }
  };

  const toggleSelectAllCategories = () => {
    const topLevelCategories = categories.filter(c => !c.parentId);
    if (selectedCategoryIds.length === topLevelCategories.length) {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds(topLevelCategories.map(c => c.id));
    }
  };

  const handleDeleteSelectedCategories = () => {
    Alert.alert(
      'Slett valgte kategorier',
      `Er du sikker på at du vil slette ${selectedCategoryIds.length} kategorier?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            for (const id of selectedCategoryIds) {
              await deleteCategory(id);
            }
            setSelectedCategoryIds([]);
            setCategorySelectionMode(false);
          },
        },
      ]
    );
  };

  const toggleTilleggsvareSelection = (tilleggsvareId: string) => {
    if (selectedTilleggsvareIdsForDelete.includes(tilleggsvareId)) {
      setSelectedTilleggsvareIdsForDelete(selectedTilleggsvareIdsForDelete.filter(id => id !== tilleggsvareId));
    } else {
      setSelectedTilleggsvareIdsForDelete([...selectedTilleggsvareIdsForDelete, tilleggsvareId]);
    }
  };

  const toggleSelectAllTilleggsvarer = () => {
    if (selectedTilleggsvareIdsForDelete.length === tilleggsvarer.length) {
      setSelectedTilleggsvareIdsForDelete([]);
    } else {
      setSelectedTilleggsvareIdsForDelete(tilleggsvarer.map(t => t.id));
    }
  };

  const handleDeleteSelectedTilleggsvarer = () => {
    Alert.alert(
      'Slett valgte tilleggsvarer',
      `Er du sikker på at du vil slette ${selectedTilleggsvareIdsForDelete.length} tilleggsvarer?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            for (const id of selectedTilleggsvareIdsForDelete) {
              await deleteTilleggsvare(id);
            }
            setSelectedTilleggsvareIdsForDelete([]);
            setTilleggsvareSelectionMode(false);
          },
        },
      ]
    );
  };

  const handleAddCategory = async () => {
    if (categoryName.trim()) {
      const result = await addCategory(categoryName.trim(), categoryImage.trim() || undefined, parentCategoryId);
      if (result) {
        setCategoryName('');
        setCategoryImage('');
        setParentCategoryId(undefined);
        setShowAddCategory(false);
        Alert.alert('Suksess', 'Kategori opprettet');
      }
    }
  };

  const handleOpenEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryImage(category.image || '');
    setParentCategoryId(category.parentId);
    setShowEditCategory(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    
    if (categoryName.trim()) {
      const success = await updateCategory(editingCategory.id, {
        name: categoryName.trim(),
        image: categoryImage.trim() || undefined,
        parentId: parentCategoryId,
      });
      
      if (success) {
        setEditingCategory(null);
        setCategoryName('');
        setCategoryImage('');
        setParentCategoryId(undefined);
        setShowEditCategory(false);
        Alert.alert('Suksess', 'Kategori oppdatert');
      } else {
        Alert.alert('Feil', 'Kunne ikke oppdatere kategori');
      }
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    Alert.alert(
      'Slett kategori',
      'Er du sikker på at du vil slette denne kategorien?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            await deleteCategory(categoryId);
          },
        },
      ]
    );
  };

  const handleAddTilleggsvare = async () => {
    if (tilleggsvareNavn.trim()) {
      const result = await addTilleggsvare(tilleggsvareNavn.trim());
      if (result) {
        setTilleggsvareNavn('');
        setShowAddTilleggsvare(false);
        Alert.alert('Suksess', 'Tilleggsvare opprettet');
      }
    }
  };

  const handleOpenEditTilleggsvare = (tilleggsvare: Tilleggsvare) => {
    setEditingTilleggsvare(tilleggsvare);
    setTilleggsvareNavn(tilleggsvare.name);
    setShowEditTilleggsvare(true);
  };

  const handleUpdateTilleggsvare = async () => {
    if (!editingTilleggsvare) return;
    
    if (tilleggsvareNavn.trim()) {
      const success = await updateTilleggsvare(editingTilleggsvare.id, {
        name: tilleggsvareNavn.trim(),
      });
      
      if (success) {
        setEditingTilleggsvare(null);
        setTilleggsvareNavn('');
        setShowEditTilleggsvare(false);
        Alert.alert('Suksess', 'Tilleggsvare oppdatert');
      } else {
        Alert.alert('Feil', 'Kunne ikke oppdatere tilleggsvare');
      }
    }
  };

  const handleDeleteTilleggsvare = (tilleggsvareId: string) => {
    Alert.alert(
      'Slett tilleggsvare',
      'Er du sikker på at du vil slette denne tilleggsvaren?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            await deleteTilleggsvare(tilleggsvareId);
          },
        },
      ]
    );
  };

  const handleOpenVariants = (tilleggsvare: Tilleggsvare) => {
    setSelectedTilleggsvare(tilleggsvare);
    setVariantNavn('');
    setVariantPris('');
    setVariantColor(undefined);
    setCustomColor('');
    setEditingVariant(null);
    setShowEditVariant(false);
    setShowVariantsModal(true);
  };

  const handleAddVariant = async () => {
    if (!selectedTilleggsvare) return;
    
    const pris = parseFloat(variantPris);
    if (!variantNavn.trim() || isNaN(pris) || pris < 0) {
      Alert.alert('Feil', 'Fyll inn navn og pris');
      return;
    }
    
    let finalColor = variantColor;
    if (customColor.trim()) {
      finalColor = customColor.trim();
    }
    
    const result = await addVariant(selectedTilleggsvare.id, variantNavn.trim(), pris, finalColor);
    if (result) {
      setVariantNavn('');
      setVariantPris('');
      setVariantColor(undefined);
      setCustomColor('');
    } else {
      Alert.alert('Feil', 'Kunne ikke lagre variant');
    }
  };

  const handleOpenEditVariant = (variant: TilleggsvareVariant) => {
    setEditingVariant(variant);
    setVariantNavn(variant.name);
    setVariantPris(variant.price.toString());
    if (variant.color) {
      setCustomColor(variant.color);
      setVariantColor(undefined);
    } else {
      setVariantColor(undefined);
      setCustomColor('');
    }
    setShowEditVariant(true);
  };

  const handleUpdateVariant = async () => {
    if (!selectedTilleggsvare || !editingVariant) return;
    
    const pris = parseFloat(variantPris);
    if (!variantNavn.trim() || isNaN(pris) || pris < 0) {
      Alert.alert('Feil', 'Fyll inn navn og pris');
      return;
    }
    
    let finalColor: string | undefined = variantColor;
    if (customColor.trim()) {
      finalColor = customColor.trim();
    }
    
    const success = await updateVariant(selectedTilleggsvare.id, editingVariant.id, {
      name: variantNavn.trim(),
      price: pris,
      color: finalColor,
    });
    
    if (success) {
      setEditingVariant(null);
      setVariantNavn('');
      setVariantPris('');
      setVariantColor(undefined);
      setCustomColor('');
      setShowEditVariant(false);
      Alert.alert('Suksess', 'Variant oppdatert');
    } else {
      Alert.alert('Feil', 'Kunne ikke oppdatere variant');
    }
  };

  const handleDeleteVariant = (variantId: string) => {
    if (!selectedTilleggsvare) return;
    
    Alert.alert(
      'Slett variant',
      'Er du sikker på at du vil slette denne varianten?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteVariant(selectedTilleggsvare.id, variantId);
            if (!success) {
              Alert.alert('Feil', 'Kunne ikke slette variant');
            }
          },
        },
      ]
    );
  };





  const handleAddSize = () => {
    const price = parseFloat(newSizePrice);
    if (newSizeName.trim() && price > 0) {
      const newSize: ProductSize = {
        id: `size_${Date.now()}_${Math.random()}`,
        name: newSizeName.trim(),
        price: price,
      };
      setProductSizes([...productSizes, newSize]);
      setNewSizeName('');
      setNewSizePrice('');
    }
  };

  const handleRemoveSize = (sizeId: string) => {
    setProductSizes(productSizes.filter(s => s.id !== sizeId));
  };





  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Backoffice</Text>
        </View>

        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabNav}>
          <View style={styles.tabNavContent}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'products' && styles.tabButtonActive]}
              onPress={() => setActiveTab('products')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'products' && styles.tabButtonTextActive]}>Produkter</Text>
              <Text style={[styles.tabCount, activeTab === 'products' && styles.tabCountActive]}>{products.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'categories' && styles.tabButtonActive]}
              onPress={() => setActiveTab('categories')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'categories' && styles.tabButtonTextActive]}>Kategorier</Text>
              <Text style={[styles.tabCount, activeTab === 'categories' && styles.tabCountActive]}>{categories.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'tilleggsvarer' && styles.tabButtonActive]}
              onPress={() => setActiveTab('tilleggsvarer')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'tilleggsvarer' && styles.tabButtonTextActive]}>Tilleggsvarer</Text>
              <Text style={[styles.tabCount, activeTab === 'tilleggsvarer' && styles.tabCountActive]}>{tilleggsvarer.length}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'printers' && styles.tabButtonActive]}
              onPress={() => setActiveTab('printers')}
            >
              <Printer size={16} color={activeTab === 'printers' ? '#fff' : '#6B7280'} />
              <Text style={[styles.tabButtonText, activeTab === 'printers' && styles.tabButtonTextActive]}>Printere</Text>
              <Text style={[styles.tabCount, activeTab === 'printers' && styles.tabCountActive]}>{printers.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'import' && styles.tabButtonActive]}
              onPress={() => setActiveTab('import')}
            >
              <Upload size={16} color={activeTab === 'import' ? '#fff' : '#6B7280'} />
              <Text style={[styles.tabButtonText, activeTab === 'import' && styles.tabButtonTextActive]}>Importer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'settings' && styles.tabButtonActive]}
              onPress={() => setActiveTab('settings')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'settings' && styles.tabButtonTextActive]}>Innstillinger</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'reorder' && styles.tabButtonActive]}
              onPress={() => setActiveTab('reorder')}
            >
              <GripVertical size={16} color={activeTab === 'reorder' ? '#fff' : '#6B7280'} />
              <Text style={[styles.tabButtonText, activeTab === 'reorder' && styles.tabButtonTextActive]}>Bytt plass</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'profile' && styles.tabButtonActive]}
              onPress={() => setActiveTab('profile')}
            >
              <User size={16} color={activeTab === 'profile' ? '#fff' : '#6B7280'} />
              <Text style={[styles.tabButtonText, activeTab === 'profile' && styles.tabButtonTextActive]}>Profil</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {activeTab === 'reorder' ? (
        <KeyboardAvoidingView 
          style={styles.reorderFullScreenContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <View style={styles.reorderTypeSelection}>
            <TouchableOpacity
              style={[styles.reorderTypeButton, reorderMode === 'products' && styles.reorderTypeButtonActive]}
              onPress={() => {
                setReorderMode('products');
                setSelectedCategoryForReorder(null);
              }}
            >
              <Package size={20} color={reorderMode === 'products' ? '#fff' : '#6B7280'} />
              <Text style={[styles.reorderTypeButtonText, reorderMode === 'products' && styles.reorderTypeButtonTextActive]}>Produkter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reorderTypeButton, reorderMode === 'categories' && styles.reorderTypeButtonActive]}
              onPress={() => {
                setReorderMode('categories');
                setSelectedCategoryForReorder(null);
              }}
            >
              <FolderPlus size={20} color={reorderMode === 'categories' ? '#fff' : '#6B7280'} />
              <Text style={[styles.reorderTypeButtonText, reorderMode === 'categories' && styles.reorderTypeButtonTextActive]}>Kategorier</Text>
            </TouchableOpacity>
          </View>

          {reorderMode === 'products' && (
            !selectedCategoryForReorder ? (
              <ScrollView style={styles.reorderFullScreenScroll}>
                <Text style={styles.reorderInstructionText}>Velg en kategori for å endre rekkefølgen på produktene</Text>
                <View style={styles.categorySelectionList}>
                  {categories
                    .filter(cat => !cat.parentId)
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((category) => {
                      const productsInCategory = products.filter(p => p.categoryId === category.id);
                      const subcategories = categories.filter(sub => sub.parentId === category.id);
                      const hasProducts = productsInCategory.length > 0;
                      const hasSubcatsWithProducts = subcategories.some(sub => products.filter(p => p.categoryId === sub.id).length > 0);
                      
                      if (!hasProducts && !hasSubcatsWithProducts) return null;
                      
                      return (
                        <View key={category.id}>
                          {hasProducts && (
                            <TouchableOpacity
                              style={styles.categorySelectionCard}
                              onPress={() => setSelectedCategoryForReorder(category.id)}
                            >
                              {category.image ? (
                                <Image source={{ uri: category.image }} style={styles.categorySelectionImage} />
                              ) : (
                                <View style={[styles.categorySelectionImage, styles.categorySelectionPlaceholder]}>
                                  <FolderPlus size={32} color="#10B981" />
                                </View>
                              )}
                              <View style={styles.categorySelectionInfo}>
                                <Text style={styles.categorySelectionName}>{category.name}</Text>
                                <Text style={styles.categorySelectionCount}>{productsInCategory.length} produkter</Text>
                              </View>
                            </TouchableOpacity>
                          )}
                          {subcategories.map((subcat) => {
                            const subcatProducts = products.filter(p => p.categoryId === subcat.id);
                            if (subcatProducts.length === 0) return null;
                            
                            return (
                              <TouchableOpacity
                                key={subcat.id}
                                style={[styles.categorySelectionCard, styles.categorySelectionCardSubcategory]}
                                onPress={() => setSelectedCategoryForReorder(subcat.id)}
                              >
                                {subcat.image ? (
                                  <Image source={{ uri: subcat.image }} style={styles.categorySelectionImage} />
                                ) : (
                                  <View style={[styles.categorySelectionImage, styles.categorySelectionPlaceholder]}>
                                    <FolderPlus size={32} color="#10B981" />
                                  </View>
                                )}
                                <View style={styles.categorySelectionInfo}>
                                  <Text style={styles.categorySelectionParentName}>{category.name} →</Text>
                                  <Text style={styles.categorySelectionName}>{subcat.name}</Text>
                                  <Text style={styles.categorySelectionCount}>{subcatProducts.length} produkter</Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      );
                    })}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.reorderWithBackContainer}>
                <View style={styles.reorderBackHeader}>
                  <TouchableOpacity
                    style={styles.reorderBackButton}
                    onPress={() => setSelectedCategoryForReorder(null)}
                  >
                    <X size={20} color="#10B981" />
                    <Text style={styles.reorderBackText}>Tilbake til kategorier</Text>
                  </TouchableOpacity>
                  <Text style={styles.reorderCategoryTitle}>
                    {categories.find(c => c.id === selectedCategoryForReorder)?.name}
                  </Text>
                </View>
                <ScrollView 
                  style={styles.reorderFullScreenScroll}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.reorderList}>
                    {products
                      .filter(p => p.categoryId === selectedCategoryForReorder)
                      .map((product, index, filteredProducts) => {
                        const isEditing = editingPositionId === product.id;
                        const globalIndex = products.findIndex(p => p.id === product.id);
                        
                        return (
                          <View key={product.id} style={[styles.reorderNumberItem, isEditing && styles.reorderNumberItemEditing]}>
                            {isEditing ? (
                              <View style={styles.reorderEditRow}>
                                <View style={styles.reorderNumberInputContainer}>
                                  <TextInput
                                    style={styles.reorderNumberInput}
                                    value={tempPositionValue}
                                    onChangeText={setTempPositionValue}
                                    keyboardType="number-pad"
                                    selectTextOnFocus
                                    autoFocus
                                  />
                                </View>
                                <TouchableOpacity
                                  style={styles.reorderConfirmButton}
                                  onPress={() => {
                                    const newPosition = parseInt(tempPositionValue) || 1;
                                    if (newPosition >= 1 && newPosition <= filteredProducts.length && newPosition !== index + 1) {
                                      const allProducts = [...products];
                                      const productsInCategory = allProducts.filter(p => p.categoryId === selectedCategoryForReorder);
                                      const otherProducts = allProducts.filter(p => p.categoryId !== selectedCategoryForReorder);
                                      
                                      const item = productsInCategory[index];
                                      productsInCategory.splice(index, 1);
                                      productsInCategory.splice(newPosition - 1, 0, item);
                                      
                                      const reorderedProducts = [...otherProducts, ...productsInCategory];
                                      reorderProducts(reorderedProducts);
                                    }
                                    setEditingPositionId(null);
                                    setTempPositionValue('');
                                  }}
                                >
                                  <Check size={20} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.reorderCancelButton}
                                  onPress={() => {
                                    setEditingPositionId(null);
                                    setTempPositionValue('');
                                  }}
                                >
                                  <X size={20} color="#6B7280" />
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.reorderNumberInputContainer}
                                onPress={() => {
                                  setEditingPositionId(product.id);
                                  setTempPositionValue((index + 1).toString());
                                }}
                              >
                                <Text style={styles.reorderNumberText}>{index + 1}</Text>
                                <Edit3 size={14} color="#10B981" style={styles.reorderEditIcon} />
                              </TouchableOpacity>
                            )}
                            {!isEditing && (
                              <>
                                {product.image ? (
                                  <Image source={{ uri: product.image }} style={styles.reorderItemImage} />
                                ) : (
                                  <View style={[styles.reorderItemImage, { backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }]}>
                                    <ImageIcon size={20} color="#9CA3AF" />
                                  </View>
                                )}
                                <View style={styles.reorderItemInfo}>
                                  <Text style={styles.reorderItemName} numberOfLines={1}>{product.name}</Text>
                                  <Text style={styles.reorderItemPrice}>{product.price.toFixed(2)} kr</Text>
                                </View>
                              </>
                            )}
                          </View>
                        );
                      })}
                  </View>
                </ScrollView>
              </View>
            )
          )}

          {reorderMode === 'categories' && (
            !selectedParentForSubcatReorder ? (
              <ScrollView 
                style={styles.reorderFullScreenScroll}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.reorderList}>
                  {categories
                    .filter(cat => !cat.parentId)
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((category, index, filteredCategories) => {
                      const subcategories = categories.filter(sub => sub.parentId === category.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                      const isEditing = editingPositionId === category.id;
                      return (
                        <View key={category.id}>
                          <View style={[styles.reorderNumberItem, isEditing && styles.reorderNumberItemEditing]}>
                            {isEditing ? (
                              <View style={styles.reorderEditRow}>
                                <View style={styles.reorderNumberInputContainer}>
                                  <TextInput
                                    style={styles.reorderNumberInput}
                                    value={tempPositionValue}
                                    onChangeText={setTempPositionValue}
                                    keyboardType="number-pad"
                                    selectTextOnFocus
                                    autoFocus
                                  />
                                </View>
                                <TouchableOpacity
                                  style={styles.reorderConfirmButton}
                                  onPress={async () => {
                                    const newPosition = parseInt(tempPositionValue) || 1;
                                    if (newPosition >= 1 && newPosition <= filteredCategories.length && newPosition !== index + 1) {
                                      console.log('[CategoryReorder] Moving from', index + 1, 'to', newPosition);
                                      
                                      const newOrder = [...filteredCategories];
                                      const item = newOrder.splice(index, 1)[0];
                                      newOrder.splice(newPosition - 1, 0, item);
                                      
                                      console.log('[CategoryReorder] New order:', newOrder.map(c => c.name));
                                      
                                      const subcategories = categories.filter(c => c.parentId);
                                      const reorderedWithOrder = newOrder.map((cat, idx) => ({
                                        ...cat,
                                        order: idx
                                      }));
                                      
                                      const allCategories = [...reorderedWithOrder, ...subcategories];
                                      console.log('[CategoryReorder] Saving all categories:', allCategories.map(c => ({ name: c.name, order: c.order })));
                                      
                                      await reorderCategories(allCategories);
                                    }
                                    setEditingPositionId(null);
                                    setTempPositionValue('');
                                  }}
                                >
                                  <Check size={20} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.reorderCancelButton}
                                  onPress={() => {
                                    setEditingPositionId(null);
                                    setTempPositionValue('');
                                  }}
                                >
                                  <X size={20} color="#6B7280" />
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.reorderNumberInputContainer}
                                onPress={() => {
                                  setEditingPositionId(category.id);
                                  setTempPositionValue((index + 1).toString());
                                }}
                              >
                                <Text style={styles.reorderNumberText}>{index + 1}</Text>
                                <Edit3 size={14} color="#10B981" style={styles.reorderEditIcon} />
                              </TouchableOpacity>
                            )}
                            {!isEditing && (
                              <>
                                {category.image ? (
                                  <Image source={{ uri: category.image }} style={styles.reorderItemImage} />
                                ) : (
                                  <View style={[styles.reorderItemImage, { backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }]}>
                                    <FolderPlus size={20} color="#9CA3AF" />
                                  </View>
                                )}
                                <View style={styles.reorderItemInfo}>
                                  <Text style={styles.reorderItemName} numberOfLines={1}>{category.name}</Text>
                                  {subcategories.length > 0 && (
                                    <Text style={styles.reorderItemSubtext}>{subcategories.length} underkategorier</Text>
                                  )}
                                </View>
                              </>
                            )}
                          </View>
                          {subcategories.length > 0 && (
                            <View style={styles.reorderSubcategoriesList}>
                              {subcategories.map((subcat) => (
                                <TouchableOpacity 
                                  key={subcat.id} 
                                  style={styles.reorderSubcategoryItemClickable}
                                  onPress={() => setSelectedParentForSubcatReorder(category.id)}
                                >
                                  {subcat.image ? (
                                    <Image source={{ uri: subcat.image }} style={styles.reorderSubcategoryImage} />
                                  ) : (
                                    <View style={[styles.reorderSubcategoryImage, { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }]}>
                                      <FolderPlus size={16} color="#9CA3AF" />
                                    </View>
                                  )}
                                  <Text style={styles.reorderSubcategoryName}>{subcat.name}</Text>
                                  <GripVertical size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.reorderWithBackContainer}>
                <View style={styles.reorderBackHeader}>
                  <TouchableOpacity
                    style={styles.reorderBackButton}
                    onPress={() => {
                      setSelectedParentForSubcatReorder(null);
                      setEditingSubcatPositionId(null);
                      setTempPositionValue('');
                    }}
                  >
                    <X size={20} color="#10B981" />
                    <Text style={styles.reorderBackText}>Tilbake til hovedkategorier</Text>
                  </TouchableOpacity>
                  <Text style={styles.reorderCategoryTitle}>
                    {categories.find(c => c.id === selectedParentForSubcatReorder)?.name}
                  </Text>
                </View>
                <ScrollView 
                  style={styles.reorderFullScreenScroll}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.reorderList}>
                    {categories
                      .filter(sub => sub.parentId === selectedParentForSubcatReorder)
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map((subcat, index, filteredSubcats) => {
                        const isEditing = editingSubcatPositionId === subcat.id;
                        return (
                          <View key={subcat.id} style={[styles.reorderNumberItem, isEditing && styles.reorderNumberItemEditing]}>
                            {isEditing ? (
                              <View style={styles.reorderEditRow}>
                                <View style={styles.reorderNumberInputContainer}>
                                  <TextInput
                                    style={styles.reorderNumberInput}
                                    value={tempPositionValue}
                                    onChangeText={setTempPositionValue}
                                    keyboardType="number-pad"
                                    selectTextOnFocus
                                    autoFocus
                                  />
                                </View>
                                <TouchableOpacity
                                  style={styles.reorderConfirmButton}
                                  onPress={async () => {
                                    const newPosition = parseInt(tempPositionValue) || 1;
                                    if (newPosition >= 1 && newPosition <= filteredSubcats.length && newPosition !== index + 1) {
                                      console.log('[SubcategoryReorder] Moving from', index + 1, 'to', newPosition);
                                      
                                      const newOrder = [...filteredSubcats];
                                      const item = newOrder.splice(index, 1)[0];
                                      newOrder.splice(newPosition - 1, 0, item);
                                      
                                      console.log('[SubcategoryReorder] New order:', newOrder.map(c => c.name));
                                      
                                      const mainCategories = categories.filter(c => !c.parentId);
                                      const otherSubcategories = categories.filter(c => c.parentId && c.parentId !== selectedParentForSubcatReorder);
                                      
                                      const reorderedWithOrder = newOrder.map((cat, idx) => ({
                                        ...cat,
                                        order: idx
                                      }));
                                      
                                      const allCategories = [...mainCategories, ...otherSubcategories, ...reorderedWithOrder];
                                      console.log('[SubcategoryReorder] Saving all categories');
                                      
                                      await reorderCategories(allCategories);
                                    }
                                    setEditingSubcatPositionId(null);
                                    setTempPositionValue('');
                                  }}
                                >
                                  <Check size={20} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.reorderCancelButton}
                                  onPress={() => {
                                    setEditingSubcatPositionId(null);
                                    setTempPositionValue('');
                                  }}
                                >
                                  <X size={20} color="#6B7280" />
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.reorderNumberInputContainer}
                                onPress={() => {
                                  setEditingSubcatPositionId(subcat.id);
                                  setTempPositionValue((index + 1).toString());
                                }}
                              >
                                <Text style={styles.reorderNumberText}>{index + 1}</Text>
                                <Edit3 size={14} color="#10B981" style={styles.reorderEditIcon} />
                              </TouchableOpacity>
                            )}
                            {!isEditing && (
                              <>
                                {subcat.image ? (
                                  <Image source={{ uri: subcat.image }} style={styles.reorderItemImage} />
                                ) : (
                                  <View style={[styles.reorderItemImage, { backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }]}>
                                    <FolderPlus size={20} color="#9CA3AF" />
                                  </View>
                                )}
                                <View style={styles.reorderItemInfo}>
                                  <Text style={styles.reorderItemName} numberOfLines={1}>{subcat.name}</Text>
                                </View>
                              </>
                            )}
                          </View>
                        );
                      })}
                  </View>
                </ScrollView>
              </View>
            )
          )}
        </KeyboardAvoidingView>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {activeTab === 'products' && (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <View>
                <Text style={styles.tabTitle}>Produkter</Text>
                <Text style={styles.tabDescription}>{products.length} produkter totalt</Text>
              </View>
              <View style={styles.headerActions}>
                {selectionMode ? (
                  <>
                    <TouchableOpacity 
                      style={styles.selectAllButton} 
                      onPress={toggleSelectAll}
                    >
                      {selectedProductIds.length === products.length ? (
                        <Check size={18} color="#10B981" />
                      ) : (
                        <Grid3x3 size={18} color="#6B7280" />
                      )}
                      <Text style={styles.selectAllText}>Alle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.deleteSelectedButton, selectedProductIds.length === 0 && styles.deleteSelectedButtonDisabled]} 
                      onPress={handleDeleteSelected}
                      disabled={selectedProductIds.length === 0}
                    >
                      <Trash2 size={18} color="#fff" />
                      <Text style={styles.deleteSelectedText}>{selectedProductIds.length}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.cancelSelectionButton} 
                      onPress={() => {
                        setSelectionMode(false);
                        setSelectedProductIds([]);
                      }}
                    >
                      <X size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.selectionModeButton} onPress={() => setSelectionMode(true)}>
                      <Grid3x3 size={18} color="#6366F1" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addButton} onPress={() => setShowAddProduct(true)}>
                      <Plus size={20} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {products.length > 0 ? (
          <>
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <Search size={18} color="#6B7280" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Søk etter produktnavn eller kategori..."
                  placeholderTextColor="#9CA3AF"
                  value={productSearchQuery}
                  onChangeText={setProductSearchQuery}
                  autoCapitalize="none"
                />
                {productSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setProductSearchQuery('')}>
                    <X size={18} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                style={[styles.filterButton, selectedCategoryFilter && styles.filterButtonActive]}
                onPress={() => setShowCategoryFilter(!showCategoryFilter)}
              >
                <Filter size={20} color={selectedCategoryFilter ? "#fff" : "#10B981"} />
              </TouchableOpacity>
            </View>
            {showCategoryFilter && (
              <View style={styles.categoryFilterContainer}>
                <Text style={styles.categoryFilterTitle}>Filtrer etter kategori</Text>
                <ScrollView style={styles.categoryFilterScrollVertical} showsVerticalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.categoryFilterChip, !selectedCategoryFilter && styles.categoryFilterChipActive]}
                    onPress={() => setSelectedCategoryFilter(null)}
                  >
                    <Text style={[styles.categoryFilterChipText, !selectedCategoryFilter && styles.categoryFilterChipTextActive]}>
                      Alle
                    </Text>
                  </TouchableOpacity>
                  {categories
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .filter(cat => !cat.parentId)
                    .map(category => {
                      const subcategories = categories.filter(sub => sub.parentId === category.id);
                      return (
                        <View key={category.id} style={styles.categoryFilterGroupVertical}>
                          <TouchableOpacity
                            style={[styles.categoryFilterChip, selectedCategoryFilter === category.id && styles.categoryFilterChipActive]}
                            onPress={() => setSelectedCategoryFilter(category.id)}
                          >
                            {category.image ? (
                              <Image source={{ uri: category.image }} style={styles.categoryFilterChipImage} />
                            ) : null}
                            <Text style={[styles.categoryFilterChipText, selectedCategoryFilter === category.id && styles.categoryFilterChipTextActive]}>
                              {category.name}
                            </Text>
                          </TouchableOpacity>
                          {subcategories.map(subcat => (
                            <TouchableOpacity
                              key={subcat.id}
                              style={[styles.categoryFilterChipSubcategory, selectedCategoryFilter === subcat.id && styles.categoryFilterChipActive]}
                              onPress={() => setSelectedCategoryFilter(subcat.id)}
                            >
                              {subcat.image ? (
                                <Image source={{ uri: subcat.image }} style={styles.categoryFilterChipImage} />
                              ) : null}
                              <Text style={[styles.categoryFilterChipText, selectedCategoryFilter === subcat.id && styles.categoryFilterChipTextActive]}>
                                • {subcat.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      );
                    })}
                </ScrollView>
              </View>
            )}
            <View style={styles.productsGrid}>
            {products
              .filter(product => {
                // Category filter
                if (selectedCategoryFilter && product.categoryId !== selectedCategoryFilter) {
                  return false;
                }
                
                // Search filter
                if (!productSearchQuery.trim()) return true;
                const query = productSearchQuery.toLowerCase();
                const matchesName = product.name.toLowerCase().includes(query);
                const category = categories.find(c => c.id === product.categoryId);
                const matchesCategory = category?.name.toLowerCase().includes(query);
                return matchesName || matchesCategory;
              })
              .map((product) => {
              const cardWidth = settings.productColumns === 1 ? '100%' : 
                                settings.productColumns === 2 ? '48%' : 
                                settings.productColumns === 3 ? '31%' : 
                                settings.productColumns === 4 ? '23%' : '18%';
              const imageHeight = settings.productColumns === 1 ? 140 : 
                                  settings.productColumns === 2 ? 100 : 
                                  settings.productColumns === 3 ? 70 : 
                                  settings.productColumns === 4 ? 60 : 50;
              const category = categories.find(c => c.id === product.categoryId);

              const isSelected = selectedProductIds.includes(product.id);
              
              return (
                <TouchableOpacity 
                  key={product.id} 
                  style={[styles.productCard, { width: cardWidth }, isSelected && styles.productCardSelected]}
                  onPress={() => selectionMode && toggleProductSelection(product.id)}
                  disabled={!selectionMode}
                  activeOpacity={selectionMode ? 0.7 : 1}
                >
                  {selectionMode && (
                    <View style={[styles.selectionCheckbox, isSelected && styles.selectionCheckboxSelected]}>
                      {isSelected && <Check size={16} color="#fff" />}
                    </View>
                  )}
                  {product.image ? (
                    <Image source={{ uri: product.image }} style={[styles.productImage, { height: imageHeight }]} />
                  ) : (
                    <View style={[styles.productImagePlaceholder, { height: imageHeight }]}>
                      <ImageIcon size={settings.productColumns === 3 ? 24 : 32} color="#D1D5DB" />
                    </View>
                  )}
                  {category && (
                    <View style={styles.categoryTag}>
                      {category.image ? (
                        <Image source={{ uri: category.image }} style={styles.categoryTagImage} />
                      ) : (
                        <Text style={styles.categoryTagText}>{category.name}</Text>
                      )}
                    </View>
                  )}
                  <View style={styles.productCardContent}>
                    <Text style={[styles.productCardName, { fontSize: settings.productColumns === 3 ? 13 : 14 }]} numberOfLines={1}>
                      {product.name}
                    </Text>
                    {product.sizes && product.sizes.length > 0 ? (
                      <View style={styles.sizeBadge}>
                        <Ruler size={settings.productColumns === 3 ? 10 : 12} color="#8B5CF6" />
                        <Text style={[styles.sizeBadgeText, { fontSize: settings.productColumns === 3 ? 11 : 12 }]}>
                          {product.sizes.length} størrelser
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.productCardPrice, { fontSize: settings.productColumns === 3 ? 14 : 16 }]}>
                        {product.price.toFixed(2)} kr
                      </Text>
                    )}
                  </View>
                  {!selectionMode && (
                    <View style={styles.productCardActions}>
                      <TouchableOpacity onPress={() => handleOpenEditProduct(product)} style={styles.iconButton}>
                        <Edit3 size={settings.productColumns === 3 ? 14 : 16} color="#6366F1" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteProduct(product.id)} style={styles.iconButton}>
                        <Trash2 size={settings.productColumns === 3 ? 14 : 16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          </>
            ) : (
              <View style={styles.emptyState}>
                <ImageIcon size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Ingen produkter ennå</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'categories' && (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <View>
                <Text style={styles.tabTitle}>Kategorier</Text>
                <Text style={styles.tabDescription}>{categories.length} kategorier</Text>
              </View>
              <View style={styles.headerActions}>
                {categorySelectionMode ? (
                  <>
                    <TouchableOpacity 
                      style={styles.selectAllButton} 
                      onPress={toggleSelectAllCategories}
                    >
                      {selectedCategoryIds.length === categories.filter(c => !c.parentId).length ? (
                        <Check size={18} color="#10B981" />
                      ) : (
                        <Grid3x3 size={18} color="#6B7280" />
                      )}
                      <Text style={styles.selectAllText}>Alle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.deleteSelectedButton, selectedCategoryIds.length === 0 && styles.deleteSelectedButtonDisabled]} 
                      onPress={handleDeleteSelectedCategories}
                      disabled={selectedCategoryIds.length === 0}
                    >
                      <Trash2 size={18} color="#fff" />
                      <Text style={styles.deleteSelectedText}>{selectedCategoryIds.length}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.cancelSelectionButton} 
                      onPress={() => {
                        setCategorySelectionMode(false);
                        setSelectedCategoryIds([]);
                      }}
                    >
                      <X size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.selectionModeButton} onPress={() => setCategorySelectionMode(true)}>
                      <Grid3x3 size={18} color="#6366F1" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addButton} onPress={() => {
                      setParentCategoryId(undefined);
                      setShowAddCategory(true);
                    }}>
                      <Plus size={20} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {categories.length > 0 ? (
          <View style={styles.categoryList}>
            {categories
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .filter(cat => !cat.parentId)
              .map((cat, index, filteredCategories) => {
                const subcategories = categories.filter(sub => sub.parentId === cat.id);
                const isSelected = selectedCategoryIds.includes(cat.id);
                return (
                  <View key={cat.id}>
                    <CategoryDraggableItem
                      category={cat}
                      index={index}
                      filteredCategories={filteredCategories}
                      subcategories={subcategories}
                      isDragging={draggingCategoryId === cat.id}
                      isDraggedOver={draggedOverIndex === index}
                      isSelected={isSelected}
                      selectionMode={categorySelectionMode}
                      onSelect={() => toggleCategorySelection(cat.id)}
                      onDragStart={() => {
                        setDraggingCategoryId(cat.id);
                        setDraggedOverIndex(null);
                      }}
                      onDragOver={(targetIndex: number) => {
                        if (targetIndex !== index) {
                          setDraggedOverIndex(targetIndex);
                        }
                      }}
                      onDrop={async (targetIndex: number) => {
                        if (targetIndex !== index && draggingCategoryId) {
                          const newOrder = [...filteredCategories];
                          const draggedItem = newOrder[index];
                          newOrder.splice(index, 1);
                          newOrder.splice(targetIndex, 0, draggedItem);
                          
                          const allCategories = categories.map(c => {
                            if (!c.parentId) {
                              const newIndex = newOrder.findIndex(nc => nc.id === c.id);
                              return { ...c, order: newIndex };
                            }
                            return c;
                          });
                          await reorderCategories(allCategories);
                        }
                        setDraggingCategoryId(null);
                        setDraggedOverIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggingCategoryId(null);
                        setDraggedOverIndex(null);
                      }}
                      onAddSubcategory={() => {
                        setParentCategoryId(cat.id);
                        setShowAddCategory(true);
                      }}
                      onEdit={() => handleOpenEditCategory(cat)}
                      onDelete={() => handleDeleteCategory(cat.id)}
                      onEditSubcategory={handleOpenEditCategory}
                      onDeleteSubcategory={handleDeleteCategory}
                    />
                  </View>
                );
              })}
          </View>
            ) : (
              <View style={styles.emptyState}>
                <FolderPlus size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Ingen kategorier ennå</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'tilleggsvarer' && (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <View>
                <Text style={styles.tabTitle}>Tilleggsvarer</Text>
                <Text style={styles.tabDescription}>{tilleggsvarer.length} tilleggsvarer</Text>
              </View>
              <View style={styles.headerActions}>
                {tilleggsvareSelectionMode ? (
                  <>
                    <TouchableOpacity 
                      style={styles.selectAllButton} 
                      onPress={toggleSelectAllTilleggsvarer}
                    >
                      {selectedTilleggsvareIdsForDelete.length === tilleggsvarer.length ? (
                        <Check size={18} color="#10B981" />
                      ) : (
                        <Grid3x3 size={18} color="#6B7280" />
                      )}
                      <Text style={styles.selectAllText}>Alle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.deleteSelectedButton, selectedTilleggsvareIdsForDelete.length === 0 && styles.deleteSelectedButtonDisabled]} 
                      onPress={handleDeleteSelectedTilleggsvarer}
                      disabled={selectedTilleggsvareIdsForDelete.length === 0}
                    >
                      <Trash2 size={18} color="#fff" />
                      <Text style={styles.deleteSelectedText}>{selectedTilleggsvareIdsForDelete.length}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.cancelSelectionButton} 
                      onPress={() => {
                        setTilleggsvareSelectionMode(false);
                        setSelectedTilleggsvareIdsForDelete([]);
                      }}
                    >
                      <X size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.selectionModeButton} onPress={() => setTilleggsvareSelectionMode(true)}>
                      <Grid3x3 size={18} color="#6366F1" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addButton} onPress={() => setShowAddTilleggsvare(true)}>
                      <Plus size={20} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {tilleggsvarer.length > 0 ? (
              <View style={styles.categoryList}>
                {tilleggsvarer.map((tilleggsvare) => {
                  const isSelected = selectedTilleggsvareIdsForDelete.includes(tilleggsvare.id);
                  return (
                    <TouchableOpacity
                      key={tilleggsvare.id}
                      style={[styles.categoryItem, isSelected && styles.productCardSelected]}
                      onPress={() => tilleggsvareSelectionMode && toggleTilleggsvareSelection(tilleggsvare.id)}
                      disabled={!tilleggsvareSelectionMode}
                      activeOpacity={tilleggsvareSelectionMode ? 0.7 : 1}
                    >
                      {tilleggsvareSelectionMode && (
                        <View style={[styles.selectionCheckbox, isSelected && styles.selectionCheckboxSelected]}>
                          {isSelected && <Check size={16} color="#fff" />}
                        </View>
                      )}
                      <View style={styles.categoryDot} />
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{tilleggsvare.name}</Text>
                        <Text style={styles.variantCount}>{tilleggsvare.variants.length} varianter</Text>
                      </View>
                      {!tilleggsvareSelectionMode && (
                        <View style={styles.itemActions}>
                          <TouchableOpacity onPress={() => handleOpenVariants(tilleggsvare)} style={styles.variantsButton}>
                            <Package size={16} color="#10B981" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleOpenEditTilleggsvare(tilleggsvare)} style={styles.iconButtonSmall}>
                            <Edit3 size={16} color="#6366F1" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteTilleggsvare(tilleggsvare.id)} style={styles.iconButtonSmall}>
                            <Trash2 size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Package size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Ingen tilleggsvarer ennå</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'import' && (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <View>
                <Text style={styles.tabTitle}>Importer</Text>
                <Text style={styles.tabDescription}>Last opp Excel eller CSV fil for å importere produkter</Text>
              </View>
            </View>

            <View style={styles.instructionsCard}>
              <FileSpreadsheet size={48} color="#10B981" />
              <Text style={styles.instructionsTitle}>Slik fungerer det</Text>
              <Text style={styles.instructionsText}>
                Filen må inneholde disse kolonnene i rekkefølge:
              </Text>
              <View style={styles.columnList}>
                <Text style={styles.columnItem}>1. Produktnavn</Text>
                <Text style={styles.columnItem}>2. Pris</Text>
                <Text style={styles.columnItem}>3. Størrelse navn</Text>
                <Text style={styles.columnItem}>4. Størrelse pris</Text>
                <Text style={styles.columnItem}>5. Kategori</Text>
                <Text style={styles.columnItem}>6. Underkategori</Text>
                <Text style={styles.columnItem}>7. Tilleggsvarer</Text>
                <Text style={styles.columnItem}>8. Varianter navn</Text>
                <Text style={styles.columnItem}>9. Varianter pris</Text>
                <Text style={styles.columnItem}>10. Farge</Text>
                <Text style={styles.columnItem}>11. Bilde</Text>
              </View>
              <Text style={styles.instructionsText}>
                • For produkter med størrelser: Legg til én linje per størrelse med samme produktnavn
              </Text>
              <Text style={styles.instructionsText}>
                • For tilleggsvarer: Bruk &quot;Tillegg&quot; som kategori
              </Text>
            </View>

            <View style={styles.exampleBox}>
              <Text style={styles.exampleTitle}>Eksempel fil</Text>
              <Text style={styles.exampleHeader}>Produktnavn|Pris|Størrelse navn|Størrelse pris|Kategori|Underkategori|Tilleggsvarer|Varianter navn|Varianter pris|Farge|Bilde</Text>
              <Text style={styles.exampleText}>Pizza Margherita|120|||Pizza||||||</Text>
              <Text style={styles.exampleText}>Vegetar||Liten|100|Pizza|Vegetar|||||</Text>
              <Text style={styles.exampleText}>Vegetar||Medium|130|Pizza|Vegetar|||||</Text>
            </View>

            <TouchableOpacity 
              style={styles.filePickerButton} 
              onPress={async () => {
                try {
                  const result = await DocumentPicker.getDocumentAsync({
                    type: ['text/csv', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                    copyToCacheDirectory: true,
                  });

                  if (!result.canceled && result.assets[0]) {
                    console.log('[pickFile] File selected:', result.assets[0].name);
                    setImportFile(result.assets[0]);
                    setParsedImportData([]);
                    setImportStatus('idle');
                    setImportError('');
                  }
                } catch (error) {
                  console.error('[pickFile] Error:', error);
                  Alert.alert('Feil', 'Kunne ikke velge fil');
                }
              }}
            >
              <Upload size={24} color="#10B981" />
              <Text style={styles.fileInputText}>
                {importFile ? importFile.name : 'Velg Excel eller CSV fil'}
              </Text>
            </TouchableOpacity>

            {importFile && importStatus === 'idle' && (
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={async () => {
                  if (!importFile) return;

                  try {
                    setImportStatus('parsing');
                    setImportError('');
                    Alert.alert('Info', 'Leser fil...');
                  } catch (error: any) {
                    console.error('[parseFile] Error:', error);
                    setImportStatus('error');
                    setImportError(error.message || 'Kunne ikke lese filen');
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>Les og importer fil</Text>
              </TouchableOpacity>
            )}

            {importStatus === 'error' && importError && (
              <View style={styles.errorSection}>
                <View style={styles.errorHeader}>
                  <AlertCircle size={24} color="#EF4444" />
                  <Text style={styles.errorTitle}>Feil ved lesing</Text>
                </View>
                <Text style={styles.errorText}>{importError}</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'printers' && (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <View>
                <Text style={styles.tabTitle}>Printere</Text>
                <Text style={styles.tabDescription}>{printers.length} printere konfigurert</Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.scanButton} 
                  onPress={async () => {
                    try {
                      const found = await scanForPrinters();
                      setShowDiscoveredPrinters(true);
                      if (found.length === 0) {
                        Alert.alert('Ingen skrivere funnet', 'Ingen skrivere ble funnet på nettverket. Sjekk at skriveren er på og koblet til samme WiFi.');
                      }
                    } catch (error: any) {
                      Alert.alert('Feil', error.message || 'Kunne ikke skanne etter skrivere');
                    }
                  }}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <Activity size={18} color="#10B981" />
                  ) : (
                    <Search size={18} color="#10B981" />
                  )}
                  <Text style={styles.scanButtonText}>
                    {isScanning ? 'Skanner...' : 'Finn skrivere'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowAddPrinter(true)}>
                  <Plus size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {printers.length > 0 ? (
              <View style={styles.categoryList}>
                {printers.map((printer) => (
                  <View key={printer.id} style={styles.printerItem}>
                    <View style={styles.printerIconContainer}>
                      <Printer size={20} color={printer.enabled ? '#10B981' : '#9CA3AF'} />
                    </View>
                    <View style={styles.printerInfo}>
                      <View style={styles.printerHeader}>
                        <Text style={styles.printerName}>{printer.name}</Text>
                        <View style={styles.printerHeaderRight}>
                          {printer.connectionType === 'usb' && (
                            <View style={styles.usbBadge}>
                              <Text style={styles.usbBadgeText}>USB</Text>
                            </View>
                          )}
                          <TouchableOpacity
                            onPress={() => updatePrinter(printer.id, { enabled: !printer.enabled })}
                            style={[styles.statusBadge2, printer.enabled ? styles.statusBadgeActive : styles.statusBadgeInactive]}
                          >
                            <Power size={12} color={printer.enabled ? '#10B981' : '#EF4444'} />
                            <Text style={[styles.statusText2, printer.enabled ? styles.statusTextActive : styles.statusTextInactive]}>
                              {printer.enabled ? 'Aktiv' : 'Inaktiv'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.printerDetails}>
                        {printer.connectionType === 'network' ? (
                          <Text style={styles.printerIP}>{printer.ipAddress}</Text>
                        ) : (
                          <Text style={styles.printerIP}>{printer.usbDeviceId || 'USB Printer'}</Text>
                        )}
                        <View style={styles.printerMeta}>
                          <View style={styles.printerMetaBadge}>
                            <Text style={styles.printerMetaText}>{printer.type}</Text>
                          </View>
                          <View style={styles.printerMetaBadge}>
                            <Text style={styles.printerMetaText}>{printer.paperWidth}mm</Text>
                          </View>
                        </View>
                      </View>
                      {printer.connectionType === 'network' && (
                        <TouchableOpacity 
                          style={styles.testButton}
                          onPress={async () => {
                            setTestingPrinter(printer.id);
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 10000);
                            
                            try {
                              const isRawPrinter = printer.printerType === 'raw' || printer.port === 9100;
                              const port = printer.port || (isRawPrinter ? 9100 : 8001);
                              
                              if (isRawPrinter) {
                                // RAW/ESC-POS test print
                                const url = `http://${printer.ipAddress}:${port}`;
                                const ESC = '\x1B';
                                const GS = '\x1D';
                                
                                let testData = '';
                                testData += ESC + '@'; // Initialize
                                testData += ESC + 'a' + '\x01'; // Center
                                testData += GS + '!' + '\x11'; // Large text
                                testData += '*** TEST PRINT ***\n';
                                testData += GS + '!' + '\x00'; // Normal text
                                testData += `${new Date().toLocaleString('nb-NO')}\n`;
                                testData += `Printer: ${printer.name}\n`;
                                testData += `IP: ${printer.ipAddress}:${port}\n`;
                                testData += 'RAW/ESC-POS test OK\n';
                                testData += '\n\n\n';
                                testData += GS + 'V' + '\x00'; // Cut paper
                                
                                console.log('[TEST] Sending RAW ESC/POS test to:', url);
                                
                                const response = await fetch(url, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/octet-stream',
                                  },
                                  body: testData,
                                  signal: controller.signal,
                                });
                                
                                clearTimeout(timeoutId);
                                const responseText = await response.text().catch(() => '');
                                console.log('[TEST] Response status:', response.status);
                                
                                if (response.ok || response.status === 0 || (response.status >= 200 && response.status < 300)) {
                                  Alert.alert('Suksess', `Test-print sendt til ${printer.name}\n\nSjekk skriveren din nå.`);
                                } else {
                                  Alert.alert('Feil', `HTTP ${response.status}\n${responseText}\n\nSkriveren svarte, men godtok ikke kommandoen.`);
                                }
                              } else {
                                // WebPRNT test print
                                const url = `http://${printer.ipAddress}:8001/StarWebPRNT/SendMessage`;
                                const testXML = `<?xml version="1.0" encoding="UTF-8"?><StarWebPrintData><alignment value="center"/><emphasis><text>TEST PRINT</text></emphasis><br/><text>${new Date().toLocaleString('nb-NO')}</text><br/><text>Printer: ${printer.name}</text><br/><text>IP: ${printer.ipAddress}:8001</text><br/><text>Dette er en WebPRNT test</text><br/><br/><br/><cutpaper type="feed"/><action type="print" /></StarWebPrintData>`;
                                
                                console.log('[TEST] Sending WebPRNT test to:', url);
                                console.log('[TEST] XML body:', testXML.substring(0, 200));
                                
                                const response = await fetch(url, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'text/xml; charset=utf-8',
                                  },
                                  body: testXML,
                                  signal: controller.signal,
                                });
                                
                                clearTimeout(timeoutId);
                                const responseText = await response.text();
                                console.log('[TEST] Response status:', response.status);
                                console.log('[TEST] Response:', responseText.substring(0, 500));
                                
                                if (response.ok || response.status === 0) {
                                  Alert.alert('Suksess', `Test-print sendt til ${printer.name}\n\nSjekk skriveren din nå.\n\nHvis den skriver HTTP-headers i stedet for kvittering, er WebPRNT IKKE aktivert på skriveren.`);
                                } else {
                                  Alert.alert('Feil', `HTTP ${response.status}\n${responseText}\n\nSkriveren svarte, men godtok ikke WebPRNT.`);
                                }
                              }
                            } catch (error: any) {
                              clearTimeout(timeoutId);
                              console.error('[TEST] Error:', error);
                              
                              let errorMessage = error.message || 'Ukjent feil';
                              if (error.name === 'AbortError') {
                                errorMessage = 'Timeout - skriveren svarer ikke innen 10 sekunder.';
                              } else if (error.message?.includes('Network request failed')) {
                                errorMessage = 'Kan ikke nå skriveren. Kontroller nettverkstilkobling.';
                              }
                              
                              Alert.alert('Feil', `Kunne ikke koble til skriveren:\n${errorMessage}\n\nSjekk at:\n1. IP-adresse er riktig\n2. Skriver er på\n3. På samme WiFi\n4. Riktig port (WebPRNT: 8001, RAW: 9100)`);
                            } finally {
                              setTestingPrinter(null);
                            }
                          }}
                          disabled={testingPrinter === printer.id}
                        >
                          <Activity size={14} color="#6366F1" />
                          <Text style={styles.testButtonText}>
                            {testingPrinter === printer.id ? 'Tester...' : 'Test'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {printer.connectionType === 'usb' && (
                        <TouchableOpacity 
                          style={styles.testButton}
                          onPress={async () => {
                            setTestingPrinter(printer.id);
                            try {
                              const testHTML = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: monospace; text-align: center; padding: 20px;">
<h2>Test Print</h2>
<p>${new Date().toLocaleString('nb-NO')}</p>
<p>Printer: ${printer.name}</p>
<p>Dette er en test-kvittering</p>
</body>
</html>
                              `;
                              await printToUSB(testHTML, printer);
                              Alert.alert('Suksess', 'Test-print sendt til skriver');
                            } catch (error: any) {
                              Alert.alert('Feil', error.message || 'Kunne ikke teste USB-printing');
                            } finally {
                              setTestingPrinter(null);
                            }
                          }}
                          disabled={testingPrinter === printer.id}
                        >
                          <Activity size={14} color="#6366F1" />
                          <Text style={styles.testButtonText}>
                            {testingPrinter === printer.id ? 'Tester...' : 'Test'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => {
                      Alert.alert(
                        'Slett printer',
                        `Er du sikker på at du vil slette ${printer.name}?`,
                        [
                          { text: 'Avbryt', style: 'cancel' },
                          { text: 'Slett', style: 'destructive', onPress: () => deletePrinter(printer.id) },
                        ]
                      );
                    }}>
                      <Trash2 size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Printer size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Ingen printere konfigurert</Text>
                <Text style={styles.emptySubtext}>Legg til en nettverks- eller USB-printer</Text>
              </View>
            )}

            {printLogs.length > 0 && (
              <View style={styles.logsSection}>
                <Text style={styles.logsSectionTitle}>Siste print-forsøk</Text>
                <View style={styles.logsList}>
                  {printLogs.slice(0, 3).map((log) => {
                    const statusColor = log.status === 'success' ? '#10B981' : log.status === 'retrying' ? '#F59E0B' : '#EF4444';
                    const statusBg = log.status === 'success' ? '#D1FAE5' : log.status === 'retrying' ? '#FEF3C7' : '#FEE2E2';
                    const date = new Date(log.timestamp);
                    const time = date.toLocaleString('nb-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    
                    return (
                      <View key={log.id} style={styles.logItem}>
                        <View style={styles.logHeader}>
                          <View style={styles.logTitleRow}>
                            <Text style={styles.logOrderNumber}>Ordre #{log.orderNumber}</Text>
                            <View style={[styles.logStatusBadge, { backgroundColor: statusBg }]}>
                              <Text style={[styles.logStatusText, { color: statusColor }]}>
                                {log.status === 'success' ? 'Suksess' : log.status === 'retrying' ? 'Prøver igjen' : 'Feilet'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.logTime}>{time}</Text>
                        </View>
                        <View style={styles.logDetails}>
                          <Text style={styles.logPrinter}>{log.printerName}</Text>
                          <Text style={styles.logAttempts}>Forsøk: {log.attempts}</Text>
                        </View>
                        {log.errorMessage && (
                          <Text style={styles.logError}>{log.errorMessage}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <View>
                <Text style={styles.tabTitle}>Innstillinger</Text>
                <Text style={styles.tabDescription}>Tilpass utseendet på kassesiden</Text>
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Produktvisning</Text>
              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Text style={styles.settingLabel}>Antall kolonner i kasse</Text>
                  <Text style={styles.settingDescription}>Velg hvor mange kolonner produktene skal vises i</Text>
                </View>
                <View style={styles.columnSelector}>
                  {[1, 2, 3, 4, 5].map(num => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.columnButton,
                        settings.productColumns === num && styles.columnButtonActive,
                      ]}
                      onPress={async () => {
                        try {
                          console.log('[BackOffice] Changing columns from', settings.productColumns, 'to', num);
                          const newSettings = { ...settings, productColumns: num };
                          console.log('[BackOffice] New settings object:', newSettings);
                          
                          const success = await updateSettings(newSettings);
                          console.log('[BackOffice] Update result:', success);
                          
                          if (success) {
                            Alert.alert('Suksess', `Antall kolonner endret til ${num}`);
                          } else {
                            Alert.alert('Feil', 'Kunne ikke endre antall kolonner');
                          }
                        } catch (error) {
                          console.error('[BackOffice] Error updating columns:', error);
                          Alert.alert('Feil', 'Kunne ikke endre antall kolonner');
                        }
                      }}
                    >
                      <Text style={[
                        styles.columnButtonText,
                        settings.productColumns === num && styles.columnButtonTextActive,
                      ]}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

          {activeTab === 'profile' && (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <View>
                <Text style={styles.tabTitle}>Profil</Text>
                <Text style={styles.tabDescription}>Kontoinformasjon og innstillinger</Text>
              </View>
            </View>

            <View style={styles.profileSection}>
              <View style={styles.profileIconContainer}>
                <User size={48} color="#10B981" />
              </View>
              
              <View style={styles.profileInfoSection}>
                <Text style={styles.profileLabel}>Navn</Text>
                <Text style={styles.profileValue}>{user?.user_metadata?.full_name || 'Ikke angitt'}</Text>
              </View>

              <View style={styles.profileInfoSection}>
                <Text style={styles.profileLabel}>Bedriftsnavn</Text>
                <Text style={styles.profileValue}>{user?.user_metadata?.company_name || 'Ikke angitt'}</Text>
              </View>

              <View style={styles.profileInfoSection}>
                <Text style={styles.profileLabel}>E-post</Text>
                <Text style={styles.profileValue}>{user?.email || 'Ikke tilgjengelig'}</Text>
              </View>

              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={async () => {
                  Alert.alert(
                    'Logg ut',
                    'Er du sikker på at du vil logge ut?',
                    [
                      { text: 'Avbryt', style: 'cancel' },
                      {
                        text: 'Logg ut',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await signOut();
                          } catch (error: any) {
                            Alert.alert('Feil', error.message || 'Kunne ikke logge ut');
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <LogOut size={20} color="#fff" />
                <Text style={styles.logoutButtonText}>Logg ut</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.deleteAccountButton}
                onPress={async () => {
                  Alert.alert(
                    'Slett konto',
                    'Er du helt sikker på at du vil slette kontoen din? Dette vil permanent slette all data knyttet til kontoen din inkludert produkter, kategorier, ordre og innstillinger. Denne handlingen kan ikke angres.',
                    [
                      { text: 'Avbryt', style: 'cancel' },
                      {
                        text: 'Slett permanent',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await deleteAccount();
                            Alert.alert('Suksess', 'Kontoen din har blitt slettet');
                          } catch (error: any) {
                            Alert.alert('Feil', error.message || 'Kunne ikke slette konto');
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Trash2 size={20} color="#fff" />
                <Text style={styles.deleteAccountButtonText}>Slett konto</Text>
              </TouchableOpacity>
            </View>
          </View>
          )}
        </ScrollView>
      )}

      <Modal visible={showAddProduct} animationType="fade" transparent={true} onRequestClose={() => setShowAddProduct(false)}>
        <KeyboardAvoidingView 
          style={styles.modalOverlayCentered}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContentCentered}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nytt produkt</Text>
              <TouchableOpacity onPress={() => setShowAddProduct(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Produktnavn"
                placeholderTextColor="#9CA3AF"
                value={productName}
                onChangeText={setProductName}
              />

              {categories.length > 0 && (
                <View style={styles.categorySelection}>
                  <Text style={styles.inputLabel}>Kategori *</Text>
                  <Text style={styles.tilleggsvarerHint}>Du kan bare velge kategorier uten underkategorier</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {categories.map(cat => {
                      const hasSubcategories = categories.some(c => c.parentId === cat.id);
                      const isDisabled = hasSubcategories;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryOption,
                            productCategoryId === cat.id && styles.categoryOptionSelected,
                            isDisabled && styles.categoryOptionDisabled
                          ]}
                          onPress={() => {
                            if (!isDisabled) {
                              setProductCategoryId(cat.id);
                            }
                          }}
                          disabled={isDisabled}
                        >
                          {cat.image ? (
                            <Image source={{ uri: cat.image }} style={[styles.categoryOptionImage, isDisabled && styles.categoryOptionImageDisabled]} />
                          ) : (
                            <View style={[styles.categoryOptionDot, isDisabled && styles.categoryOptionDotDisabled]} />
                          )}
                          <Text style={[styles.categoryOptionText, isDisabled && styles.categoryOptionTextDisabled]}>
                            {cat.name}
                            {isDisabled && ' 🔒'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
              
              <View style={styles.imageSection}>
                <Text style={styles.inputLabel}>Bilde</Text>
                {productImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: productImage }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => setProductImage('')}>
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imageButtons}>
                    <TouchableOpacity style={styles.imageButton} onPress={() => pickImage(setProductImage)}>
                      <ImageIcon size={20} color="#10B981" />
                      <Text style={styles.imageButtonText}>Velg fra enheten</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TextInput
                  style={[styles.input, styles.urlInput]}
                  placeholder="Eller legg inn bilde-URL"
                  placeholderTextColor="#9CA3AF"
                  value={productImage}
                  onChangeText={setProductImage}
                  autoCapitalize="none"
                />
              </View>
              
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setHasSize(!hasSize)}
              >
                <View style={[styles.checkbox, hasSize && styles.checkboxChecked]}>
                  {hasSize && <Check size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>Har størrelser</Text>
              </TouchableOpacity>

              {!hasSize ? (
                <TextInput
                  style={styles.input}
                  placeholder="Pris"
                  placeholderTextColor="#9CA3AF"
                  value={productPrice}
                  onChangeText={setProductPrice}
                  keyboardType="decimal-pad"
                />
              ) : (
                <View style={styles.sizesSection}>
                  <Text style={styles.sizesSectionTitle}>Størrelser</Text>
                  
                  {productSizes.length > 0 && (
                    <View style={styles.sizesList}>
                      {productSizes.map((size) => (
                        <View key={size.id} style={styles.sizeItem}>
                          <Text style={styles.sizeItemName}>{size.name}</Text>
                          <View style={styles.sizeItemRight}>
                            <Text style={styles.sizeItemPrice}>{size.price.toFixed(2)} kr</Text>
                            <TouchableOpacity onPress={() => handleRemoveSize(size.id)}>
                              <X size={18} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.addSizeRow}>
                    <TextInput
                      style={[styles.input, styles.sizeNameInput]}
                      placeholder="Størrelse (f.eks. Liten)"
                      placeholderTextColor="#9CA3AF"
                      value={newSizeName}
                      onChangeText={setNewSizeName}
                    />
                    <TextInput
                      style={[styles.input, styles.sizePriceInput]}
                      placeholder="Pris"
                      placeholderTextColor="#9CA3AF"
                      value={newSizePrice}
                      onChangeText={setNewSizePrice}
                      keyboardType="decimal-pad"
                    />
                    <TouchableOpacity style={styles.addSizeButton} onPress={handleAddSize}>
                      <Plus size={20} color="#10B981" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {tilleggsvarer.length > 0 && (
                <View style={styles.tilleggsvarerSection}>
                  <Text style={styles.inputLabel}>Tilleggsvarer (valgfritt)</Text>
                  <Text style={styles.tilleggsvarerHint}>Velg hvilke tilleggsvarer som skal være tilgjengelige for dette produktet</Text>
                  <View style={styles.tilleggsvarerList}>
                    {tilleggsvarer.map((tilleggsvare) => {
                      const isSelected = selectedTilleggsvareIds.includes(tilleggsvare.id);
                      return (
                        <TouchableOpacity
                          key={tilleggsvare.id}
                          style={[styles.tilleggsvareOption, isSelected && styles.tilleggsvareOptionSelected]}
                          onPress={() => {
                            if (isSelected) {
                              setSelectedTilleggsvareIds(selectedTilleggsvareIds.filter(id => id !== tilleggsvare.id));
                            } else {
                              setSelectedTilleggsvareIds([...selectedTilleggsvareIds, tilleggsvare.id]);
                            }
                          }}
                        >
                          <View style={[styles.tilleggsvareCheckbox, isSelected && styles.tilleggsvareCheckboxChecked]}>
                            {isSelected && <Check size={14} color="#fff" />}
                          </View>
                          <View style={styles.tilleggsvareOptionInfo}>
                            <Text style={styles.tilleggsvareOptionName}>{tilleggsvare.name}</Text>
                            <Text style={styles.tilleggsvareOptionVariants}>{tilleggsvare.variants.length} varianter</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddProduct(false)}>
                <Text style={styles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleAddProduct}>
                <Check size={18} color="#fff" />
                <Text style={styles.confirmButtonText}>Legg til</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showEditProduct} animationType="fade" transparent={true} onRequestClose={() => setShowEditProduct(false)}>
        <KeyboardAvoidingView 
          style={styles.modalOverlayCentered}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContentCentered}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rediger produkt</Text>
              <TouchableOpacity onPress={() => setShowEditProduct(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Produktnavn"
                placeholderTextColor="#9CA3AF"
                value={productName}
                onChangeText={setProductName}
              />

              {categories.length > 0 && (
                <View style={styles.categorySelection}>
                  <Text style={styles.inputLabel}>Kategori *</Text>
                  <Text style={styles.tilleggsvarerHint}>Du kan bare velge kategorier uten underkategorier</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {categories.map(cat => {
                      const hasSubcategories = categories.some(c => c.parentId === cat.id);
                      const isDisabled = hasSubcategories;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryOption,
                            productCategoryId === cat.id && styles.categoryOptionSelected,
                            isDisabled && styles.categoryOptionDisabled
                          ]}
                          onPress={() => {
                            if (!isDisabled) {
                              setProductCategoryId(cat.id);
                            }
                          }}
                          disabled={isDisabled}
                        >
                          {cat.image ? (
                            <Image source={{ uri: cat.image }} style={[styles.categoryOptionImage, isDisabled && styles.categoryOptionImageDisabled]} />
                          ) : (
                            <View style={[styles.categoryOptionDot, isDisabled && styles.categoryOptionDotDisabled]} />
                          )}
                          <Text style={[styles.categoryOptionText, isDisabled && styles.categoryOptionTextDisabled]}>
                            {cat.name}
                            {isDisabled && ' 🔒'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
              
              <View style={styles.imageSection}>
                <Text style={styles.inputLabel}>Bilde</Text>
                {productImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: productImage }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => setProductImage('')}>
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imageButtons}>
                    <TouchableOpacity style={styles.imageButton} onPress={() => pickImage(setProductImage)}>
                      <ImageIcon size={20} color="#10B981" />
                      <Text style={styles.imageButtonText}>Velg fra enheten</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TextInput
                  style={[styles.input, styles.urlInput]}
                  placeholder="Eller legg inn bilde-URL"
                  placeholderTextColor="#9CA3AF"
                  value={productImage}
                  onChangeText={setProductImage}
                  autoCapitalize="none"
                />
              </View>
              
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setHasSize(!hasSize)}
              >
                <View style={[styles.checkbox, hasSize && styles.checkboxChecked]}>
                  {hasSize && <Check size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>Har størrelser</Text>
              </TouchableOpacity>

              {!hasSize ? (
                <TextInput
                  style={styles.input}
                  placeholder="Pris"
                  placeholderTextColor="#9CA3AF"
                  value={productPrice}
                  onChangeText={setProductPrice}
                  keyboardType="decimal-pad"
                />
              ) : (
                <View style={styles.sizesSection}>
                  <Text style={styles.sizesSectionTitle}>Størrelser</Text>
                  
                  {productSizes.length > 0 && (
                    <View style={styles.sizesList}>
                      {productSizes.map((size) => (
                        <View key={size.id} style={styles.sizeItem}>
                          <Text style={styles.sizeItemName}>{size.name}</Text>
                          <View style={styles.sizeItemRight}>
                            <Text style={styles.sizeItemPrice}>{size.price.toFixed(2)} kr</Text>
                            <TouchableOpacity onPress={() => handleRemoveSize(size.id)}>
                              <X size={18} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.addSizeRow}>
                    <TextInput
                      style={[styles.input, styles.sizeNameInput]}
                      placeholder="Størrelse (f.eks. Liten)"
                      placeholderTextColor="#9CA3AF"
                      value={newSizeName}
                      onChangeText={setNewSizeName}
                    />
                    <TextInput
                      style={[styles.input, styles.sizePriceInput]}
                      placeholder="Pris"
                      placeholderTextColor="#9CA3AF"
                      value={newSizePrice}
                      onChangeText={setNewSizePrice}
                      keyboardType="decimal-pad"
                    />
                    <TouchableOpacity style={styles.addSizeButton} onPress={handleAddSize}>
                      <Plus size={20} color="#10B981" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {tilleggsvarer.length > 0 && (
                <View style={styles.tilleggsvarerSection}>
                  <Text style={styles.inputLabel}>Tilleggsvarer (valgfritt)</Text>
                  <Text style={styles.tilleggsvarerHint}>Velg hvilke tilleggsvarer som skal være tilgjengelige for dette produktet</Text>
                  <View style={styles.tilleggsvarerList}>
                    {tilleggsvarer.map((tilleggsvare) => {
                      const isSelected = selectedTilleggsvareIds.includes(tilleggsvare.id);
                      return (
                        <TouchableOpacity
                          key={tilleggsvare.id}
                          style={[styles.tilleggsvareOption, isSelected && styles.tilleggsvareOptionSelected]}
                          onPress={() => {
                            if (isSelected) {
                              setSelectedTilleggsvareIds(selectedTilleggsvareIds.filter(id => id !== tilleggsvare.id));
                            } else {
                              setSelectedTilleggsvareIds([...selectedTilleggsvareIds, tilleggsvare.id]);
                            }
                          }}
                        >
                          <View style={[styles.tilleggsvareCheckbox, isSelected && styles.tilleggsvareCheckboxChecked]}>
                            {isSelected && <Check size={14} color="#fff" />}
                          </View>
                          <View style={styles.tilleggsvareOptionInfo}>
                            <Text style={styles.tilleggsvareOptionName}>{tilleggsvare.name}</Text>
                            <Text style={styles.tilleggsvareOptionVariants}>{tilleggsvare.variants.length} varianter</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEditProduct(false)}>
                <Text style={styles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleUpdateProduct}>
                <Check size={18} color="#fff" />
                <Text style={styles.confirmButtonText}>Oppdater</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showAddCategory} animationType="fade" transparent={true} onRequestClose={() => setShowAddCategory(false)}>
        <KeyboardAvoidingView 
          style={styles.modalOverlayCentered}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContentCentered}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{parentCategoryId ? 'Ny underkategori' : 'Ny kategori'}</Text>
              <TouchableOpacity onPress={() => {
                setShowAddCategory(false);
                setParentCategoryId(undefined);
              }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {parentCategoryId && (
                <View style={styles.parentCategoryInfo}>
                  <Text style={styles.parentCategoryLabel}>Foreldrerkategori:</Text>
                  <Text style={styles.parentCategoryName}>
                    {categories.find(c => c.id === parentCategoryId)?.name}
                  </Text>
                </View>
              )}
              <TextInput
                style={styles.input}
                placeholder="Kategorinavn"
                placeholderTextColor="#9CA3AF"
                value={categoryName}
                onChangeText={setCategoryName}
              />
              
              <View style={styles.imageSection}>
                <Text style={styles.inputLabel}>Bilde (valgfritt)</Text>
                {categoryImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: categoryImage }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => setCategoryImage('')}>
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imageButtons}>
                    <TouchableOpacity style={styles.imageButton} onPress={() => pickImage(setCategoryImage)}>
                      <ImageIcon size={20} color="#10B981" />
                      <Text style={styles.imageButtonText}>Velg fra enheten</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TextInput
                  style={[styles.input, styles.urlInput]}
                  placeholder="Eller legg inn bilde-URL"
                  placeholderTextColor="#9CA3AF"
                  value={categoryImage}
                  onChangeText={setCategoryImage}
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setShowAddCategory(false);
                setParentCategoryId(undefined);
              }}>
                <Text style={styles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleAddCategory}>
                <Check size={18} color="#fff" />
                <Text style={styles.confirmButtonText}>Opprett</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showAddTilleggsvare} animationType="fade" transparent={true} onRequestClose={() => setShowAddTilleggsvare(false)}>
        <KeyboardAvoidingView 
          style={styles.modalOverlayCentered}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContentSmall}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ny tilleggsvare</Text>
              <TouchableOpacity onPress={() => {
                setShowAddTilleggsvare(false);
                setTilleggsvareNavn('');
              }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Tilleggsvarenavn (f.eks. Pommes frites, Agurk, etc.)"
              placeholderTextColor="#9CA3AF"
              value={tilleggsvareNavn}
              onChangeText={setTilleggsvareNavn}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setShowAddTilleggsvare(false);
                setTilleggsvareNavn('');
              }}>
                <Text style={styles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleAddTilleggsvare}>
                <Check size={18} color="#fff" />
                <Text style={styles.confirmButtonText}>Opprett</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showVariantsModal} animationType="fade" transparent={true} onRequestClose={() => setShowVariantsModal(false)}>
        <KeyboardAvoidingView 
          style={styles.modalOverlayCentered}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContentCentered}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedTilleggsvare?.name}</Text>
              <TouchableOpacity onPress={() => {
                setShowVariantsModal(false);
                setShowEditVariant(false);
                setEditingVariant(null);
                setSelectedTilleggsvare(null);
                setVariantNavn('');
                setVariantPris('');
                setVariantColor(undefined);
                setCustomColor('');
              }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.variantsScrollView}>
              <Text style={styles.sectionTitle}>Varianter</Text>
              {selectedTilleggsvare && tilleggsvarer.find(t => t.id === selectedTilleggsvare.id)?.variants && tilleggsvarer.find(t => t.id === selectedTilleggsvare.id)!.variants.length > 0 ? (
                <View style={styles.variantsList}>
                  {tilleggsvarer.find(t => t.id === selectedTilleggsvare.id)!.variants.map((variant) => (
                    <View key={variant.id} style={[styles.variantItem, variant.color && { borderLeftWidth: 4, borderLeftColor: variant.color }]}>
                      <View style={styles.variantInfo}>
                        <View style={styles.variantNameRow}>
                          {variant.color && (
                            <View style={[styles.variantColorDot, { backgroundColor: variant.color }]} />
                          )}
                          <Text style={styles.variantName}>{variant.name}</Text>
                        </View>
                        <Text style={styles.variantPrice}>{variant.price.toFixed(2)} kr</Text>
                      </View>
                      <View style={styles.variantActions}>
                        <TouchableOpacity onPress={() => handleOpenEditVariant(variant)} style={styles.iconButtonSmall}>
                          <Edit3 size={16} color="#6366F1" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteVariant(variant.id)}>
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyVariantsText}>Ingen varianter ennå</Text>
              )}

              <Text style={styles.sectionTitle}>Legg til ny variant</Text>
              <TextInput
                style={styles.input}
                placeholder="Variantnavn (f.eks. Ekstra agurk, Stor, etc.)"
                placeholderTextColor="#9CA3AF"
                value={variantNavn}
                onChangeText={setVariantNavn}
              />
              <TextInput
                style={styles.input}
                placeholder="Pris"
                placeholderTextColor="#9CA3AF"
                value={variantPris}
                onChangeText={setVariantPris}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputLabel}>Farge (valgfritt)</Text>
              <ColorPicker 
                color={customColor || '#6B7280'} 
                onColorChange={(newColor) => {
                  setCustomColor(newColor);
                  setVariantColor(undefined);
                }}
              />
              {showEditVariant ? (
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => {
                    setShowEditVariant(false);
                    setEditingVariant(null);
                    setVariantNavn('');
                    setVariantPris('');
                    setVariantColor(undefined);
                    setCustomColor('');
                  }}>
                    <Text style={styles.cancelButtonText}>Avbryt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmButton} onPress={handleUpdateVariant}>
                    <Check size={18} color="#fff" />
                    <Text style={styles.confirmButtonText}>Oppdater</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addVariantButton} onPress={handleAddVariant}>
                  <Plus size={18} color="#fff" />
                  <Text style={styles.addVariantButtonText}>Legg til variant</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showEditCategory} animationType="fade" transparent={true} onRequestClose={() => setShowEditCategory(false)}>
        <KeyboardAvoidingView 
          style={styles.modalOverlayCentered}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContentCentered}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rediger kategori</Text>
              <TouchableOpacity onPress={() => {
                setShowEditCategory(false);
                setEditingCategory(null);
                setCategoryName('');
                setCategoryImage('');
                setParentCategoryId(undefined);
              }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <View style={styles.categorySelection}>
                <Text style={styles.inputLabel}>Foreldrerkategori (valgfritt)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  <TouchableOpacity
                    style={[styles.categoryOption, !parentCategoryId && styles.categoryOptionSelected]}
                    onPress={() => setParentCategoryId(undefined)}
                  >
                    <Text style={styles.categoryOptionText}>Ingen</Text>
                  </TouchableOpacity>
                  {categories.filter(c => c.id !== editingCategory?.id && !c.parentId).map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryOption,
                        parentCategoryId === cat.id && styles.categoryOptionSelected
                      ]}
                      onPress={() => setParentCategoryId(cat.id)}
                    >
                      {cat.image ? (
                        <Image source={{ uri: cat.image }} style={styles.categoryOptionImage} />
                      ) : (
                        <View style={styles.categoryOptionDot} />
                      )}
                      <Text style={styles.categoryOptionText}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Kategorinavn"
                placeholderTextColor="#9CA3AF"
                value={categoryName}
                onChangeText={setCategoryName}
              />
              
              <View style={styles.imageSection}>
                <Text style={styles.inputLabel}>Bilde (valgfritt)</Text>
                {categoryImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: categoryImage }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => setCategoryImage('')}>
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imageButtons}>
                    <TouchableOpacity style={styles.imageButton} onPress={() => pickImage(setCategoryImage)}>
                      <ImageIcon size={20} color="#10B981" />
                      <Text style={styles.imageButtonText}>Velg fra enheten</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TextInput
                  style={[styles.input, styles.urlInput]}
                  placeholder="Eller legg inn bilde-URL"
                  placeholderTextColor="#9CA3AF"
                  value={categoryImage}
                  onChangeText={setCategoryImage}
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setShowEditCategory(false);
                setEditingCategory(null);
                setCategoryName('');
                setCategoryImage('');
                setParentCategoryId(undefined);
              }}>
                <Text style={styles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleUpdateCategory}>
                <Check size={18} color="#fff" />
                <Text style={styles.confirmButtonText}>Oppdater</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showEditTilleggsvare} animationType="fade" transparent={true} onRequestClose={() => setShowEditTilleggsvare(false)}>
        <KeyboardAvoidingView 
          style={styles.modalOverlayCentered}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContentSmall}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rediger tilleggsvare</Text>
              <TouchableOpacity onPress={() => {
                setShowEditTilleggsvare(false);
                setEditingTilleggsvare(null);
                setTilleggsvareNavn('');
              }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Tilleggsvarenavn (f.eks. Pommes frites, Agurk, etc.)"
              placeholderTextColor="#9CA3AF"
              value={tilleggsvareNavn}
              onChangeText={setTilleggsvareNavn}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setShowEditTilleggsvare(false);
                setEditingTilleggsvare(null);
                setTilleggsvareNavn('');
              }}>
                <Text style={styles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleUpdateTilleggsvare}>
                <Check size={18} color="#fff" />
                <Text style={styles.confirmButtonText}>Oppdater</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>



      <Modal visible={showEditVariant} animationType="fade" transparent={true} onRequestClose={() => setShowEditVariant(false)}>
        <KeyboardAvoidingView 
          style={styles.modalOverlayCentered}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContentSmall}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rediger variant</Text>
              <TouchableOpacity onPress={() => {
                setShowEditVariant(false);
                setEditingVariant(null);
                setVariantNavn('');
                setVariantPris('');
                setVariantColor(undefined);
                setCustomColor('');
              }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Variantnavn (f.eks. Ekstra agurk, Stor, etc.)"
                placeholderTextColor="#9CA3AF"
                value={variantNavn}
                onChangeText={setVariantNavn}
              />
              <TextInput
                style={styles.input}
                placeholder="Pris"
                placeholderTextColor="#9CA3AF"
                value={variantPris}
                onChangeText={setVariantPris}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputLabel}>Farge (valgfritt)</Text>
              <ColorPicker 
                color={customColor || '#6B7280'} 
                onColorChange={(newColor) => {
                  setCustomColor(newColor);
                  setVariantColor(undefined);
                }}
              />
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setShowEditVariant(false);
                setEditingVariant(null);
                setVariantNavn('');
                setVariantPris('');
                setVariantColor(undefined);
                setCustomColor('');
              }}>
                <Text style={styles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleUpdateVariant}>
                <Check size={18} color="#fff" />
                <Text style={styles.confirmButtonText}>Oppdater</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showReorderModal} animationType="fade" transparent={true} onRequestClose={() => setShowReorderModal(false)}>
        <KeyboardAvoidingView 
          style={styles.modalOverlayCentered}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContentCentered}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {reorderType === 'products' ? 'Endre rekkefølge - Produkter' : 'Endre rekkefølge - Kategorier'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowReorderModal(false);
                setReorderType(null);
                setDraggingProductId(null);
                setDraggedProductOverIndex(null);
                setDraggingCategoryId(null);
                setDraggedOverIndex(null);
              }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.reorderScrollView}>
              {reorderType === 'products' && (
                <View style={styles.reorderList}>
                  {products.map((product, index) => (
                    <ProductDraggableItem
                      key={product.id}
                      product={product}
                      index={index}
                      allProducts={products}
                      isDragging={draggingProductId === product.id}
                      isDraggedOver={draggedProductOverIndex === index}
                      onDragStart={() => {
                        setDraggingProductId(product.id);
                        setDraggedProductOverIndex(null);
                      }}
                      onDragOver={(targetIndex: number) => {
                        if (targetIndex !== index) {
                          setDraggedProductOverIndex(targetIndex);
                        }
                      }}
                      onDrop={async (targetIndex: number) => {
                        if (targetIndex !== index && draggingProductId) {
                          const newOrder = [...products];
                          const draggedItem = newOrder[index];
                          newOrder.splice(index, 1);
                          newOrder.splice(targetIndex, 0, draggedItem);
                          await reorderProducts(newOrder);
                        }
                        setDraggingProductId(null);
                        setDraggedProductOverIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggingProductId(null);
                        setDraggedProductOverIndex(null);
                      }}
                    />
                  ))}
                </View>
              )}


            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.confirmButton} onPress={() => {
                setShowReorderModal(false);
                setReorderType(null);
                setDraggingProductId(null);
                setDraggedProductOverIndex(null);
                setDraggingCategoryId(null);
                setDraggedOverIndex(null);
              }}>
                <Check size={18} color="#fff" />
                <Text style={styles.confirmButtonText}>Ferdig</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showAddPrinter} animationType="fade" transparent={true} onRequestClose={() => setShowAddPrinter(false)}>
        <KeyboardAvoidingView 
          style={styles.modalOverlayCentered}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContentCentered}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ny Printer</Text>
              <TouchableOpacity onPress={() => {
                setShowAddPrinter(false);
                setPrinterName('');
                setPrinterIP('');
                setPrinterType('kitchen');
                setPrinterPaperWidth(58);
                setConnectionType('network');
              }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.inputLabel}>Tilkoblingstype</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[styles.typeButton, connectionType === 'network' && styles.typeButtonActive]}
                  onPress={() => setConnectionType('network')}
                >
                  <Text style={[styles.typeButtonText, connectionType === 'network' && styles.typeButtonTextActive]}>Nettverk</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, connectionType === 'usb' && styles.typeButtonActive]}
                  onPress={() => setConnectionType('usb')}
                  disabled={Platform.OS === 'web'}
                >
                  <Text style={[styles.typeButtonText, connectionType === 'usb' && styles.typeButtonTextActive, Platform.OS === 'web' && { color: '#D1D5DB' }]}>USB</Text>
                </TouchableOpacity>
              </View>
              {Platform.OS === 'web' && connectionType === 'usb' && (
                <Text style={styles.inputHint}>⚠️ USB-printing er kun tilgjengelig på mobile enheter</Text>
              )}

              <Text style={styles.inputLabel}>Printer navn</Text>
              <TextInput
                style={styles.input}
                placeholder="F.eks. Kjøkken Printer 1"
                placeholderTextColor="#9CA3AF"
                value={printerName}
                onChangeText={setPrinterName}
              />

              {connectionType === 'network' ? (
                <>
                  <Text style={styles.inputLabel}>IP-adresse</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="192.168.1.34"
                    placeholderTextColor="#9CA3AF"
                    value={printerIP}
                    onChangeText={setPrinterIP}
                    keyboardType="default"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={styles.inputHint}>💡 Finn IP-adressen:
1. Trykk på printer-knappen i 3 sekunder
2. Velg &quot;Network Report&quot; eller &quot;Settings&quot;
3. Se etter IP-adresse (f.eks. 192.168.1.34)

⚠️ For Star mC-Print3: Skriveren må være i samme nettverk og støtte WebPRNT</Text>
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>USB-skriver</Text>
                  <Text style={[styles.inputHint, { color: '#EF4444', fontWeight: '600' }]}>⚠️ USB-skriving er deaktivert. Bruk kun nettverksskrivere med WebPRNT.</Text>
                </>
              )}

              <Text style={styles.inputLabel}>Printer type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[styles.typeButton, printerType === 'kitchen' && styles.typeButtonActive]}
                  onPress={() => setPrinterType('kitchen')}
                >
                  <Text style={[styles.typeButtonText, printerType === 'kitchen' && styles.typeButtonTextActive]}>Kjøkken</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, printerType === 'bar' && styles.typeButtonActive]}
                  onPress={() => setPrinterType('bar')}
                >
                  <Text style={[styles.typeButtonText, printerType === 'bar' && styles.typeButtonTextActive]}>Bar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, printerType === 'customer' && styles.typeButtonActive]}
                  onPress={() => setPrinterType('customer')}
                >
                  <Text style={[styles.typeButtonText, printerType === 'customer' && styles.typeButtonTextActive]}>Kunde</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Papir bredde</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[styles.typeButton, printerPaperWidth === 58 && styles.typeButtonActive]}
                  onPress={() => setPrinterPaperWidth(58)}
                >
                  <Text style={[styles.typeButtonText, printerPaperWidth === 58 && styles.typeButtonTextActive]}>58mm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, printerPaperWidth === 80 && styles.typeButtonActive]}
                  onPress={() => setPrinterPaperWidth(80)}
                >
                  <Text style={[styles.typeButtonText, printerPaperWidth === 80 && styles.typeButtonTextActive]}>80mm</Text>
                </TouchableOpacity>
              </View>

              {connectionType === 'network' && (
                <View style={styles.testInfoCard}>
                  <Text style={styles.testInfoTitle}>📝 Sjekkliste for nettverksprinter:</Text>
                  <Text style={styles.testInfoNote}>✅ Skriveren er på og koblet til WiFi</Text>
                  <Text style={styles.testInfoNote}>✅ Telefon/tablet er på samme WiFi</Text>
                  <Text style={styles.testInfoNote}>✅ WebPRNT er aktivert på printeren</Text>
                  <Text style={styles.testInfoNote}>✅ IP-adressen er riktig</Text>
                </View>
              )}
              
              {connectionType === 'usb' && Platform.OS !== 'web' && (
                <View style={styles.testInfoCard}>
                  <Text style={styles.testInfoTitle}>📝 Sjekkliste for AirPrint/IPP:</Text>
                  <Text style={styles.testInfoNote}>✅ Skriveren støtter AirPrint (iOS) eller IPP (Android)</Text>
                  <Text style={styles.testInfoNote}>✅ Skriveren er koblet til WiFi (ikke USB!)</Text>
                  <Text style={styles.testInfoNote}>✅ Telefon/tablet er på samme WiFi</Text>
                  <Text style={styles.testInfoNote}>✅ For Star mC-Print3: Bruk &quot;StarPRNT&quot; eller &quot;mC-Print3&quot; fra listen</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setShowAddPrinter(false);
                setPrinterName('');
                setPrinterIP('');
                setPrinterType('kitchen');
                setPrinterPaperWidth(58);
              }}>
                <Text style={styles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={async () => {
                if (!printerName.trim()) {
                  Alert.alert('Feil', 'Fyll inn printer navn');
                  return;
                }
                if (connectionType === 'network' && !printerIP.trim()) {
                  Alert.alert('Feil', 'Fyll inn IP-adresse');
                  return;
                }
                if (connectionType === 'usb' && !printerIP.trim()) {
                  Alert.alert('Feil', 'Velg en USB-skriver først');
                  return;
                }
                try {
                  await addPrinter({
                    name: printerName.trim(),
                    connectionType: connectionType,
                    ipAddress: connectionType === 'network' ? printerIP.trim() : undefined,
                    usbDeviceId: connectionType === 'usb' ? printerIP.trim() : undefined,
                    type: printerType,
                    paperWidth: printerPaperWidth,
                    enabled: true,
                  });
                  setShowAddPrinter(false);
                  setPrinterName('');
                  setPrinterIP('');
                  setPrinterType('kitchen');
                  setPrinterPaperWidth(58);
                  setConnectionType('network');
                  Alert.alert('Suksess', 'Printer lagt til');
                } catch {
                  Alert.alert('Feil', 'Kunne ikke legge til printer');
                }
              }}>
                <Check size={18} color="#fff" />
                <Text style={styles.confirmButtonText}>Legg til</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showDiscoveredPrinters} animationType="fade" transparent={true} onRequestClose={() => setShowDiscoveredPrinters(false)}>
        <View style={styles.modalOverlayCentered}>
          <View style={styles.modalContentCentered}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Oppdagede skrivere</Text>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity 
                  style={styles.debugButton} 
                  onPress={() => setShowScanDebug(!showScanDebug)}
                >
                  <Text style={styles.debugButtonText}>Debug</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDiscoveredPrinters(false)}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {isScanning && scanProgress && (
              <View style={styles.scanProgressContainer}>
                <View style={styles.scanProgressHeader}>
                  <Activity size={16} color="#10B981" />
                  <Text style={styles.scanProgressText}>{scanProgress.message}</Text>
                </View>
                <View style={styles.scanProgressBar}>
                  <View 
                    style={[
                      styles.scanProgressFill, 
                      { width: `${(scanProgress.current / scanProgress.total) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.scanProgressCounter}>
                  {scanProgress.current} / {scanProgress.total} IP-adresser testet
                </Text>
              </View>
            )}

            {showScanDebug && scanDebugLog.length > 0 && (
              <ScrollView style={styles.debugLogContainer}>
                {scanDebugLog.map((log, idx) => (
                  <Text key={idx} style={styles.debugLogText}>{log}</Text>
                ))}
              </ScrollView>
            )}

            {!isScanning && (
              discoveredPrinters.length > 0 ? (
                <ScrollView style={styles.discoveredPrintersScroll}>
                  <View style={styles.discoveredPrintersList}>
                    {discoveredPrinters.map((printer, idx) => (
                      <View key={`${printer.ip}-${idx}`} style={styles.discoveredPrinterItem}>
                        <View style={styles.discoveredPrinterIcon}>
                          <Wifi size={24} color="#10B981" />
                        </View>
                        <View style={styles.discoveredPrinterInfo}>
                          <Text style={styles.discoveredPrinterName}>
                            {printer.name || `Printer ${printer.ip}`}
                          </Text>
                          <View style={styles.discoveredPrinterMeta}>
                            <Text style={styles.discoveredPrinterIP}>{printer.ip}</Text>
                            <View style={styles.discoveredPrinterTypeBadge}>
                              <Text style={styles.discoveredPrinterTypeText}>
                                {printer.type === 'webprnt' ? 'WebPRNT' : 'RAW'}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.addDiscoveredButton}
                          onPress={async () => {
                            try {
                              await addPrinter({
                                name: printer.name || `Printer ${printer.ip}`,
                                connectionType: 'network',
                                ipAddress: printer.ip,
                                type: 'kitchen',
                                paperWidth: 58,
                                enabled: true,
                              });
                              Alert.alert('Suksess', `Skriver ${printer.ip} lagt til`);
                              setShowDiscoveredPrinters(false);
                            } catch (error: any) {
                              Alert.alert('Feil', error.message || 'Kunne ikke legge til skriver');
                            }
                          }}
                        >
                          <Plus size={20} color="#10B981" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.emptyDiscoveredState}>
                  <Search size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>Ingen skrivere funnet</Text>
                  <Text style={styles.emptySubtext}>Sjekk debuggen for detaljer</Text>
                  <View style={styles.troubleshootingCard}>
                    <Text style={styles.troubleshootingTitle}>📋 Feilsøking:</Text>
                    <Text style={styles.troubleshootingText}>• Skriver på samme WiFi?</Text>
                    <Text style={styles.troubleshootingText}>• iOS Local Network tillatelse?</Text>
                    <Text style={styles.troubleshootingText}>• IP i 192.168.1.x eller 192.168.0.x?</Text>
                    <Text style={styles.troubleshootingText}>• WebPRNT aktivert?</Text>
                  </View>
                </View>
              )
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDiscoveredPrinters(false)}>
                <Text style={styles.cancelButtonText}>Lukk</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={async () => {
                  try {
                    await scanForPrinters();
                  } catch (error: any) {
                    Alert.alert('Feil', error.message || 'Kunne ikke skanne');
                  }
                }}
                disabled={isScanning}
              >
                {isScanning ? (
                  <Activity size={18} color="#fff" />
                ) : (
                  <Search size={18} color="#fff" />
                )}
                <Text style={styles.confirmButtonText}>
                  {isScanning ? 'Skanner...' : 'Skann på nytt'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface CategoryDraggableItemProps {
  category: Category;
  index: number;
  filteredCategories: Category[];
  subcategories: Category[];
  isDragging: boolean;
  isDraggedOver: boolean;
  isSelected: boolean;
  selectionMode: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragOver: (index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
  onAddSubcategory: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onEditSubcategory: (cat: Category) => void;
  onDeleteSubcategory: (id: string) => void;
}

function CategoryDraggableItem({
  category,
  index,
  filteredCategories,
  subcategories,
  isDragging,
  isDraggedOver,
  isSelected,
  selectionMode,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onAddSubcategory,
  onEdit,
  onDelete,
  onEditSubcategory,
  onDeleteSubcategory,
}: CategoryDraggableItemProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDraggingState, setIsDraggingState] = useState(false);
  const currentOffsetY = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (selectionMode) return false;
        const shouldStart = Math.abs(gestureState.dy) > 10;
        return shouldStart;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        if (selectionMode) return false;
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        if (selectionMode) return;
        console.log('[CategoryDrag] Grant - starting drag at index:', index);
        setIsDraggingState(true);
        onDragStart();
        currentOffsetY.current = 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (selectionMode) return;
        
        currentOffsetY.current = gestureState.dy;
        pan.setValue({ x: 0, y: gestureState.dy });
        
        const itemHeight = 78;
        const moveSteps = Math.round(gestureState.dy / itemHeight);
        const targetIndex = Math.max(0, Math.min(filteredCategories.length - 1, index + moveSteps));
        
        if (targetIndex !== index && moveSteps !== 0) {
          onDragOver(targetIndex);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (selectionMode) {
          setIsDraggingState(false);
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 8,
            tension: 40,
          }).start();
          return;
        }
        
        const itemHeight = 78;
        const moveSteps = Math.round(gestureState.dy / itemHeight);
        const targetIndex = Math.max(0, Math.min(filteredCategories.length - 1, index + moveSteps));
        
        console.log('[CategoryDrag] Release - from:', index, 'to:', targetIndex, 'offset:', gestureState.dy, 'steps:', moveSteps);
        
        setIsDraggingState(false);
        
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }).start(() => {
          if (targetIndex !== index) {
            console.log('[CategoryDrag] Executing drop');
            onDrop(targetIndex);
          } else {
            onDragEnd();
          }
        });
      },
      onPanResponderTerminate: () => {
        console.log('[CategoryDrag] Terminated');
        setIsDraggingState(false);
        
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }).start(() => {
          onDragEnd();
        });
      },
    })
  ).current;

  return (
    <>
      <Animated.View
        {...(!selectionMode ? panResponder.panHandlers : {})}
        style={[
          styles.draggableContainer,
          {
            transform: [{ translateY: pan.y }],
          },
          isDraggingState && styles.categoryItemDragging,
          isDraggedOver && styles.categoryItemDraggedOver,
        ]}
      >
        <TouchableOpacity
          style={[styles.categoryItem, isSelected && styles.productCardSelected]}
          onPress={selectionMode ? onSelect : undefined}
          disabled={!selectionMode}
          activeOpacity={selectionMode ? 0.7 : 1}
        >
          {selectionMode && (
            <View style={[styles.selectionCheckbox, isSelected && styles.selectionCheckboxSelected]}>
              {isSelected && <Check size={16} color="#fff" />}
            </View>
          )}

          {category.image ? (
            <Image source={{ uri: category.image }} style={styles.categoryImageSmall} />
          ) : (
            <View style={styles.categoryDot} />
          )}
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{category.name}</Text>
            {subcategories.length > 0 && (
              <Text style={styles.subcategoryCount}>{subcategories.length} underkategorier</Text>
            )}
          </View>
          {!selectionMode && (
            <View style={styles.itemActions}>
              <TouchableOpacity
                onPress={onAddSubcategory}
                style={styles.iconButtonSmall}
              >
                <FolderPlus size={16} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onEdit} style={styles.iconButtonSmall}>
                <Edit3 size={16} color="#6366F1" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onDelete} style={styles.iconButtonSmall}>
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
      {subcategories.length > 0 && (
        <View style={styles.subcategoriesList}>
          {subcategories.map((sub) => (
            <View key={sub.id} style={styles.subcategoryItem}>
              {sub.image ? (
                <Image source={{ uri: sub.image }} style={styles.categoryImageSmall} />
              ) : (
                <View style={styles.subcategoryDot} />
              )}
              <Text style={styles.subcategoryName}>{sub.name}</Text>
              <View style={styles.itemActions}>
                <TouchableOpacity onPress={() => onEditSubcategory(sub)} style={styles.iconButtonSmall}>
                  <Edit3 size={16} color="#6366F1" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDeleteSubcategory(sub.id)} style={styles.iconButtonSmall}>
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

interface ProductDraggableItemProps {
  product: Product;
  index: number;
  allProducts: Product[];
  isDragging: boolean;
  isDraggedOver: boolean;
  onDragStart: () => void;
  onDragOver: (index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
}

interface CategoryReorderItemProps {
  category: Category;
  index: number;
  filteredCategories: Category[];
  isDragging: boolean;
  isDraggedOver: boolean;
  onDragStart: () => void;
  onDragOver: (index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
}

function CategoryReorderItem({
  category,
  index,
  filteredCategories,
  isDragging,
  isDraggedOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: CategoryReorderItemProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDraggingState, setIsDraggingState] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        setIsDraggingState(true);
        onDragStart();
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: 0, y: gestureState.dy });
        
        const itemHeight = 78;
        const moveSteps = Math.round(gestureState.dy / itemHeight);
        const targetIndex = Math.max(0, Math.min(filteredCategories.length - 1, index + moveSteps));
        
        if (targetIndex !== index && moveSteps !== 0) {
          onDragOver(targetIndex);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const itemHeight = 78;
        const moveSteps = Math.round(gestureState.dy / itemHeight);
        const targetIndex = Math.max(0, Math.min(filteredCategories.length - 1, index + moveSteps));
        
        setIsDraggingState(false);
        
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }).start(() => {
          if (targetIndex !== index) {
            onDrop(targetIndex);
          } else {
            onDragEnd();
          }
        });
      },
      onPanResponderTerminate: () => {
        setIsDraggingState(false);
        
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }).start(() => {
          onDragEnd();
        });
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.reorderItem,
        {
          transform: [{ translateY: pan.y }],
        },
        isDraggingState && styles.reorderItemDragging,
        isDraggedOver && styles.reorderItemDraggedOver,
      ]}
    >
      <View style={styles.dragHandle}>
        <GripVertical size={20} color="#9CA3AF" />
      </View>
      {category.image ? (
        <Image source={{ uri: category.image }} style={styles.reorderItemImage} />
      ) : (
        <View style={[styles.reorderItemImage, { backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }]}>
          <FolderPlus size={20} color="#9CA3AF" />
        </View>
      )}
      <View style={styles.reorderItemInfo}>
        <Text style={styles.reorderItemName} numberOfLines={1}>{category.name}</Text>
      </View>
    </Animated.View>
  );
}

function ProductDraggableItem({
  product,
  index,
  allProducts,
  isDragging,
  isDraggedOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: ProductDraggableItemProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDraggingState, setIsDraggingState] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        setIsDraggingState(true);
        onDragStart();
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: 0, y: gestureState.dy });
        
        const itemHeight = 70;
        const moveSteps = Math.round(gestureState.dy / itemHeight);
        const targetIndex = Math.max(0, Math.min(allProducts.length - 1, index + moveSteps));
        
        if (targetIndex !== index && moveSteps !== 0) {
          onDragOver(targetIndex);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const itemHeight = 70;
        const moveSteps = Math.round(gestureState.dy / itemHeight);
        const targetIndex = Math.max(0, Math.min(allProducts.length - 1, index + moveSteps));
        
        setIsDraggingState(false);
        
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }).start(() => {
          if (targetIndex !== index) {
            onDrop(targetIndex);
          } else {
            onDragEnd();
          }
        });
      },
      onPanResponderTerminate: () => {
        setIsDraggingState(false);
        
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }).start(() => {
          onDragEnd();
        });
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.reorderItem,
        {
          transform: [{ translateY: pan.y }],
        },
        isDraggingState && styles.reorderItemDragging,
        isDraggedOver && styles.reorderItemDraggedOver,
      ]}
    >
      <View style={styles.dragHandle}>
        <GripVertical size={20} color="#9CA3AF" />
      </View>
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.reorderItemImage} />
      ) : (
        <View style={[styles.reorderItemImage, { backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }]}>
          <ImageIcon size={20} color="#9CA3AF" />
        </View>
      )}
      <View style={styles.reorderItemInfo}>
        <Text style={styles.reorderItemName} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.reorderItemPrice}>{product.price.toFixed(2)} kr</Text>
      </View>
    </Animated.View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#111827',
    letterSpacing: -0.5,
  },
  tabNav: {
    flexGrow: 0,
  },
  tabNavContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#10B981',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  tabCount: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#9CA3AF',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    textAlign: 'center' as const,
  },
  tabCountActive: {
    color: '#10B981',
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  reorderFullScreenContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  reorderFullScreenScroll: {
    flex: 1,
  },
  tabContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 2,
  },
  tabDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  sizeControls: {
    flexDirection: 'row',
    gap: 6,
  },
  sizeControlButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  sizeControlActive: {
    backgroundColor: '#D1FAE5',
  },

  addButton: {
    backgroundColor: '#10B981',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 40,
  },
  productCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative' as const,
  },
  productImage: {
    width: '100%',
    backgroundColor: '#E5E7EB',
  },
  productImagePlaceholder: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTag: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fff',
  },
  productCardContent: {
    padding: 10,
  },
  productCardName: {
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  productCardPrice: {
    fontWeight: '700' as const,
    color: '#10B981',
  },
  sizeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sizeBadgeText: {
    color: '#10B981',
    fontWeight: '500' as const,
  },
  productCardActions: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  iconButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  categoryList: {
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  categoryImageSmall: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  categoryTagImage: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  categoryOptionImage: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
  },
  variantCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  variantsButton: {
    padding: 6,
    marginRight: 8,
  },
  addOnList: {
    gap: 8,
  },
  addOnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  addOnInfo: {
    flex: 1,
  },
  addOnName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  addOnPrice: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalContentCentered: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 8,
  },
  categorySelection: {
    marginBottom: 12,
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 8,
    gap: 6,
  },
  categoryOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  categoryOptionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#111827',
  },
  imageSection: {
    marginBottom: 12,
  },
  imageButtons: {
    marginBottom: 8,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  urlInput: {
    marginBottom: 0,
  },
  imagePreviewContainer: {
    position: 'relative' as const,
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  removeImageButton: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  sizesSection: {
    marginBottom: 12,
  },
  sizesSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 12,
  },
  sizesList: {
    gap: 8,
    marginBottom: 12,
  },
  sizeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  sizeItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
  },
  sizeItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sizeItemPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  addSizeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  sizeNameInput: {
    flex: 2,
    marginBottom: 0,
  },
  sizePriceInput: {
    flex: 1,
    marginBottom: 0,
  },
  addSizeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderColor: '#111827',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  addOnTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  addOnTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  addOnTypeAdd: {
    backgroundColor: '#D1FAE5',
  },
  addOnTypeRemove: {
    backgroundColor: '#FEE2E2',
  },
  addOnTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#111827',
  },
  addOnProducts: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  addOnActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButtonSmall: {
    padding: 6,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeSelection: {
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#10B981',
  },
  productSelection: {
    marginBottom: 12,
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  productCheckboxList: {
    maxHeight: 200,
  },
  productCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    marginBottom: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  productCheckboxText: {
    fontSize: 14,
    color: '#111827',
  },
  typeIdSelection: {
    marginBottom: 12,
  },
  typeIdButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeIdButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  typeIdButtonSelected: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  typeIdButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  typeIdButtonTextActive: {
    color: '#10B981',
  },
  addTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed' as const,
  },
  addTypeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  typeIdHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
    marginTop: -4,
  },
  typesList: {
    gap: 8,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  typeAddOnsCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center' as const,
  },
  importPlaceholder: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  modalContentSmall: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '50%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  variantsScrollView: {
    maxHeight: 400,
  },
  variantsList: {
    gap: 8,
    marginBottom: 16,
  },
  variantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  variantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 12,
  },
  variantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  variantColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  variantName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
  },
  variantPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  emptyVariantsText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  addVariantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  addVariantButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  tilleggsvarerSection: {
    marginBottom: 12,
  },
  tilleggsvarerHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  tilleggsvarerList: {
    gap: 8,
  },
  tilleggsvareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  tilleggsvareOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  tilleggsvareCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tilleggsvareCheckboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  tilleggsvareOptionInfo: {
    flex: 1,
  },
  tilleggsvareOptionName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
  },
  tilleggsvareOptionVariants: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  settingsSection: {
    marginTop: 16,
    gap: 16,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  settingItemLeft: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  columnSelector: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  columnButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  columnButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  columnButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#6B7280',
  },
  columnButtonTextActive: {
    color: '#fff',
  },
  printerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  printerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerInfo: {
    flex: 1,
  },
  printerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  printerName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#111827',
  },
  statusBadge2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText2: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  statusTextActive: {
    color: '#10B981',
  },
  statusTextInactive: {
    color: '#EF4444',
  },
  printerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  printerIP: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'monospace' as const,
  },
  printerMeta: {
    flexDirection: 'row',
    gap: 6,
  },
  printerMetaBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  printerMetaText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#6B7280',
    textTransform: 'capitalize' as const,
  },
  logsSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logsSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
  },
  logsList: {
    gap: 10,
  },
  logItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
  },
  logHeader: {
    marginBottom: 8,
  },
  logTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logOrderNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#111827',
  },
  logStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  logStatusText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  logTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace' as const,
  },
  logDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logPrinter: {
    fontSize: 13,
    color: '#6B7280',
  },
  logAttempts: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  logError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    fontFamily: 'monospace' as const,
  },
  testInfoCard: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  testInfoTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 8,
  },
  testInfoCode: {
    fontSize: 11,
    fontFamily: 'monospace' as const,
    color: '#374151',
    lineHeight: 16,
  },
  testInfoNote: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 6,
    lineHeight: 18,
  },
  subcategoriesList: {
    marginLeft: 40,
    marginTop: 8,
    gap: 8,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  subcategoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  subcategoryName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#374151',
  },
  subcategoryCount: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  dragHandle: {
    padding: 8,
    marginRight: 8,
  },
  categoryItemDragging: {
    opacity: 0.95,
    elevation: 15,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
    borderWidth: 3,
  },
  categoryItemDraggedOver: {
    borderTopWidth: 4,
    borderTopColor: '#10B981',
    backgroundColor: '#ECFDF5',
    marginTop: 4,
  },
  parentCategoryInfo: {
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  parentCategoryLabel: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  parentCategoryName: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '700' as const,
  },
  draggableContainer: {
    zIndex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  importButton: {
    backgroundColor: '#D1FAE5',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  importScrollView: {
    maxHeight: 500,
  },
  importInstructions: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
  },
  importInstructionsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  importInstructionsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center' as const,
    paddingHorizontal: 20,
  },
  fileFormatSection: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  fileFormatTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
  },
  fileFormatText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  exampleBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  exampleTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 8,
  },
  exampleHeader: {
    fontSize: 11,
    fontFamily: 'monospace' as const,
    color: '#10B981',
    marginBottom: 8,
    fontWeight: '700' as const,
  },
  exampleText: {
    fontSize: 11,
    fontFamily: 'monospace' as const,
    color: '#374151',
    marginBottom: 4,
  },
  exampleComment: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
    fontStyle: 'italic' as const,
  },
  fileFormatNote: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600' as const,
  },
  fileInputContainer: {
    marginBottom: 16,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed' as const,
  },
  fileInputText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  errorSection: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#EF4444',
  },
  errorText: {
    fontSize: 13,
    color: '#991B1B',
    marginBottom: 4,
    lineHeight: 18,
  },
  previewSection: {
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  previewItem: {
    marginBottom: 12,
  },
  previewItemTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#047857',
    marginBottom: 8,
  },
  previewChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  previewChipText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600' as const,
  },
  confirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
  },
  selectionModeButton: {
    backgroundColor: '#EEF2FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  deleteSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteSelectedButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
  },
  deleteSelectedText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  cancelSelectionButton: {
    backgroundColor: '#F3F4F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCardSelected: {
    borderColor: '#6366F1',
    borderWidth: 3,
    backgroundColor: '#EEF2FF',
  },
  selectionCheckbox: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  selectionCheckboxSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  columnDescriptions: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  columnDescTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
  },
  columnDesc: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 16,
  },
  instructionsCard: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  columnList: {
    width: '100%',
    gap: 6,
    marginBottom: 12,
  },
  columnItem: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500' as const,
  },
  profileSection: {
    marginTop: 16,
    gap: 20,
  },
  profileIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  profileInfoSection: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  profileLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 6,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    padding: 6,
    borderRadius: 6,
    marginTop: 20,
    opacity: 0.4,
  },
  deleteAccountButtonText: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: '#fff',
  },
  reorderButton: {
    backgroundColor: '#F5F3FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  reorderScrollView: {
    maxHeight: 500,
  },
  reorderList: {
    gap: 8,
    paddingBottom: 20,
  },
  reorderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  reorderNumberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  reorderNumberInputContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderNumberInput: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#10B981',
    textAlign: 'center' as const,
    width: '100%',
    padding: 0,
  },
  reorderNumberText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  reorderEditIcon: {
    position: 'absolute' as const,
    bottom: 4,
    right: 4,
  },
  reorderNumberItemEditing: {
    borderColor: '#10B981',
    borderWidth: 3,
    backgroundColor: '#ECFDF5',
  },
  reorderEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  reorderConfirmButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  reorderCancelButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderItemDragging: {
    opacity: 0.95,
    elevation: 15,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
    borderWidth: 3,
  },
  reorderItemDraggedOver: {
    borderTopWidth: 4,
    borderTopColor: '#10B981',
    backgroundColor: '#ECFDF5',
    marginTop: 4,
  },
  reorderItemImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  reorderItemInfo: {
    flex: 1,
  },
  reorderItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  reorderItemPrice: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  reorderItemSubtext: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  reorderSubcategoriesList: {
    marginLeft: 56,
    marginTop: 8,
    marginBottom: 8,
    gap: 6,
  },
  reorderSubcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  reorderSubcategoryImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  reorderSubcategoryName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#374151',
    flex: 1,
  },
  reorderSubcategoryItemClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  categorySelectionParentName: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  variantActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customColorPreview: {
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  customColorPreviewText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  printerHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usbBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  usbBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#6366F1',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366F1',
    marginTop: 8,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6366F1',
  },
  reorderTypeSelection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  reorderTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  reorderTypeButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  reorderTypeButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  reorderTypeButtonTextActive: {
    color: '#fff',
  },
  reorderContentScroll: {
    maxHeight: 500,
  },
  usbSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366F1',
    marginBottom: 8,
  },
  usbSelectButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366F1',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  scanButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  discoveredPrintersScroll: {
    maxHeight: 400,
  },
  discoveredPrintersList: {
    gap: 12,
    marginBottom: 16,
  },
  discoveredPrinterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  discoveredPrinterIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoveredPrinterInfo: {
    flex: 1,
  },
  discoveredPrinterName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  discoveredPrinterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discoveredPrinterIP: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'monospace' as const,
  },
  discoveredPrinterTypeBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  discoveredPrinterTypeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  addDiscoveredButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  emptyDiscoveredState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  debugButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  debugButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  scanProgressContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  scanProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  scanProgressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  scanProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  scanProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  scanProgressCounter: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center' as const,
  },
  debugLogContainer: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    maxHeight: 200,
    marginBottom: 16,
  },
  debugLogText: {
    fontSize: 10,
    fontFamily: 'monospace' as const,
    color: '#D1D5DB',
    marginBottom: 2,
  },
  troubleshootingCard: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
    width: '100%',
  },
  troubleshootingTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#92400E',
    marginBottom: 8,
  },
  troubleshootingText: {
    fontSize: 13,
    color: '#78350F',
    marginBottom: 4,
  },
  reorderInstructionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
    textAlign: 'center' as const,
    marginBottom: 20,
    marginTop: 10,
  },
  categorySelectionList: {
    gap: 12,
  },
  categorySelectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categorySelectionImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  categorySelectionPlaceholder: {
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySelectionInfo: {
    flex: 1,
  },
  categorySelectionName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  categorySelectionCount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600' as const,
  },
  categorySelectionCardSubcategory: {
    marginLeft: 32,
  },
  reorderWithBackContainer: {
    flex: 1,
  },
  reorderBackHeader: {
    marginBottom: 16,
    gap: 12,
  },
  reorderBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  reorderBackText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  reorderCategoryTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  searchContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
  },
  categoryFilterContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryFilterTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 10,
  },
  categoryFilterScroll: {
    flexGrow: 0,
  },
  categoryFilterScrollVertical: {
    maxHeight: 300,
  },
  categoryFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryFilterChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  categoryFilterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  categoryFilterChipTextActive: {
    color: '#fff',
  },
  categoryFilterChipImage: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  categoryFilterGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryFilterGroupVertical: {
    marginBottom: 8,
  },
  categoryFilterChipSubcategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginLeft: 16,
    marginTop: 6,
  },
  categoryOptionDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    opacity: 0.6,
  },
  categoryOptionImageDisabled: {
    opacity: 0.5,
  },
  categoryOptionDotDisabled: {
    backgroundColor: '#9CA3AF',
  },
  categoryOptionTextDisabled: {
    color: '#9CA3AF',
  },
});
