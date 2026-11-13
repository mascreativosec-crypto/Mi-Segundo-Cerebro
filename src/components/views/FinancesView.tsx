import React, { useEffect, useState } from 'react';
import { AppStoreData } from '../../services/storage';
import { BankAccount, CreditAccount, CreditPayment, FinancialTransaction } from '../../types';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Wallet,
  PieChart,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface FinancesViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  initialAction?: 'add_tx' | null;
  onClearInitialAction?: () => void;
}

export const FinancesView: React.FC<FinancesViewProps> = ({
  data,
  onUpdateData,
  initialAction,
  onClearInitialAction,
}) => {
  const [activeTab, setActiveTab] = useState<'movimientos' | 'cuentas_pagar' | 'bancos' | 'distribucion'>('movimientos');

  // New transaction modal
  const [showAddTx, setShowAddTx] = useState(false);
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState<number>(150);
  const [txType, setTxType] = useState<FinancialTransaction['type']>('expense');
  const [txCategory, setTxCategory] = useState('Alimentación & Supermercado');
  const [txBankAccountId, setTxBankAccountId] = useState<string>(data.personalFinances.bankAccounts[0]?.id || '');

  useEffect(() => {
    if (initialAction === 'add_tx') {
      setTxType('expense');
      setShowAddTx(true);
      onClearInitialAction?.();
    }
  }, [initialAction, onClearInitialAction]);

  // New Credit Account modal
  const [showAddCredit, setShowAddCredit] = useState(false);
  const [creditName, setCreditName] = useState('');
  const [creditCategory, setCreditCategory] = useState<CreditAccount['category']>('tarjeta_credito');
  const [creditTotalAmount, setCreditTotalAmount] = useState<number>(1000);
  const [creditCurrentBalance, setCreditCurrentBalance] = useState<number>(1000);
  const [creditDueDate, setCreditDueDate] = useState('Día 25 de cada mes');
  const [creditInstitution, setCreditInstitution] = useState('');

  // Payment / Abono modal
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(200);
  const [paymentNote, setPaymentNote] = useState('Abono a capital');
  const [paymentSourceAccountId, setPaymentSourceAccountId] = useState<string>(data.personalFinances.bankAccounts[0]?.id || '');

  // New Bank Account modal
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankType, setBankType] = useState<BankAccount['accountType']>('checking');
  const [bankBalance, setBankBalance] = useState<number>(2000);
  const [bankInstitution, setBankInstitution] = useState('Banco Pichincha');

  const personal = data.personalFinances;

  // Calculate totals
  const totalBankLiquidity = personal.bankAccounts.reduce((acc, b) => acc + (b.currentBalance || 0), 0);
  const totalDebtsRemaining = personal.creditAccounts.reduce((acc, c) => acc + (c.currentBalanceRemaining || 0), 0);

  // Group expenses by category
  const expenseTransactions = personal.transactions.filter((tx) => tx.type === 'expense' || tx.type === 'debt_payment');
  const totalExpenses = expenseTransactions.reduce((acc, tx) => acc + tx.amount, 0);

  const categoryTotals: Record<string, number> = {};
  expenseTransactions.forEach((tx) => {
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
  });

  const categoriesSorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  const categoriesList = [
    'Vivienda & Servicios',
    'Alimentación & Supermercado',
    'Transporte & Movilidad',
    'Salud & Bienestar',
    'Educación & Cursos',
    'Entretenimiento & Ocio',
    'Suscripciones & Software',
    'Inversiones / Ahorro',
    'Pago Tarjeta / Crédito',
    'Otros Gastos Personales'
  ];

  // Handlers
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDesc.trim()) return;

    const newTx: FinancialTransaction = {
      id: `tx_${Date.now()}`,
      description: txDesc.trim(),
      amount: Number(txAmount) || 0,
      type: txType,
      category: txCategory,
      date: new Date().toISOString().split('T')[0],
      scope: 'personal',
      bankAccountId: txBankAccountId || undefined,
    };

    onUpdateData((prev) => {
      const updatedBanks = prev.personalFinances.bankAccounts.map((b) => {
        if (b.id === txBankAccountId) {
          const delta = txType === 'income' ? Number(txAmount) : -Number(txAmount);
          return { ...b, currentBalance: Math.max(0, b.currentBalance + delta) };
        }
        return b;
      });

      return {
        ...prev,
        personalFinances: {
          ...prev.personalFinances,
          bankAccounts: updatedBanks,
          transactions: [newTx, ...prev.personalFinances.transactions],
          monthlyExpenses: txType === 'expense' ? prev.personalFinances.monthlyExpenses + Number(txAmount) : prev.personalFinances.monthlyExpenses,
          monthlyIncome: txType === 'income' ? prev.personalFinances.monthlyIncome + Number(txAmount) : prev.personalFinances.monthlyIncome,
        },
      };
    });

    setShowAddTx(false);
    setTxDesc('');
  };

  const handleCreateCreditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditName.trim()) return;

    const newCredit: CreditAccount = {
      id: `ca_${Date.now()}`,
      name: creditName.trim(),
      category: creditCategory,
      totalLimitOrOriginalAmount: Number(creditTotalAmount) || 1000,
      currentBalanceRemaining: Number(creditCurrentBalance) || 1000,
      dueDate: creditDueDate.trim() || 'Día 30',
      institution: creditInstitution.trim() || 'Entidad Financiera',
      payments: [],
    };

    onUpdateData((prev) => ({
      ...prev,
      personalFinances: {
        ...prev.personalFinances,
        creditAccounts: [...prev.personalFinances.creditAccounts, newCredit],
        debtsTotal: prev.personalFinances.debtsTotal + newCredit.currentBalanceRemaining,
      },
    }));

    setShowAddCredit(false);
    setCreditName('');
  };

  const handleCreateBankAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) return;

    const newBank: BankAccount = {
      id: `ba_${Date.now()}`,
      name: bankName.trim(),
      accountType: bankType,
      currentBalance: Number(bankBalance) || 0,
      currency: 'USD',
      institution: bankInstitution.trim() || 'Banco',
    };

    onUpdateData((prev) => ({
      ...prev,
      personalFinances: {
        ...prev.personalFinances,
        bankAccounts: [...prev.personalFinances.bankAccounts, newBank],
      },
    }));

    setShowAddBank(false);
    setBankName('');
  };

  const handleRegisterCreditPayment = (creditAccountId: string) => {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;

    onUpdateData((prev) => {
      const targetCredit = prev.personalFinances.creditAccounts.find((c) => c.id === creditAccountId);
      if (!targetCredit) return prev;

      const newPayment: CreditPayment = {
        id: `cp_${Date.now()}`,
        creditAccountId: creditAccountId,
        date: new Date().toISOString().split('T')[0],
        amount: amount,
        sourceAccountId: paymentSourceAccountId,
        note: paymentNote.trim() || 'Abono registrado',
      };

      const updatedCredits = prev.personalFinances.creditAccounts.map((c) => {
        if (c.id === creditAccountId) {
          const newRemaining = Math.max(0, c.currentBalanceRemaining - amount);
          return {
            ...c,
            currentBalanceRemaining: newRemaining,
            payments: [newPayment, ...c.payments],
          };
        }
        return c;
      });

      const updatedBanks = prev.personalFinances.bankAccounts.map((b) => {
        if (b.id === paymentSourceAccountId) {
          return { ...b, currentBalance: Math.max(0, b.currentBalance - amount) };
        }
        return b;
      });

      const newTx: FinancialTransaction = {
        id: `tx_${Date.now()}`,
        description: `Abono a ${targetCredit.name}`,
        amount: amount,
        type: 'debt_payment',
        category: 'Pago Tarjeta / Crédito',
        date: new Date().toISOString().split('T')[0],
        scope: 'personal',
        bankAccountId: paymentSourceAccountId,
        creditAccountId: creditAccountId,
      };

      return {
        ...prev,
        personalFinances: {
          ...prev.personalFinances,
          creditAccounts: updatedCredits,
          bankAccounts: updatedBanks,
          debtsTotal: Math.max(0, prev.personalFinances.debtsTotal - amount),
          transactions: [newTx, ...prev.personalFinances.transactions],
        },
      };
    });

    setShowPaymentModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Apple Liquid Glass with vibrant squircle icon */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
              <DollarSign className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Mis Finanzas Personales
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Control de ingresos, distribución de gastos, saldos bancarios y amortización de créditos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAddCredit(true)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Cuenta por Pagar</span>
            </button>
            <button
              onClick={() => setShowAddTx(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Registrar Movimiento</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-md dark:shadow-xl space-y-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Liquidez Bancaria Total</span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight block">
            ${totalBankLiquidity.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">{personal.bankAccounts.length} cuentas activas</span>
        </div>

        <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-md dark:shadow-xl space-y-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Cuentas por Pagar / Deudas</span>
          <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight block">
            ${totalDebtsRemaining.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">{personal.creditAccounts.length} cuentas abiertas</span>
        </div>

        <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-md dark:shadow-xl space-y-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Fondo de Emergencia</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight block">
            ${personal.emergencyFund.toLocaleString()}
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Reserva blindada</span>
        </div>

        <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-md dark:shadow-xl space-y-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Patrimonio Neto Personal</span>
          <span className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 tracking-tight block">
            ${(totalBankLiquidity + personal.investmentsTotal - totalDebtsRemaining).toLocaleString()}
          </span>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">Activos menos pasivos</span>
        </div>
      </div>

      {/* Sub-Tabs: Apple Segmented Control */}
      <div className="p-1.5 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06] backdrop-blur-md flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('movimientos')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'movimientos'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Historial de Movimientos
        </button>

        <button
          onClick={() => setActiveTab('cuentas_pagar')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'cuentas_pagar'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Cuentas por Pagar ({personal.creditAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bancos')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'bancos'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Cuentas de Banco ({personal.bankAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('distribucion')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'distribucion'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Distribución de Gastos</span>
        </button>
      </div>

      {/* TAB 1: MOVIMIENTOS */}
      {activeTab === 'movimientos' && (
        <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Registro de Ingresos & Gastos</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cada salida e ingreso clasificado con exactitud.</p>
            </div>
            <button
              onClick={() => setShowAddTx(true)}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Ingreso / Gasto
            </button>
          </div>

          <div className="space-y-2">
            {personal.transactions.map((tx) => {
              const bankAccount = personal.bankAccounts.find((b) => b.id === tx.bankAccountId);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] text-xs hover:border-slate-300 dark:hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : tx.type === 'debt_payment'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : tx.type === 'investment'
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : tx.type === 'debt_payment' ? (
                        <CreditCard className="w-4 h-4" />
                      ) : tx.type === 'investment' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">{tx.description}</span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{tx.category}</span>
                        <span>·</span>
                        <span>{tx.date}</span>
                        {bankAccount && (
                          <>
                            <span>·</span>
                            <span>{bankAccount.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`font-bold text-sm tracking-tight ${
                      tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CUENTAS POR PAGAR & CRÉDITOS */}
      {activeTab === 'cuentas_pagar' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  Cuentas por Pagar, Créditos y Tarjetas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Control de saldos abiertos y amortización estructurada de capital.
                </p>
              </div>

              <button
                onClick={() => setShowAddCredit(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nueva Cuenta
              </button>
            </div>

            {/* Credit Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personal.creditAccounts.map((credit) => {
                const paidAmount = Math.max(0, credit.totalLimitOrOriginalAmount - credit.currentBalanceRemaining);
                const percentPaid = credit.totalLimitOrOriginalAmount > 0
                  ? Math.round((paidAmount / credit.totalLimitOrOriginalAmount) * 100)
                  : 0;

                return (
                  <div
                    key={credit.id}
                    className="p-5 rounded-3xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] flex flex-col justify-between space-y-4 hover:border-emerald-400/40 transition-all shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                          {credit.category.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          {percentPaid}% Amortizado
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">{credit.name}</h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{credit.institution || 'Entidad financiera'}</span>

                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Saldo Pendiente:</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            ${credit.currentBalanceRemaining.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>Monto Original / Límite:</span>
                          <span className="font-medium">${credit.totalLimitOrOriginalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>Vencimiento / Corte:</span>
                          <span className="font-medium">{credit.dueDate}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                          style={{ width: `${percentPaid}%` }}
                        />
                      </div>
                    </div>

                    {/* Action buttons and payments log */}
                    <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.06] space-y-3">
                      <button
                        onClick={() => {
                          setShowPaymentModal(credit.id);
                          setPaymentAmount(Math.min(200, credit.currentBalanceRemaining));
                        }}
                        className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Registrar Abono / Pago
                      </button>

                      {credit.payments.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                            Últimos Abonos ({credit.payments.length}):
                          </span>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {credit.payments.slice(0, 3).map((p) => (
                              <div key={p.id} className="flex justify-between text-[11px] text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200/60 dark:border-white/[0.04]">
                                <span>{p.date} · {p.note}</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">+${p.amount}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUENTAS BANCARIAS */}
      {activeTab === 'bancos' && (
        <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                Cuentas Bancarias & Billeteras
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tus depósitos y saldos líquidos disponibles.</p>
            </div>
            <button
              onClick={() => setShowAddBank(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir Cuenta
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {personal.bankAccounts.map((bank) => (
              <div key={bank.id} className="p-5 rounded-3xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">{bank.institution}</span>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {bank.accountType}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{bank.name}</h4>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight pt-2">
                  ${bank.currentBalance.toLocaleString()} <span className="text-xs text-slate-400">{bank.currency}</span>
                </div>
                {bank.notes && <p className="text-[11px] text-slate-500 dark:text-slate-400">{bank.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DISTRIBUCIÓN */}
      {activeTab === 'distribucion' && (
        <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-500" />
              ¿En qué se fue mi dinero? (Desglose por Categoría)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Análisis exacto de cada salida de capital para erradicar fugas financieras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {categoriesSorted.map(([category, amount]) => {
                const percent = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{category}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        ${amount.toLocaleString()} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 rounded-3xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1">Diagnóstico Financiero Personal</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Tus mayores gastos se concentran en <strong className="text-emerald-600 dark:text-emerald-400">{categoriesSorted[0]?.[0] || 'Vivienda'}</strong> y <strong className="text-emerald-600 dark:text-emerald-400">{categoriesSorted[1]?.[0] || 'Alimentación'}</strong>.
                  La amortización constante de deudas acelera tu libertad patrimonial.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                <div className="flex justify-between">
                  <span>Total Gastos & Salidas:</span>
                  <span className="font-bold text-slate-900 dark:text-white">${totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Capacidad de Ahorro / Inversión:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Sana (&gt; 35%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR ABONO */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Registrar Abono / Pago a Cuenta
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ingresa el monto del abono. Se descontará del saldo pendiente y de la cuenta de banco seleccionada.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Monto a Abonar ($)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Pagar desde Cuenta de Banco</label>
                <select
                  value={paymentSourceAccountId}
                  onChange={(e) => setPaymentSourceAccountId(e.target.value)}
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                >
                  {personal.bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (${b.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Nota o Referencia</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Ej: Abono de $200 quincenal"
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowPaymentModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleRegisterCreditPayment(showPaymentModal)}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-md"
              >
                Confirmar Abono
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR CUENTA POR PAGAR */}
      {showAddCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <form onSubmit={handleCreateCreditAccount} className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Nueva Cuenta por Pagar / Crédito
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configura deudas abiertas, tarjetas de crédito o compromisos financieros por pagar.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Nombre de la Cuenta / Deuda</label>
                <input
                  type="text"
                  placeholder="Ej: Crédito Abierto $1000, Tarjeta Oro..."
                  value={creditName}
                  onChange={(e) => setCreditName(e.target.value)}
                  required
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Monto Original ($)</label>
                  <input
                    type="number"
                    value={creditTotalAmount}
                    onChange={(e) => setCreditTotalAmount(Number(e.target.value))}
                    required
                    className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Saldo Pendiente ($)</label>
                  <input
                    type="number"
                    value={creditCurrentBalance}
                    onChange={(e) => setCreditCurrentBalance(Number(e.target.value))}
                    required
                    className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Categoría</label>
                  <select
                    value={creditCategory}
                    onChange={(e) => setCreditCategory(e.target.value as any)}
                    className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="tarjeta_credito">Tarjeta de Crédito</option>
                    <option value="credito_bancario">Crédito Bancario</option>
                    <option value="prestamo_personal">Préstamo Personal</option>
                    <option value="cuenta_por_pagar">Cuenta Abierta / Por Pagar</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Fecha de Corte / Pago</label>
                  <input
                    type="text"
                    value={creditDueDate}
                    onChange={(e) => setCreditDueDate(e.target.value)}
                    placeholder="Ej: Día 28 de cada mes"
                    className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowAddCredit(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-md"
              >
                Crear Cuenta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: NUEVA CUENTA DE BANCO */}
      {showAddBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <form onSubmit={handleCreateBankAccount} className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              Nueva Cuenta Bancaria / Billetera
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Nombre de la Cuenta</label>
                <input
                  type="text"
                  placeholder="Ej: Banco Pichincha Ahorros..."
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Saldo Actual ($)</label>
                  <input
                    type="number"
                    value={bankBalance}
                    onChange={(e) => setBankBalance(Number(e.target.value))}
                    required
                    className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Tipo</label>
                  <select
                    value={bankType}
                    onChange={(e) => setBankType(e.target.value as any)}
                    className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="checking">Cuenta Corriente</option>
                    <option value="savings">Cuenta de Ahorros</option>
                    <option value="cash">Efectivo / Caja</option>
                    <option value="investment">Inversión Líquida</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowAddBank(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-md"
              >
                Guardar Cuenta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: NUEVA TRANSACCIÓN */}
      {showAddTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <form onSubmit={handleAddTransaction} className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Registrar Movimiento Personal
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Descripción del Movimiento</label>
                <input
                  type="text"
                  placeholder="Ej: Pago de supermercado semanal..."
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  required
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Monto ($)</label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                    required
                    className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Tipo de Movimiento</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="expense">Gasto / Pago Rápido</option>
                    <option value="debt_payment">Pago Tarjeta / Crédito</option>
                    <option value="income">Ingreso / Entrada</option>
                    <option value="investment">Ahorro / Inversión</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Categoría</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Cuenta de Banco / Origen</label>
                <select
                  value={txBankAccountId}
                  onChange={(e) => setTxBankAccountId(e.target.value)}
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                >
                  {personal.bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (${b.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowAddTx(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-md"
              >
                Guardar Movimiento
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
