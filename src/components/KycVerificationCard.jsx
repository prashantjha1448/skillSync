import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Smartphone, KeyRound, CheckCircle2, Loader2 } from 'lucide-react';
import { kycApi } from '../api/endpoints';

const KycVerificationCard = () => {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const triggerKycOtp = async (e) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) return;
    setLoading(true);
    setError('');
    try {
      await kycApi.sendOtp({ phoneNumber: `+91${phoneNumber}` });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verifyKycOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      await kycApi.verifyOtp({ phoneNumber: `+91${phoneNumber}`, otp });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) return null;

  return (
    <div className="w-full bg-gradient-to-br from-indigo-600/10 via-transparent to-transparent border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-start gap-4 max-w-xl">
          <div className="p-3 bg-indigo-600/10 text-indigo-500 rounded-2xl border border-indigo-500/20 shrink-0">
            <ShieldCheck size={24} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Complete KYC Verification</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Verify your identity to activate location radar and financial features.
            </p>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={triggerKycOtp} className="w-full md:w-auto flex flex-col sm:flex-row gap-2 shrink-0">
            <div className="flex bg-accent/40 border border-border rounded-xl px-3.5 py-2.5 items-center focus-within:border-primary/40 transition-all">
              <Smartphone size={16} className="text-muted-foreground mr-2" />
              <input type="text" maxLength="10" placeholder="Mobile Number"
                value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                className="bg-transparent border-none outline-none w-full sm:w-40 text-xs font-semibold text-foreground placeholder:text-muted-foreground" />
            </div>
            <button type="submit" disabled={phoneNumber.length !== 10 || loading}
              className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <>Get OTP <ArrowRight size={14} /></>}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyKycOtp} className="w-full md:w-auto flex flex-col sm:flex-row gap-2 shrink-0">
            <div className="flex bg-accent/40 border border-border rounded-xl px-3.5 py-2.5 items-center focus-within:border-primary/40 transition-all">
              <KeyRound size={16} className="text-muted-foreground mr-2" />
              <input type="text" maxLength="6" placeholder="6-Digit OTP"
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="bg-transparent border-none outline-none w-full sm:w-40 text-xs font-mono font-bold text-foreground tracking-widest" />
            </div>
            <button type="submit" disabled={otp.length !== 6 || loading}
              className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <>Verify <CheckCircle2 size={14} /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default KycVerificationCard;