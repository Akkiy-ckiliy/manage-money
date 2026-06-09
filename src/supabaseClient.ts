import { createClient } from "@supabase/supabase-js";

// .env.local から安全に鍵を読み込む（C言語のマクロや環境変数と同じ仕組み）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 外部のファイルからいつでも呼び出せるように、Supabaseの窓口（クライアント）をエクスポートする
export const supabase = createClient(supabaseUrl, supabaseAnonKey);