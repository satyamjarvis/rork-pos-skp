import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileSpreadsheet, CheckCircle2, AlertCircle, Upload } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useProducts } from '@/contexts/ProductsContext';
import * as XLSX from 'xlsx';

interface ParsedRow {
  productName: string;
  price: string;
  sizeName: string;
  sizePrice: string;
  category: string;
  subcategory: string;
  addons: string;
  variantName: string;
  variantPrice: string;
  color: string;
  image: string;
}

export default function ImportScreen() {
  const insets = useSafeAreaInsets();
  const { categories, tilleggsvarer, addCategory, addProduct, updateProduct, addTilleggsvare, addVariant, loadProducts, loadCategories, loadTilleggsvarer } = useProducts();
  
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [importResult, setImportResult] = useState<{
    categories: number;
    products: number;
    addons: number;
  } | null>(null);

  const detectDelimiter = (line: string): string => {
    const delimiters = ['|', ',', ';', '\t'];
    let maxCount = 0;
    let bestDelimiter = '|';
    
    delimiters.forEach(delimiter => {
      const count = line.split(delimiter).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    });
    
    return bestDelimiter;
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('Filen er tom');
    }

    const delimiter = detectDelimiter(lines[0]);
    console.log('[parseCSV] Detected delimiter:', delimiter);

    const headerLine = lines[0];
    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase());
    
    console.log('[parseCSV] Headers:', headers);

    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(delimiter);
      
      console.log(`[parseCSV] Row ${i + 1}:`, values);

      rows.push({
        productName: (values[0] || '').trim(),
        price: (values[1] || '').trim(),
        sizeName: (values[2] || '').trim(),
        sizePrice: (values[3] || '').trim(),
        category: (values[4] || '').trim(),
        subcategory: (values[5] || '').trim(),
        addons: (values[6] || '').trim(),
        variantName: (values[7] || '').trim(),
        variantPrice: (values[8] || '').trim(),
        color: (values[9] || '').trim(),
        image: (values[10] || '').trim(),
      });
    }

    console.log('[parseCSV] Parsed', rows.length, 'rows');
    return rows;
  };

  const parseExcel = async (uri: string): Promise<ParsedRow[]> => {
    console.log('[parseExcel] Reading Excel file...');
    
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
    
    if (jsonData.length === 0) {
      throw new Error('Filen er tom');
    }

    console.log('[parseExcel] Total rows (including header):', jsonData.length);
    console.log('[parseExcel] First row (headers):', jsonData[0]);

    const rows: ParsedRow[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      const productName = row[0] ? String(row[0]).trim() : '';
      const price = row[1] ? String(row[1]).trim() : '';
      const sizeName = row[2] ? String(row[2]).trim() : '';
      const sizePrice = row[3] ? String(row[3]).trim() : '';
      const category = row[4] ? String(row[4]).trim() : '';
      const subcategory = row[5] ? String(row[5]).trim() : '';
      const addons = row[6] ? String(row[6]).trim() : '';
      const variantName = row[7] ? String(row[7]).trim() : '';
      const variantPrice = row[8] ? String(row[8]).trim() : '';
      const color = row[9] ? String(row[9]).trim() : '';
      const image = row[10] ? String(row[10]).trim() : '';

      const hasAnyData = productName || price || sizeName || sizePrice || category || subcategory || addons || variantName || variantPrice || color || image;
      
      if (!hasAnyData) {
        console.log(`[parseExcel] Row ${i + 1}: TOMME - skipping completely empty row`);
        continue;
      }

      console.log(`[parseExcel] Row ${i + 1}:`, { productName, price, sizeName, sizePrice, category, subcategory, addons, variantName, variantPrice, color, image });

      rows.push({
        productName,
        price,
        sizeName,
        sizePrice,
        category,
        subcategory,
        addons,
        variantName,
        variantPrice,
        color,
        image,
      });
    }

    console.log('[parseExcel] *** TOTALT LEST:', rows.length, 'rader (ekskludert tomme rader) ***');
    console.log('[parseExcel] *** ALLE RADER:', rows);
    return rows;
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('[pickFile] File selected:', result.assets[0].name);
        setFile(result.assets[0]);
        setParsedData([]);
        setImportStatus('idle');
        setErrorMessage('');
        setImportResult(null);
      }
    } catch (error) {
      console.error('[pickFile] Error:', error);
      Alert.alert('Feil', 'Kunne ikke velge fil');
    }
  };

  const parseFile = async () => {
    if (!file) return;

    try {
      setImportStatus('parsing');
      setErrorMessage('');

      console.log('[parseFile] Reading file:', file.name);
      
      let rows: ParsedRow[];
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        rows = await parseExcel(file.uri);
      } else {
        const response = await fetch(file.uri);
        const text = await response.text();
        console.log('[parseFile] File content length:', text.length);
        rows = parseCSV(text);
      }
      
      setParsedData(rows);
      setImportStatus('success');
      
      Alert.alert('Suksess', `${rows.length} rader funnet`);
    } catch (error: any) {
      console.error('[parseFile] Error:', error);
      setImportStatus('error');
      setErrorMessage(error.message || 'Kunne ikke lese filen');
    }
  };

  const importData = async () => {
    if (parsedData.length === 0) {
      Alert.alert('Feil', 'Ingen data å importere');
      return;
    }

    try {
      console.log('[importData] ========== STARTER IMPORT ==========');
      console.log('[importData] Total rader:', parsedData.length);
      console.log('[importData] Alle rader:', parsedData);
      
      const categoryMap = new Map<string, string>();
      const subcategoryMap = new Map<string, string>();
      const addonMap = new Map<string, string>();
      const productAddonMap = new Map<string, Set<string>>();
      
      let categoriesCreated = 0;
      let categoriesUpdated = 0;
      let productsCreated = 0;
      let productsUpdated = 0;
      let addonsCreated = 0;
      let addonsUpdated = 0;
      let variantsCreated = 0;
      let variantsUpdated = 0;

      console.log('\n[importData] ===== FASE 1: KATEGORIER =====');
      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        console.log(`[importData] Rad ${i + 1}/${parsedData.length}:`, row);
        
        if (row.category) {
          let categoryId: string | undefined;
          
          if (!categoryMap.has(row.category)) {
            const existingByName = categories.find(c => c.name.toLowerCase() === row.category.toLowerCase() && !c.parentId);
            
            if (existingByName) {
              console.log('[importData] ✓ Bruker eksisterende kategori:', existingByName.name);
              categoryId = existingByName.id;
              categoryMap.set(row.category, categoryId);
            } else {
              console.log('[importData] + Oppretter ny kategori:', row.category);
              const newCategory = await addCategory(row.category);
              if (newCategory) {
                categoryId = newCategory.id;
                categoryMap.set(row.category, categoryId);
                categoriesCreated++;
                console.log('[importData] ✅ Kategori opprettet:', newCategory.name, 'ID:', newCategory.id);
              }
            }
          } else if (categoryId) {
            categoryMap.set(row.category, categoryId);
          }
        }
        
        if (row.category && row.subcategory) {
          const subcategoryKey = `${row.category}:${row.subcategory}`;
          let subcategoryId: string | undefined;
          
          if (!subcategoryMap.has(subcategoryKey)) {
            const parentCategoryId = categoryMap.get(row.category);
            const existingByName = categories.find(c => 
              c.name.toLowerCase() === row.subcategory.toLowerCase() && 
              c.parentId === parentCategoryId
            );
            
            if (existingByName) {
              console.log('[importData] ✓ Bruker eksisterende underkategori:', existingByName.name);
              subcategoryId = existingByName.id;
              subcategoryMap.set(subcategoryKey, subcategoryId);
            } else if (parentCategoryId) {
              console.log('[importData] + Oppretter ny underkategori:', row.subcategory, 'under', row.category);
              const newSubcategory = await addCategory(row.subcategory, undefined, parentCategoryId);
              if (newSubcategory) {
                subcategoryId = newSubcategory.id;
                subcategoryMap.set(subcategoryKey, subcategoryId);
                categoriesCreated++;
                console.log('[importData] ✅ Underkategori opprettet:', newSubcategory.name, 'ID:', newSubcategory.id);
              }
            }
          } else if (subcategoryId) {
            subcategoryMap.set(subcategoryKey, subcategoryId);
          }
        }
      }

      console.log('\n[importData] ===== FASE 2: TILLEGGSVARER OG VARIANTER =====');
      
      const variantTracker = new Map<string, Set<string>>();
      
      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        console.log(`[importData] Rad ${i + 1}/${parsedData.length}: Sjekker tilleggsvarer og varianter...`);
        console.log(`[importData] Rad data:`, { addons: row.addons, variantName: row.variantName, variantPrice: row.variantPrice, color: row.color });
        
        if (row.addons || row.variantName) {
          const addonName = row.addons || 'Standard Tillegg';
          console.log(`[importData] Rad ${i + 1} har tilleggsvare/variant:`, { addon: addonName, variant: row.variantName, price: row.variantPrice });
          
          let addonId = addonMap.get(addonName);
          
          if (!addonId) {
            const existingByName = tilleggsvarer.find(t => t.name.toLowerCase() === addonName.toLowerCase());
            
            if (existingByName) {
              console.log('[importData] ✓ Bruker eksisterende tilleggsvare:', existingByName.name);
              addonId = existingByName.id;
              addonMap.set(addonName, addonId);
            } else {
              console.log('[importData] + Oppretter ny tilleggsvare:', addonName);
              const newAddon = await addTilleggsvare(addonName);
              if (newAddon) {
                addonId = newAddon.id;
                addonMap.set(addonName, addonId);
                addonsCreated++;
                console.log('[importData] ✅ Tilleggsvare opprettet:', newAddon.name, 'ID:', newAddon.id);
              }
            }
          }
          
          if (addonId && row.variantName && row.variantPrice) {
            const price = parseFloat(row.variantPrice);
            if (!isNaN(price)) {
              const color = row.color || undefined;
              
              const variantKey = `${addonId}:${row.variantName.toLowerCase()}:${price}`;
              console.log('[importData] Variant nøkkel:', variantKey);
              
              if (!variantTracker.has(addonId)) {
                variantTracker.set(addonId, new Set());
                console.log('[importData] Opprettet ny tracker for tilleggsvare:', addonId);
              }
              
              const existingVariants = variantTracker.get(addonId)!;
              console.log('[importData] Eksisterende varianter for denne tilleggsvaren:', Array.from(existingVariants));
              
              if (!existingVariants.has(variantKey)) {
                console.log('[importData] + Legger til variant:', row.variantName, 'pris:', price, 'farge:', color, 'til tilleggsvare ID:', addonId);
                const newVariant = await addVariant(addonId, row.variantName, price, color);
                if (newVariant) {
                  variantsCreated++;
                  existingVariants.add(variantKey);
                  console.log('[importData] ✅ Variant lagt til med ID:', newVariant.id);
                } else {
                  console.error('[importData] ❌ Feilet å legge til variant:', row.variantName);
                }
              } else {
                console.log('[importData] ⏭️ Variant allerede importert (duplikat):', row.variantName, 'med pris:', price);
              }
            } else {
              console.error('[importData] ⚠️ Ugyldig variantpris:', row.variantPrice, 'for', row.variantName);
            }
          } else {
            console.log('[importData] ⚠️ Kan ikke opprette variant:', { 
              addonId: !!addonId, 
              variantName: !!row.variantName, 
              variantPrice: !!row.variantPrice 
            });
            if (row.variantName && !row.variantPrice) {
              console.error('[importData] ⚠️ Variant', row.variantName, 'mangler pris - hopper over');
            }
          }
          
          if (row.productName && addonId && row.addons) {
            const productKey = row.productName;
            if (!productAddonMap.has(productKey)) {
              productAddonMap.set(productKey, new Set<string>());
            }
            productAddonMap.get(productKey)!.add(addonId);
            console.log('[importData] 🔗 Merket tilleggsvare', addonName, 'for kobling til produkt', row.productName);
          }
        } else {
          console.log(`[importData] Rad ${i + 1}: Ingen tilleggsvare eller variant data`);
        }
      }

      console.log('\n[importData] ===== FASE 3: GRUPPERER PRODUKTER =====');
      console.log('[importData] Total rader å behandle:', parsedData.length);
      
      const productGroups = new Map<string, ParsedRow[]>();
      
      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        
        if (row.productName) {
          const productKey = row.productName.toLowerCase().trim();
          
          if (!productGroups.has(productKey)) {
            productGroups.set(productKey, []);
          }
          
          productGroups.get(productKey)!.push(row);
          console.log(`[importData] Rad ${i + 1}: Produkt '${row.productName}' lagt til gruppe '${productKey}'`);
        } else {
          console.log(`[importData] Rad ${i + 1}: Ingen produktnavn - hopper over`);
        }
      }

      console.log('[importData] ⭐ Fant', productGroups.size, 'unike produkter fra', parsedData.length, 'rader');

      let productIndex = 0;
      for (const [productKey, rows] of productGroups.entries()) {
        productIndex++;
        const productName = rows[0].productName;
        
        console.log(`\n[importData] ===== PRODUKT ${productIndex}/${productGroups.size}: ${productName} (${rows.length} rader) =====`);
        
        const allSizes = rows
          .filter(row => row.sizeName && row.sizePrice)
          .map(row => ({
            id: `size_${Date.now()}_${Math.random()}`,
            name: row.sizeName,
            price: parseFloat(row.sizePrice),
          }))
          .filter(size => !isNaN(size.price));
        
        const hasSizes = allSizes.length > 0;
        
        const categoryId = rows[0].subcategory ? 
          subcategoryMap.get(`${rows[0].category}:${rows[0].subcategory}`) : 
          categoryMap.get(rows[0].category);
        
        const image = rows.find(r => r.image)?.image || '';
        
        console.log('[importData] Kategori ID:', categoryId);
        console.log('[importData] Kategori navn:', rows[0].category, rows[0].subcategory ? `> ${rows[0].subcategory}` : '');
        console.log('[importData] Har størrelser:', hasSizes, '(', allSizes.length, 'størrelser)');
        
        if (hasSizes) {
          console.log('[importData] Størrelser:', allSizes.map(s => `${s.name}: ${s.price}kr`).join(', '));

          const product = await addProduct(productName, 0);
          if (product) {
            const updates: any = {
              categoryId,
              sizes: allSizes,
              hasSize: true,
            };
            
            if (image) {
              updates.image = image;
            }
            
            const addonSet = productAddonMap.get(productName);
            if (addonSet && addonSet.size > 0) {
              updates.tilleggsvareIds = Array.from(addonSet);
              console.log('[importData] 🔗 Kobler', updates.tilleggsvareIds.length, 'tilleggsvarer til produkt:', productName);
            }
            
            const updateSuccess = await updateProduct(product.id, updates);
            if (updateSuccess) {
              productsCreated++;
              console.log('[importData] ✅ Produkt med', allSizes.length, 'størrelser opprettet:', productName, 'ID:', product.id);
            } else {
              console.error('[importData] ❌ Feilet å oppdatere produkt:', productName);
            }
          }
        } else {
          const priceRow = rows.find(r => r.price);
          if (priceRow) {
            const price = parseFloat(priceRow.price);
            if (!isNaN(price)) {
              const product = await addProduct(productName, price);
              if (product) {
                const updates: any = {
                  categoryId,
                };
                
                if (image) {
                  updates.image = image;
                }
                
                const addonSet = productAddonMap.get(productName);
                if (addonSet && addonSet.size > 0) {
                  updates.tilleggsvareIds = Array.from(addonSet);
                  console.log('[importData] 🔗 Kobler', updates.tilleggsvareIds.length, 'tilleggsvarer til produkt:', productName);
                }
                
                const updateSuccess = await updateProduct(product.id, updates);
                if (updateSuccess) {
                  productsCreated++;
                  console.log('[importData] ✅ Produkt opprettet:', productName, 'ID:', product.id, 'Pris:', price);
                } else {
                  console.error('[importData] ❌ Feilet å oppdatere produkt:', productName);
                }
              }
            } else {
              console.log('[importData] ⚠️ Ugyldig pris for produkt:', productName, '- hopper over');
            }
          } else {
            console.log('[importData] ⚠️ Produkt mangler pris eller størrelser:', productName, '- hopper over');
          }
        }
      }

      console.log('\n[importData] ===== OPPSUMMERING =====');
      console.log('[importData] Kategorier opprettet:', categoriesCreated);
      console.log('[importData] Kategorier oppdatert:', categoriesUpdated);
      console.log('[importData] Produkter opprettet:', productsCreated);
      console.log('[importData] Produkter oppdatert:', productsUpdated);
      console.log('[importData] Tilleggsvarer opprettet:', addonsCreated);
      console.log('[importData] Tilleggsvarer oppdatert:', addonsUpdated);
      console.log('[importData] Varianter opprettet:', variantsCreated);
      console.log('[importData] Varianter oppdatert:', variantsUpdated);

      console.log('\n[importData] 🔄 Laster inn data på nytt fra database...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await Promise.all([
        loadProducts(),
        loadCategories(), 
        loadTilleggsvarer()
      ]);
      
      console.log('[importData] ✅ Data lastet inn på nytt!');

      setImportResult({
        categories: categoriesCreated,
        products: productsCreated,
        addons: addonsCreated,
      });

      Alert.alert(
        'Import fullført!',
        `✅ Kategorier: ${categoriesCreated} opprettet\n✅ Produkter: ${productsCreated} opprettet, ${productsUpdated} oppdatert\n✅ Tilleggsvarer: ${addonsCreated} opprettet\n✅ Varianter: ${variantsCreated} opprettet`,
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('[importData] ❌ ERROR:', error);
      console.error('[importData] Error stack:', error.stack);
      Alert.alert('Feil', error.message || 'Import feilet');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Importer fra Excel</Text>
        <Text style={styles.headerSubtitle}>Last opp CSV/Excel fil for å importere produkter</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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

        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>Eksempel fil</Text>
          <Text style={styles.exampleHeader}>Produktnavn|Pris|Størrelse navn|Størrelse pris|Kategori|Underkategori|Tilleggsvarer|Varianter navn|Varianter pris|Farge|Bilde</Text>
          <Text style={styles.exampleRow}>Pizza Margherita|120|||Pizza||||||</Text>
          <Text style={styles.exampleRow}>Vegetar||Liten|100|Pizza|Vegetar|||||</Text>
          <Text style={styles.exampleRow}>Vegetar||Medium|130|Pizza|Vegetar|||||</Text>
        </View>

        <TouchableOpacity style={styles.fileButton} onPress={pickFile}>
          <Upload size={24} color="#10B981" />
          <Text style={styles.fileButtonText}>
            {file ? file.name : 'Velg fil'}
          </Text>
        </TouchableOpacity>

        {file && importStatus === 'idle' && (
          <TouchableOpacity style={styles.parseButton} onPress={parseFile}>
            <Text style={styles.parseButtonText}>Les fil</Text>
          </TouchableOpacity>
        )}

        {importStatus === 'success' && parsedData.length > 0 && (
          <>
            <View style={styles.previewCard}>
              <CheckCircle2 size={32} color="#10B981" />
              <Text style={styles.previewTitle}>{parsedData.length} rader funnet</Text>
            </View>

            <View style={styles.dataCard}>
              <Text style={styles.dataTitle}>Forhåndsvisning av data: (Viser alle {parsedData.length} rader)</Text>
              <ScrollView style={styles.dataScroll} horizontal>
                <View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataHeaderCell}>Produktnavn</Text>
                    <Text style={styles.dataHeaderCell}>Pris</Text>
                    <Text style={styles.dataHeaderCell}>Størrelse navn</Text>
                    <Text style={styles.dataHeaderCell}>Størrelse pris</Text>
                    <Text style={styles.dataHeaderCell}>Kategori</Text>
                    <Text style={styles.dataHeaderCell}>Underkategori</Text>
                    <Text style={styles.dataHeaderCell}>Tilleggsvarer</Text>
                    <Text style={styles.dataHeaderCell}>Varianter navn</Text>
                    <Text style={styles.dataHeaderCell}>Varianter pris</Text>
                    <Text style={styles.dataHeaderCell}>Farge</Text>
                    <Text style={styles.dataHeaderCell}>Bilde</Text>
                  </View>
                  {parsedData.map((row, index) => (
                    <View key={index} style={styles.dataRow}>
                      <Text style={styles.dataCell}>{row.productName || '-'}</Text>
                      <Text style={styles.dataCell}>{row.price || '-'}</Text>
                      <Text style={styles.dataCell}>{row.sizeName || '-'}</Text>
                      <Text style={styles.dataCell}>{row.sizePrice || '-'}</Text>
                      <Text style={styles.dataCell}>{row.category || '-'}</Text>
                      <Text style={styles.dataCell}>{row.subcategory || '-'}</Text>
                      <Text style={styles.dataCell}>{row.addons || '-'}</Text>
                      <Text style={styles.dataCell}>{row.variantName || '-'}</Text>
                      <Text style={styles.dataCell}>{row.variantPrice || '-'}</Text>
                      <Text style={styles.dataCell}>{row.color || '-'}</Text>
                      <Text style={styles.dataCell}>{row.image || '-'}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            <TouchableOpacity style={styles.importButton} onPress={importData}>
              <Text style={styles.importButtonText}>Importer data</Text>
            </TouchableOpacity>
          </>
        )}

        {importStatus === 'error' && (
          <View style={styles.errorCard}>
            <AlertCircle size={32} color="#EF4444" />
            <Text style={styles.errorTitle}>Feil ved lesing</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {importResult && (
          <View style={styles.resultCard}>
            <CheckCircle2 size={48} color="#10B981" />
            <Text style={styles.resultTitle}>Import fullført!</Text>
            <View style={styles.resultStats}>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatNumber}>{importResult.categories}</Text>
                <Text style={styles.resultStatLabel}>Kategorier</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatNumber}>{importResult.products}</Text>
                <Text style={styles.resultStatLabel}>Produkter</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatNumber}>{importResult.addons}</Text>
                <Text style={styles.resultStatLabel}>Tilleggsvarer</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  instructionsCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  columnList: {
    width: '100%',
    gap: 8,
  },
  columnItem: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500' as const,
  },
  exampleCard: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
  },
  exampleHeader: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#10B981',
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  exampleRow: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#374151',
    marginBottom: 4,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed' as const,
  },
  fileButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  parseButton: {
    backgroundColor: '#10B981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  parseButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  previewCard: {
    backgroundColor: '#ECFDF5',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#047857',
    marginTop: 12,
    marginBottom: 16,
  },
  importButton: {
    backgroundColor: '#10B981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  dataCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
  },
  dataScroll: {
    maxHeight: 600,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dataHeaderCell: {
    width: 120,
    padding: 12,
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#111827',
    backgroundColor: '#F3F4F6',
  },
  dataCell: {
    width: 120,
    padding: 12,
    fontSize: 12,
    color: '#374151',
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#991B1B',
    marginTop: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#B91C1C',
    textAlign: 'center' as const,
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginTop: 16,
    marginBottom: 24,
  },
  resultStats: {
    flexDirection: 'row',
    gap: 32,
  },
  resultStat: {
    alignItems: 'center',
  },
  resultStatNumber: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#10B981',
    marginBottom: 4,
  },
  resultStatLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600' as const,
  },
});
