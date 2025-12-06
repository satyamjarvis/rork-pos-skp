import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface TilleggsvareVariant {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  type?: 'add' | 'remove' | 'other';
  categoryName?: string;
  color?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  addOns?: TilleggsvareVariant[];
}

export interface Order {
  id: string;
  items: OrderItem[];
  timestamp: number;
  date: string;
  status: 'pending' | 'in_progress' | 'completed';
  orderNumber: number;
  customerName?: string;
}

export const [OrdersProvider, useOrders] = createContextHook(() => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextOrderNumber, setNextOrderNumber] = useState(1);
  const { user } = useAuth();

  const loadOrders = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('[OrdersContext] Loading orders for user:', user.id);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('[OrdersContext] Loaded orders from database:', data?.length || 0, 'orders');
      
      const formattedOrders: Order[] = (data || []).map((o, index) => {
        const orderNum = o.order_number || (parseInt(o.id.slice(-4), 16) % 10000);
        console.log('[OrdersContext] Order:', o.id, 'Number:', orderNum, 'Status:', o.status);
        return {
          id: o.id,
          items: o.items || [],
          timestamp: new Date(o.created_at).getTime(),
          date: new Date(o.created_at).toLocaleString('nb-NO'),
          status: o.status as 'pending' | 'in_progress' | 'completed',
          orderNumber: orderNum,
          customerName: o.customer_name,
        };
      });

      setOrders(formattedOrders);
      console.log('[OrdersContext] Orders set in state:', formattedOrders.length);
    } catch (error) {
      console.error('[OrdersContext] Failed to load orders:', error instanceof Error ? error.message : JSON.stringify(error, null, 2));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadOrderNumber = useCallback(async () => {
    if (!user) return;
    
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setNextOrderNumber((count || 0) + 1);
    } catch (error) {
      console.error('Failed to load order number:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadOrders();
      loadOrderNumber();
      
      console.log('[OrdersContext] 🔄 Setting up realtime subscription for user:', user.id);
      console.log('[OrdersContext] 🔄 Timestamp:', new Date().toISOString());
      
      const channelName = `orders-changes-${user.id}`;
      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: true },
          },
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[OrdersContext] ✅✅✅ REALTIME INSERT RECEIVED ✅✅✅');
            console.log('[OrdersContext] Payload:', JSON.stringify(payload, null, 2));
            console.log('[OrdersContext] Timestamp:', new Date().toISOString());
            const newRecord = payload.new as any;
            
            if (newRecord.status === 'completed') {
              console.log('[OrdersContext] ⏭️  Skipping completed order');
              return;
            }
            
            const newOrder: Order = {
              id: newRecord.id,
              items: newRecord.items || [],
              timestamp: new Date(newRecord.created_at).getTime(),
              date: new Date(newRecord.created_at).toLocaleString('nb-NO'),
              status: newRecord.status,
              orderNumber: newRecord.order_number || (parseInt(newRecord.id.slice(-4), 16) % 10000),
              customerName: newRecord.customer_name,
            };
            
            console.log('[OrdersContext] 📦 New order object:', newOrder);
            setOrders(prev => {
              const exists = prev.some(o => o.id === newOrder.id);
              if (exists) {
                console.log('[OrdersContext] ⏭️  Order already exists, skipping');
                return prev;
              }
              console.log('[OrdersContext] ✅ Adding order to state. Previous count:', prev.length);
              const newState = [newOrder, ...prev];
              console.log('[OrdersContext] ✅ New count:', newState.length);
              return newState;
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[OrdersContext] 🔄 REALTIME UPDATE RECEIVED');
            console.log('[OrdersContext] Timestamp:', new Date().toISOString());
            const updatedRecord = payload.new as any;
            
            if (updatedRecord.status === 'completed') {
              console.log('[OrdersContext] 🗑️  Removing completed order from view');
              setOrders(prev => prev.filter(o => o.id !== updatedRecord.id));
              return;
            }
            
            setOrders(prev => prev.map(o => {
              if (o.id === updatedRecord.id) {
                console.log('[OrdersContext] 🔄 Updating order status:', updatedRecord.status);
                return {
                  ...o,
                  status: updatedRecord.status,
                  items: updatedRecord.items || o.items,
                  customerName: updatedRecord.customer_name || o.customerName,
                };
              }
              return o;
            }));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[OrdersContext] 🗑️  REALTIME DELETE RECEIVED');
            console.log('[OrdersContext] Timestamp:', new Date().toISOString());
            const deletedRecord = payload.old as any;
            setOrders(prev => prev.filter(o => o.id !== deletedRecord.id));
          }
        )
        .subscribe((status, err) => {
          console.log('[OrdersContext] 📡 Subscription status changed:', status);
          console.log('[OrdersContext] Timestamp:', new Date().toISOString());
          if (status === 'SUBSCRIBED') {
            console.log('[OrdersContext] ✅✅✅ REALTIME SUBSCRIPTION ACTIVE ✅✅✅');
            console.log('[OrdersContext] Channel name:', channelName);
            console.log('[OrdersContext] Listening for orders with user_id:', user.id);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[OrdersContext] ❌❌❌ REALTIME ERROR ❌❌❌');
            console.error('[OrdersContext] Error:', err ? JSON.stringify(err, null, 2) : 'Unknown error');
          } else if (status === 'TIMED_OUT') {
            console.error('[OrdersContext] ⏱️  REALTIME TIMEOUT');
          } else if (status === 'CLOSED') {
            console.log('[OrdersContext] 🔌 REALTIME CLOSED');
          }
        });

      return () => {
        console.log('[OrdersContext] 🔌 Unsubscribing from realtime');
        console.log('[OrdersContext] Timestamp:', new Date().toISOString());
        supabase.removeChannel(channel);
      };
    } else {
      setOrders([]);
      setNextOrderNumber(1);
      setIsLoading(false);
    }
  }, [user, loadOrders, loadOrderNumber]);

  const addOrder = useCallback(async (items: OrderItem[], customerName?: string) => {
    if (!user) {
      console.error('[OrdersContext] ❌ Cannot add order: No user');
      return null;
    }
    
    const total = items.reduce((sum, item) => {
      let itemTotal = item.price * item.quantity;
      if (item.addOns) {
        itemTotal += item.addOns.reduce((addOnSum, addOn) => 
          addOnSum + (addOn.price * (addOn.quantity || 1)), 0);
      }
      return sum + itemTotal;
    }, 0);

    try {
      console.log('[OrdersContext] 📝 Adding order with', items.length, 'items');
      console.log('[OrdersContext] User ID:', user.id);
      console.log('[OrdersContext] Total:', total);
      console.log('[OrdersContext] Timestamp:', new Date().toISOString());
      
      const orderData = {
        user_id: user.id,
        customer_name: customerName || 'Walk-in Customer',
        items: items,
        total: total,
        subtotal: total,
        vat_amount: 0,
        status: 'pending' as const,
      };
      console.log('[OrdersContext] 📦 Order data to insert:', JSON.stringify(orderData, null, 2));
      
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error('[OrdersContext] ❌ Failed to insert order:', error);
        console.error('[OrdersContext] Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('[OrdersContext] ✅ Order inserted successfully!');
      console.log('[OrdersContext] Order ID:', data.id);
      console.log('[OrdersContext] Order number:', data.order_number);
      console.log('[OrdersContext] Status:', data.status);
      console.log('[OrdersContext] 🎉 Waiting for realtime event...');
      console.log('[OrdersContext] Timestamp:', new Date().toISOString());
      
      const order: Order = {
        id: data.id,
        items: data.items,
        timestamp: new Date(data.created_at).getTime(),
        date: new Date(data.created_at).toLocaleString('nb-NO'),
        status: 'pending',
        orderNumber: data.order_number || nextOrderNumber,
        customerName: data.customer_name,
      };

      setNextOrderNumber(prev => prev + 1);
      return order;
    } catch (error) {
      console.error('[OrdersContext] ❌ Failed to add order:', error);
      return null;
    }
  }, [user, nextOrderNumber]);

  const updateOrderStatus = useCallback(async (orderId: string, status: 'pending' | 'in_progress' | 'completed') => {
    if (!user) return;
    
    try {
      if (status === 'completed') {
        console.log('[OrdersContext] 🗑️  Deleting order:', orderId);
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId)
          .eq('user_id', user.id);

        if (error) throw error;
        
        console.log('[OrdersContext] ✅ Order deleted successfully');
        setOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
        const { error } = await supabase
          .from('orders')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', orderId)
          .eq('user_id', user.id);

        if (error) throw error;

        setOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, status } : o
        ));
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  }, [user]);

  const deleteOrder = useCallback(async (orderId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('user_id', user.id);

      if (error) throw error;

      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (error) {
      console.error('Failed to delete order:', error);
    }
  }, [user]);

  const clearCompletedOrders = useCallback(async () => {
    if (!user) return;
    
    try {
      await loadOrders();
    } catch (error) {
      console.error('Failed to clear completed orders:', error);
    }
  }, [user, loadOrders]);

  return useMemo(() => ({
    orders,
    isLoading,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    clearCompletedOrders,
  }), [orders, isLoading, addOrder, updateOrderStatus, deleteOrder, clearCompletedOrders]);
});