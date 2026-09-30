import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  Truck,
  Package,
  Clock,
  Printer,
  FileText,
  Lock,
  RotateCcw,
  Phone,
  MapPin,
  User,
  CreditCard,
  ShieldCheck,
  Calendar,
  Send,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { DeliveryBoy, Order, OrderStatus, ProductReturn } from '../../types';
import { db } from '../../services/db';
import { OrderInvoiceModal } from '../common/OrderInvoiceModal';
import { TryAtHomeCountdown } from '../order/TryAtHomeCountdown';

interface AdminOrderFullDetailModalProps {
  order: Order | null;
  deliveryBoys: DeliveryBoy[];
  returns: ProductReturn[];
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: () => void;
}

export const AdminOrderFullDetailModal: React.FC<AdminOrderFullDetailModalProps> = ({
  order,
  deliveryBoys,
  returns,
  isOpen,
  onClose,
  onOrderUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'delivery' | 'billing' | 'timeline'>('overview');
  const [newStatus, setNewStatus] = useState<OrderStatus>(order?.order_status || 'Pending');
  const [trackingNumber, setTrackingNumber] = useState(order?.tracking_number || '');
  const [courierPartner, setCourierPartner] = useState(order?.courier_partner || 'BlueDart Express');
  const [statusNotes, setStatusNotes] = useState('');
  const [assignBoyId, setAssignBoyId] = useState(order?.assigned_delivery_boy_id || '');
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [viewingInvoice, setViewingInvoice] = useState(false);

  React.useEffect(() => {
    if (order) {
      setNewStatus(order.order_status);
      setTrackingNumber(order.tracking_number || '');
      setCourierPartner(order.courier_partner || 'BlueDart Express');
      setAssignBoyId(order.assigned_delivery_boy_id || '');
      setStatusNotes('');
      setAdminNoteInput('');
      setActionSuccessMsg('');
    }
  }, [order?.order_id, order?.id]);

  if (!isOpen || !order) return null;

  const isFinalBillLocked = db.isOrderLocked(order);
  const isDeliveryLocked = db.isOrderDeliveryLocked(order);
  const isOpenState = db.isOpenOrder(order);
  const isClosedState = db.isClosedOrder(order);
  const billCalc = db.getOrderBillCalculation(order);
  const payableAmount = db.getOrderPayableAmount(order) ?? 0;

  const activeDeliveryBoys = deliveryBoys.filter(
    (b) => b.status === 'Active' || b.status === 'ACTIVE'
  );
  const assignedBoy = deliveryBoys.find(
    (b) => b.id === order.assigned_delivery_boy_id || b.delivery_boy_id === order.assigned_delivery_boy_id
  );
  const orderReturns = returns.filter((r) => r.order_id === order.order_id);

  const statusColors: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-800 border-amber-300',
    Confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
    Processing: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    Packed: 'bg-purple-100 text-purple-800 border-purple-300',
    Shipped: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'Out for Delivery': 'bg-teal-100 text-teal-800 border-teal-300',
    Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Cancelled: 'bg-rose-100 text-rose-800 border-rose-300',
    Returned: 'bg-purple-100 text-purple-800 border-purple-300',
    Refunded: 'bg-slate-100 text-slate-800 border-slate-300',
  };

  const workflowSteps: OrderStatus[] = [
    'Pending',
    'Confirmed',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
  ];

  const currentStepIdx = workflowSteps.indexOf(order.order_status);

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Status update
  const handleUpdateStatus = (statusToSet: OrderStatus) => {
    if (isFinalBillLocked) {
      alert('Order is locked: Final Bill & Invoice has been generated and locked.');
      return;
    }
    db.updateOrderStatus(
      order.order_id,
      statusToSet,
      'Merchant Admin Team',
      statusNotes || `Status updated to ${statusToSet}`
    );

    if (trackingNumber.trim()) {
      db.updateOrderShipping(order.order_id, trackingNumber.trim(), courierPartner);
    }

    setStatusNotes('');
    showToast(`Order status updated to ${statusToSet}`);
    onOrderUpdated();
  };

  // Delivery Partner assign
  const handleAssignBoy = (boyId: string) => {
    if (!boyId) return;
    if (isDeliveryLocked) {
      alert(db.getDeliveryLockReason(order) || 'Cannot change delivery partner: Order is locked.');
      return;
    }
    const boy = deliveryBoys.find((b) => b.id === boyId);
    if (!boy) return;
    db.assignOrderToDeliveryBoy(order.order_id, boy.id);
    setAssignBoyId(boy.id);
    showToast(`Delivery assigned to ${boy.name} (${boy.vehicle_type})`);
    onOrderUpdated();
  };

  const handleUnassignBoy = () => {
    if (isDeliveryLocked) {
      alert(db.getDeliveryLockReason(order) || 'Cannot unassign delivery partner: Order is locked.');
      return;
    }
    db.unassignOrderFromDeliveryBoy(order.order_id);
    setAssignBoyId('');
    showToast('Delivery partner unassigned');
    onOrderUpdated();
  };

  // Item cancellation
  const handleCancelItem = (itemId: string, itemName: string) => {
    if (isFinalBillLocked) {
      alert('Order is locked: Items cannot be cancelled after final bill generation.');
      return;
    }
    const reason = prompt(
      `Enter reason to cancel "${itemName}" (Stock will be auto-restored to inventory):`,
      'Out of stock / Customer requested cancellation'
    );
    if (!reason) return;

    db.cancelOrderItem(order.order_id, itemId, reason, 'Admin');
    showToast(`Item "${itemName}" cancelled & inventory restocked`);
    onOrderUpdated();
  };

  // Full Order cancellation
  const handleCancelFullOrder = () => {
    if (isFinalBillLocked) {
      alert('Order is locked: Final Bill & Invoice has been generated.');
      return;
    }
    if (order.order_status === 'Delivered') {
      alert('Cannot cancel an order that has already been Delivered.');
      return;
    }
    const reason = prompt(
      `Are you sure you want to CANCEL this entire order (${order.order_id})?\nStock will be restored for all items. Enter cancellation reason:`,
      'Customer cancellation request'
    );
    if (!reason) return;

    db.cancelFullOrder(order.order_id, reason, 'Admin');
    showToast(`Order ${order.order_id} cancelled & all items restocked`);
    onOrderUpdated();
  };

  // Mark Payment as Paid
  const handleMarkPaymentPaid = () => {
    db.updateOrderPaymentStatus(order.order_id, 'PAID', 'Admin', 'Payment verified and marked as PAID by Admin');
    showToast('Order payment status marked as PAID');
    onOrderUpdated();
  };

  // Add Internal Admin Note
  const handleAddAdminNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNoteInput.trim()) return;
    db.addOrderHistoryNote(order.order_id, adminNoteInput.trim(), 'Admin Note');
    setAdminNoteInput('');
    showToast('Internal note logged in history trail');
    onOrderUpdated();
  };

  return (
    <>
      <div
        id="admin-order-full-detail-modal"
        className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      >
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
          {/* Top Modal Header */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-base font-black font-mono tracking-tight text-white">
                    {order.order_id}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                      statusColors[order.order_status] || 'bg-slate-800 text-slate-200 border-slate-700'
                    }`}
                  >
                    {order.order_status}
                  </span>
                  {isOpenState ? (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-900/80 text-indigo-200 border border-indigo-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                      Open Order (In Progress)
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-200 border border-emerald-700 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      Closed Order ({order.order_status})
                    </span>
                  )}
                  {order.order_type === 'try_at_home' && (
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                      Try at Home Order
                    </span>
                  )}
                  {isFinalBillLocked && (
                    <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Final Bill Locked
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>
                    Invoice: <strong className="text-slate-200 font-mono">{order.invoice_number || `INV-${order.order_id.replace(/^ORD-/, '')}`}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Placed on: {new Date(order.created_at || order.order_date || Date.now()).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="modal-quick-invoice-btn"
                onClick={() => setViewingInvoice(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="View Official Tax Invoice"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tax Invoice</span>
              </button>

              <button
                id="modal-close-btn"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toast message */}
          {actionSuccessMsg && (
            <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between animate-fade-in shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
              <button
                onClick={() => setActionSuccessMsg('')}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-0.5"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto shrink-0">
            {[
              { id: 'overview', label: 'Overview & Workflow', icon: Package },
              { id: 'items', label: `Items (${order.items.length})`, icon: Package },
              { id: 'delivery', label: 'Delivery Partner', icon: Truck },
              { id: 'billing', label: 'Billing & Payment', icon: CreditCard },
              { id: 'timeline', label: `History (${order.status_history?.length || 0})`, icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 sm:px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs font-extrabold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* TAB 1: OVERVIEW & WORKFLOW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Try at Home Doorstep Trial Management & Countdown */}
                {order.order_type === 'try_at_home' && (
                  <div className="space-y-3">
                    <TryAtHomeCountdown order={order} />
                    {order.order_status === 'Delivered' && !order.final_bill_locked && (
                      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs">
                        <span className="font-bold text-indigo-950">
                          Try at Home Admin Controls:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              db.extendTryAtHomeTimer(order.order_id, 15);
                              onOrderUpdated();
                              showToast('Try at Home timer extended by 15 minutes for customer!');
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer text-xs shadow-2xs"
                          >
                            +15 Mins Extension
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Trigger Auto-Return for all items and finalize bill?')) {
                                db.autoReturnAllOrderItems(order.order_id);
                                onOrderUpdated();
                                showToast('All items marked as auto-returned and final bill locked.');
                              }
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg cursor-pointer text-xs shadow-2xs"
                          >
                            Auto-Return All Items
                          </button>
                          {order.try_at_home_status !== 'CLOSED' && (
                            <button
                              type="button"
                              onClick={() => {
                                db.closeTryAtHomeOrder(order.order_id, 'Manually marked closed by Admin');
                                onOrderUpdated();
                                showToast('Try at Home window closed successfully.');
                              }}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer text-xs shadow-2xs"
                            >
                              Close Trial Window
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Visual Workflow Stepper */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      Fulfillment Lifecycle Stepper
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Current Stage: <strong className="text-slate-900">{order.order_status}</strong>
                    </span>
                  </div>

                  {order.order_status === 'Cancelled' ? (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs flex items-center gap-3 text-rose-800">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      <div>
                        <p className="font-extrabold text-sm">Order Has Been Cancelled</p>
                        <p className="text-rose-700 mt-0.5">
                          Fulfillment has stopped. All garment stocks have been restored to available inventory.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {workflowSteps.map((step, idx) => {
                        const isDone = currentStepIdx >= idx && currentStepIdx !== -1;
                        const isCurrent = order.order_status === step;
                        return (
                          <div
                            key={step}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              isCurrent
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-200'
                                : isDone
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                : 'bg-white text-slate-400 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-center mb-1">
                              {isDone && !isCurrent ? (
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              ) : isCurrent ? (
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                              ) : (
                                <span className="text-[10px] font-mono font-bold text-slate-400">
                                  {idx + 1}
                                </span>
                              )}
                            </div>
                            <p className={`text-[11px] font-bold leading-tight ${isCurrent ? 'text-white' : ''}`}>
                              {step}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Quick Workflow Advance Actions */}
                  {!isFinalBillLocked && order.order_status !== 'Delivered' && order.order_status !== 'Cancelled' && (
                    <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-bold text-slate-600">Quick Advance to Next Stage:</span>
                      <div className="flex flex-wrap gap-2">
                        {order.order_status === 'Pending' && (
                          <button
                            onClick={() => handleUpdateStatus('Confirmed')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Mark Confirmed
                          </button>
                        )}
                        {(order.order_status === 'Pending' || order.order_status === 'Confirmed') && (
                          <button
                            onClick={() => handleUpdateStatus('Packed')}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Mark Packed
                          </button>
                        )}
                        {(order.order_status === 'Packed' || order.order_status === 'Confirmed') && (
                          <button
                            onClick={() => handleUpdateStatus('Shipped')}
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Mark Shipped
                          </button>
                        )}
                        {order.order_status === 'Shipped' && (
                          <button
                            onClick={() => handleUpdateStatus('Out for Delivery')}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Mark Out for Delivery
                          </button>
                        )}
                        {order.order_status === 'Out for Delivery' && (
                          <button
                            onClick={() => handleUpdateStatus('Delivered')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Mark as Delivered
                          </button>
                        )}
                        <button
                          onClick={handleCancelFullOrder}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel Entire Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Update Form with Tracking */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-indigo-600" />
                      Set Custom Workflow Stage
                    </h4>

                    {isFinalBillLocked ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                        <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Workflow Permanently Locked</p>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            Final bill has been generated and locked. Order lifecycle cannot be altered.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Select Status</label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                            className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 bg-white"
                          >
                            {[
                              'Pending',
                              'Confirmed',
                              'Processing',
                              'Packed',
                              'Shipped',
                              'Out for Delivery',
                              'Delivered',
                              'Cancelled',
                            ].map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">Courier Partner</label>
                            <input
                              type="text"
                              value={courierPartner}
                              onChange={(e) => setCourierPartner(e.target.value)}
                              placeholder="e.g. BlueDart / Hub"
                              className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">Tracking AWB #</label>
                            <input
                              type="text"
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              placeholder="e.g. BD-892182"
                              className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Admin Audit Note</label>
                          <input
                            type="text"
                            value={statusNotes}
                            onChange={(e) => setStatusNotes(e.target.value)}
                            placeholder="Reason or notes for status update..."
                            className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600"
                          />
                        </div>

                        <button
                          onClick={() => handleUpdateStatus(newStatus)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          Apply Status Update
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Customer Information Card */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      Customer & Delivery Destination
                    </h4>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Customer Name:</span>
                        <strong className="text-slate-900">{order.customer_name}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Mobile Number:</span>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-900 font-mono">+91 {order.mobile}</strong>
                          <a
                            href={`tel:${order.mobile}`}
                            className="p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[10px] font-bold flex items-center gap-0.5"
                            title="Call Customer"
                          >
                            <Phone className="w-2.5 h-2.5" />
                            Call
                          </a>
                        </div>
                      </div>
                      {order.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Email Address:</span>
                          <span className="text-slate-800 font-mono text-[11px]">{order.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        Shipping Address:
                      </span>
                      <p className="text-slate-800 font-medium leading-relaxed pl-4">
                        {order.address?.address || 'Address Details'}
                        {order.address?.city ? `, ${order.address.city}` : ''}
                        {order.address?.state ? `, ${order.address.state}` : ''}
                        {order.address?.pincode ? ` - ${order.address.pincode}` : ''}
                      </p>
                      <span className="inline-block ml-4 text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                        Type: {order.address?.type || 'HOME'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ITEMS & STOCK AUDIT */}
            {activeTab === 'items' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Garments in Order ({order.items.length} items)
                  </h4>
                  <span className="text-xs text-slate-500">
                    Order Type: <strong>{order.order_type === 'try_at_home' ? 'Try at Home' : 'Standard Delivery'}</strong>
                  </span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  {order.items.map((it) => {
                    const isCancelled = it.item_status === 'Cancelled';
                    return (
                      <div key={it.id} className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isCancelled ? 'bg-rose-50/40' : 'hover:bg-slate-50/50'}`}>
                        <div className="flex items-center gap-3">
                          <img
                            src={it.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=200&q=80'}
                            alt={it.product_name}
                            className={`w-14 h-14 object-cover rounded-xl border shrink-0 ${isCancelled ? 'opacity-50 grayscale' : 'border-slate-200'}`}
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm font-bold ${isCancelled ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                {it.product_name}
                              </p>
                              <span
                                className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                  isCancelled
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {it.item_status || order.order_status}
                              </span>
                              {it.return_status && (
                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                  {it.return_status}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                              <span>Size: <strong className="text-slate-800">{it.size}</strong></span>
                              <span>•</span>
                              <span>Color: <strong className="text-slate-800">{it.color}</strong></span>
                              <span>•</span>
                              <span>Qty: <strong className="text-slate-800">{it.quantity}</strong></span>
                              <span>•</span>
                              <span>SKU: <code className="text-slate-600">{it.sku || it.product_id}</code></span>
                            </div>
                            {isCancelled && it.cancellation_reason && (
                              <p className="text-[11px] text-rose-700 font-semibold mt-1">
                                Cancel Reason: {it.cancellation_reason}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                          <div className="text-right">
                            <span className={`text-sm font-black ${isCancelled ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              ₹{((it.price ?? 0) * (it.quantity ?? 1)).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ₹{(it.price ?? 0).toLocaleString('en-IN')} each
                            </span>
                          </div>

                          {!isCancelled && !isFinalBillLocked && order.order_status !== 'Delivered' && order.order_status !== 'Cancelled' && (
                            <button
                              onClick={() => handleCancelItem(it.id, it.product_name)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              title="Cancel item and auto-restore stock"
                            >
                              Cancel Item
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Returns section */}
                {orderReturns.length > 0 && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                        Returned Items Audit ({orderReturns.length})
                      </span>
                      <span className="text-xs font-bold text-amber-800">
                        Total Refund: ₹{orderReturns.reduce((sum, r) => sum + (Number(r.return_amount) || 0), 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {orderReturns.map((ret) => (
                        <div key={ret.id} className="p-3 bg-white border border-amber-200 rounded-xl text-xs flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900">{ret.product_name || ret.item_name} (Size: {ret.size || 'M'}, Qty: {ret.quantity})</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Reason: <em>{ret.reason}</em> • Returned at: {new Date(ret.returned_at || ret.created_at || Date.now()).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-amber-900 text-xs">
                              -₹{(ret.return_amount ?? 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded block mt-0.5">
                              {ret.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: DELIVERY PARTNER */}
            {activeTab === 'delivery' && (
              <div className="space-y-5">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    Delivery Associate Status & Lock
                  </h4>

                  {isDeliveryLocked && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2 mb-4">
                      <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-amber-950">Delivery Partner Assignment is Locked</p>
                        <p className="text-[11px] text-amber-850 mt-0.5 leading-relaxed">
                          {db.getDeliveryLockReason(order) || 'Cannot change delivery partner: Order has been Delivered or COD cash has been collected.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {assignedBoy ? (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black text-base shrink-0">
                          {assignedBoy.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-black text-slate-900 text-sm">{assignedBoy.name}</h5>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                              {assignedBoy.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span className="font-mono">+91 {assignedBoy.mobile}</span>
                            <span>•</span>
                            <span>{assignedBoy.vehicle_type} ({assignedBoy.vehicle_number || 'N/A'})</span>
                            <span>•</span>
                            <span>Zone: {assignedBoy.assigned_area || assignedBoy.city || 'Hub'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <a
                          href={`tel:${assignedBoy.mobile}`}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          Call Partner
                        </a>

                        {!isDeliveryLocked && (
                          <button
                            onClick={handleUnassignBoy}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-colors cursor-pointer"
                          >
                            Unassign
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                      <p className="text-xs font-bold text-amber-900 mb-2">No Delivery Associate Currently Assigned</p>
                      <p className="text-[11px] text-amber-700">Assign an active delivery partner below to dispatch this order.</p>
                    </div>
                  )}
                </div>

                {/* Assignment Form */}
                {!isDeliveryLocked && (
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                      {assignedBoy ? 'Reassign to Different Delivery Partner' : 'Assign to Delivery Partner'}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeDeliveryBoys.map((boy) => {
                        const isSelected = (assignedBoy?.id === boy.id);
                        return (
                          <div
                            key={boy.id}
                            onClick={() => handleAssignBoy(boy.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-500 shadow-2xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-900">{boy.name}</p>
                              <p className="text-[10px] text-slate-500">
                                {boy.vehicle_type} • +91 {boy.mobile} • {boy.assigned_area || 'Central Hub'}
                              </p>
                            </div>
                            <button
                              type="button"
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 hover:bg-indigo-100 text-slate-700'
                              }`}
                            >
                              {isSelected ? 'Assigned' : 'Assign'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: BILLING & PAYMENT */}
            {activeTab === 'billing' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Detailed Financial Calculation */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      Financial Audit & Bill Breakdown
                    </h4>

                    <div className="space-y-2 text-xs divide-y divide-slate-100">
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600">Items Gross Subtotal:</span>
                        <strong className="text-slate-900 font-mono">₹{(order.subtotal ?? 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600">Discount Applied:</span>
                        <span className="text-emerald-700 font-mono font-bold">-₹{(order.discount ?? 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600">Delivery Charges:</span>
                        <span className="text-slate-900 font-mono font-bold">
                          {(order.delivery_charge ?? 0) === 0 ? 'FREE' : `₹${order.delivery_charge}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600">GST / Taxes:</span>
                        <span className="text-slate-900 font-mono font-bold">₹{(order.tax_amount ?? 0).toLocaleString('en-IN')}</span>
                      </div>
                      {order.order_type === 'try_at_home' && (
                        <div className="flex items-center justify-between py-1 text-indigo-700">
                          <span className="font-semibold">Try at Home Fee (Non-refundable):</span>
                          <span className="font-mono font-bold">
                            {billCalc.try_at_home_fee > 0
                              ? `+₹${billCalc.try_at_home_fee.toLocaleString('en-IN')}`
                              : '₹0 (Not Applicable - Kept > ₹500)'}
                          </span>
                        </div>
                      )}
                      {billCalc.replacement_credit_applied > 0 && (
                        <div className="flex items-center justify-between py-1 text-purple-700">
                          <span className="font-semibold">Replacement Credit Adjustment:</span>
                          <span className="font-mono font-bold">-₹{billCalc.replacement_credit_applied.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {billCalc.has_returns && (
                        <div className="flex items-center justify-between py-1 text-amber-800">
                          <span>Deductions for Returns:</span>
                          <span className="font-mono font-bold">-₹{billCalc.total_return_amount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {billCalc.total_final_quantity === 0 && billCalc.try_at_home_fee > 0 && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 font-medium">
                          All items returned. Cash amount to collect at doorstep: <strong>₹{payableAmount.toLocaleString('en-IN')}</strong> (Non-refundable Try at Home service fee).
                        </div>
                      )}
                      <div className="flex items-center justify-between py-2 border-t-2 border-slate-200 text-sm">
                        <strong className="text-slate-900">Net Final Payable Amount:</strong>
                        <strong className="text-indigo-700 font-black font-mono text-base">
                          ₹{payableAmount.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setViewingInvoice(true)}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span>View & Print Tax Invoice (PDF)</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Method & Status */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Payment Method & Verification
                    </h4>

                    <div className="p-4 bg-slate-50 rounded-xl space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Payment Mode:</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {order.payment_method === 'COD' ? 'Cash on Delivery (COD)' : 'Online Payment (Razorpay)'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Payment Status:</span>
                        <span
                          className={`text-xs font-extrabold px-2.5 py-1 rounded-full uppercase flex items-center gap-1 ${
                            order.payment_status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.payment_status === 'PAID' && <CheckCircle className="w-3.5 h-3.5" />}
                          {order.payment_status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Invoice Number:</span>
                        <span className="font-mono font-bold text-indigo-700">
                          {order.invoice_number || `INV-${order.order_id.replace(/^ORD-/, '')}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Final Bill Locked:</span>
                        <span className="font-bold text-slate-800">
                          {isFinalBillLocked ? 'Yes (Workflow Frozen)' : 'No (Adjustable)'}
                        </span>
                      </div>
                    </div>

                    {order.payment_status !== 'PAID' && (
                      <button
                        onClick={handleMarkPaymentPaid}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark COD Payment as Received (PAID)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: TIMELINE & AUDIT HISTORY */}
            {activeTab === 'timeline' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Complete Chronological Audit Trail
                  </h4>
                  <span className="text-xs text-slate-500">
                    Total Events: <strong>{order.status_history?.length || 0}</strong>
                  </span>
                </div>

                {/* Add note form */}
                <form onSubmit={handleAddAdminNote} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                  <input
                    type="text"
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    placeholder="Add internal admin log note to order history..."
                    className="flex-1 text-xs p-2 border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!adminNoteInput.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                    <span>Log Note</span>
                  </button>
                </form>

                {/* Timeline Items */}
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {(order.status_history || []).map((sh, idx) => (
                    <div key={sh.id || idx} className="relative group">
                      <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-200" />
                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] uppercase font-bold border border-indigo-200">
                              {sh.status}
                            </span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(sh.changed_at).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Updated by: <strong className="text-slate-800">{sh.changed_by}</strong>
                        </p>
                        {sh.notes && (
                          <p className="text-xs text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                            "{sh.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span>Customer: <strong>{order.customer_name}</strong></span>
              <span>•</span>
              <span>Net Payable: <strong className="text-indigo-700 font-black">₹{payableAmount.toLocaleString('en-IN')}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewingInvoice(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Invoice Print</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Invoice Modal */}
      {viewingInvoice && (
        <OrderInvoiceModal
          order={order}
          onClose={() => setViewingInvoice(false)}
          userRole="Admin"
          onBillGenerated={(updated) => {
            setViewingInvoice(false);
            onOrderUpdated();
          }}
        />
      )}
    </>
  );
};
