import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";

// --- 型定義 (TypeScript) ---
interface WishItem {
  id: string;
  title: string;
  cost: number;
  is_planned_this_month: boolean;
}

interface ExpenseItem {
  id: string;
  memo: string;
  amount: number;
  created_at: string;
}

interface IncomeItem {
  id: string;
  memo: string;
  amount: number;
  created_at: string;
}

export default function App() {
  // --- 状態管理 (State) ---
  const [have, setHave] = useState<number>(0); // ベース持ち金
  const [fixedCost, setFixedCost] = useState<number>(0); // 固定費

  const [wishList, setWishList] = useState<WishItem[]>([]);
  const [expenseList, setExpenseList] = useState<ExpenseItem[]>([]);
  const [incomeList, setIncomeList] = useState<IncomeItem[]>([]);

  // 入力フォーム用のState
  const [wishTitle, setWishTitle] = useState("");
  const [wishCost, setWishCost] = useState("");
  const [expenseInput, setExpenseInput] = useState("");
  const [incomeInput, setIncomeInput] = useState("");

  // モーダルの開閉状態
  const [activeModal, setActiveModal] = useState<
    "wish" | "expense" | "income" | null
  >(null);

  // チラつき防止：データ読み込み中フラグ
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 初回実行の判定用フラグ（エディタルール対策）
  const isFirstRender = useRef(true);

  // ─── 💾 【DOWNLOAD】Supabaseから全データをロードする関数群 ───

  const fetchExpenses = useCallback(async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setExpenseList(data);
  }, []);

  const fetchIncomes = useCallback(async () => {
    const { data, error } = await supabase
      .from("incomes")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setIncomeList(data);
  }, []);

  const fetchWishes = useCallback(async () => {
    const { data, error } = await supabase
      .from("wishes")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setWishList(data);
  }, []);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchExpenses(), fetchIncomes(), fetchWishes()]);
    setIsLoading(false);
  }, [fetchExpenses, fetchIncomes, fetchWishes]);

  // カッコ [ ] を使わない起動時1回実行
  useEffect(() => {
    if (isFirstRender.current) {
      fetchAllData();
      isFirstRender.current = false;
    }
  });

  // ─── 🧮 【📐 計算ロジック】 ───
  const totalIncome = incomeList.reduce((sum, item) => sum + item.amount, 0);
  const totalPlannedWishCost = wishList
    .filter((item) => item.is_planned_this_month)
    .reduce((sum, item) => sum + item.cost, 0);
  const totalSpent = expenseList.reduce((sum, item) => sum + item.amount, 0);
  const remainingMoney =
    have + totalIncome - fixedCost - totalPlannedWishCost - totalSpent;

  // ─── ✍️ 【UPLOAD】データ追加・更新ハンドラー ───

  const handleAddWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishTitle || !wishCost) return;

    const newItem = {
      title: wishTitle,
      cost: Number(wishCost),
      is_planned_this_month: false,
    };
    const { error } = await supabase.from("wishes").insert([newItem]);
    if (error) return;

    await fetchWishes();
    setWishTitle("");
    setWishCost("");
    setActiveModal("wish");
  };

  const toggleWishPlan = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("wishes")
      .update({ is_planned_this_month: !currentStatus })
      .eq("id", id);
    if (error) return;
    await fetchWishes();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseInput.trim()) return;

    const match = expenseInput.trim().match(/^(?:(\d+)\s+(.*)|(.+)\s+(\d+))$/);
    if (!match) {
      alert("金額、スペース、メモを入力してください！");
      return;
    }

    const amount = match[1] ? Number(match[1]) : Number(match[4]);
    const memo = match[2] ? match[2].trim() : match[3].trim();
    const newItem = { memo, amount };

    const { error } = await supabase.from("expenses").insert([newItem]);
    if (error) return;

    await fetchExpenses();
    setExpenseInput("");
    setActiveModal("expense");
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeInput.trim()) return;

    const match = incomeInput.trim().match(/^(?:(\d+)\s+(.*)|(.+)\s+(\d+))$/);
    if (!match) {
      alert("金額、スペース、メモを入力してください！");
      return;
    }

    const amount = match[1] ? Number(match[1]) : Number(match[4]);
    const memo = match[2] ? match[2].trim() : match[3].trim();
    const newItem = { memo, amount };

    const { error } = await supabase.from("incomes").insert([newItem]);
    if (error) return;

    await fetchIncomes();
    setIncomeInput("");
    setActiveModal("income");
  };

  // ─── 🗑️ 【DELETE】新機能：Supabaseからデータを削除する関数群 ───

  // 1. Wishの削除
  const handleDeleteWish = async (id: string) => {
    if (!confirm("この項目を削除してよろしいですか？")) return;
    const { error } = await supabase.from("wishes").delete().eq("id", id);
    if (!error) await fetchWishes();
  };

  // 2. 支出の削除
  const handleDeleteExpense = async (id: string) => {
    if (!confirm("この支出履歴を削除してよろしいですか？")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (!error) await fetchExpenses();
  };

  // 3. 収入の削除
  const handleDeleteIncome = async (id: string) => {
    if (!confirm("この収入履歴を削除してよろしいですか？")) return;
    const { error } = await supabase.from("incomes").delete().eq("id", id);
    if (!error) await fetchIncomes();
  };

  // --- 💡 ロード中は待機 ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center font-sans">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs tracking-widest text-emerald-400 font-mono">
            CONNECTING TO DATABASE...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-700 text-gray-100 px-2 py-4 sm:p-6 font-sans relative">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* ヘッダー */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-1 gap-2">
          <h1 className="text-sm sm:text-xl font-bold tracking-wider text-purple-400 ">
            ⚡ BUDGET & DESIRE
          </h1>
        </header>

        {/* ステータスボード */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-1 sm:gap-4">
          <div className="bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-800">
            <label className="text-[10px] sm:text-xs text-gray-400 block mb-0.5">
              ベース持ち金
            </label>
            <input
              type="number"
              value={have}
              onChange={(e) => setHave(Number(e.target.value))}
              className="bg-transparent text-base sm:text-xl font-semibold text-emerald-400 focus:outline-none w-full border-b border-dashed border-gray-700 pb-0.5"
            />
          </div>
          <div className="bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-800">
            <label className="text-[10px] sm:text-xs text-gray-400 block mb-0.5">
              固定費
            </label>
            <input
              type="number"
              value={fixedCost}
              onChange={(e) => setFixedCost(Number(e.target.value))}
              className="bg-transparent text-base sm:text-xl font-semibold text-white focus:outline-none w-full border-b border-dashed border-gray-700 pb-0.5"
            />
          </div>
          <div className="bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-800 flex flex-col justify-between">
            <span className="text-[10px] sm:text-xs text-gray-400 block mb-0.5 leading-tight">
              今月の出費予定額
            </span>
            <span className="text-base sm:text-xl font-semibold text-amber-400 block mt-1">
              ¥{totalPlannedWishCost.toLocaleString()}
            </span>
          </div>
          <div
            className={`p-3 sm:p-4 rounded-xl border flex flex-col justify-between ${remainingMoney >= 0 ? "bg-emerald-950 border-emerald-800" : "bg-rose-950 border-rose-800"}`}
          >
            <span className="text-[10px] sm:text-xs text-gray-400 block mb-0.5 leading-tight">
              自由に使える残金
            </span>
            <span
              className={`text-lg sm:text-2xl font-bold block mt-1 ${remainingMoney >= 0 ? "text-emerald-600" : "text-rose-400"}`}
            >
              ¥{remainingMoney.toLocaleString()}
            </span>
          </div>
        </section>

        {/* 収入の追加セクション */}
        <section className="bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1">
          <div className="flex justify-between items-center flex-1">
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-emerald-400">
                💰 収入の追加
              </h3>
            </div>
            <button
              onClick={() => setActiveModal("income")}
              className="bg-gray-950 hover:bg-gray-800 text-[10px] sm:text-xs text-emerald-400 px-2.5 py-1.5 rounded border border-emerald-900/50 transition-colors font-mono ml-2"
            >
              📊 履歴 ({incomeList.length}件)
            </button>
          </div>
          <form onSubmit={handleAddIncome} className="w-full sm:w-auto">
            <input
              type="text"
              placeholder="金額・メモを入力"
              value={incomeInput}
              onChange={(e) => setIncomeInput(e.target.value)}
              className="w-full sm:w-64 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-emerald-300 font-mono"
            />
          </form>
        </section>
        {/* 左：Wish List */}
        <section className="bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-800 space-y-3.5">
          <div className="flex justify-between items-center">
            <h2 className="text-sm sm:text-base font-semibold text-amber-400">
              🫧 Wish List
            </h2>
            <button
              onClick={() => setActiveModal("wish")}
              className="bg-gray-950 hover:bg-gray-800 text-[10px] sm:text-xs text-amber-400 px-2.5 py-1.5 rounded border border-amber-900/30 font-mono"
            >
              📋 リスト表示 ({wishList.length}件)
            </button>
          </div>

          <form
            onSubmit={handleAddWish}
            className="grid grid-cols-3 sm:grid-cols-3 gap-2"
          >
            <input
              type="text"
              placeholder="やりたいこと"
              value={wishTitle}
              onChange={(e) => setWishTitle(e.target.value)}
              className="sm:col-span-2 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
            />
            <input
              type="number"
              placeholder="金額"
              value={wishCost}
              onChange={(e) => setWishCost(e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
            />
            <button className="sm:col-span-3 bg-amber-500 hover:bg-amber-600 text-gray-950 text-xs sm:text-sm font-semibold py-2 rounded-lg transition-colors">
              Add Wish
            </button>
          </form>
        </section>

        {/* 右：支出の追加 */}
        <section className="bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-800 space-y-3.5">
          <div className="flex justify-between items-center">
            <h2 className="text-sm sm:text-base font-semibold text-emerald-400">
              💸 払った分
            </h2>
            <button
              onClick={() => setActiveModal("expense")}
              className="bg-gray-950 hover:bg-gray-800 text-[10px] sm:text-xs text-emerald-400 px-2.5 py-1.5 rounded border border-emerald-900/30 font-mono"
            >
              📜 履歴表示 ({expenseList.length}件)
            </button>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-1">
            <input
              type="text"
              placeholder="金額・項目を入力"
              value={expenseInput}
              onChange={(e) => setExpenseInput(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 text-emerald-300 font-mono"
            />
          </form>
        </section>
      </div>

      {/* ─── 共通モーダルシステム（🗑️ 削除ボタン付き） ─── */}
      {activeModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-2xl flex flex-col max-h-[85vh] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h3
                className={`text-sm sm:text-base font-bold ${activeModal === "wish" ? "text-amber-400" : "text-emerald-400"}`}
              >
                {activeModal === "wish" && "📋 Wish List 一覧"}
                {activeModal === "expense" && "📜 支出履歴"}
                {activeModal === "income" && "📊 収入履歴"}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-500 hover:text-white font-mono text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {/* 【A】Wish List */}
              {activeModal === "wish" &&
                wishList.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${item.is_planned_this_month ? "bg-amber-950/20 border-amber-500/50" : "bg-gray-950 border-gray-800/80"}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <input
                        type="checkbox"
                        checked={item.is_planned_this_month}
                        onChange={() =>
                          toggleWishPlan(item.id, item.is_planned_this_month)
                        }
                        className="w-4 h-4 rounded accent-amber-500 cursor-pointer flex-shrink-0"
                      />
                      <span
                        className={`text-xs sm:text-sm truncate ${item.is_planned_this_month ? "text-amber-200" : "text-gray-300"}`}
                      >
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs sm:text-sm font-medium text-gray-400">
                        ¥{item.cost.toLocaleString()}
                      </span>
                      {/* 🗑️ Wish削除ボタン */}
                      <button
                        onClick={() => handleDeleteWish(item.id)}
                        className="text-gray-500 hover:text-rose-400 transition-colors text-xs p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}

              {/* 【B】支出履歴 */}
              {activeModal === "expense" &&
                expenseList.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-2.5 bg-gray-950 border border-gray-800/50 rounded-lg gap-2 font-mono"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs sm:text-sm text-gray-200 truncate">
                        {item.memo}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(item.created_at).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs sm:text-sm font-semibold text-rose-400">
                        -¥{item.amount.toLocaleString()}
                      </span>
                      {/* 🗑️ 支出削除ボタン */}
                      <button
                        onClick={() => handleDeleteExpense(item.id)}
                        className="text-gray-600 hover:text-rose-400 transition-colors text-xs p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}

              {/* 【C】収入履歴 */}
              {activeModal === "income" &&
                incomeList.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-2.5 bg-gray-950 border border-gray-800/50 rounded-lg gap-2 font-mono"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs sm:text-sm text-gray-200 truncate">
                        {item.memo}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(item.created_at).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs sm:text-sm font-semibold text-emerald-400">
                        +¥{item.amount.toLocaleString()}
                      </span>
                      {/* 🗑️ 収入削除ボタン */}
                      <button
                        onClick={() => handleDeleteIncome(item.id)}
                        className="text-gray-600 hover:text-rose-400 transition-colors text-xs p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900/50 rounded-b-2xl font-mono text-right text-xs">
              {activeModal === "wish" && (
                <div>
                  今月の出費予定総額:{" "}
                  <span className="text-amber-400 font-bold">
                    ¥{totalPlannedWishCost.toLocaleString()}
                  </span>
                </div>
              )}
              {activeModal === "expense" && (
                <div>
                  これまでの総支出:{" "}
                  <span className="text-rose-400 font-bold">
                    ¥{totalSpent.toLocaleString()}
                  </span>
                </div>
              )}
              {activeModal === "income" && (
                <div>
                  これまでの総収入:{" "}
                  <span className="text-emerald-400 font-bold">
                    ¥{totalIncome.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
