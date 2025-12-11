
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

        // --- COLORES ---
        const black = [0, 0, 0];
        const white = [255, 255, 255];
        const grayBg = [240, 240, 240];
        const headerBg = [0, 0, 0]; // Black header

        // --- ENCABEZADO SUPERIOR (NEGRO) ---
        // @ts-ignore
        doc.setFillColor(...headerBg);
        doc.rect(0, 0, 210, 35, 'F');

        // Logo Text (PROSESU)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.text("PROSESU", 14, 18);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("SMART LOGISTICS", 14, 24);

        // Slogan (Derecha)
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Toma decisiones de valor", 195, 14, { align: 'right' });

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("Lleva tu logística con eficiencia y eficacia", 195, 20, { align: 'right' });

        // Iconos simulados (Rectángulos con texto)
        // @ts-ignore
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(120, 26, 20, 6, 1, 1, 'F');
        doc.roundedRect(142, 26, 20, 6, 1, 1, 'F');
        doc.roundedRect(164, 26, 20, 6, 1, 1, 'F');
        doc.roundedRect(186, 26, 20, 6, 1, 1, 'F');

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(5);
        doc.text("30% Ahorro", 130, 30, { align: 'center' });
        doc.text("250 hrs", 152, 30, { align: 'center' });
        doc.text("30% Capacidad", 174, 30, { align: 'center' });
        doc.text("26° Temp", 196, 30, { align: 'center' });


        // --- BARRA DE INFO (GRIS) ---
        let yPos = 42;
        // @ts-ignore
        doc.setFillColor(...grayBg);
        doc.rect(14, yPos, 182, 8, 'F');

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Nº de Pro-forma", 60, yPos + 5.5, { align: 'center' });
        doc.text("Fecha:", 140, yPos + 5.5);
        doc.setFont("helvetica", "normal");
        doc.text(quote.date, 160, yPos + 5.5);

        // --- DATOS DEL CLIENTE ---
        yPos += 14;
        doc.setFontSize(9);

        // Columna Izquierda
        doc.setFont("helvetica", "bold");
        doc.text("Contacto:", 14, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(quote.contact, 40, yPos);

        yPos += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Empresa:", 14, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(quote.company, 40, yPos);

        yPos += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Telefono:", 14, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(quote.phone, 40, yPos);

        // Columna Derecha (alineada con la izquierda en Y)
        yPos -= 10;
        doc.setFont("helvetica", "bold");
        doc.text("RFC:", 110, yPos);
        // doc.text(quote.rfc || "", 130, yPos); // RFC no está en el objeto quote aún

        yPos += 5;
        doc.text("Correo:", 110, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(quote.email, 130, yPos);


        // --- TABLA DE PRODUCTOS ---
        yPos += 15;

        const tableColumn = ["Concepto", "Cant.", "Precio Unitario", "Precio total"];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tableRows: any[] = [];

        quote.items.forEach(item => {
            const rowData = [
                item.description, // Concepto
                item.quantity.toString(), // Cant.
                `$${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                `$${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: yPos,
            theme: 'plain', // Custom theme logic mostly
            headStyles: {
                fillColor: [0, 0, 0],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                textColor: [0, 0, 0],
                fontSize: 9
            },
            columnStyles: {
                0: { cellWidth: 80 }, // Concepto
                1: { cellWidth: 20, halign: 'center', fillColor: [240, 240, 240] }, // Cant (Gris)
                2: { cellWidth: 40, halign: 'center' }, // Precio U
                3: { cellWidth: 40, halign: 'center' }  // Precio Total
            },
            styles: {
                cellPadding: 3,
                lineColor: [200, 200, 200],
                lineWidth: 0.1
            },
            // Draw vertical lines manually if needed or rely on grid theme, but 'plain' with borders is better for custom look
            // Let's use 'grid' but override styles
            // theme: 'grid' might be better to get borders
        });

        // @ts-ignore
        const finalY = doc.lastAutoTable.finalY || yPos + 40;

        // --- FOOTER TOTALES ---
        let footerY = finalY + 5;

        // Nota a la izquierda
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text("Nota: La renta mensual por unidad tiene un costo de $650 + IVA", 14, footerY + 5);
        if (quote.notes) {
            doc.text(`Notas adicionales: ${quote.notes}`, 14, footerY + 10);
        }

        // Totales a la derecha
        const rightColX = 130;
        const valColX = 170;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        // Total Parcial
        doc.setFont("helvetica", "bold");
        doc.text("Total parcial", rightColX, footerY + 5);
        doc.text(`${quote.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valColX, footerY + 5, { align: 'right' });

        // Descuento (Fondo gris)
        footerY += 8;
        // @ts-ignore
        doc.setFillColor(...grayBg);
        doc.rect(rightColX, footerY - 4, 60, 6, 'F');
        doc.text("Descuento (%)", rightColX + 2, footerY);

        // Impuestos 8%
        footerY += 8;
        doc.text("Impuestos 8% (IVA)", rightColX, footerY);
        doc.setFont("helvetica", "normal");
        doc.text(`${quote.iva.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valColX, footerY, { align: 'right' });

        // Ret ISR
        footerY += 6;
        doc.setFont("helvetica", "bold");
        doc.text("Ret. ISR 1.25", rightColX, footerY);
        doc.setFont("helvetica", "normal");
        const retIsr = quote.retIsr || 0;
        doc.text(`${retIsr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valColX, footerY, { align: 'right' });

        // Pagado (Total) - Fondo Rojo Claro
        footerY += 6;
        // @ts-ignore
        doc.setFillColor(255, 180, 180); // Light red
        doc.rect(rightColX, footerY - 4, 60, 8, 'F');

        doc.setFont("helvetica", "bold");
        doc.text("Pagado", rightColX + 5, footerY + 1);
        doc.setFontSize(12);
        doc.text(`${quote.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, valColX, footerY + 1, { align: 'right' });


        // --- DATOS BANCARIOS Y VENDEDOR (Bottom) ---
        const pageHeight = doc.internal.pageSize.height;
        const bottomY = pageHeight - 40;

        // Cuadro Vendedor
        doc.setDrawColor(0, 0, 0);
        doc.rect(14, bottomY, 70, 25);

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Vendedor", 16, bottomY + 5);
        doc.setFont("helvetica", "italic");
        doc.text(`Nombre: ${quote.agent}`, 16, bottomY + 10);
        doc.text(`Correo: marredondo@prosesu.com`, 16, bottomY + 15); // Hardcoded from image
        doc.text(`Numero: 664 276 5157`, 16, bottomY + 20); // Hardcoded from image

        // Cuadro Datos Bancarios
        doc.rect(84, bottomY, 112, 25);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("Datos Bancarios", 86, bottomY + 5);
        doc.setFont("helvetica", "italic");
        doc.text("Cuenta CLABE: 002027902213663782", 86, bottomY + 10);
        doc.text("Banco: Citibanamex", 86, bottomY + 15);
        doc.text("Cuenta: 1366378", 86, bottomY + 20);
        doc.text("Sucursal: 9022", 86, bottomY + 25);

        // Guardar
        const safeName = quote.folio ? quote.folio.replace(/[^a-z0-9]/gi, '_') : 'cotizacion';
        doc.save(`Cotizacion_${safeName}.pdf`);
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
        // Final safety check
        if (!timeStr || timeStr.toString().includes("Invalid") || timeStr === "Invalid Date") {
            timeStr = "--:--";
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

export const generateDateRangeReportPDF = (history: HistoryItem[], startDate: string, endDate: string) => {
    const doc = new jsPDF();
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    // Adjust end date to include the full day (23:59:59)
    const endObjInclusive = new Date(endDate);
    endObjInclusive.setHours(23, 59, 59, 999);

    // Normalize start to 00:00
    startObj.setHours(0, 0, 0, 0);

    const filteredItems = history.filter(item => {
        let itemDate: Date;
        if (item.isoDate) {
            itemDate = new Date(item.isoDate);
        } else if (item.timestamp) {
            // Fallback for string timestamp if possible, but mainly relying on isoDate for accuracy
            const d = new Date(item.timestamp);
            if (!isNaN(d.getTime())) itemDate = d;
            else return false;
        } else {
            return false;
        }
        return itemDate >= startObj && itemDate <= endObjInclusive;
    });

    if (filteredItems.length === 0) {
        alert("No hay actividad registrada en este rango de fechas.");
        return;
    }

    // --- HEADER ---
    doc.setFillColor(3, 7, 17); // Obsidian background
    doc.rect(0, 0, 210, 40, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Actividad", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Del ${startDate} al ${endDate}`, 105, 30, { align: "center" });

    // --- TABLE ---
    const tableBody = filteredItems.map(item => {
        let timeStr = item.timestamp;
        if (item.isoDate) {
            try {
                timeStr = new Date(item.isoDate).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            } catch (e) {
                console.error("Error parsing isoDate:", e);
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
        head: [['Fecha/Hora', 'Cliente', 'Agente', 'Actividad']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' }, // Slate 900
        bodyStyles: { textColor: [0, 0, 0] },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 40 },
            2: { cellWidth: 30 },
            3: { cellWidth: 'auto' }
        }
    });

    doc.save(`Reporte_Actividad_${startDate}_${endDate}.pdf`);
};
