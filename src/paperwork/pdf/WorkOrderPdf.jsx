import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as S } from "./pdfStyles";

export default function WorkOrderPdf({ data }) {
  const { business, client, workOrder, schedule, crew, materials, checklist, notes } = data;

  const checkRow = (label, checked) => (
    <View style={[S.row, { justifyContent: "space-between", marginBottom: 6 }]} key={label}>
      <Text>{label}</Text>
      <Text>{checked ? "☑" : "☐"}</Text>
    </View>
  );

  return (
    <Document title={`WorkOrder-${workOrder.number || "Draft"}.pdf`}>
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
            <Text style={S.docTitle}>WORK ORDER / JOB SHEET</Text>
            <View style={S.docMeta}>
              <Text><Text style={S.subtle}>WO No: </Text>{workOrder.number || "—"}</Text>
              <Text><Text style={S.subtle}>Date: </Text>{workOrder.date || "—"}</Text>
              {workOrder.reference ? (
                <Text><Text style={S.subtle}>Reference: </Text>{workOrder.reference}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={[S.row, { gap: 12 }]}>
          <View style={[S.card, { flex: 1 }]}>
            <Text style={S.sectionTitle}>Client</Text>
            <Text>{client.name || "—"}</Text>
            {client.address ? <Text>{client.address}</Text> : null}
            {client.phone ? <Text>{client.phone}</Text> : null}
            {client.email ? <Text>{client.email}</Text> : null}
          </View>

          <View style={[S.card, { flex: 1 }]}>
            <Text style={S.sectionTitle}>Site & Schedule</Text>
            <Text>{workOrder.projectTitle || "—"}</Text>
            {workOrder.siteAddress ? <Text>{workOrder.siteAddress}</Text> : null}
            <View style={{ marginTop: 6 }}>
              <Text><Text style={S.subtle}>Start: </Text>{schedule.startDate || "—"} {schedule.startTime || ""}</Text>
              <Text><Text style={S.subtle}>End: </Text>{schedule.endDate || "—"} {schedule.endTime || ""}</Text>
              {schedule.arrivalWindow ? (
                <Text><Text style={S.subtle}>Arrival Window: </Text>{schedule.arrivalWindow}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={[S.section, { gap: 10 }]}>
          <View style={S.card}>
            <Text style={S.sectionTitle}>Crew</Text>
            <Text>{crew || "—"}</Text>
          </View>

          <View style={S.card}>
            <Text style={S.sectionTitle}>Materials / Equipment</Text>
            <Text>{materials || "—"}</Text>
          </View>

          <View style={S.card}>
            <Text style={S.sectionTitle}>Site Checklist</Text>
            {checkRow("Access confirmed / keys arranged", checklist.access)}
            {checkRow("Utilities checked (water/electric)", checklist.utilities)}
            {checkRow("Waste disposal planned", checklist.waste)}
            {checkRow("Client notified of noise/dust", checklist.notice)}
            {checkRow("Before photos taken", checklist.photosBefore)}
            {checkRow("After photos taken", checklist.photosAfter)}
          </View>

          <View style={S.card}>
            <Text style={S.sectionTitle}>Notes / Method</Text>
            <Text>{notes || "—"}</Text>
          </View>
        </View>

        <View style={[S.section, S.card]}>
          <Text style={S.sectionTitle}>Sign-off</Text>
          <Text style={S.subtle}>Client confirms works completed as described (or snags recorded).</Text>
          <View style={[S.row, { gap: 16, marginTop: 10 }]}>
            <View style={{ flex: 1 }}>
              <Text style={S.subtle}>Client Name / Signature</Text>
              <View style={{ marginTop: 10, height: 28, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }} />
            </View>
            <View style={{ width: 160 }}>
              <Text style={S.subtle}>Date</Text>
              <View style={{ marginTop: 10, height: 28, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }} />
            </View>
          </View>
        </View>

        <View style={S.footer}>
          <Text style={S.subtle}>{business.footerNote || "Job sheet generated for on-site use and client sign-off."}</Text>
        </View>
      </Page>
    </Document>
  );
}