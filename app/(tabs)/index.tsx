import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  useWindowDimensions,
  Image,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ShoppingCart, Plus, X, Trash2, Save, Minus, Banknote, Filter, Search } from 'lucide-react-native';
import { useProducts, Product, ProductSize, TilleggsvareVariant } from '@/contexts/ProductsContext';
import { useOrders, OrderItem } from '@/contexts/OrdersContext';
import { useBusinessSettings } from '@/contexts/BusinessSettingsContext';
import { usePrinter } from '@/contexts/PrinterContext';



type TilleggsvarerSelectorProps = {
  selectedVariants: { variant: TilleggsvareVariant; quantity: number }[];
  setSelectedVariants: (variants: { variant: TilleggsvareVariant; quantity: number }[]) => void;
  productTilleggsvareIds?: string[];
};

function TilleggsvarerSelector({ selectedVariants, setSelectedVariants, productTilleggsvareIds }: TilleggsvarerSelectorProps) {
  const { tilleggsvarer: allTilleggsvarer } = useProducts();
  
  const tilleggsvarer = productTilleggsvareIds && productTilleggsvareIds.length > 0
    ? allTilleggsvarer.filter(t => productTilleggsvareIds.includes(t.id))
    : allTilleggsvarer;
  const scrollViewRef = React.useRef<ScrollView>(null);
  
  const [selectedTilleggsvareId, setSelectedTilleggsvareId] = useState<string | undefined>(
    tilleggsvarer.length > 0 ? tilleggsvarer[0].id : undefined
  );
  
  const tilleggsvareIds = tilleggsvarer.map(t => t.id);
  
  const allVariants = tilleggsvarer.flatMap(t => 
    t.variants.map(v => ({ ...v, tilleggsvareId: t.id, tilleggsvareName: t.name }))
  );
  
  const filteredVariants = allVariants.filter(v => v.tilleggsvareId === selectedTilleggsvareId);

  const getTilleggsvareLabel = (tilleggsvareId: string) => {
    const foundTilleggsvare = tilleggsvarer.find(t => t.id === tilleggsvareId);
    return foundTilleggsvare ? foundTilleggsvare.name : 'Annet';
  };

  const getVariantQuantity = (variantId: string) => {
    const found = selectedVariants.find(v => v.variant.id === variantId);
    return found ? found.quantity : 0;
  };

  const updateVariantQuantity = (variant: any, delta: number) => {
    const currentQuantity = getVariantQuantity(variant.id);
    const newQuantity = currentQuantity + delta;

    if (newQuantity <= 0) {
      setSelectedVariants(selectedVariants.filter(v => v.variant.id !== variant.id));
    } else {
      const existing = selectedVariants.find(v => v.variant.id === variant.id);
      if (existing) {
        setSelectedVariants(
          selectedVariants.map(v =>
            v.variant.id === variant.id ? { ...v, quantity: newQuantity } : v
          )
        );
      } else {
        setSelectedVariants([...selectedVariants, { variant, quantity: newQuantity }]);
      }
    }
  };

  return (
    <>
      <Text style={styles.addOnsTitle}>Tilpass produkt</Text>
      <Text style={styles.addOnsSubtitle}>Velg tilleggsvarer</Text>
      
      {tilleggsvareIds.length > 1 && (
        <View style={styles.addOnTypesContainer}>
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.addOnTypesScroll}
            contentContainerStyle={styles.addOnTypesContent}
          >
            {tilleggsvareIds.map((tilleggsvareId) => {
              return (
                <TouchableOpacity
                  key={tilleggsvareId}
                  style={[
                    styles.addOnTypeTab,
                    selectedTilleggsvareId === tilleggsvareId && styles.addOnTypeTabActive,
                  ]}
                  onPress={() => setSelectedTilleggsvareId(tilleggsvareId)}
                >
                  <Text style={[
                    styles.addOnTypeTabText,
                    selectedTilleggsvareId === tilleggsvareId && styles.addOnTypeTabTextActive,
                  ]}>
                    {getTilleggsvareLabel(tilleggsvareId)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
      
      <ScrollView style={styles.addOnsList} showsVerticalScrollIndicator={false}>
        {filteredVariants.map((variant: any) => {
          const quantity = getVariantQuantity(variant.id);
          const priceText = variant.price > 0 ? ` +${variant.price.toFixed(2)} kr` : '';
          
          return (
            <View
              key={variant.id}
              style={[styles.addOnOption, quantity > 0 && styles.addOnOptionSelected]}
            >
              <View style={styles.addOnInfo}>
                <View style={styles.addOnNameRow}>
                  <Text style={styles.addOnName}>{variant.name}</Text>
                  <View style={[styles.addOnTypeBadge, styles.addOnTypeAddBadge]}>
                    <Text style={styles.addOnTypeBadgeText}>{variant.tilleggsvareName}</Text>
                  </View>
                </View>
                {priceText !== '' && <Text style={styles.addOnPrice}>{priceText}</Text>}
              </View>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateVariantQuantity(variant, -1)}
                >
                  <Minus size={16} color={quantity > 0 ? "#10B981" : "#D1D5DB"} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateVariantQuantity(variant, 1)}
                >
                  <Plus size={16} color="#10B981" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </>
  );
}

export default function CashRegisterScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  
  const { products, categories, tilleggsvarer } = useProducts();
  const { addOrder } = useOrders();
  const { settings } = useBusinessSettings();
  const { printToAllPrinters, printers } = usePrinter();
  
  const [showCartOnMobile, setShowCartOnMobile] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    const firstCategory = categories.find(c => !c.parentId);
    return firstCategory ? firstCategory.id : null;
  });
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showAddOnsModal, setShowAddOnsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | undefined>(undefined);
  const [selectedVariants, setSelectedVariants] = useState<{ variant: TilleggsvareVariant; quantity: number }[]>([]);
  const [showCashModal, setShowCashModal] = useState(false);
  
  React.useEffect(() => {
    console.log('showCashModal state changed:', showCashModal);
  }, [showCashModal]);
  
  React.useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      const firstCategory = categories.find(c => !c.parentId);
      if (firstCategory) {
        setSelectedCategory(firstCategory.id);
      }
    }
  }, [categories, selectedCategory]);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [showChangeDetails, setShowChangeDetails] = useState(false);
  const [showCustomAmountModal, setShowCustomAmountModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [customAmountName, setCustomAmountName] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategories, setSelectedFilterCategories] = useState<string[]>([]);
  
  const addToReceivedAmount = (amount: number) => {
    const current = parseFloat(receivedAmount) || 0;
    const newAmount = current + amount;
    setReceivedAmount(newAmount.toFixed(2));
  };
  
  const columns = settings.productColumns || 2;



  const handleClear = () => {
    setItems([]);
  };

  const handleSaveOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Feil', 'Handlekurven er tom');
      return;
    }

    try {
      const order = await addOrder(items);
      if (!order) {
        throw new Error('Kunne ikke opprette ordre');
      }
      
      const businessName = settings.storeName || 'Restaurant';
      const enabledPrinters = printers.filter(p => p.type === 'kitchen' && p.enabled);
      
      if (enabledPrinters.length > 0) {
        try {
          await printToAllPrinters(order, businessName);
          console.log('✅ Kvittering sendt til printer');
        } catch (printError) {
          console.error('⚠️ Printing feilet:', printError);
        }
      }
      
      setItems([]);
      if (!isTablet) {
        setShowCartOnMobile(false);
      }
      Alert.alert('Suksess', 'Bestilling lagt til i kjøkkenskjerm');
    } catch (error) {
      console.error('Failed to save order:', error);
      Alert.alert('Feil', 'Kunne ikke lagre bestilling');
    }
  };

  const handleCashPayment = () => {
    console.log('Cash button pressed, items:', items.length);
    if (items.length === 0) {
      Alert.alert('Feil', 'Handlekurven er tom');
      return;
    }
    console.log('Opening cash modal');
    setShowCashModal(true);
  };

  const handleCustomAmount = () => {
    setShowCustomAmountModal(true);
  };

  const addCustomAmountToCart = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Feil', 'Vennligst skriv inn et gyldig beløp');
      return;
    }

    const name = customAmountName.trim() || 'Egendefinert beløp';
    
    const newItem: OrderItem = {
      id: `custom_${Date.now()}_${Math.random()}`,
      name: name,
      price: amount,
      quantity: 1,
    };
    
    setItems([...items, newItem]);
    setCustomAmount('');
    setCustomAmountName('');
    setShowCustomAmountModal(false);
  };

  const completeCashPayment = async () => {
    const received = parseFloat(receivedAmount);
    const total = getTotalAmount();

    if (isNaN(received) || received <= 0) {
      Alert.alert('Feil', 'Vennligst skriv inn et gyldig beløp');
      return;
    }

    if (received < total) {
      Alert.alert('Feil', 'Mottatt beløp er mindre enn totalbeløpet');
      return;
    }

    try {
      const order = await addOrder(items);
      if (!order) {
        throw new Error('Kunne ikke opprette ordre');
      }
      
      const businessName = settings.storeName || 'Restaurant';
      const enabledPrinters = printers.filter(p => p.type === 'kitchen' && p.enabled);
      
      if (enabledPrinters.length > 0) {
        try {
          await printToAllPrinters(order, businessName);
          console.log('✅ Kvittering sendt til printer');
        } catch (printError) {
          console.error('⚠️ Printing feilet:', printError);
        }
      }
      
      setItems([]);
      setReceivedAmount('');
      setShowCashModal(false);
      setShowChangeDetails(false);
      if (!isTablet) {
        setShowCartOnMobile(false);
      }
      Alert.alert('Suksess', 'Kontantbetaling fullført');
    } catch (error) {
      console.error('Failed to complete cash payment:', error);
      Alert.alert('Feil', 'Kunne ikke fullføre betaling');
    }
  };

  const getChangeAmount = () => {
    const received = parseFloat(receivedAmount);
    const total = getTotalAmount();
    if (isNaN(received)) return 0;
    return Math.max(0, received - total);
  };

  const getChangeBreakdown = () => {
    const changeAmount = getChangeAmount();
    if (changeAmount === 0) return [];

    const denominations = [
      { value: 1000, label: '1000 kr' },
      { value: 500, label: '500 kr' },
      { value: 200, label: '200 kr' },
      { value: 100, label: '100 kr' },
      { value: 50, label: '50 kr' },
      { value: 20, label: '20 kr' },
      { value: 10, label: '10 kr' },
      { value: 5, label: '5 kr' },
      { value: 1, label: '1 kr' },
    ];

    let remaining = changeAmount;
    const breakdown: { value: number; label: string; count: number }[] = [];

    for (const denom of denominations) {
      if (remaining >= denom.value) {
        const count = Math.floor(remaining / denom.value);
        breakdown.push({ ...denom, count });
        remaining = remaining % denom.value;
      }
    }

    return breakdown;
  };

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    
    const productTilleggsvarer = product.tilleggsvareIds && product.tilleggsvareIds.length > 0
      ? tilleggsvarer.filter(t => product.tilleggsvareIds?.includes(t.id))
      : [];
    const hasVariants = productTilleggsvarer.some(t => t.variants.length > 0);
    
    if (product.sizes && product.sizes.length > 0) {
      setShowSizeModal(true);
    } else if (hasVariants) {
      setShowAddOnsModal(true);
    } else {
      addProductToCart(product, undefined, undefined);
      setSelectedProduct(null);
    }
  };

  const addProductToCart = (product: Product, size?: ProductSize, variantsWithQty?: { variant: any; quantity: number }[]) => {
    let basePrice = size ? size.price : product.price;
    const sizeName = size ? size.name : undefined;
    
    let variantsTotal = 0;
    const filteredVariants = variantsWithQty?.filter(v => v.quantity > 0);
    const addOnsToCompare = filteredVariants && filteredVariants.length > 0
      ? filteredVariants.map(v => {
          variantsTotal += v.variant.price * v.quantity;
          return { 
            id: v.variant.id, 
            name: v.variant.name, 
            price: v.variant.price, 
            quantity: v.quantity,
            type: 'add' as const,
            categoryName: v.variant.tilleggsvareName,
            color: v.variant.color
          };
        })
      : undefined;
    
    const price = basePrice + variantsTotal;
    
    const existingItemIndex = items.findIndex(item => {
      const nameMatch = item.name === product.name;
      const sizeMatch = item.size === sizeName;
      
      const addOnsMatch = JSON.stringify(
        item.addOns?.map(a => ({ id: a.id, quantity: a.quantity })).sort((a, b) => a.id.localeCompare(b.id))
      ) === JSON.stringify(
        addOnsToCompare?.map(a => ({ id: a.id, quantity: a.quantity })).sort((a, b) => a.id.localeCompare(b.id))
      );
      
      return nameMatch && sizeMatch && addOnsMatch;
    });
    
    if (existingItemIndex !== -1) {
      const updatedItems = [...items];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + 1,
      };
      setItems(updatedItems);
    } else {
      const newItem: OrderItem = {
        id: `item_${Date.now()}_${Math.random()}`,
        name: product.name,
        price: price,
        quantity: 1,
        size: sizeName,
        addOns: addOnsToCompare,
      };
      setItems([...items, newItem]);
    }
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  const updateItemQuantity = (itemId: string, delta: number) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + delta;
        return { ...item, quantity: Math.max(1, newQuantity) };
      }
      return item;
    });
    setItems(updatedItems);
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTotalItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const firstParentCategory = categories.find(cat => !cat.parentId);
  
  const filteredProducts = React.useMemo(() => {
    let filtered = products;

    if (selectedFilterCategories.length > 0) {
      filtered = products.filter(p => {
        if (!p.categoryId) return false;
        if (selectedFilterCategories.includes(p.categoryId)) return true;
        const productCategory = categories.find(c => c.id === p.categoryId);
        if (productCategory?.parentId && selectedFilterCategories.includes(productCategory.parentId)) {
          return true;
        }
        return false;
      });
    } else {
      filtered = selectedSubcategory
        ? products.filter(p => p.categoryId === selectedSubcategory)
        : selectedCategory
        ? products.filter(p => p.categoryId === selectedCategory || categories.some(sub => sub.parentId === selectedCategory && sub.id === p.categoryId))
        : firstParentCategory
        ? products.filter(p => p.categoryId === firstParentCategory.id || categories.some(sub => sub.parentId === firstParentCategory.id && sub.id === p.categoryId))
        : [];
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
    }

    return filtered;
  }, [products, categories, selectedSubcategory, selectedCategory, firstParentCategory, selectedFilterCategories, searchQuery]);

  const CartView = () => {
    return (
      <View style={styles.cartContainer}>
        <View style={styles.cartHeader}>
          <ShoppingCart size={24} color="#111827" />
          <Text style={styles.cartHeaderText}>Handlekurv</Text>
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{getTotalItemCount()}</Text>
          </View>
        </View>
        
        <ScrollView style={styles.cartItems} showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <View style={styles.emptyCart}>
              <ShoppingCart size={48} color="#D1D5DB" />
              <Text style={styles.emptyCartText}>Handlekurven er tom</Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  {item.size && (
                    <Text style={styles.cartItemSize}>{item.size}</Text>
                  )}
                  {item.addOns && item.addOns.length > 0 && (
                    <View style={styles.cartItemAddOns}>
                      {item.addOns.map((addOn, idx) => (
                        <Text key={idx} style={styles.cartItemAddOnText}>
                          + {addOn.name} {addOn.quantity && addOn.quantity > 1 ? `x${addOn.quantity}` : ''}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
                <View style={styles.cartItemActions}>
                  <View style={styles.cartItemQuantityControls}>
                    <TouchableOpacity
                      style={styles.cartItemQuantityButton}
                      onPress={() => updateItemQuantity(item.id, -1)}
                    >
                      <Minus size={14} color="#6B7280" />
                    </TouchableOpacity>
                    <Text style={styles.cartItemQuantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.cartItemQuantityButton}
                      onPress={() => updateItemQuantity(item.id, 1)}
                    >
                      <Plus size={14} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemPrice}>{(item.price * item.quantity).toFixed(2)} kr</Text>
                  <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.cartItemDelete}>
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.cartFooter}>
          <View style={styles.cartTotal}>
            <Text style={styles.cartTotalLabel}>Totalt</Text>
            <Text style={styles.cartTotalValue}>{getTotalAmount().toFixed(2)} kr</Text>
          </View>
          
          <View style={styles.cartActions}>
            <TouchableOpacity style={styles.customAmountButton} onPress={handleCustomAmount}>
              <Banknote size={20} color="#3B82F6" />
              <Text style={styles.customAmountButtonText}>+</Text>
            </TouchableOpacity>
            
            {items.length > 0 && (
              <>
                <TouchableOpacity style={styles.clearCartButton} onPress={handleClear}>
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveOrder}>
                  <Save size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Lagre</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cashButton} 
                  onPress={handleCashPayment}
                  activeOpacity={0.7}
                >
                  <Banknote size={20} color="#fff" />
                  <Text style={styles.cashButtonText}>Kontant</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };



  return (
    <View style={styles.container}>
      {!isTablet && showCartOnMobile ? (
        <>
          <View style={styles.mobileCartHeader}>
            <TouchableOpacity onPress={() => setShowCartOnMobile(false)} style={styles.backButton}>
              <X size={24} color="#111827" />
              <Text style={styles.backButtonText}>Tilbake</Text>
            </TouchableOpacity>
          </View>
          <CartView />
        </>
      ) : (
        <View style={isTablet ? styles.tabletLayout : styles.mobileLayout}>
        <View style={isTablet ? styles.productsSection : styles.mobileProductsSection}>
          <View style={styles.topSection}>
            <View style={styles.searchAndFilterContainer}>
              <View style={styles.searchContainer}>
                <Search size={20} color="#6B7280" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Søk etter produkter..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                    <X size={18} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilterCategories.length > 0 && styles.filterButtonActive,
                ]}
                onPress={() => setShowFilterModal(true)}
              >
                <Filter size={20} color={selectedFilterCategories.length > 0 ? "#fff" : "#6B7280"} />
                {selectedFilterCategories.length > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{selectedFilterCategories.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            {categories.length > 0 && (
              <ScrollView 
                horizontal 
                style={styles.categoriesScroll}
                contentContainerStyle={styles.categoriesContent}
                showsHorizontalScrollIndicator={false}
              >
                {categories.filter(cat => !cat.parentId).map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === cat.id && styles.categoryChipActive,
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat.id);
                      const subcategories = categories.filter(sub => sub.parentId === cat.id);
                      if (subcategories.length > 0) {
                        setSelectedSubcategory(subcategories[0].id);
                      } else {
                        setSelectedSubcategory(null);
                      }
                    }}
                  >
                    {cat.image ? (
                      <>
                        <Image 
                          source={{ 
                            uri: cat.image,
                            cache: 'force-cache'
                          }} 
                          style={styles.categoryChipBackground}
                          resizeMode="cover"
                        />
                        <View style={styles.categoryChipOverlay} />
                        <Text style={[
                          styles.categoryChipText,
                          styles.categoryChipTextWithBackground,
                          selectedCategory === cat.id && styles.categoryChipTextActive,
                        ]}>{cat.name}</Text>
                      </>
                    ) : (
                      <Text style={[
                        styles.categoryChipText,
                        selectedCategory === cat.id && styles.categoryChipTextActive,
                      ]}>{cat.name}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {selectedCategory && (
              <ScrollView 
                horizontal 
                style={styles.subcategoriesScroll}
                contentContainerStyle={styles.categoriesContent}
                showsHorizontalScrollIndicator={false}
              >
                {categories.filter(cat => cat.parentId === selectedCategory).map(subcat => (
                  <TouchableOpacity
                    key={subcat.id}
                    style={[
                      styles.subcategoryChip,
                      selectedSubcategory === subcat.id && styles.subcategoryChipActive,
                    ]}
                    onPress={() => setSelectedSubcategory(subcat.id)}
                  >
                    {subcat.image ? (
                      <>
                        <Image 
                          source={{ 
                            uri: subcat.image,
                            cache: 'force-cache'
                          }} 
                          style={styles.categoryChipBackground}
                          resizeMode="cover"
                        />
                        <View style={styles.categoryChipOverlay} />
                        <Text style={[
                          styles.subcategoryChipText,
                          styles.categoryChipTextWithBackground,
                          selectedSubcategory === subcat.id && styles.subcategoryChipTextActive,
                        ]}>{subcat.name}</Text>
                      </>
                    ) : (
                      <Text style={[
                        styles.subcategoryChipText,
                        selectedSubcategory === subcat.id && styles.subcategoryChipTextActive,
                      ]}>{subcat.name}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <ScrollView
            style={styles.productsGrid}
            contentContainerStyle={styles.productsGridContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredProducts.length === 0 ? (
              <View style={styles.emptyProducts}>
                <Text style={styles.emptyProductsText}>Ingen produkter funnet</Text>
                <Text style={styles.emptyProductsSubtext}>Gå til Backoffice for å legge til produkter</Text>
              </View>
            ) : (
              <View style={styles.productsGridInner}>
                {filteredProducts.map(product => {
                  let cardWidth = '48%';
                  if (columns === 1) cardWidth = '100%';
                  else if (columns === 2) cardWidth = '48%';
                  else if (columns === 3) cardWidth = '31.5%';
                  else if (columns === 4) cardWidth = '23%';
                  else if (columns === 5) cardWidth = '18.5%';
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={[styles.productCard, { width: cardWidth }]}
                      onPress={() => handleProductPress(product)}
                    >
                      <View style={styles.productCardContent}>
                        {product.image ? (
                          <Image 
                            source={{ 
                              uri: product.image,
                              cache: 'force-cache'
                            }} 
                            style={styles.productCardImage} 
                            resizeMode="cover"
                            defaultSource={require('@/assets/images/icon.png')}
                          />
                        ) : (
                          <View style={styles.productCardImagePlaceholder}>
                            <Text style={styles.productImagePlaceholderText}>{product.name.charAt(0)}</Text>
                          </View>
                        )}
                        
                        <View style={styles.productCardInfo}>
                          <Text style={styles.productCardName} numberOfLines={2}>{product.name}</Text>
                          {product.sizes && product.sizes.length > 0 ? (
                            <Text style={styles.productCardPrice}>fra {Math.min(...product.sizes.map(s => s.price)).toFixed(2)} kr</Text>
                          ) : (
                            <Text style={styles.productCardPrice}>{product.price.toFixed(2)} kr</Text>
                          )}
                        </View>
                        
                        <TouchableOpacity 
                          style={styles.productCardAddButton}
                          onPress={() => handleProductPress(product)}
                        >
                          <Plus size={18} color="#fff" strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {!isTablet && (
            <TouchableOpacity 
              style={styles.mobileCartButton}
              onPress={() => setShowCartOnMobile(true)}
            >
              <ShoppingCart size={24} color="#fff" />
              <Text style={styles.mobileCartButtonText}>Gå til handlekurv</Text>
              {items.length > 0 && (
                <View style={styles.mobileCartBadge}>
                  <Text style={styles.mobileCartBadgeText}>{getTotalItemCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {isTablet && (
          <View style={styles.cartSection}>
            <CartView />
          </View>
        )}
        </View>
      )}

      <Modal
        visible={showSizeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSizeModal(false)}
      >
        <View style={styles.modalOverlayCentered}>
          <View style={styles.modalContentCentered}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Velg størrelse</Text>
              <TouchableOpacity onPress={() => {
                setShowSizeModal(false);
                setSelectedProduct(null);
              }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedProduct?.image && (
              <Image source={{ uri: selectedProduct.image }} style={styles.modalProductImage} />
            )}
            
            <Text style={styles.modalProductName}>{selectedProduct?.name}</Text>
            
            <View style={styles.sizesList}>
              {selectedProduct?.sizes?.map(size => (
                <TouchableOpacity
                  key={size.id}
                  style={styles.sizeOption}
                  onPress={() => {
                    if (selectedProduct) {
                      const productTilleggsvarer = selectedProduct.tilleggsvareIds && selectedProduct.tilleggsvareIds.length > 0
                        ? tilleggsvarer.filter(t => selectedProduct.tilleggsvareIds?.includes(t.id))
                        : [];
                      const hasVariants = productTilleggsvarer.some(t => t.variants.length > 0);
                      
                      setSelectedSize(size);
                      setShowSizeModal(false);
                      if (hasVariants) {
                        setShowAddOnsModal(true);
                      } else {
                        addProductToCart(selectedProduct, size);
                        setSelectedProduct(null);
                        setSelectedSize(undefined);
                      }
                    }
                  }}
                >
                  <View style={styles.sizeOptionLeft}>
                    <Text style={styles.sizeOptionName}>{size.name}</Text>
                  </View>
                  <View style={styles.sizeOptionRight}>
                    <Text style={styles.sizeOptionPrice}>{size.price.toFixed(2)} kr</Text>
                    <Plus size={20} color="#10B981" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddOnsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAddOnsModal(false)}
      >
        <View style={styles.modalOverlayCentered}>
          <View style={styles.modalContentCentered}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tilpass produkt</Text>
              <TouchableOpacity onPress={() => {
                setShowAddOnsModal(false);
                setSelectedVariants([]);
                setSelectedProduct(null);
                setSelectedSize(undefined);
              }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedProduct?.image && (
              <Image source={{ uri: selectedProduct.image }} style={styles.modalProductImage} />
            )}
            
            <Text style={styles.modalProductName}>{selectedProduct?.name}</Text>
            {selectedSize && (
              <Text style={styles.modalProductSize}>Størrelse: {selectedSize.name}</Text>
            )}
            
            {selectedProduct && selectedProduct.tilleggsvareIds && selectedProduct.tilleggsvareIds.length > 0 && (
              <TilleggsvarerSelector
                selectedVariants={selectedVariants}
                setSelectedVariants={setSelectedVariants}
                productTilleggsvareIds={selectedProduct.tilleggsvareIds}
              />
            )}
            
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={() => {
                if (selectedProduct) {
                  const filteredVariants = selectedVariants.filter(v => v.quantity > 0);
                  const variantsToAdd = filteredVariants.length > 0 ? filteredVariants : undefined;
                  addProductToCart(selectedProduct, selectedSize, variantsToAdd);
                }
                setShowAddOnsModal(false);
                setSelectedVariants([]);
                setSelectedProduct(null);
                setSelectedSize(undefined);
              }}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.addToCartButtonText}>Legg til i handlekurv</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCashModal}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => {
          console.log('Modal close requested');
          setShowCashModal(false);
        }}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.cashModalOverlay}
          onPress={() => {
            setShowCashModal(false);
            setReceivedAmount('');
            setShowChangeDetails(false);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.cashModalKeyboardView}
          >
            <TouchableOpacity activeOpacity={1} style={styles.cashModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Kontantbetaling</Text>
                <TouchableOpacity onPress={() => {
                  setShowCashModal(false);
                  setReceivedAmount('');
                  setShowChangeDetails(false);
                }}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.cashModalBody}>
                <View style={styles.totalSection}>
                  <Text style={styles.totalLabel}>Totalbeløp:</Text>
                  <Text style={styles.totalAmount}>{getTotalAmount().toFixed(2)} kr</Text>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Mottatt beløp</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencySymbol}>kr</Text>
                    <TextInput
                      keyboardType="decimal-pad"
                      value={receivedAmount}
                      onChangeText={setReceivedAmount}
                      placeholder="0.00"
                      placeholderTextColor="#9CA3AF"
                      style={styles.cashInput}
                    />
                  </View>
                  
                  <View style={styles.quickAmountButtonsContainer}>
                    <Text style={styles.quickAmountTitle}>Legg til beløp:</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.quickAmountScrollContent}
                      style={styles.quickAmountScroll}
                    >
                      {[1, 5, 10, 20, 50, 100, 200, 500, 1000].map((amount) => (
                        <TouchableOpacity
                          key={amount}
                          style={styles.quickAmountButton}
                          onPress={() => addToReceivedAmount(amount)}
                        >
                          <Text style={styles.quickAmountText}>+{amount}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {receivedAmount && parseFloat(receivedAmount) >= getTotalAmount() && (
                  <>
                    <View style={styles.changeSection}>
                      <View style={styles.changeSectionLeft}>
                        <Text style={styles.changeLabel}>Vekslepenger:</Text>
                        <Text style={styles.changeAmount}>{getChangeAmount().toFixed(2)} kr</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.toggleDetailsButton}
                        onPress={() => setShowChangeDetails(!showChangeDetails)}
                      >
                        <Text style={styles.toggleDetailsText}>
                          {showChangeDetails ? 'Skjul detaljer' : 'Vis detaljer'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {showChangeDetails && (
                      <View style={styles.changeDetailsSection}>
                        <Text style={styles.changeDetailsTitle}>Sedler og mynter:</Text>
                        {getChangeBreakdown().map((item, idx) => (
                          <View key={idx} style={styles.changeDetailRow}>
                            <Text style={styles.changeDetailLabel}>{item.label}</Text>
                            <View style={styles.changeDetailRight}>
                              <Text style={styles.changeDetailCount}>× {item.count}</Text>
                              <Text style={styles.changeDetailAmount}>{(item.value * item.count).toFixed(2)} kr</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                )}

                {receivedAmount && parseFloat(receivedAmount) < getTotalAmount() && parseFloat(receivedAmount) > 0 && (
                  <View style={styles.warningSection}>
                    <Text style={styles.warningText}>Mottatt beløp er for lavt</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.completeCashButton,
                  (!receivedAmount || parseFloat(receivedAmount) < getTotalAmount()) && styles.completeCashButtonDisabled
                ]}
                onPress={completeCashPayment}
                disabled={!receivedAmount || parseFloat(receivedAmount) < getTotalAmount()}
              >
                <Text style={styles.completeCashButtonText}>Fullfør betaling</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showCustomAmountModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCustomAmountModal(false)}
      >
        <View style={styles.modalOverlayCentered}>
          <View style={styles.modalContentCentered}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Legg til egendefinert beløp</Text>
              <TouchableOpacity onPress={() => {
                setShowCustomAmountModal(false);
                setCustomAmount('');
                setCustomAmountName('');
              }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.customAmountModalBody}>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Navn (valgfritt)</Text>
                <TextInput
                  value={customAmountName}
                  onChangeText={setCustomAmountName}
                  placeholder="F.eks. Tips, Frakt, etc."
                  placeholderTextColor="#9CA3AF"
                  style={styles.customAmountNameInput}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Beløp (kr)</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>kr</Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    value={customAmount}
                    onChangeText={setCustomAmount}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    style={styles.cashInput}
                    autoFocus
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.addCustomAmountButton,
                (!customAmount || parseFloat(customAmount) <= 0) && styles.addCustomAmountButtonDisabled
              ]}
              onPress={addCustomAmountToCart}
              disabled={!customAmount || parseFloat(customAmount) <= 0}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.addCustomAmountButtonText}>Legg til i handlekurv</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFilterModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlayCentered}>
          <View style={styles.modalContentCentered}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrer etter kategori</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterCategoriesList} showsVerticalScrollIndicator={false}>
              {categories.length === 0 ? (
                <View style={styles.emptyFilterCategories}>
                  <Text style={styles.emptyFilterText}>Ingen kategorier funnet</Text>
                  <Text style={styles.emptyFilterSubtext}>Gå til Backoffice for å legge til kategorier</Text>
                </View>
              ) : (
                <>
                  {categories.filter(c => !c.parentId).map(parentCat => {
                    const subcategories = categories.filter(c => c.parentId === parentCat.id);
                    const isParentSelected = selectedFilterCategories.includes(parentCat.id);
                    
                    return (
                      <View key={parentCat.id} style={styles.filterCategoryGroup}>
                        <TouchableOpacity
                          style={[
                            styles.filterCategoryOption,
                            isParentSelected && styles.filterCategoryOptionSelected,
                          ]}
                          onPress={() => {
                            if (isParentSelected) {
                              setSelectedFilterCategories(prev => prev.filter(id => id !== parentCat.id));
                            } else {
                              setSelectedFilterCategories(prev => [...prev, parentCat.id]);
                            }
                          }}
                        >
                          <View style={styles.filterCategoryLeft}>
                            {parentCat.image && (
                              <Image
                                source={{ uri: parentCat.image, cache: 'force-cache' }}
                                style={styles.filterCategoryImage}
                              />
                            )}
                            <View style={styles.filterCategoryTextContainer}>
                              <Text style={[
                                styles.filterCategoryText,
                                isParentSelected && styles.filterCategoryTextSelected,
                              ]}>
                                {parentCat.name}
                              </Text>
                              {subcategories.length > 0 && (
                                <Text style={styles.filterSubcategoryCount}>
                                  {subcategories.length} underkategori{subcategories.length !== 1 ? 'er' : ''}
                                </Text>
                              )}
                            </View>
                          </View>
                          <View style={[
                            styles.filterCheckbox,
                            isParentSelected && styles.filterCheckboxSelected,
                          ]}>
                            {isParentSelected && (
                              <View style={styles.filterCheckboxCheck} />
                            )}
                          </View>
                        </TouchableOpacity>
                        
                        {subcategories.length > 0 && (
                          <View style={styles.filterSubcategoriesContainer}>
                            <View style={styles.subcategoryDivider} />
                            {subcategories.map(subcat => {
                              const isSubSelected = selectedFilterCategories.includes(subcat.id);
                              
                              return (
                                <TouchableOpacity
                                  key={subcat.id}
                                  style={[
                                    styles.filterSubcategoryOption,
                                    isSubSelected && styles.filterSubcategoryOptionSelected,
                                  ]}
                                  onPress={() => {
                                    if (isSubSelected) {
                                      setSelectedFilterCategories(prev => prev.filter(id => id !== subcat.id));
                                    } else {
                                      setSelectedFilterCategories(prev => [...prev, subcat.id]);
                                    }
                                  }}
                                >
                                  <View style={styles.filterCategoryLeft}>
                                    {subcat.image && (
                                      <Image
                                        source={{ uri: subcat.image, cache: 'force-cache' }}
                                        style={styles.filterSubcategoryImage}
                                      />
                                    )}
                                    <Text style={[
                                      styles.filterSubcategoryText,
                                      isSubSelected && styles.filterSubcategoryTextSelected,
                                    ]}>
                                      {subcat.name}
                                    </Text>
                                  </View>
                                  <View style={[
                                    styles.filterCheckbox,
                                    isSubSelected && styles.filterCheckboxSelected,
                                  ]}>
                                    {isSubSelected && (
                                      <View style={styles.filterCheckboxCheck} />
                                    )}
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </>
              )}
            </ScrollView>
            
            <View style={styles.filterModalFooter}>
              {selectedFilterCategories.length > 0 && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => setSelectedFilterCategories([])}
                >
                  <Text style={styles.clearFiltersButtonText}>Fjern alle filtre</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyFiltersButtonText}>
                  {selectedFilterCategories.length > 0
                    ? `Vis ${filteredProducts.length} produkter`
                    : 'Lukk'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  tabletLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  mobileLayout: {
    flex: 1,
  },
  productsSection: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  mobileProductsSection: {
    flex: 1,
  },
  cartSection: {
    width: 380,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  topSection: {
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
  categoriesScroll: {
    flexGrow: 0,
  },
  categoriesContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },

  categoryChip: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    position: 'relative' as const,
    minHeight: 49,
    minWidth: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  categoryChipText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#6B7280',
    textAlign: 'center' as const,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  categoryChipBackground: {
    position: 'absolute' as const,
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    width: undefined,
    height: undefined,
  },
  categoryChipOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  categoryChipTextWithBackground: {
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    zIndex: 2,
  },
  subcategoriesScroll: {
    flexGrow: 0,
    marginTop: 8,
  },
  subcategoryChip: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
    position: 'relative' as const,
    minHeight: 52,
    minWidth: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subcategoryChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  subcategoryChipText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#6B7280',
    textAlign: 'center' as const,
  },
  subcategoryChipTextActive: {
    color: '#fff',
  },
  productsGrid: {
    flex: 1,
  },
  productsGridContent: {
    padding: 16,
    paddingBottom: 100,
  },
  productsGridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative' as const,
  },
  productCardContent: {
    flex: 1,
  },
  productCardImage: {
    width: '100%',
    height: 110,
    backgroundColor: '#F9FAFB',
  },
  productCardImagePlaceholder: {
    width: '100%',
    height: 110,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImagePlaceholderText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#9CA3AF',
  },
  productCardInfo: {
    padding: 10,
    gap: 4,
    minHeight: 60,
  },
  productCardName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#111827',
    lineHeight: 16,
  },
  productCardPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#10B981',
    marginTop: 2,
  },
  productCardAddButton: {
    position: 'absolute' as const,
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyProducts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyProductsText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyProductsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  cartContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cartHeaderText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#111827',
    flex: 1,
  },
  cartBadge: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  cartItems: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  emptyCart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyCartText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#9CA3AF',
    marginTop: 16,
  },
  cartItem: {
    flexDirection: 'column',
    padding: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cartItemLeft: {
    flex: 1,
  },
  cartItemInfo: {
    flex: 1,
    marginBottom: 8,
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  cartItemSize: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  cartItemAddOns: {
    gap: 4,
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cartItemAddOnText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600' as const,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    overflow: 'hidden',
  },
  cartItemRight: {
    alignItems: 'flex-end',
    gap: 6,
    justifyContent: 'space-between',
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cartItemQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
    gap: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cartItemQuantityButton: {
    padding: 6,
    backgroundColor: '#fff',
    borderRadius: 6,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemQuantityText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#111827',
    minWidth: 32,
    textAlign: 'center' as const,
  },
  cartItemPrice: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#10B981',
  },
  cartItemDelete: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
    paddingBottom: 14,
    backgroundColor: '#fff',
  },
  cartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  cartTotalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  cartTotalValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
  },
  cartActions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearCartButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  cashButton: {
    flex: 1,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cashButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  mobileCartButton: {
    position: 'absolute' as const,
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mobileCartButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  mobileCartBadge: {
    position: 'absolute' as const,
    top: -8,
    right: 16,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  mobileCartBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  mobileCartHeader: {
    padding: 16,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
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
  modalOverlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashModalKeyboardView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
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
  modalProductImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  modalProductName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 16,
  },
  modalProductSize: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  sizesList: {
    gap: 12,
  },
  sizeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  sizeOptionLeft: {
    flex: 1,
  },
  sizeOptionName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  sizeOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sizeOptionPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  addOnsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  addOnsSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  addOnsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  addOnOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  addOnOptionSelected: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  addOnCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addOnInfo: {
    flex: 1,
  },
  addOnName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  addOnPrice: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600' as const,
  },
  addToCartButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addToCartButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  addOnNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  addOnTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  addOnTypeAddBadge: {
    backgroundColor: '#D1FAE5',
  },
  addOnTypeRemoveBadge: {
    backgroundColor: '#FEE2E2',
  },
  addOnTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#111827',
  },
  addOnTypesContainer: {
    marginBottom: 16,
  },
  addOnTypesScroll: {
    marginHorizontal: -20,
  },
  addOnTypesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  addOnTypeTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  addOnTypeTabActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  addOnTypeTabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  addOnTypeTabTextActive: {
    color: '#fff',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quantityButton: {
    padding: 4,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    minWidth: 24,
    textAlign: 'center' as const,
  },
  cashModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 450,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 24,
  },
  cashModalBody: {
    gap: 24,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
  },
  inputSection: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#9CA3AF',
  },
  changeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  changeSectionLeft: {
    flex: 1,
  },
  changeLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#059669',
  },
  changeAmount: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#059669',
  },
  toggleDetailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  toggleDetailsText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  changeDetailsSection: {
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  changeDetailsTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#6B7280',
    marginBottom: 12,
  },
  changeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  changeDetailLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
  },
  changeDetailRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  changeDetailCount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#6B7280',
  },
  changeDetailAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#10B981',
    minWidth: 80,
    textAlign: 'right' as const,
  },
  warningSection: {
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#DC2626',
    textAlign: 'center' as const,
  },
  completeCashButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  completeCashButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  completeCashButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  cashInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#111827',
    backgroundColor: 'transparent',
    textAlign: 'right' as const,
    padding: 0,
  },
  quickAmountButtonsContainer: {
    marginTop: 8,
  },
  quickAmountTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 10,
    marginLeft: 4,
  },
  quickAmountScroll: {
    flexGrow: 0,
  },
  quickAmountScrollContent: {
    gap: 10,
    paddingRight: 20,
  },
  quickAmountButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#10B981',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 70,
  },
  quickAmountText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  customAmountButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  customAmountButtonText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3B82F6',
  },
  customAmountModalBody: {
    gap: 20,
    marginBottom: 20,
  },
  customAmountNameInput: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  addCustomAmountButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addCustomAmountButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  addCustomAmountButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  searchAndFilterContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative' as const,
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterBadge: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
  },
  filterCategoriesList: {
    maxHeight: 450,
    marginBottom: 16,
  },
  emptyFilterCategories: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyFilterText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyFilterSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center' as const,
  },
  filterCategoryGroup: {
    marginBottom: 12,
  },
  filterCategoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  filterCategoryOptionSelected: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  filterSubcategoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  filterSubcategoryOptionSelected: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  filterCategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  filterCategoryImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  filterCategoryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    flex: 1,
  },
  filterCategoryTextSelected: {
    color: '#059669',
  },
  filterSubcategoryText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#6B7280',
    flex: 1,
  },
  filterSubcategoryTextSelected: {
    color: '#059669',
    fontWeight: '600' as const,
  },
  filterSubcategoriesContainer: {
    paddingLeft: 20,
    marginTop: 4,
    marginBottom: 8,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#D1D5DB',
    marginLeft: 12,
  },
  subcategoryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
    marginTop: 4,
  },
  filterCategoryTextContainer: {
    flex: 1,
    gap: 2,
  },
  filterSubcategoryCount: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#9CA3AF',
  },
  filterSubcategoryImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  filterCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCheckboxSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterCheckboxCheck: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  filterModalFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  clearFiltersButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  clearFiltersButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  applyFiltersButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFiltersButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
