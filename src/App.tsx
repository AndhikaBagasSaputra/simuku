import { ChevronLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BillDetail, type BillPayInput } from './components/bills/BillDetail'
import { BillForm } from './components/bills/BillForm'
import { BillsPage } from './components/bills/BillsPage'
import { BottomNav } from './components/BottomNav'
import { DebtDetail } from './components/debts/DebtDetail'
import { DebtForm } from './components/debts/DebtForm'
import { DebtsPage } from './components/debts/DebtsPage'
import { HomePage } from './components/home/HomePage'
import { MORE_PAGES, PAGE_INFO, type PageKey } from './components/layout/navigation'
import { Sidebar } from './components/layout/Sidebar'
import { AccountPage } from './components/more/AccountPage'
import { BackupPage, type RestoreMode } from './components/more/BackupPage'
import { UpdatePrompt } from './components/pwa/UpdatePrompt'
import { ExportPage } from './components/more/ExportPage'
import { LockPage } from './components/more/LockPage'
import { MorePage } from './components/more/MorePage'
import { SavingsDetail } from './components/savings/SavingsDetail'
import { SavingsForm } from './components/savings/SavingsForm'
import { SavingsPage } from './components/savings/SavingsPage'
import { SplitBillDetail } from './components/splitbill/SplitBillDetail'
import { SplitBillForm } from './components/splitbill/SplitBillForm'
import { SplitBillsPage } from './components/splitbill/SplitBillsPage'
import { TransactionForm } from './components/TransactionForm'
import { ThemeQuickButton } from './components/ui/ThemeToggle'
import { Toast, type ToastData } from './components/ui/Toast'
import { useDebts } from './hooks/useDebts'
import { DESKTOP_QUERY, useMediaQuery } from './hooks/useMediaQuery'
import { useRecurringBills } from './hooks/useRecurringBills'
import { useSavings } from './hooks/useSavings'
import { useSplitBills } from './hooks/useSplitBills'
import { describeSync, useSync } from './hooks/useSync'
import { useTransactions } from './hooks/useTransactions'
import { mergeData, type BackupData } from './lib/backup'
import { formatShortDate, todayISO, toMonthKey } from './lib/format'
import { defaultPeriod, getRange, isInRange, type Period } from './lib/period'
import { getBillStatus, isAttention } from './lib/recurring'
import { calculateSplit, ME_ID } from './lib/splitBill'
import { planSplitLinks } from './lib/splitLinks'
import type {
  Debt,
  DebtDirection,
  DebtInput,
  RecurringBill,
  RecurringBillInput,
  SavingsGoal,
  SavingsGoalInput,
  SplitBill,
  SplitBillInput,
  Transaction,
  TransactionInput,
} from './types'

/** null = form tertutup, 'new' = tambah baru, objek = edit */
type FormState<T> = null | 'new' | T

function summaryLabel(period: Period) {
  if (period.preset === 'month') return 'Selisih bulan ini'
  if (period.preset === 'all') return 'Selisih keseluruhan'
  return 'Selisih periode ini'
}

function App() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, upsertTransaction, restoreTransactions } =
    useTransactions()
  const { debts, addDebt, updateDebt, deleteDebt, addPayment, deletePayment, upsertDebt, restoreDebts } = useDebts()
  const { splitBills, saveSplitBill, deleteSplitBill, restoreSplitBills } = useSplitBills()
  const { goals, addGoal, updateGoal, deleteGoal, addEntry, deleteEntry, restoreGoals } = useSavings()
  const {
    bills,
    addBill,
    updateBill,
    deleteBill,
    addBillPayment,
    deleteBillPayment,
    removePaymentByTransaction,
    restoreBills,
  } = useRecurringBills()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  // ----- Navigasi -----
  const [currentPage, setPage] = useState<PageKey>('transaksi')
  // Di desktop semua menu ada di sidebar, jadi halaman menu "Lainnya" diganti Target Tabungan
  const page: PageKey = isDesktop && currentPage === 'lainnya' ? 'tabungan' : currentPage
  const [period, setPeriod] = useState<Period>(defaultPeriod)
  const [toast, setToast] = useState<ToastData | null>(null)

  // ----- Panel yang terbuka (detail disimpan id-nya supaya selalu menampilkan data terbaru) -----
  const [transactionForm, setTransactionForm] = useState<FormState<Transaction>>(null)
  const [debtDirection, setDebtDirection] = useState<DebtDirection>('owed_to_me')
  const [debtForm, setDebtForm] = useState<FormState<Debt>>(null)
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)
  const [splitForm, setSplitForm] = useState<FormState<SplitBill>>(null)
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(null)
  const [goalForm, setGoalForm] = useState<FormState<SavingsGoal>>(null)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [billForm, setBillForm] = useState<FormState<RecurringBill>>(null)
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null)

  const selectedDebt = debts.find((d) => d.id === selectedDebtId)
  const selectedSplit = splitBills.find((b) => b.id === selectedSplitId)
  const selectedGoal = goals.find((g) => g.id === selectedGoalId)
  const selectedBill = bills.find((b) => b.id === selectedBillId)

  // Notifikasi hilang sendiri setelah 5 detik
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  function showToast(message: string, action?: ToastData['action']) {
    setToast({ id: Date.now(), message, action })
  }

  const allData: BackupData = { transactions, debts, splitBills, goals, bills }

  function replaceAllData(data: BackupData) {
    restoreTransactions(data.transactions)
    restoreDebts(data.debts)
    restoreSplitBills(data.splitBills)
    restoreGoals(data.goals)
    restoreBills(data.bills)
  }

  // Login & sinkron antar perangkat (tidak melakukan apa-apa kalau belum masuk)
  const account = useSync(allData, replaceAllData)

  /**
   * Jalankan aksi yang bisa dibatalkan (hapus, restore backup).
   * Sebelum aksi, semua data disalin. Tombol "Batalkan" mengembalikan salinan itu,
   * jadi data yang ikut berubah (misalnya hutang dari split bill) juga kembali.
   */
  function withUndo(message: string, action: () => void) {
    const snapshot = allData
    action()
    showToast(message, {
      label: 'Batalkan',
      onClick: () => {
        replaceAllData(snapshot)
        showToast('↩️ Dibatalkan, data dikembalikan')
      },
    })
  }

  function deleteWithUndo(message: string, action: () => void) {
    withUndo(`🗑️ ${message}`, action)
  }

  function handleRestore(data: BackupData, mode: RestoreMode) {
    const next = mode === 'replace' ? data : mergeData(allData, data)
    withUndo('📂 Data berhasil dipulihkan dari backup', () => replaceAllData(next))
  }

  // Transaksi dalam periode terpilih, terbaru di atas
  const range = getRange(period)
  const periodTransactions = transactions
    .filter((t) => isInRange(t.date, range))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

  const personSuggestions = [
    ...new Set([
      ...debts.map((d) => d.person),
      ...splitBills.flatMap((b) => b.participants.filter((p) => p.id !== ME_ID).map((p) => p.name)),
    ]),
  ].sort()

  const lastPaymentInfo =
    [...splitBills].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.paymentInfo ?? ''

  const billsNeedAttention = bills.filter((b) => isAttention(getBillStatus(b, todayISO()).state)).length

  // ----- Transaksi -----
  function handleSelectTransaction(t: Transaction) {
    // Transaksi dari split bill dibuka lewat split bill-nya
    if (t.splitBillId && splitBills.some((b) => b.id === t.splitBillId)) {
      setSelectedSplitId(t.splitBillId)
    } else {
      setTransactionForm(t)
    }
  }

  function handleTransactionSubmit(input: TransactionInput) {
    if (transactionForm === 'new') addTransaction(input)
    else if (transactionForm) updateTransaction(transactionForm.id, input)
    setTransactionForm(null)
    // Periode tidak diubah otomatis. Kalau transaksi di luar periode, kasih tahu.
    if (!isInRange(input.date, range)) {
      showToast(`✅ Tersimpan (${formatShortDate(input.date)}), di luar periode ini`, {
        label: 'Lihat',
        onClick: () => {
          setPeriod({ ...period, preset: 'month', month: toMonthKey(input.date) })
          setToast(null)
        },
      })
    }
  }

  function handleTransactionDelete() {
    const target = transactionForm
    if (target && target !== 'new') {
      deleteWithUndo('Transaksi dihapus', () => {
        deleteTransaction(target.id)
        // Kalau ini pembayaran tagihan, tagihannya kembali jadi belum dibayar
        if (target.recurringBillId) removePaymentByTransaction(target.id)
      })
    }
    setTransactionForm(null)
  }

  // ----- Hutang -----
  function handleDebtSubmit(input: DebtInput) {
    if (debtForm === 'new') addDebt(input)
    else if (debtForm) updateDebt(debtForm.id, input)
    setDebtDirection(input.direction)
    setDebtForm(null)
  }

  // ----- Split bill -----
  function handleSplitSubmit(input: SplitBillInput) {
    const existing = splitForm && splitForm !== 'new' ? splitForm : null
    const id = existing?.id ?? crypto.randomUUID()
    const plan = planSplitLinks(
      id,
      input,
      calculateSplit(input),
      existing?.links ?? { transactionId: null, debts: {} },
      debts,
    )

    if (plan.transaction) upsertTransaction(plan.transaction.id, plan.transaction.input)
    if (plan.deleteTransactionId) deleteTransaction(plan.deleteTransactionId)
    for (const d of plan.upsertDebts) upsertDebt(d.id, d.input)
    for (const debtId of plan.deleteDebtIds) deleteDebt(debtId)

    saveSplitBill({ ...input, id, links: plan.links, createdAt: existing?.createdAt ?? new Date().toISOString() })
    setSplitForm(null)
    setSelectedSplitId(id) // langsung tampilkan hasil + tombol salin teks
  }

  function handleSplitDelete(bill: SplitBill) {
    deleteWithUndo('Split bill dihapus', () => {
      if (bill.links.transactionId) deleteTransaction(bill.links.transactionId)
      for (const debtId of Object.values(bill.links.debts)) deleteDebt(debtId)
      deleteSplitBill(bill.id)
    })
    setSelectedSplitId(null)
  }

  // ----- Tabungan -----
  function handleGoalSubmit(input: SavingsGoalInput) {
    if (goalForm === 'new') addGoal(input)
    else if (goalForm) updateGoal(goalForm.id, input)
    setGoalForm(null)
  }

  // ----- Tagihan rutin -----
  function handleBillSubmit(input: RecurringBillInput) {
    if (billForm === 'new') addBill(input)
    else if (billForm) updateBill(billForm.id, input)
    setBillForm(null)
  }

  function handleBillPay(bill: RecurringBill, input: BillPayInput) {
    let transactionId: string | null = null
    if (input.recordExpense) {
      transactionId = crypto.randomUUID()
      upsertTransaction(transactionId, {
        type: 'expense',
        amount: input.amount,
        categoryId: bill.categoryId,
        date: input.paidDate,
        note: `Tagihan: ${bill.name} (${formatShortDate(input.dueDate)})`,
        recurringBillId: bill.id,
      })
    }
    addBillPayment(bill.id, {
      id: crypto.randomUUID(),
      dueDate: input.dueDate,
      paidDate: input.paidDate,
      amount: input.amount,
      transactionId,
    })
  }

  function handleBillPaymentDelete(bill: RecurringBill, paymentId: string) {
    const payment = bill.payments.find((p) => p.id === paymentId)
    deleteWithUndo('Pembayaran tagihan dibatalkan', () => {
      if (payment?.transactionId) deleteTransaction(payment.transactionId)
      deleteBillPayment(bill.id, paymentId)
    })
  }

  /** Tombol "+" mengikuti halaman yang sedang dibuka */
  function handleAdd() {
    if (page === 'hutang') setDebtForm('new')
    else if (page === 'splitbill') setSplitForm('new')
    else if (page === 'tabungan') setGoalForm('new')
    else if (page === 'tagihan') setBillForm('new')
    else setTransactionForm('new')
  }

  const info = PAGE_INFO[page]
  const showBack = !isDesktop && MORE_PAGES.includes(page) && page !== 'lainnya'

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar page={page} onNavigate={setPage} onAdd={info.addLabel ? handleAdd : undefined} billsBadge={billsNeedAttention} />

      <div className="lg:pl-64">
        <main className="mx-auto max-w-md space-y-4 px-4 pt-6 pb-28 lg:max-w-6xl lg:space-y-6 lg:px-8 lg:pt-8 lg:pb-12">
          <header className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              {showBack && (
                <button
                  type="button"
                  onClick={() => setPage('lainnya')}
                  className="-ml-2 mb-1 flex items-center rounded-lg px-2 py-1 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Lainnya
                </button>
              )}
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 lg:text-3xl">
                {page === 'transaksi' && !isDesktop ? '💰 Simuku' : info.title}
              </h1>
              <p className="text-sm text-slate-500">{info.subtitle}</p>
            </div>
            {/* Di desktop, pilihan tema ada di sidebar */}
            {!isDesktop && <ThemeQuickButton />}
          </header>

          {page === 'transaksi' && (
            <HomePage
              isDesktop={isDesktop}
              transactions={transactions}
              periodTransactions={periodTransactions}
              period={period}
              onPeriodChange={setPeriod}
              summaryLabel={summaryLabel(period)}
              bills={bills}
              onSelectBill={(b) => setSelectedBillId(b.id)}
              onSeeAllBills={() => setPage('tagihan')}
              onAddBill={() => setBillForm('new')}
              onSelectTransaction={handleSelectTransaction}
            />
          )}

          {page === 'hutang' && (
            <DebtsPage
              debts={debts}
              direction={debtDirection}
              onDirectionChange={setDebtDirection}
              onSelect={(d) => setSelectedDebtId(d.id)}
            />
          )}

          {page === 'splitbill' && (
            <SplitBillsPage splitBills={splitBills} onSelect={(b) => setSelectedSplitId(b.id)} />
          )}

          {page === 'lainnya' && (
            <MorePage goals={goals} bills={bills} syncLabel={describeSync(account)} onOpen={setPage} />
          )}
          {page === 'tabungan' && <SavingsPage goals={goals} onSelect={(g) => setSelectedGoalId(g.id)} />}
          {page === 'tagihan' && <BillsPage bills={bills} onSelect={(b) => setSelectedBillId(b.id)} />}
          {page === 'ekspor' && <ExportPage data={allData} />}
          {page === 'backup' && <BackupPage data={allData} onRestore={handleRestore} />}
          {page === 'keamanan' && <LockPage onNotify={showToast} />}
          {page === 'akun' && <AccountPage account={account} />}
        </main>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
      <UpdatePrompt />

      <BottomNav page={page} onNavigate={setPage} onAdd={info.addLabel ? handleAdd : undefined} moreBadge={billsNeedAttention} />

      {/* ===== Panel-panel. key diberi awalan supaya tidak bentrok antar panel ===== */}

      {transactionForm && (
        <TransactionForm
          key={`transaction-form-${transactionForm === 'new' ? 'new' : transactionForm.id}`}
          initial={transactionForm === 'new' ? undefined : transactionForm}
          onSubmit={handleTransactionSubmit}
          onDelete={transactionForm === 'new' ? undefined : handleTransactionDelete}
          onClose={() => setTransactionForm(null)}
        />
      )}

      {selectedSplit && (
        <SplitBillDetail
          key={`split-detail-${selectedSplit.id}`}
          bill={selectedSplit}
          debts={debts}
          onClose={() => setSelectedSplitId(null)}
          onEdit={() => setSplitForm(selectedSplit)}
          onDelete={() => handleSplitDelete(selectedSplit)}
          onOpenDebt={(debtId) => {
            setSelectedSplitId(null)
            setSelectedDebtId(debtId)
          }}
        />
      )}

      {selectedDebt && (
        <DebtDetail
          key={`debt-detail-${selectedDebt.id}`}
          debt={selectedDebt}
          onClose={() => setSelectedDebtId(null)}
          onEdit={() => setDebtForm(selectedDebt)}
          onDelete={() => {
            deleteWithUndo('Hutang dihapus', () => deleteDebt(selectedDebt.id))
            setSelectedDebtId(null)
          }}
          onAddPayment={(input) => addPayment(selectedDebt.id, input)}
          onDeletePayment={(paymentId) =>
            deleteWithUndo('Pembayaran dihapus', () => deletePayment(selectedDebt.id, paymentId))
          }
          splitBillTitle={splitBills.find((b) => b.id === selectedDebt.splitBillId)?.title}
          onOpenSplitBill={() => {
            setSelectedDebtId(null)
            setSelectedSplitId(selectedDebt.splitBillId ?? null)
          }}
        />
      )}

      {selectedGoal && (
        <SavingsDetail
          key={`goal-detail-${selectedGoal.id}`}
          goal={selectedGoal}
          onClose={() => setSelectedGoalId(null)}
          onEdit={() => setGoalForm(selectedGoal)}
          onDelete={() => {
            deleteWithUndo('Target tabungan dihapus', () => deleteGoal(selectedGoal.id))
            setSelectedGoalId(null)
          }}
          onAddEntry={(input) => addEntry(selectedGoal.id, input)}
          onDeleteEntry={(entryId) =>
            deleteWithUndo('Catatan tabungan dihapus', () => deleteEntry(selectedGoal.id, entryId))
          }
        />
      )}

      {selectedBill && (
        <BillDetail
          key={`bill-detail-${selectedBill.id}`}
          bill={selectedBill}
          onClose={() => setSelectedBillId(null)}
          onEdit={() => setBillForm(selectedBill)}
          onDelete={() => {
            deleteWithUndo('Tagihan dihapus', () => deleteBill(selectedBill.id))
            setSelectedBillId(null)
          }}
          onPay={(input) => handleBillPay(selectedBill, input)}
          onDeletePayment={(paymentId) => handleBillPaymentDelete(selectedBill, paymentId)}
        />
      )}

      {debtForm && (
        <DebtForm
          key={`debt-form-${debtForm === 'new' ? 'new' : debtForm.id}`}
          initial={debtForm === 'new' ? undefined : debtForm}
          defaultDirection={debtDirection}
          personSuggestions={personSuggestions}
          onSubmit={handleDebtSubmit}
          onClose={() => setDebtForm(null)}
        />
      )}

      {splitForm && (
        <SplitBillForm
          key={`split-form-${splitForm === 'new' ? 'new' : splitForm.id}`}
          initial={splitForm === 'new' ? undefined : splitForm}
          defaultPaymentInfo={lastPaymentInfo}
          personSuggestions={personSuggestions}
          onSubmit={handleSplitSubmit}
          onClose={() => setSplitForm(null)}
        />
      )}

      {goalForm && (
        <SavingsForm
          key={`goal-form-${goalForm === 'new' ? 'new' : goalForm.id}`}
          initial={goalForm === 'new' ? undefined : goalForm}
          onSubmit={handleGoalSubmit}
          onClose={() => setGoalForm(null)}
        />
      )}

      {billForm && (
        <BillForm
          key={`bill-form-${billForm === 'new' ? 'new' : billForm.id}`}
          initial={billForm === 'new' ? undefined : billForm}
          onSubmit={handleBillSubmit}
          onClose={() => setBillForm(null)}
        />
      )}
    </div>
  )
}

export default App
