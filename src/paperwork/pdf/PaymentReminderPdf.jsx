import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as S } from "./pdfStyles";
import { moneyGBP } from "../utils/money";

export default function PaymentReminderPdf({ data }) {
  const { business, client, reminder } = data;

  return (
    <Document title={`Payment-Reminder-${reminder.invoiceNumber || "Draft"}.pdf`}>
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
            <Text style={S.docTitle}>PAYMENT REMINDER</Text>
            <View style={S.docMeta}>
              <Text><Text style={S.subtle}>Issued: </Text>{reminder.issuedDate || "—"}</Text>
            </View>
          </View>
        </View>

        <View style={[S.card, { marginBottom: 12 }]}>
          <Text style={S.sectionTitle}>To</Text>
          <Text>{client.name || "—"}</Text>
          {client.address ? <Text>{client.address}</Text> : null}
          {client.email ? <Text>{client.email}</Text> : null}
        </View>

        <View style={[S.card, { marginBottom: 12 }]}>
          <Text style={S.sectionTitle}>Invoice Details</Text>
          <Text><Text style={S.subtle}>Invoice No: </Text>{reminder.invoiceNumber || "—"}</Text>
          <Text><Text style={S.subtle}>Due Date: </Text>{reminder.dueDate || "—"}</Text>
          <Text><Text style={S.subtle}>Amount Due: </Text>{moneyGBP(reminder.amountDue || 0)}</Text>
        </View>

        <View style={S.card}>
          <Text style={S.sectionTitle}>Message</Text>
          <Text>{reminder.reminderText || "This is a friendly reminder that the invoice above is now due. Thank you."}</Text>

          {reminder.paymentDetails ? (
            <View style={{ marginTop: 10 }}>
              <Text style={S.sectionTitle}>Payment Details</Text>
              <Text>{reminder.paymentDetails}</Text>
            </View>
          ) : null}
        </View>

        <View style={S.footer}>
          <Text style={S.subtle}>
            If you’ve already paid, please disregard this reminder and accept our thanks.
          </Text>
        </View>
      </Page>
    </Document>
  );
}