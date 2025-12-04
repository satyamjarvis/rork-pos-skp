import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, BookOpen } from 'lucide-react-native';

export default function GuideViewerScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Brukerveiledning</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.introSection}>
          <BookOpen size={48} color="#3B82F6" />
          <Text style={styles.introTitle}>Velkommen til kassesystemet!</Text>
          <Text style={styles.introText}>
            Denne veiledningen vil hjelpe deg med å komme i gang med alle funksjonene i systemet.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Oppsett av bedriftsinformasjon</Text>
          <Text style={styles.sectionText}>
            Før du begynner å bruke kassen, bør du legge inn bedriftsinformasjonen din:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Gå til &quot;Innstillinger&quot;-fanen (tredje fane)</Text>
            <Text style={styles.bulletItem}>• Finn seksjonen &quot;Bedriftsinformasjon&quot; øverst</Text>
            <Text style={styles.bulletItem}>• Trykk &quot;Legg til informasjon&quot; eller &quot;Rediger informasjon&quot;</Text>
            <Text style={styles.bulletItem}>• Fyll inn alle felt (butikknavn, adresse, MVA-nummer, etc.)</Text>
            <Text style={styles.bulletItem}>• Trykk &quot;Lagre&quot; for å bekrefte</Text>
            <Text style={styles.bulletItem}>• Denne informasjonen vises på alle kvitteringer</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Last opp varer fra Excel</Text>
          <Text style={styles.sectionText}>
            For å spare tid kan du laste opp alle varene dine fra en Excel-fil:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Opprett en Excel-fil (.xlsx eller .xls) med to kolonner: &quot;navn&quot; og &quot;pris&quot;</Text>
            <Text style={styles.bulletItem}>• Eksempel: Pizza Margherita | 129</Text>
            <Text style={styles.bulletItem}>• Gå til &quot;Innstillinger&quot;-fanen</Text>
            <Text style={styles.bulletItem}>• Finn seksjonen &quot;Varer&quot;</Text>
            <Text style={styles.bulletItem}>• Trykk &quot;Last opp varer fra Excel&quot;</Text>
            <Text style={styles.bulletItem}>• Velg Excel-filen din fra enheten</Text>
            <Text style={styles.bulletItem}>• Systemet vil automatisk importere alle varene</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Bruke kassen</Text>
          <Text style={styles.sectionText}>
            Slik registrerer du et salg:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Gå til &quot;Kasse&quot;-fanen (første fane med hjem-ikon)</Text>
            <Text style={styles.bulletItem}>• Trykk &quot;Legg til vare&quot; for å legge til produkter</Text>
            <Text style={styles.bulletItem}>• Velg fra lagrede varer eller legg til manuelt</Text>
            <Text style={styles.bulletItem}>• Total beløp oppdateres automatisk øverst</Text>
            <Text style={styles.bulletItem}>• For å fjerne en vare: Trykk X-ikonet ved siden av varen</Text>
            <Text style={styles.bulletItem}>• For å fjerne alle varer: Trykk &quot;Slett&quot;-knappen</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Betaling</Text>
          <Text style={styles.sectionText}>
            Når alle varer er registrert:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Trykk &quot;Betal&quot;-knappen (grønn knapp nederst)</Text>
            <Text style={styles.bulletItem}>• Du ser total beløp øverst i en hvit boks</Text>
            <Text style={styles.bulletItem}>• Skriv inn mottatt kontant fra kunden</Text>
            <Text style={styles.bulletItem}>• Alternativt: Bruk hurtigknappene for sedler/mynter</Text>
            <Text style={styles.bulletItem}>• Hvis beløpet er for lite, vises en rød boks med melding</Text>
            <Text style={styles.bulletItem}>• Når riktig beløp er mottatt, trykk &quot;OK&quot;</Text>
            <Text style={styles.bulletItem}>• Systemet viser vekslepenger og forslag til sedler/mynter</Text>
            <Text style={styles.bulletItem}>• Trykk &quot;Skriv ut kvittering&quot; for å printe</Text>
            <Text style={styles.bulletItem}>• Trykk &quot;Ferdig&quot; for å fullføre transaksjonen</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Historikk</Text>
          <Text style={styles.sectionText}>
            Se alle tidligere transaksjoner:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Gå til &quot;Historikk&quot;-fanen (andre fane med klokke-ikon)</Text>
            <Text style={styles.bulletItem}>• Her ser du en liste over alle transaksjoner</Text>
            <Text style={styles.bulletItem}>• Hver transaksjon viser dato, varer, beløp og vekslepenger</Text>
            <Text style={styles.bulletItem}>• Trykk på printer-ikonet for å skrive ut kvittering på nytt</Text>
            <Text style={styles.bulletItem}>• Trykk &quot;Slett alle&quot; for å fjerne all historikk</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Printer-oppsett</Text>
          <Text style={styles.sectionText}>
            For å kunne skrive ut kvitteringer:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Gå til &quot;Innstillinger&quot;-fanen</Text>
            <Text style={styles.bulletItem}>• Finn seksjonen &quot;Printer-innstillinger&quot;</Text>
            <Text style={styles.bulletItem}>• Automatisk: Trykk &quot;Søk etter printere&quot;</Text>
            <Text style={styles.bulletItem}>• For mC-Print3: Koble iPad til printer via USB først</Text>
            <Text style={styles.bulletItem}>• Manuelt: Trykk &quot;Legg til manuelt&quot; og skriv inn printer-info</Text>
            <Text style={styles.bulletItem}>• Test utskrift ved å gjennomføre en transaksjon</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Backup og gjenoppretting</Text>
          <Text style={styles.sectionText}>
            Sikkerhetskopier dine data regelmessig:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Gå til &quot;Innstillinger&quot;-fanen</Text>
            <Text style={styles.bulletItem}>• Finn seksjonen &quot;Data-håndtering&quot;</Text>
            <Text style={styles.bulletItem}>• Ta backup: Trykk &quot;Last ned transaksjoner&quot;</Text>
            <Text style={styles.bulletItem}>• Gjenopprett: Trykk &quot;Last opp transaksjoner&quot; og velg fil</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Tips og triks</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Bruk lagrede varer for raskere betjening</Text>
            <Text style={styles.bulletItem}>• Bruk sedel/mynt-knappene for rask kontantregistrering</Text>
            <Text style={styles.bulletItem}>• Du kan skrive ut kvitteringer både under betaling og fra historikk</Text>
            <Text style={styles.bulletItem}>• Ta backup minst én gang per uke</Text>
            <Text style={styles.bulletItem}>• Last opp ny Excel-fil for å oppdatere varepriser</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Feilsøking</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Printer fungerer ikke: Sjekk USB-tilkobling og prøv å legge til printer på nytt</Text>
            <Text style={styles.bulletItem}>• Varer vises ikke: Sjekk Excel-format (kolonner: &quot;navn&quot; og &quot;pris&quot;)</Text>
            <Text style={styles.bulletItem}>• Total beløp er feil: Sjekk at alle varer har riktig pris</Text>
          </View>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerText}>Kassesystem - Brukerveiledning</Text>
          <Text style={styles.footerSubtext}>
            Generert: {new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
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
    paddingBottom: 40,
  },
  introSection: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1E40AF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  introText: {
    fontSize: 15,
    color: '#1E40AF',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  sectionText: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 22,
  },
  bulletList: {
    marginTop: 8,
  },
  bulletItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
    paddingLeft: 8,
  },
  footerSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
