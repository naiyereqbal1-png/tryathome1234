import React, { useState, useEffect } from 'react';
import { Search, Users, ShoppingBag, Eye, Calendar, Phone, Mail, Download, Printer, FileSpreadsheet, FileText, Star, Edit3, Trash2, X, CheckCircle, ShieldAlert } from 'lucide-react';
import { Customer, Order, ProductReview } from '../../types';
import { db } from '../../services/db';
import { downloadInvoicePDF } from '../../utils/printInvoice';
import { AdminOrderFullDetailModal } from './AdminOrderFullDetailModal';

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(db.getCustomers());
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [customerReviews, setCustomerReviews] = useState<ProductReview[]>([]);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);

  // Admin Review Editing Modal State
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [isSavingReview, setIsSavingReview] = useState(false);

  const refreshCustomers = () => {
    const updatedList = db.getCustomers();
    setCustomers(updatedList);
    if (selectedCustomer) {
      const refreshedCust = updatedList.find((c) => c.customer_id === selectedCustomer.customer_id || c.id === selectedCustomer.id);
      if (refreshedCust) {
        setSelectedCustomer(refreshedCust);
        setCustomerOrders(db.getCustomerOrders(refreshedCust.customer_id));
        setCustomerReviews(db.getCustomerReviews(refreshedCust.customer_id || refreshedCust.id));
      }
    }
  };

  useEffect(() => {
    refreshCustomers();
    const handleSync = () => {
      refreshCustomers();
    };
    window.addEventListener('style1_data_changed', handleSync);
    return () => window.removeEventListener('style1_data_changed', handleSync);
  }, [selectedCustomer?.customer_id]);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerOrders(db.getCustomerOrders(c.customer_id));
    setCustomerReviews(db.getCustomerReviews(c.customer_id || c.id));
  };

  const filteredCustomers = customers.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchMobile = c.mobile.includes(q);
      const matchId = c.customer_id.toLowerCase().includes(q);
      if (!matchName && !matchMobile && !matchId) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) {
      alert('No customer records available to export.');
      return;
    }

    const headers = [
      'Customer ID',
      'Customer Name',
      'Mobile Number',
      'VIP Status',
      'Total Orders',
      'Total Spent (INR)',
      'Account Status',
      'Registered Date',
      'Primary Address'
    ];

    const rows = filteredCustomers.map((c) => {
      const defaultAddr = c.addresses?.find((a) => a.is_default) || c.addresses?.[0];
      const addressStr = defaultAddr
        ? `"${defaultAddr.address}, ${defaultAddr.locality || ''}, ${defaultAddr.city}, ${defaultAddr.state} - ${defaultAddr.pincode}"`.replace(/\s+/g, ' ')
        : '"N/A"';

      return [
        `"${c.customer_id || ''}"`,
        `"${c.name || ''}"`,
        `"+91 ${c.mobile || ''}"`,
        `"${c.is_vip ? 'VIP Customer' : 'Regular'}"`,
        c.total_orders || 0,
        c.total_spent || 0,
        `"${c.status || 'ACTIVE'}"`,
        `"${new Date(c.created_at || Date.now()).toLocaleDateString('en-IN')}"`,
        addressStr
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Customer_Directory_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    if (filteredCustomers.length === 0) {
      alert('No customer records available to export.');
      return;
    }

    await downloadInvoicePDF('printable-customer-report', `Customer_Directory_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div id="admin-customers-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-900">Registered Customer Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified Indian mobile users, purchase histories, and delivery profiles.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="admin-customers-export-excel-btn"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export all customer details into Excel CSV spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            id="admin-customers-export-pdf-btn"
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export customer directory to PDF document"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3.5 py-2 rounded-xl">
            Total Customers: <span className="text-indigo-700 font-extrabold">{customers.length}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer ID, name, or +91 mobile..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Two Column Layout: Customers Table + Customer Profile Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customers Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="p-3.5">Customer ID</th>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Mobile</th>
                  <th className="p-3.5">Total Orders</th>
                  <th className="p-3.5">Total Spent</th>
                  <th className="p-3.5">Registered On</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => {
                  const isSelected = selectedCustomer?.id === c.id;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-indigo-700">{c.customer_id}</td>
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{c.name}</span>
                          {c.is_vip && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                              VIP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">+91 {c.mobile}</td>
                      <td className="p-3.5 font-bold text-slate-800">{c.total_orders ?? 0} orders</td>
                      <td className="p-3.5 font-extrabold text-slate-900">
                        ₹{(c.total_spent ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {new Date(c.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3.5 text-right">
                        <button className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg text-xs hover:border-indigo-600 hover:text-indigo-600 shadow-2xs">
                          History
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Profile & History */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          {selectedCustomer ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <span className="font-mono text-[10px] text-indigo-700 font-bold block">
                    {selectedCustomer.customer_id}
                  </span>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                    <span>{selectedCustomer.name}</span>
                    {selectedCustomer.is_vip && (
                      <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                        VIP
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> +91 {selectedCustomer.mobile}
                    </span>
                  </div>
                </div>

                <button
                  id="customer-toggle-vip-btn"
                  onClick={async () => {
                    try {
                      const updated = await db.toggleCustomerVipAsync(selectedCustomer.customer_id);
                      if (updated) {
                        setSelectedCustomer(updated);
                        setCustomers(db.getCustomers());
                      }
                    } catch (err: any) {
                      alert(err.message || 'Failed to update VIP status.');
                    }
                  }}
                  className={`px-2 py-1 text-[10px] font-extrabold rounded-lg border shadow-3xs cursor-pointer transition-colors shrink-0 ${
                    selectedCustomer.is_vip
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  {selectedCustomer.is_vip ? 'Revoke VIP' : 'Mark VIP'}
                </button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Orders</span>
                  <p className="text-base font-black text-slate-900">
                    {selectedCustomer.total_orders}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Total Volume
                  </span>
                  <p className="text-base font-black text-emerald-700">
                    ₹{(selectedCustomer.total_spent ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Addresses */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                  Saved Delivery Addresses ({(selectedCustomer.addresses || []).length})
                </span>
                <div className="space-y-2">
                  {(selectedCustomer.addresses || []).map((addr) => (
                    <div
                      key={addr.id}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                    >
                      <p className="font-bold text-slate-800">{addr.name}</p>
                      <p className="text-slate-600 text-[11px]">{addr.address}</p>
                      <p className="text-slate-600 text-[11px]">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order History */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                  Full Order History ({customerOrders.length}) — Click Order to View Bill/Review
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {customerOrders.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No orders placed yet by this customer.</p>
                  ) : (
                    customerOrders.map((ord) => {
                      const linkedReviews = db.getOrderReviews(ord.order_id);
                      return (
                        <div
                          key={ord.id}
                          onClick={() => setSelectedOrderForModal(ord)}
                          className="p-3 bg-slate-50 hover:bg-indigo-50/80 cursor-pointer rounded-xl border border-slate-200 text-xs transition-all shadow-2xs group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-extrabold text-indigo-700 text-xs group-hover:underline flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-indigo-600" />
                              {ord.order_id}
                            </span>
                            <span className="font-black text-slate-900">
                              ₹{(ord.total ?? 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                            <span>{(ord.items || []).length} items • {new Date(ord.created_at).toLocaleDateString('en-IN')}</span>
                            <span className={`font-extrabold px-1.5 py-0.5 rounded text-[9px] ${
                              ord.order_status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                              ord.order_status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>{ord.order_status}</span>
                          </div>
                          {linkedReviews.length > 0 && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                              <span className="text-amber-700 font-extrabold flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {linkedReviews.length} Review Submitted ({linkedReviews[0].rating}★)
                              </span>
                              <span className="text-indigo-600 font-bold underline">Click to Edit Review</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Customer Submitted Reviews & Admin Editing */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Customer Submitted Reviews ({customerReviews.length})
                  </span>
                  <span className="text-[10px] text-amber-800 bg-amber-50 font-bold px-2 py-0.5 rounded border border-amber-200">
                    Admin Managed
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customerReviews.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No product reviews submitted by this customer yet.</p>
                  ) : (
                    customerReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/80 text-xs space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 text-[11px] block">{rev.product_name}</span>
                            <div className="flex items-center gap-1 my-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                                  }`}
                                />
                              ))}
                              <span className="text-[10px] font-bold text-slate-700 ml-1">{rev.rating}/5</span>
                            </div>
                          </div>

                          {/* Admin Edit & Delete & View Order Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const linkedOrd = customerOrders.find((o) => o.order_id === rev.order_id) || db.getOrderById(rev.order_id);
                                if (linkedOrd) {
                                  setSelectedOrderForModal(linkedOrd);
                                } else {
                                  alert(`Order #${rev.order_id} details loaded.`);
                                }
                              }}
                              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                              title="View Order Bill & Invoice"
                            >
                              <FileText className="w-3 h-3 text-slate-600" />
                              <span>Bill</span>
                            </button>

                            <button
                              id={`admin-edit-review-btn-${rev.id}`}
                              onClick={() => {
                                setEditingReview(rev);
                                setEditRating(rev.rating);
                                setEditTitle(rev.review_title || '');
                                setEditText(rev.review_text || '');
                              }}
                              className="px-2 py-1 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-500 text-indigo-700 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                              title="Edit Customer Review (Admin Only)"
                            >
                              <Edit3 className="w-3 h-3 text-indigo-600" />
                              <span>Edit</span>
                            </button>

                            <button
                              id={`admin-delete-review-btn-${rev.id}`}
                              onClick={async () => {
                                if (window.confirm('Admin Confirm: Are you sure you want to delete this customer review?')) {
                                  await db.deleteProductReviewAsync(rev.id);
                                  if (selectedCustomer) {
                                    setCustomerReviews(db.getCustomerReviews(selectedCustomer.customer_id || selectedCustomer.id));
                                  }
                                }
                              }}
                              className="p-1 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-400 text-rose-600 font-bold rounded-lg text-[10px] cursor-pointer transition-colors"
                              title="Delete Customer Review"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            </button>
                          </div>
                        </div>

                        {rev.review_title && (
                          <p className="font-bold text-slate-800 text-[11px]">{rev.review_title}</p>
                        )}
                        <p className="text-slate-600 text-[11px] bg-white/80 p-2 rounded-lg border border-slate-200/60 leading-relaxed italic">
                          "{rev.review_text}"
                        </p>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                          <span>Order: #{rev.order_id}</span>
                          <span>Submitted: {new Date(rev.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-bold">Select a customer to view their complete profile, order history & reviews</p>
            </div>
          )}
        </div>
      </div>

      {/* ADMIN REVIEW EDIT MODAL */}
      {editingReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-sm">Admin: Edit Customer Review</h3>
              </div>
              <button
                onClick={() => setEditingReview(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  disabled
                  value={editingReview.product_name}
                  className="w-full bg-slate-100 text-slate-600 p-2 text-xs rounded-lg font-bold border border-slate-200 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Star Rating (1 - 5 Stars)</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= editRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 fill-slate-100'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-black text-slate-800 ml-2">{editRating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Review Headline / Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Excellent fit and premium fabric!"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-hidden focus:border-indigo-600 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Review Comment / Feedback</label>
                <textarea
                  rows={3}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Enter updated customer review text..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-hidden focus:border-indigo-600 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingReview || !editText.trim()}
                onClick={async () => {
                  if (!editText.trim()) return;
                  setIsSavingReview(true);
                  try {
                    await db.saveProductReviewAsync({
                      productId: editingReview.product_id,
                      orderId: editingReview.order_id,
                      orderItemId: editingReview.order_item_id,
                      customerId: editingReview.customer_id,
                      customerName: editingReview.customer_name,
                      customerMobile: editingReview.customer_mobile,
                      rating: editRating,
                      reviewTitle: editTitle.trim(),
                      reviewText: editText.trim(),
                    });

                    if (selectedCustomer) {
                      setCustomerReviews(db.getCustomerReviews(selectedCustomer.customer_id || selectedCustomer.id));
                    }
                    setEditingReview(null);
                  } catch (err: any) {
                    alert('Failed to update review: ' + (err.message || 'Unknown error'));
                  } finally {
                    setIsSavingReview(false);
                  }
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
              >
                {isSavingReview ? 'Saving...' : 'Save Updated Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Off-screen Printable PDF Template for All Customers */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '850px' }}>
        <div id="printable-customer-report" className="bg-white p-6 space-y-4 font-sans text-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">{db.getSettings()?.store_name || 'STYLE SPHERE FASHIONS'}</h1>
              <p className="text-xs font-bold text-slate-500">Registered Customers Directory & VIP Intelligence Report</p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold text-slate-700">Date: {new Date().toLocaleDateString('en-IN')}</p>
              <p className="text-slate-500">Total Records: {filteredCustomers.length}</p>
            </div>
          </div>

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Customers</span>
              <span className="text-base font-black text-slate-900">{filteredCustomers.length}</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <span className="text-[10px] font-bold text-amber-700 uppercase block">VIP Special Customers</span>
              <span className="text-base font-black text-amber-900">{filteredCustomers.filter(c => c.is_vip).length}</span>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Total Combined Spent</span>
              <span className="text-base font-black text-emerald-900">
                ₹{filteredCustomers.reduce((acc, c) => acc + (c.total_spent || 0), 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Detailed Customer Data Table */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-extrabold uppercase text-[9px]">
                <th className="p-2 border border-slate-800">Cust ID</th>
                <th className="p-2 border border-slate-800">Customer Name</th>
                <th className="p-2 border border-slate-800">Mobile</th>
                <th className="p-2 border border-slate-800">VIP Status</th>
                <th className="p-2 border border-slate-800 text-center">Orders</th>
                <th className="p-2 border border-slate-800 text-right">Total Spent</th>
                <th className="p-2 border border-slate-800">Registered Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c, i) => {
                const addr = c.addresses?.find((a) => a.is_default) || c.addresses?.[0];
                const fullAddressStr = addr
                  ? `${addr.address}, ${addr.city}, ${addr.state} - ${addr.pincode}`
                  : 'N/A';

                return (
                  <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-2 border border-slate-200 font-mono font-bold text-indigo-900">{c.customer_id}</td>
                    <td className="p-2 border border-slate-200 font-bold text-slate-900">{c.name}</td>
                    <td className="p-2 border border-slate-200 font-mono">+91 {c.mobile}</td>
                    <td className="p-2 border border-slate-200 font-bold text-[10px]">
                      {c.is_vip ? (
                        <span className="text-amber-700 font-black">★ VIP Priority</span>
                      ) : (
                        <span className="text-slate-500">Regular</span>
                      )}
                    </td>
                    <td className="p-2 border border-slate-200 text-center font-bold">{c.total_orders || 0}</td>
                    <td className="p-2 border border-slate-200 text-right font-black">
                      ₹{(c.total_spent || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-2 border border-slate-200 text-[10px] text-slate-600">
                      {fullAddressStr}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between">
            <span>Official Merchant Customer Directory Sheet</span>
            <span>Style Sphere Admin Studio</span>
          </div>
        </div>
      </div>

      {/* ADMIN ORDER FULL DETAIL MODAL FOR LINKED BILL & REVIEWS */}
      {selectedOrderForModal && (
        <AdminOrderFullDetailModal
          order={selectedOrderForModal}
          deliveryBoys={db.getDeliveryBoys()}
          returns={db.getProductReturns()}
          isOpen={!!selectedOrderForModal}
          onClose={() => setSelectedOrderForModal(null)}
          onOrderUpdated={refreshCustomers}
        />
      )}
    </div>
  );
};
