import React, { useState, useEffect } from 'react';
import { Search, Users, ShoppingBag, Eye, Calendar, Phone, Mail, Download, Printer, FileSpreadsheet, FileText } from 'lucide-react';
import { Customer, Order } from '../../types';
import { db } from '../../services/db';
import { downloadInvoicePDF } from '../../utils/printInvoice';

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(db.getCustomers());
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  const refreshCustomers = () => {
    const updatedList = db.getCustomers();
    setCustomers(updatedList);
    if (selectedCustomer) {
      const refreshedCust = updatedList.find((c) => c.customer_id === selectedCustomer.customer_id || c.id === selectedCustomer.id);
      if (refreshedCust) {
        setSelectedCustomer(refreshedCust);
        setCustomerOrders(db.getCustomerOrders(refreshedCust.customer_id));
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
                  Order History ({customerOrders.length})
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {customerOrders.length === 0 ? (
                    <p className="text-xs text-slate-400">No orders placed yet.</p>
                  ) : (
                    customerOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-indigo-700 text-[11px]">
                            {ord.order_id}
                          </span>
                          <span className="font-black text-slate-900">
                            ₹{(ord.total ?? 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                          <span>{(ord.items || []).length} garments</span>
                          <span className="font-bold text-slate-700">{ord.order_status}</span>
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
              <p className="text-xs font-bold">Select a customer to view their complete profile</p>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
};
