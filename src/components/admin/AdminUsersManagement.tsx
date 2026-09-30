import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  Key,
  MapPin,
  Store,
  CheckCircle2,
  AlertTriangle,
  Building,
  Phone,
  Mail,
  Search,
} from 'lucide-react';
import { db } from '../../services/db';
import { AdminAccount } from '../../types';

export const AdminUsersManagement: React.FC = () => {
  const [admins, setAdmins] = useState<AdminAccount[]>(() => db.getAdmins());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [passwordPin, setPasswordPin] = useState('123456');
  const [pincodes, setPincodes] = useState('822114');
  const [role, setRole] = useState<'super_admin' | 'admin'>('admin');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const refreshAdmins = () => {
    setAdmins(db.getAdmins());
  };

  const handleOpenAdd = () => {
    setEditingAdmin(null);
    setName('');
    setStoreName('');
    setMobile('');
    setEmail('');
    setPasswordPin('123456');
    setPincodes('822114');
    setRole('admin');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (adm: AdminAccount) => {
    setEditingAdmin(adm);
    setName(adm.name);
    setStoreName(adm.store_name || '');
    setMobile(adm.mobile || '');
    setEmail(adm.email || '');
    setPasswordPin(adm.password_pin || '123456');
    setPincodes((adm.assigned_pincodes || ['822114']).join(', '));
    setRole(adm.role);
    setStatus(adm.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!mobile.trim() && !email.trim())) {
      setMessage({ type: 'error', text: 'Please enter Name and Mobile or Email.' });
      return;
    }

    const cleanPins = pincodes
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length >= 3);

    // Check if any pincode is ALREADY allotted to ANOTHER Admin
    const otherAdmins = admins.filter((a) => a.id !== editingAdmin?.id);
    const conflicts: { pin: string; store: string; adminName: string }[] = [];

    cleanPins.forEach((pin) => {
      otherAdmins.forEach((other) => {
        if ((other.assigned_pincodes || []).includes(pin)) {
          conflicts.push({
            pin,
            store: other.store_name || 'Franchise Store',
            adminName: other.name,
          });
        }
      });
    });

    if (conflicts.length > 0) {
      const conflictListStr = conflicts
        .map((c) => `Pincode "${c.pin}" (Already allotted to '${c.store}' - ${c.adminName})`)
        .join(', ');
      setMessage({
        type: 'error',
        text: `⛔ Allocation Blocked: ${conflictListStr}. Ek Pincode sirf ek hi Admin ko allot ho sakta hai!`,
      });
      return;
    }

    const saved = db.saveAdmin({
      id: editingAdmin ? editingAdmin.id : undefined,
      name: name.trim(),
      store_name: storeName.trim() || 'Franchise Store',
      mobile: mobile.trim(),
      email: email.trim(),
      email_or_mobile: email.trim() || mobile.trim(),
      password_pin: passwordPin.trim(),
      assigned_pincodes: cleanPins.length > 0 ? cleanPins : ['822114'],
      role,
      status,
    });

    if (saved) {
      setMessage({
        type: 'success',
        text: editingAdmin ? `Admin account "${saved.name}" updated!` : `New Admin "${saved.name}" created!`,
      });
      setIsModalOpen(false);
      refreshAdmins();
      setTimeout(() => setMessage(null), 3500);
    }
  };

  const handleDelete = (adm: AdminAccount) => {
    if (adm.id === 'adm-1' || adm.role === 'super_admin') {
      alert('Super Admin account cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete Admin "${adm.name}" (${adm.store_name})?`)) {
      db.deleteAdmin(adm.id);
      refreshAdmins();
      setMessage({ type: 'success', text: `Admin account "${adm.name}" deleted.` });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const filteredAdmins = admins.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      (a.store_name || '').toLowerCase().includes(q) ||
      (a.mobile || '').includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.admin_code || '').toLowerCase().includes(q)
    );
  });

  return (
    <div id="admin-management-view" className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-black text-slate-900">Multi-Admin & Franchise Store Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Super Admin portal to add and manage store admins. Each admin gets their own isolated customers, products, orders, shopkeepers, and delivery boys.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Store Admin</span>
        </button>
      </div>

      {message && (
        <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
            : 'bg-rose-50 border border-rose-300 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Admin name, Store branch, Mobile, Email or Admin Code..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-hidden focus:border-indigo-600"
          />
        </div>
        <span className="text-xs text-slate-500 font-bold">
          Total Admins: {filteredAdmins.length}
        </span>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-100 uppercase tracking-wider text-[10px] font-black">
              <tr>
                <th className="p-3.5">Admin / Store Manager</th>
                <th className="p-3.5">Branch / Store Name</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Contact Info</th>
                <th className="p-3.5">Passcode / PIN</th>
                <th className="p-3.5">Serviceable Pincodes</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-bold">
                    No admin accounts found. Click "+ Add New Store Admin" to create one.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((adm) => {
                  const isSuper = adm.role === 'super_admin';
                  return (
                    <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 ${
                            isSuper ? 'bg-amber-500' : 'bg-indigo-600'
                          }`}>
                            {adm.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block">{adm.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">{adm.admin_code || adm.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-bold text-slate-800">
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          {adm.store_name || 'General Branch'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {isSuper ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                            👑 Super Admin
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                            🏢 Store Admin
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5 text-[11px] text-slate-700">
                          {adm.mobile && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span className="font-mono font-bold">{adm.mobile}</span>
                            </div>
                          )}
                          {adm.email && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{adm.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-slate-800 text-[11px]">
                          {adm.password_pin || '123456'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {(adm.assigned_pincodes || ['822114']).map((p) => (
                            <span key={p} className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px] rounded">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          adm.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {adm.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(adm)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Admin"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {!isSuper && (
                            <button
                              onClick={() => handleDelete(adm)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Admin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit Admin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                {editingAdmin ? 'Edit Admin Account' : 'Create New Store Admin'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Admin / Manager Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Franchise / Store Branch *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Garhwa Branch, Ranchi Store"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-hidden focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Login Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin.store@tryathome.in"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-hidden focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Login Password / PIN *
                  </label>
                  <input
                    type="text"
                    required
                    value={passwordPin}
                    onChange={(e) => setPasswordPin(e.target.value)}
                    placeholder="e.g. 123456 or pass123"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 font-mono outline-hidden focus:border-indigo-600 bg-amber-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-hidden focus:border-indigo-600 bg-white"
                  >
                    <option value="admin">Store Admin (Isolated View)</option>
                    <option value="super_admin">Super Admin (Full Access)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-extrabold text-slate-800">
                    📍 Allot Serviceable Pincodes to Franchise *
                  </label>
                  <span className="text-[10px] text-indigo-600 font-bold">
                    Super Admin Allocation
                  </span>
                </div>

                <input
                  type="text"
                  value={pincodes}
                  onChange={(e) => setPincodes(e.target.value)}
                  placeholder="e.g. 822114, 834001, 800001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-hidden focus:border-indigo-600 bg-amber-50/30"
                />

                {/* Master Pincodes Quick Toggle Badges */}
                {(() => {
                  const masterPins = db.getSettings().serviceable_pincodes || ['822114', '834001', '800001', '834002', '822115'];
                  const currentPinList = pincodes
                    .split(',')
                    .map((p) => p.trim())
                    .filter(Boolean);

                  const otherAdmins = admins.filter((a) => a.id !== editingAdmin?.id);
                  const occupantMap = new Map<string, { storeName: string; adminName: string }>();
                  otherAdmins.forEach((other) => {
                    (other.assigned_pincodes || []).forEach((p) => {
                      if (p) occupantMap.set(p.trim(), { storeName: other.store_name || 'Franchise Store', adminName: other.name });
                    });
                  });

                  const togglePin = (pin: string) => {
                    const occ = occupantMap.get(pin);
                    if (occ && !currentPinList.includes(pin)) {
                      setMessage({
                        type: 'error',
                        text: `🔒 Pincode ${pin} is already allotted to '${occ.storeName}' (${occ.adminName})! De-allocate it from ${occ.adminName} first to transfer.`,
                      });
                      return;
                    }

                    if (currentPinList.includes(pin)) {
                      const updated = currentPinList.filter((p) => p !== pin);
                      setPincodes(updated.join(', '));
                    } else {
                      const updated = [...currentPinList, pin];
                      setPincodes(updated.join(', '));
                    }
                  };

                  return (
                    <div className="mt-2 space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-600 block">
                        Click Master Pincodes to Quick-Allot to this Admin (🔒 = Allotted to another Franchise):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {masterPins.map((pin) => {
                          const isSelected = currentPinList.includes(pin);
                          const occ = occupantMap.get(pin);
                          const isOccupiedByOther = !!occ && !isSelected;

                          return (
                            <button
                              key={pin}
                              type="button"
                              onClick={() => togglePin(pin)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-2xs scale-105'
                                  : isOccupiedByOther
                                  ? 'bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 cursor-not-allowed'
                                  : 'bg-white border border-slate-300 text-slate-700 hover:border-indigo-400'
                              }`}
                              title={occ ? `Allotted to '${occ.storeName}' (${occ.adminName})` : `Allot pincode ${pin}`}
                            >
                              <span>{pin}</span>
                              {isSelected ? (
                                '✓'
                              ) : isOccupiedByOther ? (
                                <span className="text-[9px] font-bold text-amber-800 flex items-center gap-0.5">
                                  🔒 ({occ.storeName.slice(0, 10)})
                                </span>
                              ) : (
                                '+'
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <p className="text-[10px] text-slate-500 mt-1.5">
                  ⚡ Customers entering these pincodes will be <b>automatically routed & assigned</b> to this Franchise Admin's panel!
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'ACTIVE'}
                      onChange={() => setStatus('ACTIVE')}
                    />
                    <span className="text-emerald-700">ACTIVE</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'INACTIVE'}
                      onChange={() => setStatus('INACTIVE')}
                    />
                    <span className="text-rose-700">INACTIVE (Locked)</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg shadow-xs"
                >
                  {editingAdmin ? 'Update Admin' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
