import { Platform } from 'react-native';

type FinancialReport = {
  date_from: string;
  date_to: string;
  gross_income: number;
  total_expenses: number;
  net_income: number;
};

type WaiterSalesRow = {
  waiter_name: string;
  orders_count: number;
  total_sales: number;
};

export type PaymentMethodSalesRow = {
  method: 'efectivo' | 'qr' | 'tarjeta' | 'sin_metodo';
  label: string;
  orders_count: number;
  total_sales: number;
};

const formatMoney = (value: number) => `Bs ${value.toFixed(2)}`;

export function exportReportAsPdfWeb(
  report: FinancialReport,
  waiterSales: WaiterSalesRow[],
  paymentMethodSales: PaymentMethodSalesRow[] = [],
) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    throw new Error('La exportación PDF está disponible por ahora solo en web.');
  }

  const rows = waiterSales.length
    ? waiterSales.map((row) => `
      <tr>
        <td>${row.waiter_name}</td>
        <td>${row.orders_count}</td>
        <td>${formatMoney(row.total_sales)}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="3">No hay ventas pagadas en este periodo.</td></tr>';

  const paymentRows = paymentMethodSales.length
    ? paymentMethodSales.map((row) => {
      const percentage = report.gross_income > 0 ? (row.total_sales / report.gross_income) * 100 : 0;
      return `
        <tr>
          <td>${row.label}</td>
          <td>${row.orders_count}</td>
          <td>${formatMoney(row.total_sales)}</td>
          <td>${percentage.toFixed(1)}%</td>
        </tr>
      `;
    }).join('')
    : '<tr><td colspan="4">No hay ventas pagadas en este periodo.</td></tr>';

  const html = `
    <html>
      <head>
        <title>Reporte iComanda</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
          h1, h2 { margin: 0 0 12px; }
          .muted { color: #6b7280; margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
          .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
          .label { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
          .value { font-size: 24px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border-bottom: 1px solid #e5e7eb; text-align: left; padding: 10px 8px; }
          th { font-size: 12px; text-transform: uppercase; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>Reporte financiero iComanda</h1>
        <div class="muted">Periodo: ${report.date_from} al ${report.date_to}</div>
        <div class="grid">
          <div class="card"><div class="label">Ingreso bruto</div><div class="value">${formatMoney(report.gross_income)}</div></div>
          <div class="card"><div class="label">Egresos</div><div class="value">${formatMoney(report.total_expenses)}</div></div>
          <div class="card"><div class="label">Neto</div><div class="value">${formatMoney(report.net_income)}</div></div>
        </div>
        <h2>Tipos de pago</h2>
        <table style="margin-bottom: 24px;">
          <thead>
            <tr><th>Metodo</th><th>Pedidos</th><th>Total</th><th>Participacion</th></tr>
          </thead>
          <tbody>${paymentRows}</tbody>
        </table>
        <h2>Ventas por mesero</h2>
        <table>
          <thead>
            <tr><th>Mesero</th><th>Pedidos pagados</th><th>Total vendido</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;

  const popup = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768');
  if (!popup) throw new Error('No se pudo abrir la ventana de impresión.');
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
}
