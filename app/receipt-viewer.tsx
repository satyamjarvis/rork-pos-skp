import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, FileText } from 'lucide-react-native';
import { Transaction } from '@/types/transaction';

export default function ReceiptViewerScreen() {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReceipt();
  }, []);

  const loadReceipt = async () => {
    if (!transactionId) {
      setError('Ingen transaksjon valgt');
      setIsLoading(false);
      return;
    }

    try {
      const stored = await AsyncStorage.getItem('@transactions');
      if (!stored) {
        setError('Ingen transaksjoner funnet');
        setIsLoading(false);
        return;
      }

      const transactions = JSON.parse(stored) as Transaction[];
      const found = transactions.find(t => t.id === transactionId);
      
      if (!found) {
        setError('Transaksjon ikke funnet');
        setIsLoading(false);
        return;
      }

      setTransaction(found);
    } catch (err) {
      console.error('Error loading receipt:', err);
      setError('Feil ved lasting av kvittering');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Laster kvittering...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kvittering</Text>
        </View>
        <View style={styles.errorContainer}>
          <FileText size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Kunne ikke laste kvittering'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kvittering</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.receiptCard}>
          <Text style={styles.receiptTitle}>KVITTERING</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Dato:</Text>
            <Text style={styles.value}>{transaction.date}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Trans. ID:</Text>
            <Text style={styles.value}>{transaction.id}</Text>
          </View>
          
          <View style={styles.divider} />
          
          {transaction.items && transaction.items.length > 0 && (
            <>
              <View style={styles.itemsSection}>
                <Text style={styles.itemsSectionTitle}>Varer:</Text>
                {transaction.items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>{item.price.toFixed(2)} kr</Text>
                  </View>
                ))}
              </View>
              <View style={styles.divider} />
            </>
          )}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Totalt:</Text>
            <Text style={styles.totalValue}>{transaction.amount.toFixed(2)} kr</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Mottatt:</Text>
            <Text style={styles.value}>{transaction.received.toFixed(2)} kr</Text>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Veksel:</Text>
            <Text style={[styles.totalValue, styles.changeValue]}>
              {transaction.change.toFixed(2)} kr
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.footer}>Takk for handelen!</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  receiptCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'center',
    color: '#111827',
    marginBottom: 16,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderStyle: 'dashed' as const,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  label: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600' as const,
  },
  value: {
    fontSize: 16,
    color: '#111827',
  },
  itemsSection: {
    marginVertical: 8,
  },
  itemsSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemName: {
    fontSize: 15,
    color: '#374151',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  changeValue: {
    color: '#10B981',
  },
  footer: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
  },
});
