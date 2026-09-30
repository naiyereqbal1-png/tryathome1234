import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, ShieldCheck, ArrowRight, RotateCcw, Lock, FileCheck } from 'lucide-react';
import { Order } from '../../types';
import { db } from '../../services/db';

interface TryAtHomeCountdownProps {
  order: Order;
  compact?: boolean;
  onTimerExpire?: () => void;
  onRequestReturnClick?: () => void;
  onFinalBillSubmit?: () => void;
}

export const TryAtHomeCountdown: React.FC<TryAtHomeCountdownProps> = ({
  order,
  compact = false,
  onTimerExpire,
  onRequestReturnClick,
  onFinalBillSubmit,
}) => {
  // Only applicable for Try at Home orders
  if (order.order_type !== 'try_at_home') {
    return null;
  }

  const [timerInfo, setTimerInfo] = useState(() => db.getTryAtHomeTimerInfo(order));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Immediate calculation
    const info = db.getTryAtHomeTimerInfo(order);
    setTimerInfo(info);

    // If delivered, not yet locked, but already expired: trigger auto-return of all items immediately
    if (
      info.isDelivered &&
      info.isExpired &&
      !order.final_bill_generated &&
      !order.final_bill_locked &&
      order.try_at_home_status !== 'CLOSED'
    ) {
      db.autoReturnAllOrderItems(order.order_id);
      setTimerInfo(db.getTryAtHomeTimerInfo(order));
      if (onTimerExpire) onTimerExpire();
      return;
    }

    // If order is not delivered or already expired/closed, no need to tick every second
    if (!info.isDelivered || info.isClosed) {
      return;
    }

    const intervalId = setInterval(() => {
      const updated = db.getTryAtHomeTimerInfo(order);
      setTimerInfo(updated);

      if (updated.isExpired && !info.isExpired) {
        // Auto return all items if customer didn't decide within the 30-minute window
        if (!order.final_bill_generated && !order.final_bill_locked && order.try_at_home_status !== 'CLOSED') {
          db.autoReturnAllOrderItems(order.order_id);
        }
        if (onTimerExpire) {
          onTimerExpire();
        }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [order.id, order.order_id, order.order_status, order.try_at_home_expires_at, order.try_at_home_status, order.final_bill_generated, order.final_bill_locked, onTimerExpire]);

  const handleFinalizeBillClick = () => {
    if (onFinalBillSubmit) {
      onFinalBillSubmit();
      return;
    }
    try {
      setIsSubmitting(true);
      db.generateFinalBill(order.order_id, 'Customer');
      setTimerInfo(db.getTryAtHomeTimerInfo(order));
      if (onTimerExpire) onTimerExpire();
    } catch (err: any) {
      alert(err.message || 'Failed to finalize bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Case 1: Order placed as Try at Home, but NOT yet Delivered
  if (!timerInfo.isDelivered) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
          <Clock className="w-3 h-3 text-indigo-600" />
          <span>Try at Home: {timerInfo.durationMinutes}m timer starts on delivery</span>
        </span>
      );
    }

    return (
      <div className="bg-linear-to-r from-indigo-50 via-purple-50 to-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 text-xs text-indigo-950 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-indigo-900 text-xs">Try at Home Scheduled</span>
              <span className="bg-indigo-200/80 text-indigo-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                {timerInfo.durationMinutes} Mins Allocated
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              जैसे ही डिलीवरी पार्टनर आपके पते पर पैकेट डिलीवर करेगा, आपका <strong>{timerInfo.durationMinutes} मिनट का टाइमर</strong> तुरंत शुरू हो जाएगा।
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[11px] font-bold text-slate-500 block">Status</span>
          <span className="text-xs font-black text-indigo-700">Awaiting Doorstep Delivery</span>
        </div>
      </div>
    );
  }

  // Case 2: Order is Delivered & Timer is CLOSED or EXPIRED
  if (timerInfo.isClosed) {
    const isLocked = timerInfo.isFinalBillLocked || !!order.final_bill_generated || !!order.final_bill_locked;

    if (compact) {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
            isLocked
              ? 'text-amber-900 bg-amber-50 border-amber-300'
              : 'text-rose-700 bg-rose-50 border-rose-200'
          }`}
        >
          {isLocked ? <Lock className="w-3 h-3 text-amber-700" /> : <AlertTriangle className="w-3 h-3 text-rose-600" />}
          <span>
            {isLocked
              ? 'Final Bill Locked (Timer Closed)'
              : `Try at Home Closed (${timerInfo.durationMinutes}m Expired)`}
          </span>
        </span>
      );
    }

    if (isLocked) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 space-y-1 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="bg-amber-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                <Lock className="w-2.5 h-2.5" /> LOCKED
              </span>
              <span className="text-[11px] font-bold text-slate-850 truncate">
                Final Bill Locked (Timer Closed)
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded">
              Timer Closed
            </span>
          </div>

          <div className="text-[11px] text-slate-650 leading-normal flex items-start gap-1">
            <FileCheck className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              फ़ाइनल बिल जनरेट हो चुका है और टाइमर बंद है। No further actions can be performed.
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-rose-50/50 border border-rose-200 rounded-lg p-2.5 space-y-1 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-0.5 shrink-0">
              <AlertTriangle className="w-2.5 h-2.5" /> EXPIRED
            </span>
            <span className="text-[11px] font-bold text-slate-850 truncate">
              Auto All Return Locked (Decision Timeout)
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100/80 px-1.5 py-0.5 rounded">
            All Returned
          </span>
        </div>

        <div className="text-[11px] text-slate-650 leading-normal flex items-start gap-1">
          <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
          <span>
            30 मिनट की समय सीमा समाप्त होने के कारण सभी कपड़े स्वतः रिटर्न और लॉक हो गए हैं।
          </span>
        </div>

        {onRequestReturnClick && (
          <div className="pt-1.5 flex items-center justify-between border-t border-rose-200/60 text-[10px]">
            <span className="text-slate-500">Need return audit breakdown?</span>
            <button
              onClick={onRequestReturnClick}
              className="font-bold text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>View return details</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Case 3: Order is Delivered & Timer is ACTIVE (Counting down!)
  const isUrgent = timerInfo.remainingSeconds < 300; // less than 5 mins

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-lg border shadow-2xs ${
          isUrgent
            ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
            : 'bg-emerald-600 text-white border-emerald-700'
        }`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span className="font-mono">{timerInfo.formattedRemaining}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Try Left</span>
      </span>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-4.5 space-y-3.5 shadow-xs transition-all ${
        isUrgent
          ? 'bg-gradient-to-br from-rose-900 via-slate-900 to-rose-950 text-white border-rose-500 shadow-rose-950/20 ring-2 ring-rose-500/50'
          : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-500/40'
      }`}
    >
      {/* Header with Live Pulsing Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isUrgent ? 'bg-rose-400' : 'bg-emerald-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isUrgent ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
            ></span>
          </span>
          <span
            className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded uppercase ${
              isUrgent ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'
            }`}
          >
            {isUrgent ? 'URGENT • TRIAL ENDING SOON' : 'LIVE TRY-AT-HOME WINDOW'}
          </span>
          <span className="text-xs text-slate-300 font-semibold hidden sm:inline">
            Doorstep Garment Trial in Progress
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
            Decision Allotment
          </span>
          <span className="text-xs font-black text-amber-400 font-mono">
            {timerInfo.durationMinutes} Minutes Window
          </span>
        </div>
      </div>

      {/* Main Countdown Centerpiece */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isUrgent ? 'bg-rose-600/30 text-rose-400' : 'bg-indigo-600/40 text-indigo-300'
            }`}
          >
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block">
              Remaining Time to Try & Decide
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`font-mono text-2xl sm:text-3xl font-black tracking-tight ${
                  isUrgent ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {timerInfo.formattedRemaining}
              </span>
              <span className="text-xs text-slate-400 font-bold font-mono">mins:secs</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px] text-slate-400">
            Elapsed: {timerInfo.progressPercentage}%
          </span>
          <div className="w-36 sm:w-44 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 rounded-full ${
                isUrgent ? 'bg-rose-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${timerInfo.progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Auto-Return Rule Warning Banner */}
      <div className="p-2.5 bg-amber-500/10 border border-amber-400/30 rounded-xl flex items-start gap-2 text-xs text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <strong className="text-amber-300">ऑटो-रिटर्न नियम (Auto-Return Policy):</strong> यदि आप <strong>{timerInfo.durationMinutes} मिनट</strong> में निर्णय नहीं लेते हैं, तो सभी कपड़े अपने-आप रिटर्न (Auto All Return) हो जाएंगे। कपड़े पसंद आने पर <strong>"Final Bill Submit"</strong> करें जिससे टाइमर बंद और सभी एक्शन लॉक हो जाएंगे।
        </div>
      </div>

      {/* Guidance and Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs pt-1 border-t border-white/10">
        <div className="flex items-center gap-2 text-slate-300 text-[11px] leading-relaxed max-w-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            डिलीवरी पार्टनर दरवाजे पर प्रतीक्षा कर रहा है। कपड़े ट्रायल करें और रिटर्न या फाइनल बिल सबमिट करें।
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onRequestReturnClick && (
            <button
              type="button"
              onClick={onRequestReturnClick}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 font-bold text-xs rounded-lg shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Return Items</span>
            </button>
          )}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleFinalizeBillClick}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Submitting...' : 'Final Bill Submit (Lock Order)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
