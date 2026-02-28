import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as S } from "./pdfStyles";

export default function SchedulePdf({ data }) {
  const { business, client, schedule, project, notes } = data;

  return (
    <Document title={`Schedule-${schedule.reference || "Draft"}.pdf`}>
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
            <Text style={S.docTitle}>APPOINTMENT CONFIRMATION</Text>
            <View style={S.docMeta}>
              <Text><Text style={S.subtle}>Reference: </Text>{schedule.reference || "—"}</Text>
              <Text><Text style={S.subtle}>Issued: </Text>{schedule.issuedDate || "—"}</Text>
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
            <Text style={S.sectionTitle}>Appointment</Text>
            <Text><Text style={S.subtle}>Date: </Text>{schedule.date || "—"}</Text>
            <Text><Text style={S.subtle}>Arrival Window: </Text>{schedule.arrivalWindow || "—"}</Text>
            <Text><Text style={S.subtle}>Expected Duration: </Text>{schedule.duration || "—"}</Text>
            {schedule.contactOnDay ? (
              <Text><Text style={S.subtle}>On-day Contact: </Text>{schedule.contactOnDay}</Text>
            ) : null}
          </View>
        </View>

        <View style={[S.section, { gap: 10 }]}>
          <View style={S.card}>
            <Text style={S.sectionTitle}>Project / Site</Text>
            <Text>{project.title || "—"}</Text>
            {project.siteAddress ? <Text>{project.siteAddress}</Text> : null}
            {project.accessNotes ? (
              <Text style={{ marginTop: 6 }}>
                <Text style={S.subtle}>Access Notes: </Text>{project.accessNotes}
              </Text>
            ) : null}
          </View>

          <View style={S.card}>
            <Text style={S.sectionTitle}>Notes</Text>
            <Text>{notes || "—"}</Text>
          </View>

          <View style={S.card}>
            <Text style={S.sectionTitle}>Rescheduling</Text>
            <Text>
              If you need to reschedule, please let us know as soon as possible. Weather-dependent works
              may be rearranged for safety and finish quality.
            </Text>
          </View>
        </View>

        <View style={S.footer}>
          <Text style={S.subtle}>{business.footerNote || "We look forward to working with you."}</Text>
        </View>
      </Page>
    </Document>
  );
}