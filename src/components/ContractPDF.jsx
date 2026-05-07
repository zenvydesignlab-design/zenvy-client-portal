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
const aqua = '#06b6d4';
const violet = '#8b5cf6';

const styles = StyleSheet.create({
  page: {
    paddingTop: 38,
    paddingRight: 42,
    paddingBottom: 56,
    paddingLeft: 42,
    fontFamily: 'Inter',
    backgroundColor: '#ffffff',
    color: ink,
    fontSize: 10,
  },
  edge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 7,
    backgroundColor: ink,
  },
  watermark: {
    position: 'absolute',
    right: 24,
    top: 330,
    fontSize: 58,
    fontWeight: 800,
    color: '#f8fafc',
    transform: 'rotate(-24deg)',
  },
  topLine: {
    height: 4,
    borderRadius: 999,
    backgroundColor: aqua,
    marginBottom: 22,
  },
  header: {
    marginBottom: 22,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
  },
  brand: {
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: 1.2,
  },
  subtitle: {
    marginTop: 5,
    color: muted,
    fontSize: 9,
  },
  title: {
    marginTop: 18,
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.08,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f5f3ff',
    border: 1,
    borderColor: '#ddd6fe',
    color: '#6d28d9',
    fontSize: 8,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  signedBadge: {
    alignSelf: 'flex-start',
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
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
    marginBottom: 20,
  },
  infoCard: {
    width: '31.7%',
    minHeight: 58,
    borderRadius: 12,
    border: 1,
    borderColor: line,
    padding: 10,
    backgroundColor: '#f8fafc',
  },
  label: {
    fontSize: 7.5,
    color: muted,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  value: {
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  section: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: 1,
    borderBottomColor: '#edf2f7',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 800,
    marginBottom: 8,
  },
  text: {
    fontSize: 9.6,
    lineHeight: 1.62,
    color: '#334155',
  },
  deliverableGrid: {
    gap: 7,
  },
  deliverableCard: {
    borderRadius: 10,
    border: 1,
    borderColor: line,
    padding: 10,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    gap: 9,
  },
  check: {
    width: 15,
    height: 15,
    borderRadius: 4,
    backgroundColor: '#ecfeff',
    color: '#0e7490',
    textAlign: 'center',
    fontSize: 9,
    fontWeight: 800,
    paddingTop: 2,
  },
  paymentCard: {
    borderRadius: 14,
    border: 1,
    borderColor: '#a5f3fc',
    backgroundColor: '#ecfeff',
    padding: 14,
    marginBottom: 14,
  },
  timeline: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: violet,
    marginTop: 2,
  },
  signatureCard: {
    marginTop: 18,
    borderRadius: 14,
    border: 1,
    borderColor: '#a5f3fc',
    backgroundColor: '#f0fdfa',
    padding: 14,
  },
  signatureTitle: {
    fontSize: 12,
    fontWeight: 800,
    color: '#0f766e',
    marginBottom: 8,
  },
  auditGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  auditItem: {
    width: '48%',
    borderTop: 1,
    borderTopColor: '#ccfbf1',
    paddingTop: 7,
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

function formatDate(value) {
  if (!value) return 'Not recorded';
  return new Date(value).toLocaleString();
}

export default function ContractPDF({ contract, project }) {
  const projectScope = contract.project_scope || contract.scope || 'No scope defined.';
  const timeline = contract.timeline || contract.timelines || 'To be determined.';
  const revisions = contract.revisions || contract.revision_limits || 'Two revision rounds are included unless otherwise agreed in writing.';
  const ownership = contract.ownership_clause || contract.ownership_terms || 'Final approved deliverables transfer after full payment is received.';
  const cancellation = contract.cancellation_clause || contract.cancellation_terms || 'Either party may cancel with written notice. Completed work remains billable.';
  const deliverables = Array.isArray(contract.deliverables) ? contract.deliverables.filter(Boolean) : [];
  const generatedAt = new Date();
  const statusLabel = contract.signed ? 'Digital Signature Verified' : contract.status || 'draft';

  return (
    <Document title={`${contract.title || 'Project Agreement'} - Zenvy Studio`}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.edge} fixed />
        <Text style={styles.watermark} fixed>AGREEMENT</Text>
        <View style={styles.topLine} fixed />

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.brand}>ZENVY STUDIO</Text>
              <Text style={styles.subtitle}>Premium creative systems agreement</Text>
            </View>
            <Text style={contract.signed ? styles.signedBadge : styles.badge}>{statusLabel}</Text>
          </View>
          <Text style={styles.title}>{contract.title || 'Project Agreement'}</Text>
        </View>

        <View style={styles.infoGrid} wrap={false}>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Client</Text>
            <Text style={styles.value}>{contract.client_name || 'Valued Client'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{contract.client_email || 'No email provided'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Project</Text>
            <Text style={styles.value}>{project?.name || contract.project_name || 'Project workspace'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Agreement ID</Text>
            <Text style={styles.value}>{contract.id || 'Draft'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Prepared By</Text>
            <Text style={styles.value}>Zenvy Studio</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Issue Date</Text>
            <Text style={styles.value}>{contract.created_at ? new Date(contract.created_at).toLocaleDateString() : generatedAt.toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Project Scope</Text>
          <Text style={styles.text}>{projectScope}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Deliverables</Text>
          <View style={styles.deliverableGrid}>
            {deliverables.length ? deliverables.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.deliverableCard} wrap={false}>
                <Text style={styles.check}>{index + 1}</Text>
                <View>
                  <Text style={[styles.label, { marginBottom: 3 }]}>Milestone {index + 1}</Text>
                  <Text style={styles.text}>{item}</Text>
                </View>
              </View>
            )) : (
              <Text style={styles.text}>No specific deliverables listed.</Text>
            )}
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>3. Timeline</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineDot} />
            <Text style={[styles.text, { flex: 1 }]}>{timeline}</Text>
          </View>
        </View>

        <View style={styles.paymentCard} wrap={false}>
          <Text style={styles.label}>4. Payment Terms</Text>
          <Text style={[styles.text, { color: ink }]}>{contract.payment_terms || 'Standard billing applies.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Revisions</Text>
          <Text style={styles.text}>{revisions}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Ownership</Text>
          <Text style={styles.text}>{ownership}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Cancellation</Text>
          <Text style={styles.text}>{cancellation}</Text>
        </View>

        <View style={styles.signatureCard} wrap={false}>
          <Text style={styles.signatureTitle}>
            {contract.signed ? 'Digital Signature Verified' : 'Digital Signature Pending'}
          </Text>
          <Text style={styles.text}>
            {contract.signed
              ? 'Electronically signed via Zenvy Studio. This agreement was accepted through the online client portal.'
              : 'This agreement has not yet been electronically signed in the client portal.'}
          </Text>
          <View style={styles.auditGrid}>
            <View style={styles.auditItem}>
              <Text style={styles.label}>Signed By</Text>
              <Text style={styles.value}>{contract.signed_by || contract.client_name || 'Pending'}</Text>
            </View>
            <View style={styles.auditItem}>
              <Text style={styles.label}>Signed Email</Text>
              <Text style={styles.value}>{contract.signed_email || contract.client_email || 'Pending'}</Text>
            </View>
            <View style={styles.auditItem}>
              <Text style={styles.label}>Signed Timestamp</Text>
              <Text style={styles.value}>{formatDate(contract.signed_at)}</Text>
            </View>
            <View style={styles.auditItem}>
              <Text style={styles.label}>Agreement Version</Text>
              <Text style={styles.value}>{contract.agreement_version || 'v1.0'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>Generated {generatedAt.toLocaleString()} | Agreement ID {contract.id || 'draft'}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
