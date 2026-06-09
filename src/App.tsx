import React, { useState } from "react";

// --- 型定義 (TypeScript) ---
interface WishItem {
  id: string;
  title: string;
  cost: number;
  isPlannedThisMonth: boolean;
}

interface ExpenseItem {
  id: string;
  memo: string;
  amount: number;
  createdAt: string;
}

// 💡 収入履歴用の構造体（C言語でいう struct IncomeItem）
interface IncomeItem {
  id: string;
  memo: string;
  amount: number;
  createdAt: string;
}

export default function App() {
  // --- 状態管理 (State) ---
  const [have, setHave] = useState<number>(200000); // 所持金
  const [fixedCost, setFixedCost] = useState<number>(80000); // 固定費

  const [wishList, setWishList] = useState<WishItem[]>([
    {
      id: "1",
      title: "サンプル：夏フェスチケット",
      cost: 30000,
      isPlannedThisMonth: true,
    },
    {
      id: "2",
      title: "サンプル：スニーカー",
      cost: 12000,
      isPlannedThisMonth: false,
    },
  ]);
  const [expenseList, setExpenseList] = useState<ExpenseItem[]>([
    { id: "1", memo: "サンプル：カフェ代", amount: 680, createdAt: "12:30" },
  ]);
  // 💡 収入リスト用のState
  const [incomeList, setIncomeList] = useState<IncomeItem[]>([
    { id: "1", memo: "サンプル：給料", amount: 150000, createdAt: "25日" },
  ]);

  // 入力フォーム用のState
  const [wishTitle, setWishTitle] = useState("");
  const [wishCost, setWishCost] = useState("");
  const [expenseInput, setExpenseInput] = useState("");
  const [incomeInput, setIncomeInput] = useState("");

  // 💡 モーダルの開閉状態を管理するフラグ（最初は全部閉じている）
  const [activeModal, setActiveModal] = useState<
    "wish" | "expense" | "income" | null
  >(null);

  // --- 計算ロジック (自動連動) ---
  const totalPlannedWishCost = wishList
    .filter((item) => item.isPlannedThisMonth)
    .reduce((sum, item) => sum + item.cost, 0);

  const totalSpent = expenseList.reduce((sum, item) => sum + item.amount, 0);

  // 💡 収入の総額も自動で計算してダッシュボードに反映（haveの計算はhandleAddIncomeで行うため、ここは純粋な履歴合計）
  const totalIncome = incomeList.reduce((sum, item) => sum + item.amount, 0);

  const remainingMoney = have - fixedCost - totalPlannedWishCost - totalSpent;

  // --- アクションハンドラー ---

  // 1. やりたいことの追加
  const handleAddWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishTitle || !wishCost) return;

    const newItem: WishItem = {
      id: crypto.randomUUID(),
      title: wishTitle,
      cost: Number(wishCost),
      isPlannedThisMonth: false,
    };

    setWishList([newItem, ...wishList]);
    setWishTitle("");
    setWishCost("");
    setActiveModal("wish"); // 💡 追加したら自動でモーダルを開いて確認させるUX
  };

  // 2. やりたいことのチェック切り替え
  const toggleWishPlan = (id: string) => {
    setWishList(
      wishList.map((item) =>
        item.id === id
          ? { ...item, isPlannedThisMonth: !item.isPlannedThisMonth }
          : item,
      ),
    );
  };

  // 3. 支出の追加
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseInput.trim()) return;

    const match = expenseInput.trim().match(/^(?:(\d+)\s+(.+)|(.+)\s+(\d+))$/);
    if (!match) {
      alert("金額、スペース、メモを入力してください！");
      return;
    }

    const amount = match[1] ? Number(match[1]) : Number(match[4]);
    const memo = match[2] ? match[2].trim() : match[3].trim();

    const newItem: ExpenseItem = {
      id: crypto.randomUUID(),
      memo,
      amount,
      createdAt: new Date().toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setExpenseList([newItem, ...expenseList]);
    setExpenseInput("");
    setActiveModal("expense"); // 💡 追加したら自動でモーダルを開く
  };

  // 4. 収入の追加（履歴保存版）
  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeInput.trim()) return;

    const match = incomeInput.trim().match(/^(?:(\d+)\s+(.+)|(.+)\s+(\d+))$/);
    if (!match) {
      alert("金額、スペース、メモを入力してください！");
      return;
    }

    const amount = match[1] ? Number(match[1]) : Number(match[4]);
    const memo = match[2] ? match[2].trim() : match[3].trim();

    const newItem: IncomeItem = {
      id: crypto.randomUUID(),
      memo,
      amount,
      createdAt: new Date().toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setIncomeList([newItem, ...incomeList]); // 履歴配列に追加
    setHave((prevHave) => prevHave + amount); // 持ち金を増やす
    setIncomeInput("");
    setActiveModal("income"); // 💡 追加したら自動でモーダルを開く
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 px-2 py-4 sm:p-6 font-sans relative">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* ヘッダー */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-3 gap-2">
          <h1 className="text-lg sm:text-xl font-bold tracking-wider text-emerald-400">
            ⚡ BUDGET & DESIRE (dev)
          </h1>
          <span className="text-[10px] sm:text-xs bg-amber-950/40 text-amber-400 px-2 py-0.5 rounded border border-amber-800/30">
            結合待ち（メモリ保存モード）
          </span>
        </header>

        {/* 今月のステータス（コックピット） */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-800">
            <label className="text-[10px] sm:text-xs text-gray-400 block mb-0.5">
              持ち金（総資産）
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
            className={`p-3 sm:p-4 rounded-xl border flex flex-col justify-between ${
              remainingMoney >= 0
                ? "bg-emerald-950/40 border-emerald-800"
                : "bg-rose-950/40 border-rose-800"
            }`}
          >
            <span className="text-[10px] sm:text-xs text-gray-400 block mb-0.5 leading-tight">
              自由に使える残金
            </span>
            <span
              className={`text-lg sm:text-2xl font-bold block mt-1 ${
                remainingMoney >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              ¥{remainingMoney.toLocaleString()}
            </span>
          </div>
        </section>

        {/* 1. 収入の入力 ＆ 履歴ボタン */}
        <section className="bg-gray-900 p-3.5 sm:p-4 rounded-xl border border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex justify-between items-center flex-1">
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-emerald-400">
                💰 収入の追加
              </h3>
              <p className="text-[10px] text-gray-500">
                「50000 給料」等で即時加算
              </p>
            </div>
            {/* 💡 履歴を見るためのボタン。タップすると activeModal が "income" になる */}
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
              placeholder="金額とメモを入力..."
              value={incomeInput}
              onChange={(e) => setIncomeInput(e.target.value)}
              className="w-full sm:w-64 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-emerald-300 font-mono"
            />
          </form>
        </section>

        {/* メインエリア（フォームと履歴ボタンのみを配置して超スッキリ） */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* 左：やりたいこと (Wish List) */}
          <section className="bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-800 space-y-3.5">
            <div className="flex justify-between items-center">
              <h2 className="text-sm sm:text-base font-semibold text-amber-400">
                Wish List
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

          {/* 右：支出の追加 (払った分) */}
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
                placeholder="金額と項目を入力"
                value={expenseInput}
                onChange={(e) => setExpenseInput(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 text-emerald-300 font-mono"
              />
            </form>
          </section>
        </div>
      </div>

      {/* ─── 💡 共通モーダルシステム（背後の黒幕オーバーレイ） ─── */}
      {activeModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-fade-in"
          onClick={() => setActiveModal(null)} // 背景タップで閉じる（C言語のデスクトップアプリのイベントと同じ挙動）
        >
          {/* モーダルコンテンツ本体（Mobile Sに最適化：max-w-sm、縦スクロール可能） */}
          <div
            className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-2xl flex flex-col max-h-[85vh] shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()} // 💡 モーダル内タップで勝手に閉じるのを防止
          >
            {/* モーダルヘッダー */}
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h3
                className={`text-sm sm:text-base font-bold ${
                  activeModal === "wish" ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {activeModal === "wish" && "📋 Wish List 一覧"}
                {activeModal === "expense" && "📜 支出履歴（払った分）"}
                {activeModal === "income" && "📊 収入履歴（入った分）"}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-500 hover:text-white font-mono text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* モーダルボディ（💡 overflow-y-auto でここだけが縦スクロールします！） */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {/* 【A】Wish List の中身 */}
              {activeModal === "wish" &&
                wishList.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${item.isPlannedThisMonth ? "bg-amber-950/20 border-amber-500/50" : "bg-gray-950 border-gray-800/80"}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <input
                        type="checkbox"
                        checked={item.isPlannedThisMonth}
                        onChange={() => toggleWishPlan(item.id)}
                        className="w-4 h-4 rounded accent-amber-500 cursor-pointer flex-shrink-0"
                      />
                      <span
                        className={`text-xs sm:text-sm truncate ${item.isPlannedThisMonth ? "text-amber-200" : "text-gray-300"}`}
                      >
                        {item.title}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-400 flex-shrink-0">
                      ¥{item.cost.toLocaleString()}
                    </span>
                  </div>
                ))}

              {/* 【B】支出履歴 の中身 */}
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
                        {item.createdAt}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-rose-400 flex-shrink-0">
                      -¥{item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}

              {/* 【C】収入履歴 の中身 */}
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
                        {item.createdAt}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-emerald-400 flex-shrink-0">
                      +¥{item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>

            {/* モーダルフッター（合計値などを固定表示） */}
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
