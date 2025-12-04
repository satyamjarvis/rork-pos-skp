import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';


import type { Order } from './OrdersContext';
import NetInfo from '@react-native-community/netinfo';

const PRINTER_STORAGE_KEY = '@printers';
const PRINT_LOG_STORAGE_KEY = '@print_logs';

export type PrinterType = 'kitchen' | 'bar' | 'customer';
export type PaperWidth = 58 | 80;
export type ConnectionType = 'network' | 'usb' | 'bluetooth';

export interface Printer {
  id: string;
  name: string;
  ipAddress?: string;
  connectionType: ConnectionType;
  type: PrinterType;
  paperWidth: PaperWidth;
  enabled: boolean;
  usbDeviceId?: string;
  bluetoothAddress?: string;
  port?: number;
  printerType?: 'webprnt' | 'raw';
}

export interface PrintLog {
  id: string;
  timestamp: number;
  printerId: string;
  printerName: string;
  orderNumber: number;
  status: 'success' | 'failed' | 'retrying';
  attempts: number;
  errorMessage?: string;
  request?: string;
  response?: string;
}

export interface DiscoveredPrinter {
  ip: string;
  port: number;
  type: 'webprnt' | 'raw' | 'escpos';
  name?: string;
}

export interface ScanProgress {
  current: number;
  total: number;
  currentIP?: string;
  message: string;
}

export const [PrinterProvider, usePrinter] = createContextHook(() => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [printLogs, setPrintLogs] = useState<PrintLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<DiscoveredPrinter[]>([]);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [scanDebugLog, setScanDebugLog] = useState<string[]>([]);

  useEffect(() => {
    loadPrinters();
    loadPrintLogs();
  }, []);

  const loadPrinters = async () => {
    try {
      const stored = await AsyncStorage.getItem(PRINTER_STORAGE_KEY);
      if (stored && stored !== 'null' && stored !== 'undefined') {
        try {
          setPrinters(JSON.parse(stored));
        } catch (parseError) {
          console.error('Failed to parse printers JSON:', parseError);
          console.error('Invalid JSON string:', stored);
          setPrinters([]);
        }
      }
    } catch (error) {
      console.error('Failed to load printers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPrintLogs = async () => {
    try {
      const stored = await AsyncStorage.getItem(PRINT_LOG_STORAGE_KEY);
      if (stored && stored !== 'null' && stored !== 'undefined') {
        try {
          setPrintLogs(JSON.parse(stored));
        } catch (parseError) {
          console.error('Failed to parse print logs JSON:', parseError);
          console.error('Invalid JSON string:', stored);
          setPrintLogs([]);
        }
      }
    } catch (error) {
      console.error('Failed to load print logs:', error);
    }
  };

  const savePrinters = async (newPrinters: Printer[]) => {
    try {
      await AsyncStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(newPrinters));
      setPrinters(newPrinters);
    } catch (error) {
      console.error('Failed to save printers:', error);
      throw error;
    }
  };

  const addPrinter = useCallback(async (printer: Omit<Printer, 'id'>) => {
    const newPrinter: Printer = {
      ...printer,
      id: `printer_${Date.now()}`,
    };
    const updated = [...printers, newPrinter];
    await savePrinters(updated);
    return newPrinter;
  }, [printers]);

  const updatePrinter = useCallback(async (id: string, updates: Partial<Printer>) => {
    const updated = printers.map(p => p.id === id ? { ...p, ...updates } : p);
    await savePrinters(updated);
  }, [printers]);

  const deletePrinter = useCallback(async (id: string) => {
    const updated = printers.filter(p => p.id !== id);
    await savePrinters(updated);
  }, [printers]);

  const addPrintLog = useCallback(async (log: Omit<PrintLog, 'id' | 'timestamp'>) => {
    const newLog: PrintLog = {
      ...log,
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
    };
    const updated = [newLog, ...printLogs].slice(0, 50);
    await AsyncStorage.setItem(PRINT_LOG_STORAGE_KEY, JSON.stringify(updated));
    setPrintLogs(updated);
  }, [printLogs]);

  const sendToRawPrinter = useCallback(async (
    printer: Printer,
    order: Order,
    businessName: string,
    maxRetries: number = 3
  ): Promise<void> => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const port = printer.port || 9100;
        console.log(`[RAW ESC/POS] Attempt ${attempt}/${maxRetries} to ${printer.name} (${printer.ipAddress}:${port})`);
        console.log(`[RAW ESC/POS] Sending direct ESC/POS commands (80mm paper)`);
        
        const formatTime = (timestamp: number) => {
          const date = new Date(timestamp);
          return date.toLocaleString('nb-NO', {
            hour: '2-digit',
            minute: '2-digit',
          });
        };

        const ESC = '\x1B';
        const GS = '\x1D';
        
        let receipt = '';
        receipt += ESC + '@';
        receipt += ESC + 'a' + '\x01';
        receipt += GS + '!' + '\x11';
        receipt += '*** KJOKKEN ***\n';
        receipt += GS + '!' + '\x00';
        receipt += ESC + 'a' + '\x01';
        receipt += `Ordre #${order.orderNumber}\n`;
        receipt += `Tid: ${formatTime(order.timestamp)}\n`;
        receipt += '--------------------------------\n';
        receipt += ESC + 'a' + '\x00';
        
        order.items.forEach(item => {
          receipt += GS + '!' + '\x11';
          receipt += `${item.quantity}x ${item.name}\n`;
          receipt += GS + '!' + '\x00';
          if (item.size) {
            receipt += `   Storrelse: ${item.size}\n`;
          }
          if (item.addOns && item.addOns.length > 0) {
            item.addOns.forEach(addOn => {
              const qty = addOn.quantity || 1;
              const categoryPrefix = addOn.categoryName ? `[${addOn.categoryName}] ` : '';
              receipt += `   + ${categoryPrefix}${qty}x ${addOn.name}\n`;
            });
          }
        });
        
        receipt += '--------------------------------\n';
        receipt += ESC + 'a' + '\x01';
        const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
        receipt += GS + '!' + '\x11';
        receipt += `Totalt: ${totalItems} varer\n`;
        receipt += GS + '!' + '\x00';
        receipt += '\n\n\n';
        receipt += GS + 'V' + '\x00';
        
        const url = `http://${printer.ipAddress}:${port}`;
        const timeoutMs = 15000;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        console.log(`[RAW ESC/POS] Sending raw ESC/POS data to ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          body: receipt,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const responseText = await response.text().catch(() => '');
        console.log(`[RAW ESC/POS] Response status: ${response.status}`);
        console.log(`[RAW ESC/POS] Response:`, responseText.substring(0, 500));
        
        if (response.ok || response.status === 0 || (response.status >= 200 && response.status < 300)) {
          console.log(`[RAW ESC/POS] ✅ Print command sent successfully to ${printer.name}`);
          
          await addPrintLog({
            printerId: printer.id,
            printerName: printer.name,
            orderNumber: order.orderNumber,
            status: 'success',
            attempts: attempt,
            request: `RAW ESC/POS to ${printer.ipAddress}:${port}`,
            response: responseText.substring(0, 500),
          });
          
          console.log(`[RAW ESC/POS] 🖨️ Kvittering sendt til fysisk print!`);
          return;
        } else {
          throw new Error(`HTTP ${response.status}: ${responseText}`);
        }
      } catch (error: any) {
        lastError = error;
        let errorMessage = error.message || 'Ukjent feil';
        
        const port = printer.port || 9100;
        if (error.name === 'AbortError') {
          errorMessage = `Timeout - skriveren svarer ikke på ${printer.ipAddress}:${port} (RAW ESC/POS).`;
        } else if (error.message?.includes('Network request failed')) {
          errorMessage = `Kan ikke nå skriveren på ${printer.ipAddress}:${port}. Kontroller: 1) Skriver er PÅ, 2) På samme WiFi, 3) RAW printing er aktivert (port ${port}).`;
        }
        
        console.error(`[RAW ESC/POS] ❌ Attempt ${attempt} failed:`, errorMessage);
        console.error(`[RAW ESC/POS] Full error:`, error);
        
        if (attempt < maxRetries) {
          await addPrintLog({
            printerId: printer.id,
            printerName: printer.name,
            orderNumber: order.orderNumber,
            status: 'retrying',
            attempts: attempt,
            errorMessage: errorMessage,
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    const port = printer.port || 9100;
    const finalErrorMessage = lastError?.name === 'AbortError'
      ? `Timeout: Skriveren ${printer.name} svarer ikke på ${printer.ipAddress}:${port} (RAW ESC/POS).`
      : lastError?.message?.includes('Network request failed')
      ? `Kan ikke nå skriveren ${printer.name} på ${printer.ipAddress}:${port}. Sjekk at skriveren støtter RAW ESC/POS på port ${port}.`
      : lastError?.message || 'Ukjent feil';
    
    await addPrintLog({
      printerId: printer.id,
      printerName: printer.name,
      orderNumber: order.orderNumber,
      status: 'failed',
      attempts: maxRetries,
      errorMessage: finalErrorMessage,
    });
    
    throw new Error(finalErrorMessage);
  }, [addPrintLog]);

  const sendToWebPRNT = useCallback(async (
    printer: Printer,
    html: string,
    orderNumber: number,
    maxRetries: number = 3
  ): Promise<void> => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[WebPRNT] Attempt ${attempt}/${maxRetries} to ${printer.name} (${printer.ipAddress})`);
        console.log(`[WebPRNT] Sending Star WebPRNT XML with ACTUAL print command`);
        
        const url = `http://${printer.ipAddress}:8001/StarWebPRNT/SendMessage`;
        const timeoutMs = 15000;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const starXML = `<?xml version="1.0" encoding="UTF-8"?><StarWebPrintData>${html}<cutpaper type="feed"/><action type="print" /></StarWebPrintData>`;
        
        console.log(`[WebPRNT] ⚠️ CRITICAL: XML MUST include <action type="print" /> to physically print!`);
        console.log(`[WebPRNT] Request body:`, starXML.substring(0, 400));
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
          },
          body: starXML,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const responseText = await response.text();
        console.log(`[WebPRNT] Response status: ${response.status}`);
        console.log(`[WebPRNT] Response:`, responseText.substring(0, 500));
        
        const isPaperOut = responseText.includes('"PaperEmpty":true');
        const isPaperNearEnd = responseText.includes('"PaperNearEmptyInner":true') || responseText.includes('"PaperNearEmptyOuter":true');
        const isOffline = responseText.includes('"Offline":true') || responseText.includes('"offline":true');
        const isCoverOpen = responseText.includes('"CoverOpen":true');
        
        if (isPaperOut) {
          throw new Error(`⚠️ SKRIVEREN ER TOM FOR PAPIR! Legg i nytt papir i ${printer.name}.`);
        }
        if (isOffline) {
          throw new Error(`⚠️ SKRIVEREN ER OFFLINE! Skru på skriveren ${printer.name} eller sjekk WiFi-tilkobling.`);
        }
        if (isCoverOpen) {
          throw new Error(`⚠️ SKRIVERLOKKET ER ÅPENT! Lukk lokket på ${printer.name}.`);
        }
        
        if (response.ok) {
          console.log(`[WebPRNT] ✅ Print command sent successfully to ${printer.name}`);
          if (isPaperNearEnd) {
            console.warn(`[WebPRNT] ⚠️ WARNING: Paper is running low in ${printer.name}`);
          }
          
          await addPrintLog({
            printerId: printer.id,
            printerName: printer.name,
            orderNumber,
            status: 'success',
            attempts: attempt,
            request: starXML.substring(0, 500),
            response: responseText.substring(0, 500),
          });
          
          console.log(`[WebPRNT] 🖨️ Kvittering sendt til fysisk print!`);
          return;
        } else {
          throw new Error(`HTTP ${response.status}: ${responseText}`);
        }
      } catch (error: any) {
        lastError = error;
        let errorMessage = error.message || 'Ukjent feil';
        
        if (error.name === 'AbortError') {
          errorMessage = `Timeout - skriveren svarer ikke på ${printer.ipAddress}. Sjekk at WebPRNT er aktivert.`;
        } else if (error.message?.includes('Network request failed')) {
          errorMessage = `Kan ikke nå skriveren på ${printer.ipAddress}. Kontroller: 1) IP-adresse er riktig, 2) Skriver og enhet er på samme WiFi, 3) WebPRNT er aktivert på printeren.`;
        }
        
        console.error(`[WebPRNT] ❌ Attempt ${attempt} failed:`, errorMessage);
        console.error(`[WebPRNT] Full error:`, error);
        
        if (attempt < maxRetries) {
          await addPrintLog({
            printerId: printer.id,
            printerName: printer.name,
            orderNumber,
            status: 'retrying',
            attempts: attempt,
            errorMessage: errorMessage,
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    const finalErrorMessage = lastError?.name === 'AbortError'
      ? `Timeout: Skriveren ${printer.name} svarer ikke på ${printer.ipAddress}. Sjekk at skriveren er på, koblet til WiFi, og at WebPRNT er aktivert.`
      : lastError?.message?.includes('Network request failed')
      ? `Kan ikke nå skriveren ${printer.name} på ${printer.ipAddress}. Kontroller: 1) IP-adresse (${printer.ipAddress}) er riktig, 2) Skriver og enhet er på samme WiFi-nettverk, 3) WebPRNT er aktivert på printeren (trykk printer-knapp i 3 sek → Settings → WebPRNT → Enable).`
      : lastError?.message || 'Ukjent feil';
    
    await addPrintLog({
      printerId: printer.id,
      printerName: printer.name,
      orderNumber,
      status: 'failed',
      attempts: maxRetries,
      errorMessage: finalErrorMessage,
    });
    
    throw new Error(finalErrorMessage);
  }, [addPrintLog]);

  const printToUSB = useCallback(async (html: string, printer: Printer) => {
    console.log('[USB] USB printing er ikke støttet uten expo-print');
    throw new Error('USB printing er ikke støttet. Bruk kun nettverksskrivere med WebPRNT.');
  }, []);

  const selectUSBPrinter = useCallback(async () => {
    console.log('[USB] USB printer selection er ikke støttet');
    throw new Error('USB printer selection er ikke støttet. Bruk kun nettverksskrivere med WebPRNT.');
  }, []);

  const printHTML = useCallback(async (html: string, printer?: Printer) => {
    console.log('[printHTML] Denne funksjonen er deaktivert. Bruk kun WebPRNT.');
    throw new Error('printHTML er deaktivert. Bruk printToWebPRNT eller printToAllPrinters i stedet.');
  }, []);

  const generateWebPRNTReceipt = useCallback((order: Order, businessName: string = 'Restaurant', paperWidth: PaperWidth = 58) => {
    const formatTime = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleString('nb-NO', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    
    let receipt = '';
    receipt += '<logo type="left" />'; 
    receipt += '<alignment value="center"/>';
    receipt += '<emphasis><text>*** KJOKKEN ***</text></emphasis><br/>';
    receipt += `<emphasis><text>Ordre #${order.orderNumber}</text></emphasis><br/>`;
    receipt += `<text>Tid: ${formatTime(order.timestamp)}</text><br/>`;
    receipt += '<text>--------------------------------</text><br/>';
    receipt += '<alignment value="left"/>';
    
    order.items.forEach(item => {
      receipt += `<emphasis><text>${item.quantity}x ${item.name}</text></emphasis><br/>`;
      if (item.size) {
        receipt += `<text>   Storrelse: ${item.size}</text><br/>`;
      }
      if (item.addOns && item.addOns.length > 0) {
        item.addOns.forEach(addOn => {
          const qty = addOn.quantity || 1;
          const categoryPrefix = addOn.categoryName ? `[${addOn.categoryName}] ` : '';
          receipt += `<text>   + ${categoryPrefix}${qty}x ${addOn.name}</text><br/>`;
        });
      }
    });
    
    receipt += '<text>--------------------------------</text><br/>';
    receipt += '<alignment value="center"/>';
    receipt += `<emphasis><text>Totalt: ${totalItems} varer</text></emphasis><br/>`;
    receipt += '<br/><br/><br/>';
    
    return receipt;
  }, []);

  const generateKitchenReceipt = useCallback((order: Order, businessName: string = 'Restaurant') => {
    const formatTime = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleString('nb-NO', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const itemsHTML = order.items.map(item => {
      let html = `
        <div class="receipt-item">
          <span class="item-qty">${item.quantity}×</span>
          <div class="item-details">
            <span class="item-name">${item.name}</span>
          </div>
        </div>
      `;

      if (item.addOns && item.addOns.length > 0) {
        html += '<div class="addons-section">';
        item.addOns.forEach(addOn => {
          const categoryText = addOn.categoryName ? `<span style="font-size: 10px; color: #666;">[${addOn.categoryName}]</span> ` : '';
          html += `
            <div class="addon-item">
              <span class="addon-qty">${addOn.quantity || 1}×</span>
              <span class="addon-name">${categoryText}+ ${addOn.name}</span>
            </div>
          `;
        });
        html += '</div>';
      }

      return html;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kjøkkenkvittering</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @media print {
      @page {
        margin: 0;
        size: 80mm auto;
      }
      
      body {
        margin: 0;
        padding: 0;
      }
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      background: white;
      padding: 0;
      margin: 0;
    }

    .receipt {
      width: 80mm;
      background: white;
      color: #000;
      font-size: 13px;
      line-height: 1.4;
      padding: 8px;
    }

    .receipt-header {
      text-align: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #000;
    }

    .receipt-header h1 {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 6px;
      letter-spacing: 1px;
    }

    .receipt-header .subtitle {
      font-size: 14px;
      font-weight: bold;
      margin-top: 4px;
    }

    .order-number {
      text-align: center;
      font-size: 32px;
      font-weight: bold;
      margin: 12px 0;
      padding: 12px;
      background: #000;
      color: #fff;
      letter-spacing: 2px;
    }

    .receipt-info {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px dashed #000;
      font-size: 12px;
    }

    .receipt-info-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }

    .receipt-items {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #000;
    }

    .receipt-item {
      display: flex;
      margin: 8px 0;
      font-size: 14px;
      font-weight: bold;
    }

    .item-qty {
      width: 35px;
      font-size: 16px;
      font-weight: bold;
    }

    .item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .item-name {
      font-size: 14px;
      font-weight: bold;
    }

    .item-size {
      font-size: 11px;
      color: #333;
      font-weight: normal;
    }

    .addons-section {
      margin-left: 35px;
      margin-top: 4px;
      padding-left: 8px;
      border-left: 2px solid #000;
    }

    .addon-item {
      display: flex;
      margin: 3px 0;
      font-size: 12px;
    }

    .addon-qty {
      width: 30px;
      font-weight: bold;
    }

    .addon-name {
      flex: 1;
    }

    .receipt-footer {
      text-align: center;
      font-size: 12px;
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px dashed #000;
    }

    .receipt-footer p {
      margin: 4px 0;
    }

    .total-items {
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      margin: 12px 0;
      padding: 8px;
      background: #f0f0f0;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="order-number">
      #${order.orderNumber}
    </div>

    <div class="receipt-info">
      <div class="receipt-info-row">
        <span>Tid:</span>
        <span>${formatTime(order.timestamp)}</span>
      </div>
    </div>

    <div class="receipt-items">
      ${itemsHTML}
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 100);
    });
  </script>
</body>
</html>
    `;
  }, []);

  const printKitchenReceipt = useCallback(async (order: Order, businessName: string = 'Restaurant', printer?: Printer) => {
    const html = generateKitchenReceipt(order, businessName);
    await printHTML(html, printer);
  }, [generateKitchenReceipt, printHTML]);

  const printToUSBPrinters = useCallback(async (order: Order, businessName: string = 'Restaurant') => {
    const usbPrinters = printers.filter(p => p.connectionType === 'usb' && p.type === 'kitchen' && p.enabled);
    
    if (usbPrinters.length === 0) {
      throw new Error('Ingen aktive USB-skrivere konfigurert');
    }
    
    const results = await Promise.allSettled(
      usbPrinters.map(async printer => {
        const html = generateKitchenReceipt(order, businessName);
        await printToUSB(html, printer);
        
        await addPrintLog({
          printerId: printer.id,
          printerName: printer.name,
          orderNumber: order.orderNumber,
          status: 'success',
          attempts: 1,
        });
      })
    );
    
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0 && failed.length === results.length) {
      const error = (failed[0] as PromiseRejectedResult).reason;
      throw new Error(error.message || 'Alle USB-skrivere feilet');
    }
    
    if (failed.length > 0) {
      console.warn(`${failed.length} av ${results.length} USB-skrivere feilet`);
    }
  }, [printers, generateKitchenReceipt, printToUSB, addPrintLog]);

  const printToWebPRNT = useCallback(async (order: Order, businessName: string = 'Restaurant') => {
    const kitchenPrinters = printers.filter(p => p.connectionType === 'network' && p.type === 'kitchen' && p.enabled);
    
    if (kitchenPrinters.length === 0) {
      throw new Error('Ingen aktive nettverksskrivere konfigurert');
    }
    
    const results = await Promise.allSettled(
      kitchenPrinters.map(async printer => {
        if (printer.printerType === 'raw' || printer.port === 9100) {
          console.log(`[Print] Using RAW/ESC-POS for ${printer.name} on port ${printer.port || 9100}`);
          return sendToRawPrinter(printer, order, businessName);
        } else {
          console.log(`[Print] Using WebPRNT for ${printer.name}`);
          const html = generateWebPRNTReceipt(order, businessName, printer.paperWidth);
          return sendToWebPRNT(printer, html, order.orderNumber);
        }
      })
    );
    
    const failed = results.filter(r => r.status === 'rejected');
    const succeeded = results.filter(r => r.status === 'fulfilled');
    
    if (failed.length > 0 && failed.length === results.length) {
      throw new Error('Alle nettverksskrivere feilet');
    }
    
    if (failed.length > 0) {
      console.warn(`${failed.length} av ${results.length} nettverksskrivere feilet`);
    }
    
    if (succeeded.length > 0) {
      console.log(`✅ ${succeeded.length} av ${results.length} skrivere mottok kvitteringen`);
    }
  }, [printers, generateWebPRNTReceipt, sendToWebPRNT, sendToRawPrinter]);

  const printToAllPrinters = useCallback(async (order: Order, businessName: string = 'Restaurant') => {
    const errors: string[] = [];
    
    const networkPrinters = printers.filter(p => p.connectionType === 'network' && p.type === 'kitchen' && p.enabled);
    const usbPrinters = printers.filter(p => p.connectionType === 'usb' && p.type === 'kitchen' && p.enabled);
    
    if (networkPrinters.length === 0 && usbPrinters.length === 0) {
      throw new Error('Ingen aktive skrivere konfigurert');
    }
    
    if (networkPrinters.length > 0) {
      try {
        await printToWebPRNT(order, businessName);
      } catch (error: any) {
        errors.push(`Nettverksskrivere: ${error.message}`);
      }
    }
    
    if (usbPrinters.length > 0) {
      try {
        await printToUSBPrinters(order, businessName);
      } catch (error: any) {
        errors.push(`USB-skrivere: ${error.message}`);
      }
    }
    
    if (errors.length > 0 && errors.length === (networkPrinters.length > 0 ? 1 : 0) + (usbPrinters.length > 0 ? 1 : 0)) {
      throw new Error(`Alle skrivere feilet:\n${errors.join('\n')}`);
    }
  }, [printers, printToWebPRNT, printToUSBPrinters]);

  const scanForPrinters = useCallback(async (): Promise<DiscoveredPrinter[]> => {
    setIsScanning(true);
    setScanProgress(null);
    setScanDebugLog([]);
    const discovered: DiscoveredPrinter[] = [];
    const debugLog: string[] = [];
    
    const addLog = (message: string) => {
      console.log(message);
      debugLog.push(message);
      setScanDebugLog([...debugLog]);
    };
    
    try {
      addLog('[PrinterScan] Starting network printer discovery...');
      addLog('[PrinterScan] Scanning for printers on same WiFi (no WebPRNT required)...');
      addLog('[PrinterScan] Supported: RAW/ESC-POS (9100), IPP (631), LPD (515), WebPRNT (8001)');
      
      let currentNetwork = 'Ukjent';
      try {
        const state = await NetInfo.fetch();
        if (state.type === 'wifi' && state.details?.ipAddress) {
          currentNetwork = state.details.ipAddress;
          addLog(`[PrinterScan] ✅ WiFi connected: ${currentNetwork}`);
        } else {
          addLog('[PrinterScan] ⚠️ Not connected to WiFi. Connect to same WiFi as printer.');
        }
      } catch {
        addLog('[PrinterScan] Could not get network info');
      }
      
      const detectSubnet = () => {
        if (currentNetwork && currentNetwork !== 'Ukjent') {
          const parts = currentNetwork.split('.');
          if (parts.length === 4) {
            return `${parts[0]}.${parts[1]}.${parts[2]}`;
          }
        }
        return null;
      };
      
      const currentSubnet = detectSubnet();
      
      let subnets: string[] = [];
      if (currentSubnet) {
        subnets = [currentSubnet];
        addLog(`[PrinterScan] 🎯 Skanner ditt nettverk: ${currentSubnet}.x`);
      } else {
        subnets = ['192.168.1', '192.168.0', '192.168.10', '10.0.0', '10.0.1', '172.16.0'];
        addLog(`[PrinterScan] ⚠️ Kunne ikke detektere nettverk, prøver vanlige subnett`);
      }
      
      const uniqueSubnets = [...new Set(subnets)];
      addLog(`[PrinterScan] Vil scanne ${uniqueSubnets.length} subnett totalt`);
      
      const startIP = 1;
      const endIP = 254;
      const totalIPs = uniqueSubnets.length * (endIP - startIP + 1);
      let currentCount = 0;
      
      const testPrinterPort = async (ip: string, port: number, type: 'webprnt' | 'raw' | 'ipp' | 'lpd'): Promise<{ found: boolean; error?: string; status?: number; }> => {
        const controller = new AbortController();
        const timeoutMs = 1500;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        try {
          let url = '';
          let method = 'GET';
          let headers: Record<string, string> = {
            'Accept': '*/*',
            'User-Agent': 'RorkApp/1.0',
          };
          let body: string | undefined;
          
          if (type === 'webprnt') {
            url = `http://${ip}:8001/StarWebPRNT/SendMessage`;
            method = 'POST';
            headers['Content-Type'] = 'text/xml';
            body = '<?xml version="1.0" encoding="UTF-8"?><StarWebPrintData></StarWebPrintData>';
          } else if (type === 'ipp') {
            url = `http://${ip}:631/`;
            method = 'GET';
          } else if (type === 'lpd') {
            url = `http://${ip}:515/`;
            method = 'GET';
          } else {
            url = `http://${ip}:${port}`;
            method = 'GET';
          }
          
          const response = await fetch(url, {
            method,
            signal: controller.signal,
            headers,
            body,
          }).catch((err) => {
            return null;
          });
          
          clearTimeout(timeoutId);
          
          if (response) {
            const status = response.status;
            
            if (type === 'webprnt' && (status === 200 || status === 400)) {
              addLog(`[Scan] ✅ WebPRNT printer at ${ip}:8001`);
              return { found: true, status };
            }
            if (type === 'ipp' && (status === 200 || status === 426 || status === 400)) {
              addLog(`[Scan] ✅ IPP/AirPrint printer at ${ip}:631`);
              return { found: true, status };
            }
            if (type === 'lpd' && (status === 200 || status === 400 || status >= 500)) {
              addLog(`[Scan] ✅ LPD printer at ${ip}:515`);
              return { found: true, status };
            }
            if (type === 'raw' && (status === 200 || status === 404 || (status >= 400 && status < 500))) {
              addLog(`[Scan] ✅ RAW/ESC-POS printer at ${ip}:${port}`);
              return { found: true, status };
            }
            return { found: false, status };
          }
          return { found: false, error: 'No response' };
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            return { found: false, error: 'Timeout' };
          }
          return { found: false, error: err.message };
        }
      };
      
      for (const subnet of uniqueSubnets) {
        addLog(`[PrinterScan] 🔍 Scanning ${subnet}.x/24...`);
        
        const batchSize = 20;
        
        for (let batchStart = startIP; batchStart <= endIP; batchStart += batchSize) {
          const batchEnd = Math.min(batchStart + batchSize - 1, endIP);
          const batchPromises: Promise<void>[] = [];
          
          for (let i = batchStart; i <= batchEnd; i++) {
            const ip = `${subnet}.${i}`;
            
            const testIP = async () => {
              currentCount++;
              setScanProgress({
                current: currentCount,
                total: totalIPs,
                currentIP: ip,
                message: `Scanning ${ip}...`,
              });
              
              const rawResult = await testPrinterPort(ip, 9100, 'raw');
              if (rawResult.found) {
                discovered.push({
                  ip,
                  port: 9100,
                  type: 'raw',
                  name: `ESC/POS Printer (${ip})`,
                });
                setDiscoveredPrinters([...discovered]);
                addLog(`[PrinterScan] ✅ Found ESC/POS printer at ${ip}:9100`);
                return;
              }
              
              const ippResult = await testPrinterPort(ip, 631, 'ipp');
              if (ippResult.found) {
                discovered.push({
                  ip,
                  port: 631,
                  type: 'raw',
                  name: `IPP Printer (${ip})`,
                });
                setDiscoveredPrinters([...discovered]);
                addLog(`[PrinterScan] ✅ Found IPP printer at ${ip}:631`);
                return;
              }
              
              const webprntResult = await testPrinterPort(ip, 8001, 'webprnt');
              if (webprntResult.found) {
                discovered.push({
                  ip,
                  port: 8001,
                  type: 'webprnt',
                  name: `Star WebPRNT (${ip})`,
                });
                setDiscoveredPrinters([...discovered]);
                addLog(`[PrinterScan] ✅ Found WebPRNT printer at ${ip}:8001`);
                return;
              }
            };
            
            batchPromises.push(testIP());
          }
          
          await Promise.all(batchPromises);
          
          if (discovered.length > 0 && currentSubnet && subnet === currentSubnet) {
            addLog(`[PrinterScan] 🎉 Found ${discovered.length} printer(s) on your network!`);
          }
        }
        
        addLog(`[PrinterScan] Completed ${subnet}.x - ${discovered.length} printer(s) found`);
      }
      
      addLog(`[PrinterScan] ✅ Scan complete. Total found: ${discovered.length} printer(s)`);
      
      if (discovered.length === 0) {
        addLog('[PrinterScan] ❌ No printers found.');
        addLog('');
        addLog('📋 TROUBLESHOOTING:');
        addLog('  1️⃣ Make sure printer is ON and connected to WiFi');
        addLog('  2️⃣ Make sure your device is on the SAME WiFi network');
        addLog('  3️⃣ On iOS: Go to Settings > This App > Allow "Local Network" access');
        addLog('  4️⃣ Check printer IP address (print network config page)');
        addLog('  5️⃣ Test manual connection: add printer with IP address');
        addLog('  6️⃣ Supported protocols: RAW (9100), IPP (631), WebPRNT (8001)');
        addLog('');
        addLog(`Your network: ${currentNetwork}`);
      } else {
        addLog('');
        addLog('🎉 Scan successful!');
        addLog(`Found ${discovered.length} printer(s). Add one to start printing.`);
      }
      
      setDiscoveredPrinters(discovered);
      return discovered;
    } catch (error: any) {
      addLog(`[PrinterScan] ❌ Scanning feilet: ${error.message}`);
      console.error('[PrinterScan] Scan failed:', error);
      throw error;
    } finally {
      setIsScanning(false);
      setScanProgress(null);
    }
  }, []);

  return useMemo(() => ({
    printers,
    printLogs,
    isLoading,
    isScanning,
    discoveredPrinters,
    scanProgress,
    scanDebugLog,
    addPrinter,
    updatePrinter,
    deletePrinter,
    printHTML,
    generateKitchenReceipt,
    printKitchenReceipt,
    generateWebPRNTReceipt,
    printToWebPRNT,
    printToUSB,
    printToUSBPrinters,
    printToAllPrinters,
    selectUSBPrinter,
    scanForPrinters,
  }), [printers, printLogs, isLoading, isScanning, discoveredPrinters, scanProgress, scanDebugLog, addPrinter, updatePrinter, deletePrinter, printHTML, generateKitchenReceipt, printKitchenReceipt, generateWebPRNTReceipt, printToWebPRNT, printToUSB, printToUSBPrinters, printToAllPrinters, selectUSBPrinter, scanForPrinters]);
});
