
import { Lead, HistoryItem, Quote } from "../types";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDF = (lead: Lead, history: HistoryItem[]) => {
    const doc = new jsPDF();

    // --- CONFIGURACIÓN DE COLORES ---
    const primaryColor = [41, 128, 185]; // Azul
    const secondaryColor = [52, 73, 94]; // Gris Oscuro

    // --- ENCABEZADO ---
    // @ts-ignore
    doc.setFillColor(...secondaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Cliente", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 30);

    doc.setFontSize(12);
    doc.text("ERP Vision", 160, 20);

    // --- DATOS DEL CLIENTE ---
    let yPos = 55;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(String(lead.name || "Cliente"), 14, yPos);

    // Etiqueta de clase
    const badgeColor = lead.clase === 'A' ? [46, 204, 113] : lead.clase === 'B' ? [52, 152, 219] : [149, 165, 166];
    // @ts-ignore
    doc.setFillColor(...badgeColor);

    doc.roundedRect(160, yPos - 6, 30, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`Clase ${lead.clase || 'C'}`, 165, yPos);

    yPos += 10;

    // Detalles en Grid
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");

    doc.text("Dirección:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(String(lead.address || "N/A"), 40, yPos);

    yPos += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Teléfono:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(String(lead.phone || "N/A"), 40, yPos);

    yPos += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Web:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(String(lead.website || "N/A"), 40, yPos);

    yPos += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Asesor:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(String(lead.agent || "No asignado"), 40, yPos);

    // --- TABLA DE HISTORIAL ---
    yPos += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Historial de Seguimiento", 14, yPos);

    yPos += 5;

    const tableColumn = ["Fecha", "Tipo", "Asesor", "Detalle"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tableRows: any[] = [];

    history.forEach(item => {
        const rowData = [
            String(item.timestamp || ""),
            String(item.title || ""),
            String(item.user.name || ""),
            String(item.description || "")
        ];
        tableRows.push(rowData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        theme: 'grid',
        headStyles: { fillColor: primaryColor as [number, number, number], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 30 }, // Fecha
            1: { cellWidth: 25 }, // Tipo
            2: { cellWidth: 25 }, // Asesor
            3: { cellWidth: 'auto' } // Detalle
        },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    const safeName = lead.name ? lead.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'reporte';
    const fileName = `Reporte_${safeName}.pdf`;
    doc.save(fileName);
};

export const generateQuotePDF = (quote: Quote) => {
    console.log("Generando PDF para:", quote);
    try {
        const doc = new jsPDF();
        console.log("Documento jsPDF creado");


        // Colores corporativos
        const headerBg = [15, 23, 42]; // Slate 900
        // const accentColor = [59, 130, 246]; // Blue 500

        // --- ENCABEZADO ---
        // Fondo oscuro superior
        // @ts-ignore
        doc.setFillColor(...headerBg);
        doc.rect(0, 0, 210, 45, 'F');

        // Título / Logo
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("ERP Vision", 14, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Soluciones Tecnológicas Integrales", 14, 26);
        doc.text("www.erpvision.com", 14, 31);

        // Datos de Cotización (Derecha)
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("COTIZACIÓN", 195, 20, { align: 'right' });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Folio: ${quote.folio}`, 195, 28, { align: 'right' });
        doc.text(`Fecha: ${quote.date}`, 195, 34, { align: 'right' });

        // --- INFORMACIÓN DEL CLIENTE ---
        let yPos = 60;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Datos del Cliente:", 14, yPos);

        yPos += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Empresa: ${quote.company}`, 14, yPos);
        doc.text(`Contacto: ${quote.contact}`, 110, yPos);

        yPos += 6;
        doc.text(`Teléfono: ${quote.phone}`, 14, yPos);
        doc.text(`Correo: ${quote.email}`, 110, yPos);

        // --- TABLA DE PRODUCTOS ---
        yPos += 15;

        const tableColumn = ["Cant", "Descripción", "P. Unitario", "Importe"];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tableRows: any[] = [];

        quote.items.forEach(item => {
            const rowData = [
                item.quantity.toString(),
                item.description,
                `$${item.unitPrice.toFixed(2)}`,
                `$${item.amount.toFixed(2)}`
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: yPos,
            theme: 'striped',
            headStyles: { fillColor: headerBg as [number, number, number], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { textColor: [0, 0, 0] }, // Texto negro explícito en filas
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 20, halign: 'center' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 30, halign: 'right' },
                3: { cellWidth: 30, halign: 'right' }
            },
            foot: [
                ['', '', 'Subtotal:', `$${quote.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
                ['', '', 'IVA (16%):', `$${quote.iva.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
                ['', '', 'TOTAL:', `$${quote.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]
            ],
            footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'right' }
        });

        // Obtener posición final de la tabla
        // @ts-ignore
        const finalY = doc.lastAutoTable.finalY || yPos + 40;

        // --- NOTAS ---
        if (quote.notes) {
            let noteY = finalY + 10;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0); // Texto negro para título notas
            doc.text("Notas:", 14, noteY);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0); // Texto negro para contenido notas
            const splitNotes = doc.splitTextToSize(quote.notes, 180);
            doc.text(splitNotes, 14, noteY + 6);
        }

        // --- PIE DE PÁGINA ---
        const pageHeight = doc.internal.pageSize.height;

        // @ts-ignore
        doc.setFillColor(...headerBg);
        doc.rect(0, pageHeight - 20, 210, 20, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text("ERP Vision - Software de Gestión Empresarial", 105, pageHeight - 12, { align: 'center' });
        doc.text("Calle Tecnológica 123, Ciudad de México | Tel: 55-1234-5678", 105, pageHeight - 8, { align: 'center' });

        // Guardar
        console.log("PDF guardado exitosamente");
    } catch (error) {
        console.error("Error CRÍTICO en generateQuotePDF:", error);
        throw error;
    }
};

export const generateDailyReportPDF = (history: HistoryItem[]) => {
    const doc = new jsPDF();
    const today = new Date();
    const dateStr = today.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const todayStr = today.toISOString().split('T')[0];

    // Filter for today's items
    // Use local date comparison to match what the user sees
    const dailyItems = history.filter(item => {
        let itemDate: Date;

        if (item.isoDate) {
            itemDate = new Date(item.isoDate);
        } else if (item.timestamp) {
            // Try to parse the formatted string "Dec 7, 12:01 AM" if possible, or just fail gracefully
            // Since parsing that format is unreliable across locales, we rely on isoDate.
            // However, if we just added isoDate, old items might not have it in memory until refresh.
            // But the user will refresh.
            // Let's try to be smart: if no isoDate, skip it or try to assume it's today if it says "Today" (not applicable here).
            return false;
        } else {
            return false;
        }

        // Compare local dates
        return itemDate.getDate() === today.getDate() &&
            itemDate.getMonth() === today.getMonth() &&
            itemDate.getFullYear() === today.getFullYear();
    });

    if (dailyItems.length === 0) {
        alert("No hay actividad registrada para el día de hoy.");
        return;
    }

    // --- HEADER ---
    doc.setFillColor(20, 20, 20); // Dark background
    doc.rect(0, 0, 210, 40, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte Diario de Actividad", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(dateStr, 105, 30, { align: "center" });

    // --- TABLE ---
    const tableBody = dailyItems.map(item => {
        let timeStr = item.timestamp;

        // Try to get a clean time string from isoDate first
        if (item.isoDate) {
            try {
                timeStr = new Date(item.isoDate).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
                console.error("Error parsing isoDate:", e);
            }
        } else {
            // Fallback: try to parse the timestamp string
            const d = new Date(item.timestamp);
            if (!isNaN(d.getTime())) {
                timeStr = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
            }
        }

        return [
            timeStr,
            item.clientName || 'Sin Cliente',
            item.user?.name || 'Sistema',
            item.description
        ];
    });

    autoTable(doc, {
        startY: 50,
        head: [['Hora', 'Cliente', 'Agente', 'Actividad']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [20, 20, 20], textColor: 255, fontStyle: 'bold' },
        bodyStyles: { textColor: [0, 0, 0] },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 25 }, // Hora
            1: { cellWidth: 40 }, // Cliente
            2: { cellWidth: 30 }, // Agente
            3: { cellWidth: 'auto' } // Actividad
        }
    });

    doc.save(`Reporte_Diario_${todayStr}.pdf`);
};
