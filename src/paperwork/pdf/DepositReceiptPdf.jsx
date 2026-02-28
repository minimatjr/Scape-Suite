import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as S } from "./pdfStyles";
import { moneyGBP } from "../utils/money";

export default function DepositReceiptPdf({ data }) {
  const { business, client, receipt } = data;

  return (
    <Document title={`Receipt-${receipt.number || "Draft"}.pdf`}>
      <Page size="A4" style={S.page}>
        <View style={[S.row, S.header]}>
          <View style={S.brandBlock}>
            <Text style={S.brandName}>{business.name || "Your Landscaping Business"}</Text>
            <Text style={S.subtle}>{business.tagline || "Landscaping & Outdoor Works"}</Text>
            <View style={{ marginTop: 8 }}>
              {business.address ? <Text>{business.address}</Text> : null}
              {business.phone ? <Text>Tel: {business.phone}</Text> : null}
              {business.email ? <Text>Email: {business.email}</Text> : null}
            </View>
          </View>

          <View style={S.titleBlock}>
            <Text style={S.docTitle}>DEPOSIT RECEIPT</Text>
            <View style={S.docMeta}>
              <Text><Text style={S.subtle}>Receipt No: </Text>{receipt.number || "—"}</Text>
              <Text><Text style={S.subtle}>Date: </Text>{receipt.date || "—"}</Text>
              {receipt.reference ? (
                <Text><Text style={S.subtle}>Reference: </Text>{receipt.reference}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={[S.row, { gap: 12 }]}>
          <View style={[S.card, { flex: 1 }]}>
            <Text style={S.sectionTitle}>Received From</Text>
            <Text>{client.name || "—"}</Text>
            {client.address ? <Text>{client.address}</Text> : null}
            {client.email ? <Text>{client.email}</Text> : null}
          </View>

          <View style={[S.card, { flex: 1 }]}>
            <Text style={S.sectionTitle}>Payment</Text>
            <Text><Text style={S.subtle}>Amount: </Text>{moneyGBP(receipt.amount || 0)}</Text>
            <Text><Text style={S.subtle}>Method: </Text>{receipt.method || "—"}</Text>
            {receipt.forDocument ? (
              <Text><Text style={S.subtle}>For: </Text>{receipt.forDocument}</Text>
            ) : null}
          </View>
        </View>

        <View style={[S.section, S.card]}>
          <Text style={S.sectionTitle}>Project / Notes</Text>
          <Text>{receipt.notes || "Deposit received. Thank you."}</Text>
        </View>

        <View style={S.footer}>
          <Text style={S.subtle}>
            {business.footerNote || "Please keep this receipt for your records."}
          </Text>
        </View>
      </Page>
    </Document>
  );
}