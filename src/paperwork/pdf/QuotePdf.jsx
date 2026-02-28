import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as S } from "./pdfStyles";
import { moneyGBP, calcTotals } from "../utils/money";

export default function QuotePdf({ data }) {
  const {
    business,
    client,
    quote,
    items,
    notes,
    terms,
    vatRatePercent,
  } = data;

  const totals = calcTotals(items, vatRatePercent);

  return (
    <Document title={`Quote-${quote.number || "Draft"}.pdf`}>
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={[S.row, S.header]}>
          <View style={S.brandBlock}>
            <Text style={S.brandName}>{business.name || "Your Landscaping Business"}</Text>
            <Text style={S.subtle}>{business.tagline || "Landscaping & Outdoor Works"}</Text>
            <View style={{ marginTop: 8 }}>
              {business.address ? <Text>{business.address}</Text> : null}
              {business.phone ? <Text>Tel: {business.phone}</Text> : null}
              {business.email ? <Text>Email: {business.email}</Text> : null}
              {business.website ? <Text>Web: {business.website}</Text> : null}
            </View>
          </View>

          <View style={S.titleBlock}>
            <Text style={S.docTitle}>QUOTE / ESTIMATE</Text>
            <View style={S.docMeta}>
              <Text>
                <Text style={S.subtle}>Quote No: </Text>
                {quote.number || "—"}
              </Text>
              <Text>
                <Text style={S.subtle}>Date: </Text>
                {quote.date || "—"}
              </Text>
              <Text>
                <Text style={S.subtle}>Valid Until: </Text>
                {quote.validUntil || "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Client / Site */}
        <View style={[S.row, { gap: 12 }]}>
          <View style={[S.card, { flex: 1 }]}>
            <Text style={S.sectionTitle}>Prepared For</Text>
            <Text>{client.name || "—"}</Text>
            {client.address ? <Text>{client.address}</Text> : null}
            {client.email ? <Text>{client.email}</Text> : null}
            {client.phone ? <Text>{client.phone}</Text> : null}
          </View>

          <View style={[S.card, { flex: 1 }]}>
            <Text style={S.sectionTitle}>Site / Project</Text>
            <Text>{quote.projectTitle || "—"}</Text>
            {quote.siteAddress ? <Text>{quote.siteAddress}</Text> : null}
            {quote.reference ? (
              <Text>
                <Text style={S.subtle}>Reference: </Text>
                {quote.reference}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Items Table */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Scope & Pricing</Text>
          <View style={S.table}>
            <View style={S.thead}>
              <Text style={[S.th, S.wDesc]}>Description</Text>
              <Text style={[S.th, S.wQty, S.right]}>Qty</Text>
              <Text style={[S.th, S.wUnit, S.right]}>Unit</Text>
              <Text style={[S.th, S.wLine, S.right]}>Line Total</Text>
            </View>

            {items.map((it) => (
              <View key={it.id} style={S.tbodyRow}>
                <Text style={[S.td, S.wDesc]}>{it.description || "—"}</Text>
                <Text style={[S.td, S.wQty, S.right]}>{it.qty ?? 0}</Text>
                <Text style={[S.td, S.wUnit, S.right]}>{moneyGBP(it.unitPrice)}</Text>
                <Text style={[S.td, S.wLine, S.right]}>
                  {moneyGBP((Number(it.qty || 0) * Number(it.unitPrice || 0)))}
                </Text>
              </View>
            ))}
          </View>

          <View style={S.totals}>
            <View style={S.totalsBox}>
              <View style={S.totalsRow}>
                <Text style={S.subtle}>Subtotal</Text>
                <Text>{moneyGBP(totals.subtotal)}</Text>
              </View>
              <View style={S.totalsRow}>
                <Text style={S.subtle}>VAT ({vatRatePercent || 0}%)</Text>
                <Text>{moneyGBP(totals.vat)}</Text>
              </View>
              <View style={[S.totalsRow, { marginBottom: 0 }]}>
                <Text style={S.totalsStrong}>Total</Text>
                <Text style={S.totalsStrong}>{moneyGBP(totals.total)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notes / Terms */}
        <View style={[S.section, { gap: 10 }]}>
          <View style={S.card}>
            <Text style={S.sectionTitle}>Notes</Text>
            <Text>{notes || "—"}</Text>
          </View>

          <View style={S.card}>
            <Text style={S.sectionTitle}>Terms</Text>
            <Text>{terms || "—"}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={S.footer}>
          <Text style={S.subtle}>
            {business.footerNote ||
              "Thank you for your enquiry. If you’d like to proceed, confirm acceptance and we’ll schedule your start date."}
          </Text>
        </View>
      </Page>
    </Document>
  );
}