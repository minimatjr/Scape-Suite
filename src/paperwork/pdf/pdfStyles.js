import { StyleSheet } from "@react-pdf/renderer";

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111",
    lineHeight: 1.35,
  },

  row: { flexDirection: "row", alignItems: "flex-start" },
  col: { flexDirection: "column" },

  header: {
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  brandBlock: { flex: 1 },
  titleBlock: { width: 220, alignItems: "flex-end" },

  brandName: { fontSize: 16, fontWeight: 700 },
  subtle: { color: "#6B7280" },

  docTitle: { fontSize: 18, fontWeight: 700 },
  docMeta: { marginTop: 6 },

  section: { marginTop: 14 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6 },

  kv: { marginBottom: 4 },
  kvLabel: { width: 90, color: "#6B7280" },

  card: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
  },

  table: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
  },
  thead: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  th: { fontSize: 9, fontWeight: 700, color: "#374151" },

  tbodyRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  td: { fontSize: 10 },
  right: { textAlign: "right" },

  wDesc: { flex: 1.2 },
  wQty: { width: 40 },
  wUnit: { width: 70 },
  wLine: { width: 80 },

  totals: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  totalsBox: {
    width: 240,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
  },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  totalsStrong: { fontSize: 11, fontWeight: 700 },

  footer: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
});