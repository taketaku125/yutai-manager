import { supabase } from "./supabase";
import { UserHolding, BenefitRule, Stock } from "@/types";

// Note: In Cloud environment (Vercel), we use Supabase instead of local JSON files.
// Data is stored in 'portfolio' table with ID 'single-user' (as we only have one user for now).

interface Database {
  holdings: UserHolding[];
  customRules: BenefitRule[];
  customStocks: Stock[];
}

const INITIAL_DB: Database = {
  holdings: [],
  customRules: [],
  customStocks: [],
};

export async function readDb(): Promise<Database> {
  try {
    const { data, error } = await supabase
      .from('portfolio')
      .select('holdings, custom_rules, custom_stocks')
      .eq('id', 'single-user')
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return INITIAL_DB;
      }
      console.error('Supabase read error:', error);
      return INITIAL_DB;
    }

    return {
      holdings: data.holdings || [],
      customRules: data.custom_rules || [],
      customStocks: data.custom_stocks || [],
    };
  } catch (e) {
    console.error('Critical database read error:', e);
    return INITIAL_DB;
  }
}

export async function writeDb(db: Database): Promise<void> {
  try {
    const { error } = await supabase
      .from('portfolio')
      .upsert({
        id: 'single-user',
        holdings: db.holdings,
        custom_rules: db.customRules,
        custom_stocks: db.customStocks,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Supabase write error:', error);
      throw error;
    }
  } catch (e) {
    console.error('Critical database write error:', e);
    throw e;
  }
}
