import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fMZhrib2Bg-4.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf', fontWeight: 800 },
  ],
});

const ink = '#0f172a';
const muted = '#64748b';
const line = '#e2e8f0';
const soft = '#f8fafc';
const aqua = '#06b6d4';

const styles = StyleSheet.create({
  page: {
    paddingTop: 38,
    paddingRight: 42,
    paddingBottom: 54,
    paddingLeft: 42,
    fontFamily: 'Inter',
    backgroundColor: '#ffffff',
    color: ink,
    fontSize: 10,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 7,
    backgroundColor: aqua,
  },
  watermark: {
    position: 'absolute',
    right: 28,
    top: 300,
    fontSize: 68,
    fontWeight: 800,
    color: '#f1f5f9',
    transform: 'rotate(-24deg)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
    marginBottom: 28,
  },
  brand: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: 1.2,
  },
  agency: {
    marginTop: 5,
    fontSize: 9,
    color: muted,
  },
  titleWrap: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 34,
    fontWeight: 800,
  },
  badge: {
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#ecfeff',
    border: 1,
    borderColor: '#a5f3fc',
    color: '#0e7490',
    fontSize: 8,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  panel: {
    flex: 1,
    border: 1,
    borderColor: line,
    borderRadius: 12,
    padding: 14,
    backgroundColor: soft,
  },
  panelWhite: {
    flex: 1,
    border: 1,
    borderColor: line,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#ffffff',
  },
  label: {
    fontSize: 7.5,
    color: muted,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 10.5,
    fontWeight: 600,
    marginBottom: 8,
  },
  clientName: {
    fontSize: 15,
    fontWeight: 800,
    marginBottom: 4,
  },
  table: {
    marginTop: 8,
    border: 1,
    borderColor: line,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottom: 1,
    borderBottomColor: '#edf2f7',
    minHeight: 34,
  },
  description: { flex: 4.2, paddingRight: 10 },
  qty: { flex: 0.9, textAlign: 'center' },
  price: { flex: 1.4, textAlign: 'right' },
  amount: { flex: 1.5, textAlign: 'right', fontWeight: 800 },
  itemText: {
    fontSize: 9.5,
    lineHeight: 1.4,
  },
  totalsWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 18,
    marginTop: 22,
  },
  terms: {
    flex: 1,
    borderRadius: 12,
    border: 1,
    borderColor: '#cffafe',
    backgroundColor: '#ecfeff',
    padding: 14,
  },
  totals: {
    width: 210,
    borderRadius: 12,
    border: 1,
    borderColor: line,
    padding: 14,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalText: {
    fontSize: 10,
    color: muted,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 700,
  },
  grand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: 1,
    borderTopColor: line,
    paddingTop: 11,
    marginTop: 4,
  },
  grandText: {
    fontSize: 11,
    fontWeight: 800,
  },
  grandValue: {
    fontSize: 16,
    fontWeight: 800,
    color: '#0891b2',
  },
  notes: {
    marginTop: 16,
    borderTop: 1,
    borderTopColor: line,
    paddingTop: 12,
    color: muted,
    lineHeight: 1.55,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 42,
    right: 42,
    paddingTop: 10,
    borderTop: 1,
    borderTopColor: line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: muted,
    fontSize: 7.5,
  },
});

export default function InvoicePDF({ invoice }) {
  const money = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: invoice.currency || 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
  const lineItems = Array.isArray(invoice.line_items) ? invoice.line_items : [];
  const subtotal = Number(invoice.subtotal ?? lineItems.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.price || 0)), 0));
  const tax = Number(invoice.tax ?? subtotal * (Number(invoice.tax_rate || 0) / 100));
  const total = Number(invoice.total ?? invoice.amount ?? subtotal + tax);
  const issuedAt = invoice.created_at ? new Date(invoice.created_at) : new Date();
  const generatedAt = new Date();
  const status = invoice.status || 'pending';

  return (
    <Document title={`${invoice.invoice_number || 'Invoice'} - Zenvy Studio`}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.accent} fixed />
        <Text style={styles.watermark} fixed>ZENVY</Text>

        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>ZENVY STUDIO</Text>
            <Text style={styles.agency}>Creative systems, digital products, and launch assets</Text>
          </View>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>Invoice</Text>
            <Text style={styles.badge}>{status}</Text>
          </View>
        </View>

        <View style={styles.metaGrid} wrap={false}>
          <View style={styles.panelWhite}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={styles.clientName}>{invoice.client_name || 'Valued Client'}</Text>
            <Text style={{ color: muted }}>{invoice.client_email || 'No email provided'}</Text>
            <Text style={[styles.label, { marginTop: 14 }]}>Project</Text>
            <Text style={styles.value}>{invoice.title || 'Project billing'}</Text>
            {invoice.description && <Text style={{ color: muted, lineHeight: 1.45 }}>{invoice.description}</Text>}
          </View>
          <View style={styles.panel}>
            <Text style={styles.label}>Invoice Number</Text>
            <Text style={styles.value}>{invoice.invoice_number || 'Draft'}</Text>
            <Text style={styles.label}>Issue Date</Text>
            <Text style={styles.value}>{issuedAt.toLocaleDateString()}</Text>
            <Text style={styles.label}>Due Date</Text>
            <Text style={styles.value}>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Not set'}</Text>
            <Text style={styles.label}>Currency</Text>
            <Text style={styles.value}>{invoice.currency || 'INR'}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.tableHeaderText, styles.description]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.qty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.price]}>Rate</Text>
            <Text style={[styles.tableHeaderText, styles.amount]}>Amount</Text>
          </View>
          {lineItems.length ? lineItems.map((item, index) => (
            <View key={`${item.description}-${index}`} style={styles.row} wrap={false}>
              <Text style={[styles.itemText, styles.description]}>{item.description || 'Untitled service'}</Text>
              <Text style={[styles.itemText, styles.qty]}>{item.quantity || 0}</Text>
              <Text style={[styles.itemText, styles.price]}>{money(item.price)}</Text>
              <Text style={[styles.itemText, styles.amount]}>{money(Number(item.quantity || 0) * Number(item.price || 0))}</Text>
            </View>
          )) : (
            <View style={styles.row}>
              <Text style={[styles.itemText, styles.description]}>No line items added</Text>
              <Text style={[styles.itemText, styles.qty]}>0</Text>
              <Text style={[styles.itemText, styles.price]}>{money(0)}</Text>
              <Text style={[styles.itemText, styles.amount]}>{money(0)}</Text>
            </View>
          )}
        </View>

        <View style={styles.totalsWrap} wrap={false}>
          <View style={styles.terms}>
            <Text style={styles.label}>Payment Terms</Text>
            <Text style={{ lineHeight: 1.55, color: ink }}>{invoice.payment_terms || 'Payment due by the listed due date.'}</Text>
            {invoice.notes && (
              <View style={styles.notes}>
                <Text style={[styles.label, { marginBottom: 5 }]}>Notes</Text>
                <Text>{invoice.notes}</Text>
              </View>
            )}
          </View>
          <View style={styles.totals}>
            <View style={styles.totalLine}>
              <Text style={styles.totalText}>Subtotal</Text>
              <Text style={styles.totalValue}>{money(subtotal)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalText}>Tax ({Number(invoice.tax_rate || 0)}%)</Text>
              <Text style={styles.totalValue}>{money(tax)}</Text>
            </View>
            <View style={styles.grand}>
              <Text style={styles.grandText}>Total</Text>
              <Text style={styles.grandValue}>{money(total)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>Generated {generatedAt.toLocaleString()} | Invoice ID {invoice.id || invoice.invoice_number || 'draft'}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
