import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { Check, ChefHat, Grid3x3, Grid2x2, Package, Maximize2, Minimize2, Printer, Circle, CheckCircle2 } from 'lucide-react-native';
import { useOrders, Order } from '@/contexts/OrdersContext';
import { useProducts } from '@/contexts/ProductsContext';
import { usePrinter } from '@/contexts/PrinterContext';
import { useBusinessSettings } from '@/contexts/BusinessSettingsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OrderSizeView = 'small' | 'medium' | 'large';

export default function KitchenScreen() {
  const { orders, updateOrderStatus, deleteOrder } = useOrders();
  const { tilleggsvarer } = useProducts();
  const { printKitchenReceipt, printToWebPRNT, printers } = usePrinter();
  const { settings } = useBusinessSettings();
  const [orderSizeView, setOrderSizeView] = useState<OrderSizeView>('medium');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);
  const printedOrdersRef = useRef<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    loadSizePreference();
    loadAutoPrintPreference();
  }, []);

  useEffect(() => {
    const activeOrders = orders.filter(o => o.status !== 'completed');
    const newOrders = activeOrders.filter(order => 
      !printedOrdersRef.current.has(order.id) && order.status === 'pending'
    );

    if (autoPrintEnabled && newOrders.length > 0) {
      newOrders.forEach(async (order) => {
        try {
          const businessName = settings.storeName || 'Restaurant';
          
          const hasWebPRNTPrinters = printers.some(p => p.type === 'kitchen' && p.enabled);
          if (hasWebPRNTPrinters) {
            await printToWebPRNT(order, businessName);
            console.log('Auto-printed to WebPRNT printers for order:', order.orderNumber);
          } else {
            await printKitchenReceipt(order, businessName);
            console.log('Auto-printed kitchen receipt for order:', order.orderNumber);
          }
          
          printedOrdersRef.current.add(order.id);
        } catch (error) {
          console.error('Failed to auto-print kitchen receipt:', error);
        }
      });
    }
  }, [orders, autoPrintEnabled, printKitchenReceipt, printToWebPRNT, printers, settings.storeName]);
  
  const loadSizePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('@kitchenSizeView');
      if (saved) {
        setOrderSizeView(saved as OrderSizeView);
      }
    } catch (error) {
      console.error('Failed to load size preference:', error);
    }
  };

  const loadAutoPrintPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('@kitchenAutoPrint');
      if (saved !== null) {
        setAutoPrintEnabled(saved === 'true');
      }
    } catch (error) {
      console.error('Failed to load auto-print preference:', error);
    }
  };

  const toggleAutoPrint = async () => {
    try {
      const newValue = !autoPrintEnabled;
      await AsyncStorage.setItem('@kitchenAutoPrint', newValue.toString());
      setAutoPrintEnabled(newValue);
    } catch (error) {
      console.error('Failed to save auto-print preference:', error);
    }
  };
  
  const saveSizePreference = async (size: OrderSizeView) => {
    try {
      await AsyncStorage.setItem('@kitchenSizeView', size);
      setOrderSizeView(size);
    } catch (error) {
      console.error('Failed to save size preference:', error);
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'completed');

  const handleStatusChange = async (orderId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    await updateOrderStatus(orderId, newStatus);
  };

  const handleDeleteOrder = (orderId: string) => {
    Alert.alert(
      'Slett bestilling',
      'Er du sikker på at du vil slette denne bestillingen?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            printedOrdersRef.current.delete(orderId);
            await deleteOrder(orderId);
          },
        },
      ]
    );
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastMessage(null);
    });
  };

  const handlePrintOrder = async (order: Order) => {
    try {
      const businessName = settings.storeName || 'Restaurant';
      
      const networkPrinters = printers.filter(p => p.type === 'kitchen' && p.enabled && p.connectionType === 'network');
      
      if (networkPrinters.length === 0) {
        showToast('Ingen nettverksskrivere konfigurert', 'error');
        return;
      }
      
      await printToWebPRNT(order, businessName);
      showToast('✓ Sendt til printer', 'success');
    } catch (error: any) {
      console.error('Print error:', error);
      const errorMsg = error.message || 'Feil ved utskrift';
      showToast(errorMsg.length > 50 ? 'Feil ved utskrift' : errorMsg, 'error');
    }
  };



  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  const toggleItemComplete = (orderId: string, itemId: string) => {
    const key = `${orderId}_${itemId}`;
    setCompletedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderOrder = (order: Order) => {
    const cardPadding = orderSizeView === 'small' ? 16 : orderSizeView === 'large' ? 24 : 20;
    const cardWidth = orderSizeView === 'small' ? '31%' : orderSizeView === 'medium' ? '48%' : '100%';
    
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const minutesAgo = Math.floor((Date.now() - order.timestamp) / 60000);

    return (
      <View key={order.id} style={[styles.orderCard, { padding: cardPadding, width: cardWidth }]}>
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderTop}>
            <View style={styles.orderTitleRow}>
              <ChefHat size={orderSizeView === 'small' ? 18 : 20} color="#111827" />
              <Text style={[styles.orderNumberText, { fontSize: orderSizeView === 'large' ? 20 : orderSizeView === 'small' ? 14 : 16 }]}>
                #{order.orderNumber}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => handleDeleteOrder(order.id)} 
              style={styles.infoButton}
              activeOpacity={0.7}
            >
              <Text style={styles.infoButtonText}>ⓘ</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeBadgeContainer}>
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeNumber}>{minutesAgo < 1 ? '1' : minutesAgo}</Text>
              <Text style={styles.timeBadgeLabel}>min</Text>
            </View>
            <Text style={styles.timeAgoText}>{minutesAgo < 1 ? 'Akkurat nå' : `${minutesAgo} ${minutesAgo === 1 ? 'minutt' : 'minutter'} siden`}</Text>
            <View style={styles.totalItemsBadge}>
              <Package size={14} color="#10B981" />
              <Text style={styles.totalItemsText}>{totalItems}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.orderItems}>
          {order.items.map((item, itemIdx) => {
            const mainVariants = item.addOns?.filter(a => a.type !== 'add' && a.type !== 'remove') || [];
            const extraAddOns = item.addOns?.filter(a => a.type === 'add') || [];
            const removeAddOns = item.addOns?.filter(a => a.type === 'remove') || [];
            const itemKey = `${order.id}_${item.id}`;
            const isCompleted = completedItems[itemKey] || false;
            
            return (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.orderItemHeader}>
                <View style={styles.orderItemLeft}>
                  <View style={styles.quantityCircle}>
                    <Text style={styles.quantityCircleText}>{item.quantity}x</Text>
                  </View>
                  <View style={styles.orderItemInfo}>
                    <Text style={[styles.productNameBold, { fontSize: orderSizeView === 'small' ? 14 : orderSizeView === 'large' ? 16 : 15 }]}>
                      {item.name}
                    </Text>
                    
                    {(item.size || mainVariants.length > 0) && (
                      <View style={styles.variantsContainer}>
                        {mainVariants.map((variant, idx) => {
                          const displayQuantity = variant.quantity || 1;
                          const tilleggsvare = tilleggsvarer.find(t => 
                            t.variants.some(v => v.id === variant.id)
                          );
                          const displayColor = variant.color || (tilleggsvare?.variants.find(v => v.id === variant.id)?.color);
                          
                          return (
                            <View key={`variant-${idx}`} style={styles.variantRow}>
                              {displayColor ? (
                                <View style={[styles.colorTextBadge, { backgroundColor: displayColor }]}>
                                  <Text style={[
                                    styles.coloredVariantText,
                                    { fontSize: orderSizeView === 'small' ? 12 : 13 }
                                  ]}>
                                    {displayQuantity}x {variant.name}
                                  </Text>
                                </View>
                              ) : (
                                <Text style={[
                                  styles.sizeText, 
                                  { fontSize: orderSizeView === 'small' ? 12 : 13 }
                                ]}>
                                  {displayQuantity}x {variant.name}
                                </Text>
                              )}
                            </View>
                          );
                        })}
                        {item.size && !mainVariants.length && (
                          <Text style={[styles.sizeText, { fontSize: orderSizeView === 'small' ? 12 : 13 }]}>
                            {item.size}
                          </Text>
                        )}
                      </View>
                    )}
                    
                    {removeAddOns.length > 0 && (
                      <View style={styles.removeBadgesContainer}>
                        {removeAddOns.map((addOn, idx) => (
                          <View key={`remove-${idx}`} style={styles.removeBadge}>
                            <Text style={styles.removeBadgeText}>FJERN {addOn.name}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {extraAddOns.length > 0 && (
                      <View style={styles.addBadgesContainer}>
                        {extraAddOns.map((addOn, idx) => {
                          const tilleggsvare = tilleggsvarer.find(t => 
                            t.variants.some(v => v.id === addOn.id)
                          );
                          let categoryName = addOn.categoryName;
                          
                          if (!categoryName && tilleggsvare) {
                            categoryName = tilleggsvare.name;
                          }
                          
                          const displayColor = addOn.color || (tilleggsvare?.variants.find(v => v.id === addOn.id)?.color);
                          const displayQuantity = addOn.quantity || 1;
                          
                          return (
                            <View key={`add-${idx}`} style={styles.addOnRow}>
                              <View style={styles.addOnContent}>
                                {categoryName && (
                                  <Text style={[styles.addOnCategoryText, { fontSize: orderSizeView === 'small' ? 11 : 12 }]}>
                                    {categoryName}
                                  </Text>
                                )}
                                {displayColor ? (
                                  <View style={[styles.colorTextBadge, { backgroundColor: displayColor }]}>
                                    <Text style={[
                                      styles.coloredVariantText,
                                      { fontSize: orderSizeView === 'small' ? 13 : 14 }
                                    ]}>
                                      {displayQuantity}x {addOn.name}
                                    </Text>
                                  </View>
                                ) : (
                                  <Text style={[
                                    styles.addOnText, 
                                    { fontSize: orderSizeView === 'small' ? 13 : 14 }
                                  ]}>
                                    {displayQuantity}x {addOn.name}
                                  </Text>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => toggleItemComplete(order.id, item.id)}
                  style={styles.checkboxButton}
                  activeOpacity={0.7}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={28} color="#16A34A" fill="#16A34A" />
                  ) : (
                    <Circle size={28} color="#D1D5DB" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            );
          })}
        </View>

        {order.status !== 'completed' && (
          <View style={styles.orderActions}>
            <TouchableOpacity
              style={[styles.printButton, { width: orderSizeView === 'small' ? 50 : 56 }]}
              onPress={() => handlePrintOrder(order)}
              activeOpacity={0.7}
            >
              <Printer size={orderSizeView === 'small' ? 20 : 22} color="#60A5FA" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.completeButton]}
              onPress={() => handleStatusChange(order.id, 'completed')}
              activeOpacity={0.8}
            >
              <Check size={orderSizeView === 'small' ? 18 : 20} color="#16A34A" strokeWidth={2.5} />
              <Text style={[styles.completeButtonText, { fontSize: orderSizeView === 'small' ? 13 : 14 }]}>
                Fullfør
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };



  return (
    <View style={styles.container}>
      {toastMessage && (
        <Animated.View 
          style={[
            styles.toast,
            toastType === 'success' ? styles.toastSuccess : styles.toastError,
            { opacity: toastOpacity }
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
      {isFullscreen && (
        <View style={styles.fullscreenHeader}>
          <TouchableOpacity
            style={styles.fullscreenExitButton}
            onPress={() => setIsFullscreen(false)}
          >
            <Minimize2 size={20} color="#fff" />
            <Text style={styles.fullscreenExitText}>Lukk fullskjerm</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {!isFullscreen && (
      <View style={styles.header}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.autoPrintButton, autoPrintEnabled && styles.autoPrintActive]}
            onPress={toggleAutoPrint}
          >
            <Printer size={16} color={autoPrintEnabled ? '#10B981' : '#6B7280'} />
            <Text style={[styles.autoPrintText, autoPrintEnabled && styles.autoPrintTextActive]}>
              Auto
            </Text>
          </TouchableOpacity>
          <View style={styles.sizeControls}>
            <TouchableOpacity
              style={[styles.sizeControlButton, orderSizeView === 'small' && styles.sizeControlActive]}
              onPress={() => saveSizePreference('small')}
            >
              <Grid3x3 size={18} color={orderSizeView === 'small' ? '#10B981' : '#6B7280'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sizeControlButton, orderSizeView === 'medium' && styles.sizeControlActive]}
              onPress={() => saveSizePreference('medium')}
            >
              <Grid2x2 size={18} color={orderSizeView === 'medium' ? '#10B981' : '#6B7280'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sizeControlButton, orderSizeView === 'large' && styles.sizeControlActive]}
              onPress={() => saveSizePreference('large')}
            >
              <Grid2x2 size={24} color={orderSizeView === 'large' ? '#10B981' : '#6B7280'} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.sizeControlButton, isFullscreen && styles.sizeControlActive]}
            onPress={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 size={18} color="#10B981" />
            ) : (
              <Maximize2 size={18} color="#6B7280" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      )}

      {activeOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <ChefHat size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>Ingen bestillinger</Text>
          <Text style={styles.emptySubtext}>
            Bestillinger vil vises her når de legges til fra kassen
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.ordersList}
          contentContainerStyle={styles.ordersListContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.ordersGrid}>
            {activeOrders.map(renderOrder)}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  sizeControls: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 8,
  },
  sizeControlButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
  sizeControlActive: {
    backgroundColor: '#D1FAE5',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  ordersList: {
    flex: 1,
  },
  ordersListContent: {
    padding: 16,
  },
  ordersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },

  orderHeader: {
    marginBottom: 16,
  },
  orderHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderNumberBadge: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  orderNumberText: {
    fontWeight: '700' as const,
    color: '#111827',
    letterSpacing: -0.3,
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  timeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  timeBadge: {
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBadgeNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    lineHeight: 20,
  },
  timeBadgeLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#fff',
  },
  timeAgoText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusPillText: {
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
  orderMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaBadgeText: {
    fontWeight: '600' as const,
  },
  orderTime: {
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  statusText: {
    fontWeight: '700' as const,
  },
  deleteButton: {
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 18,
  },
  orderItems: {
    marginBottom: 16,
    gap: 16,
  },
  orderItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 14,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderItemLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  quantityCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityCircleText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#111827',
  },
  checkboxButton: {
    padding: 4,
    marginLeft: 8,
  },
  categoryBadgeContainer: {
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  categoryBadgeText: {
    fontWeight: '700' as const,
    color: '#7C3AED',
    letterSpacing: 0.3,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  quantityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  itemCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemCountText: {
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  quantityText: {
    fontWeight: '700' as const,
    color: '#fff',
  },
  orderItemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: '700' as const,
    color: '#111827',
    lineHeight: 22,
  },
  productNameBold: {
    fontWeight: '700' as const,
    color: '#111827',
    lineHeight: 20,
    marginBottom: 4,
  },
  sizeText: {
    fontWeight: '600' as const,
    color: '#374151',
    marginTop: 2,
    marginBottom: 6,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  colorIndicatorSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  removeBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  removeBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.3,
  },
  addBadgesContainer: {
    marginTop: 8,
    gap: 10,
  },
  addOnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 2,
  },
  colorIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginTop: 3,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  addOnContent: {
    flex: 1,
  },
  addOnCategoryText: {
    fontWeight: '700' as const,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  variantsContainer: {
    gap: 6,
    marginBottom: 4,
    marginTop: 4,
  },
  variantText: {
    fontWeight: '500' as const,
    color: '#6B7280',
    marginTop: 3,
  },
  addOnsSection: {
    marginTop: 4,
  },
  addOnText: {
    fontWeight: '600' as const,
    color: '#374151',
    marginTop: 0,
  },
  itemDetailsContainer: {
    marginTop: 6,
    gap: 4,
  },
  itemDetailText: {
    color: '#6B7280',
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  itemDetailValue: {
    color: '#111827',
    fontWeight: '700' as const,
  },

  orderActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontWeight: '600' as const,
    color: '#fff',
    letterSpacing: 0.2,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    borderWidth: 1.5,
    borderColor: '#16A34A',
  },
  completeButtonText: {
    fontWeight: '700' as const,
    color: '#16A34A',
    letterSpacing: 0.2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#6B7280',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
  },
  fullscreenHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  fullscreenExitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  fullscreenExitText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#fff',
  },
  printButton: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  autoPrintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  autoPrintActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  autoPrintText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  autoPrintTextActive: {
    color: '#10B981',
  },
  totalItemsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  totalItemsText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  colorTextBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  coloredVariantText: {
    fontWeight: '700' as const,
    color: '#fff',
  },
  toast: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toastSuccess: {
    backgroundColor: '#16A34A',
  },
  toastError: {
    backgroundColor: '#EF4444',
  },
  toastText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
    textAlign: 'center',
  },
});
