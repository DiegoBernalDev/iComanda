import { Platform } from 'react-native';

type ReceiptOrder = {
  id: string;
  tableNumber: number | null;
  metodo_pago: 'efectivo' | 'qr' | 'tarjeta' | null;
  total: number;
  created_at: string;
};

type ReceiptItem = {
  nombre: string;
  precio_unitario: number;
  cantidad: number;
};

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  qr: 'QR',
  tarjeta: 'Tarjeta',
};

const formatMoney = (value: number) => `Bs ${value.toFixed(2)}`;

export function exportInternalReceiptWeb(restaurantName: string, order: ReceiptOrder, items: ReceiptItem[]) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    throw new Error('La impresión del comprobante está disponible por ahora solo en web.');
  }

  const rows = items.map((item) => `
    <tr>
      <td>${item.nombre}</td>
      <td>${item.cantidad}</td>
      <td>${formatMoney(item.precio_unitario)}</td>
      <td>${formatMoney(item.precio_unitario * item.cantidad)}</td>
    </tr>
  `).join('');

  const html = `
    <html>
      <head>
        <title>Comprobante iComanda</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; padding: 28px; max-width: 760px; margin: 0 auto; }
          h1, h2, p { margin: 0; }
          .header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 18px; }
          .badge { border: 1px solid #111827; border-radius: 10px; padding: 10px 14px; text-align: center; font-weight: 700; }
          .muted { color: #6b7280; font-size: 13px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 18px 0; }
          .box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th, td { border-bottom: 1px solid #e5e7eb; text-align: left; padding: 9px 6px; }
          th { color: #6b7280; font-size: 12px; text-transform: uppercase; }
          .total { text-align: right; font-size: 24px; font-weight: 800; margin-top: 18px; }
          .footer { margin-top: 24px; padding-top: 12px; border-top: 1px dashed #9ca3af; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>${restaurantName || 'iComanda'}</h1>
            <p class="muted">Comprobante interno de consumo</p>
          </div>
          <div class="badge">NO FISCAL<br/>SIMULACION</div>
        </div>
        <div class="grid">
          <div class="box"><div class="muted">Comprobante</div><strong>${order.id.slice(0, 8).toUpperCase()}</strong></div>
          <div class="box"><div class="muted">Fecha</div><strong>${new Date(order.created_at).toLocaleString('es-BO')}</strong></div>
          <div class="box"><div class="muted">Mesa</div><strong>${order.tableNumber ?? '-'}</strong></div>
          <div class="box"><div class="muted">Pago</div><strong>${order.metodo_pago ? PAYMENT_LABELS[order.metodo_pago] : 'Sin metodo'}</strong></div>
        </div>
        <h2>Detalle</h2>
        <table>
          <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="total">Total: ${formatMoney(order.total)}</div>
        <div class="footer">Este documento simula una factura para fines academicos. No tiene validez tributaria.</div>
      </body>
    </html>
  `;

  const popup = window.open('', '_blank', 'noopener,noreferrer,width=900,height=760');
  if (!popup) throw new Error('No se pudo abrir la ventana de impresión.');
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
}
