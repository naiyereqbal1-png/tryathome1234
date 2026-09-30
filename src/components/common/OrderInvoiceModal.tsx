import React, { useState } from 'react';
import { Order } from '../../types';
import { db } from '../../services/db';
import {
  XCircle,
  Printer,
  CheckCircle,
  FileText,
  Home,
  Lock,
  RotateCcw,
  Download,
  Building2,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { TryAtHomeCountdown } from '../order/TryAtHomeCountdown';
import { printInvoiceElement, downloadInvoicePDF } from '../../utils/printInvoice';

interface OrderInvoiceModalProps {
  order: Order | null;
  onClose: () => void;
  userRole?: 'Customer' | 'Admin' | 'Delivery Partner' | 'DeliveryBoy';
  onBillGenerated?: (updatedOrder: Order) => void;
}

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({
  order,
  onClose,
  userRole = 'Customer',
  onBillGenerated,
}) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(order);
  const [justGenerated, setJustGenerated] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  React.useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  if (!currentOrder) return null;

  const settings = db.getSettings();
  const billCalc = db.getOrderBillCalculation(currentOrder);
  const isLocked = !!currentOrder.final_bill_generated || !!currentOrder.final_bill_locked;
  const isFinalBill = billCalc.has_returns || billCalc.has_replacements || isLocked;
  const hasReplacedItems =
    billCalc.has_replacements || currentOrder.is_replace_order || billCalc.total_replaced_quantity > 0;

  const storeName = settings?.store_name || 'STYLE SPHERE FASHIONS';
  const storeAddress = settings?.store_address || '102, Fashion Avenue, C.G. Road, Ahmedabad, Gujarat - 380009';
  const storePhone = settings?.contact_phone || '+91 98980 12345';
  const storeEmail = settings?.contact_email || 'support@stylesphere.in';
  const gstinNumber = settings?.gst_number || '24AAACS1234F1Z5';

  const handleGenerateFinalBill = () => {
    try {
      const updated = db.generateFinalBill(currentOrder.order_id, userRole);
      setCurrentOrder(updated);
      setJustGenerated(true);
      if (onBillGenerated) {
        onBillGenerated(updated);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to generate final bill.');
    }
  };

  const handlePrint = () => {
    printInvoiceElement('printable-invoice-card', `Tax-Invoice-${currentOrder.order_id}`);
  };

  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);
      await downloadInvoicePDF('printable-invoice-card', `Invoice-${currentOrder.order_id}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      id="order-detail-modal"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static"
    >
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-card,
          #printable-invoice-card * {
            visibility: visible !important;
          }
          #printable-invoice-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print, .print\\:hidden, button {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Modal Window */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 max-h-[94vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Modal App Bar (Excluded from Print/PDF) */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between print:hidden border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-300">
                  {isFinalBill ? 'Final Bill & Tax Invoice' : 'Tax Invoice & Order Receipt'}
                </span>
                {isLocked ? (
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                ) : null}
              </div>
              <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                <span>{currentOrder.order_id}</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  ({billCalc.invoice_number})
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              title="Download Tax Invoice as Standard PDF"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating...' : 'PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              title="Direct Print Invoice"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-50/50 print:p-0 print:bg-white print:overflow-visible">
          <div
            id="printable-invoice-card"
            className="w-full bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-5 sm:p-8 space-y-6 text-slate-800 shadow-xs print:border-none print:shadow-none print:p-0"
          >
            {/* 1. Official Header & Tax Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b-2 border-slate-900">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                    S1
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase">
                      {storeName}
                    </h1>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      Premium Garments & Ethnic Fashion Studio
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 mt-2.5 space-y-0.5">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{storeAddress}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>+91 {storePhone.replace(/\+91\s?/, '')}</span>
                    <span className="mx-1 text-slate-300">•</span>
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{storeEmail}</span>
                  </p>
                  <p className="font-mono text-slate-700 font-bold mt-1">
                    GSTIN: <span className="text-slate-900">{gstinNumber}</span>
                  </p>
                </div>
              </div>

              {/* Invoice Meta Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:text-right w-full sm:w-auto min-w-[220px]">
                <span className="inline-block text-[11px] font-black uppercase px-2 py-0.5 bg-slate-900 text-white rounded mb-1.5 tracking-wider">
                  {isFinalBill ? 'FINAL TAX INVOICE' : 'TAX INVOICE / CASH MEMO'}
                </span>
                <p className="text-xs text-slate-600">
                  Invoice No:{' '}
                  <strong className="font-mono text-slate-900 text-xs sm:text-sm">
                    {billCalc.invoice_number}
                  </strong>
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Order ID:{' '}
                  <strong className="font-mono text-slate-900">
                    {currentOrder.order_id}
                  </strong>
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Date:{' '}
                  <strong>
                    {new Date(billCalc.order_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </strong>
                </p>
                {currentOrder.order_type === 'try_at_home' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full mt-1.5">
                    <Home className="w-3 h-3" /> Try at Home Order
                  </span>
                )}
              </div>
            </div>

            {/* In-app Notice Banners (Printed gracefully) */}
            {isLocked && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-3 text-amber-950 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    <strong>Final Bill Locked:</strong> Post-delivery & returns settlement completed. No further alterations allowed.
                  </span>
                </div>
                <span className="text-[10px] font-extrabold uppercase bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded shrink-0">
                  Closed
                </span>
              </div>
            )}

            {hasReplacedItems && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-2.5 text-purple-950 text-xs">
                <RotateCcw className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-purple-900">
                    Replace Item Order (1:1 Doorstep Exchange)
                  </p>
                  <p className="text-[11px] text-purple-800 mt-0.5 leading-relaxed">
                    Replaced garment is shown for size/piece exchange records. As per exchange policy, the <strong>bill amount does not change</strong> (₹0 bill variation).
                  </p>
                </div>
              </div>
            )}

            {justGenerated && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold print:hidden">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Final Bill generated and locked successfully!</span>
              </div>
            )}

            {/* 2. Customer Billed To / Shipped To & Order Logistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200 text-xs">
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70">
                <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1 tracking-wider">
                  Billed & Shipped To:
                </span>
                <p className="font-black text-slate-900 text-sm">
                  {billCalc.customer_name}
                </p>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  {billCalc.customer_address}
                </p>
                {billCalc.customer_mobile && (
                  <p className="text-slate-700 mt-1.5 font-medium">
                    Phone: <strong className="font-mono">+91 {billCalc.customer_mobile}</strong>
                  </p>
                )}
              </div>

              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-1">
                <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1 tracking-wider">
                  Payment & Delivery Details:
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-600">Payment Mode:</span>
                  <span className="font-bold text-slate-900">{billCalc.payment_method || 'Cash on Delivery'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Payment Status:</span>
                  <span
                    className={`font-black text-[10px] uppercase px-1.5 py-0.5 rounded ${
                      billCalc.payment_status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {billCalc.payment_status}
                  </span>
                </div>
                {billCalc.delivery_date && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Delivery Date:</span>
                    <span className="font-medium text-slate-800">
                      {new Date(billCalc.delivery_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {currentOrder.assigned_delivery_boy_name && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Delivery Partner:</span>
                    <span className="font-semibold text-slate-800">
                      {currentOrder.assigned_delivery_boy_name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Itemized Garments Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[580px] text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-extrabold border-y border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="p-2.5 w-8 text-center">#</th>
                    <th className="p-2.5">Garment Description</th>
                    <th className="p-2.5 text-right">Rate</th>
                    <th className="p-2.5 text-center">Delivered</th>
                    {isFinalBill && (
                      <>
                        <th className="p-2.5 text-center text-rose-700">Returned</th>
                        <th className="p-2.5 text-center text-purple-700">Replaced</th>
                        <th className="p-2.5 text-center text-slate-900">Net Qty</th>
                        <th className="p-2.5 text-right">Gross</th>
                        <th className="p-2.5 text-right text-rose-700">Less: Ret</th>
                      </>
                    )}
                    <th className="p-2.5 text-right font-black">
                      {isFinalBill ? 'Final Amount' : 'Amount'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {billCalc.items.map((item, index) => {
                    const isItemReplaced = item.is_replace || item.replaced_quantity > 0;
                    return (
                      <tr
                        key={item.item_id || index}
                        className={`hover:bg-slate-50/60 ${isItemReplaced ? 'bg-purple-50/20' : ''}`}
                      >
                        <td className="p-2.5 text-center text-slate-500 font-mono text-[11px]">
                          {index + 1}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{item.product_name}</span>
                            {isItemReplaced && (
                              <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded border border-purple-200">
                                ⇄ Exchange
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5 font-mono">
                            SKU: {item.sku || 'N/A'} • Size: <span className="font-bold text-slate-700">{item.size}</span> • Color: {item.color}
                          </div>
                          {isItemReplaced && (
                            <div className="text-[10px] text-purple-800 font-semibold mt-0.5">
                              ⇄ Doorstep Replacement: {item.replacement_size ? `Size ${item.replacement_size}` : ''} {item.replacement_color ? `• ${item.replacement_color}` : ''} (Bill unchanged)
                            </div>
                          )}
                          {item.returned_quantity > 0 && !isItemReplaced && (
                            <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                              ✓ {item.returned_quantity} unit returned ({item.return_status || 'Return Completed'})
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-right text-slate-700 font-mono">
                          ₹{(item.rate ?? 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-800">
                          {item.delivered_quantity ?? 1}
                        </td>
                        {isFinalBill && (
                          <>
                            <td className="p-2.5 text-center font-bold text-rose-600">
                              {(item.returned_quantity ?? 0) > 0 ? `-${item.returned_quantity}` : '0'}
                            </td>
                            <td className="p-2.5 text-center font-bold text-purple-700">
                              {(item.replaced_quantity ?? 0) > 0 ? `${item.replaced_quantity}` : '-'}
                            </td>
                            <td className="p-2.5 text-center font-black text-slate-900">
                              {item.final_quantity ?? 0}
                            </td>
                            <td className="p-2.5 text-right text-slate-500 font-mono">
                              ₹{(item.original_amount ?? 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 text-right font-bold font-mono">
                              {isItemReplaced ? (
                                <span className="text-purple-700 font-semibold text-[10px]">
                                  ₹0 (Exchange)
                                </span>
                              ) : (item.return_amount ?? 0) > 0 ? (
                                <span className="text-rose-600">
                                  -₹{(item.return_amount ?? 0).toLocaleString('en-IN')}
                                </span>
                              ) : (
                                <span className="text-slate-400">₹0</span>
                              )}
                            </td>
                          </>
                        )}
                        <td className="p-2.5 text-right font-black text-slate-900 font-mono">
                          ₹{((isFinalBill ? item.final_amount : item.original_amount) ?? 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4. Financial Calculation Summary & Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Left Column: Quantities & Terms */}
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1 tracking-wider">
                    Quantity Breakdown
                  </span>
                  <div className="flex justify-between">
                    <span>Delivered Items:</span>
                    <strong className="text-slate-900">{billCalc.total_delivered_quantity} units</strong>
                  </div>
                  {isFinalBill && (
                    <>
                      <div className="flex justify-between text-rose-600 font-semibold">
                        <span>Return Items (Refund):</span>
                        <span>-{billCalc.total_returned_quantity} units</span>
                      </div>
                      {billCalc.total_replaced_quantity > 0 && (
                        <div className="flex justify-between text-purple-700 font-semibold">
                          <span>Replace Items (Exchange):</span>
                          <span>{billCalc.total_replaced_quantity} units (₹0)</span>
                        </div>
                      )}
                      <div className="pt-1.5 border-t border-slate-200 flex justify-between font-black text-slate-900">
                        <span>Net Items Kept:</span>
                        <span className="text-emerald-700 font-black">{billCalc.total_final_quantity} units</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-200 text-[10px] text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700 uppercase">Terms & Conditions:</p>
                  <p>1. Returns/replacements accepted within store policy duration.</p>
                  <p>2. Garments must have original tags intact and remain unwashed.</p>
                  <p>3. This is a computer generated tax invoice. No signature required.</p>
                </div>
              </div>

              {/* Right Column: Financial Calculation */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
                <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1 tracking-wider">
                  Financial Adjustment
                </span>
                <div className="flex justify-between">
                  <span>Gross Order Total:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    ₹{(billCalc.original_total ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                {isFinalBill && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Less: RETURN REFUND:</span>
                    <span className="font-mono">-₹{(billCalc.total_return_amount ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {(billCalc.total_replaced_quantity ?? 0) > 0 && (
                  <div className="flex justify-between text-purple-700 text-[11px] font-medium">
                    <span>Replace Item Adjustment:</span>
                    <span>₹0 (1:1 Doorstep Exchange)</span>
                  </div>
                )}
                {(billCalc.adjusted_tax ?? 0) > 0 && (
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>GST (5% Included):</span>
                    <span className="font-mono">
                      ₹{(billCalc.adjusted_tax ?? 0).toLocaleString('en-IN')}
                      {(billCalc.tax_reversed ?? 0) > 0 && (
                        <span className="text-rose-600 ml-1">(-₹{billCalc.tax_reversed})</span>
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charges:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {billCalc.delivery_charge === 0 ? 'FREE' : `₹${billCalc.delivery_charge ?? 0}`}
                  </span>
                </div>
                {currentOrder.order_type === 'try_at_home' && (
                  <div className="flex justify-between text-indigo-700 font-semibold text-[11px]">
                    <span>Try at Home Convenience Fee:</span>
                    <span className="font-mono">
                      {(billCalc.try_at_home_fee ?? 0) > 0
                        ? `+₹${(billCalc.try_at_home_fee ?? 0).toLocaleString('en-IN')}`
                        : '₹0 (Waived - Kept > ₹500)'}
                    </span>
                  </div>
                )}
                {(billCalc.replacement_credit_applied ?? 0) > 0 && (
                  <div className="flex justify-between text-purple-700 font-semibold text-[11px]">
                    <span>Replacement Credit:</span>
                    <span className="font-mono">-₹{(billCalc.replacement_credit_applied ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Final Net Payable Box */}
                <div className="pt-2.5 pb-2 border-t-2 border-slate-300 flex justify-between items-center font-black text-slate-900">
                  <span className="text-xs uppercase tracking-wider">NET FINAL PAYABLE:</span>
                  <span className="text-emerald-700 font-mono text-base sm:text-lg">
                    ₹{(billCalc.final_payable ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Payment Breakdown */}
                <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-semibold text-slate-800">{billCalc.payment_method || 'Cash on Delivery'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Collected:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      ₹{(billCalc.amount_collected ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Balance Due:</span>
                    <span
                      className={`font-black font-mono ${(billCalc.balance_due ?? 0) === 0 ? 'text-emerald-700' : 'text-amber-700'}`}
                    >
                      ₹{(billCalc.balance_due ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Official Signature & Stamp Footer */}
            <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
              <div>
                <p className="font-bold text-slate-800">{storeName}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Thank you for your business!</p>
              </div>
              <div className="text-right">
                <div className="inline-block border-b border-slate-400 w-36 mb-1"></div>
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  Authorized Signatory
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Bar (Print/PDF/Lock/Close) */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          <div>
            {!isLocked ? (
              <button
                onClick={handleGenerateFinalBill}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Generate & Lock Final Bill</span>
              </button>
            ) : (
              <span className="text-xs text-amber-800 font-bold flex items-center gap-1.5 bg-amber-100/70 border border-amber-300 px-3 py-1.5 rounded-xl">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Final Bill & Invoice Locked</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download Tax Invoice as Standard PDF file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Bill / Invoice"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span>Print Bill</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
