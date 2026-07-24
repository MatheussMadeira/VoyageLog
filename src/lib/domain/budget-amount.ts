export interface BudgetAmountInput {
  amount: number;
  amountConverted: number | null;
  currency: string;
  referenceCurrency: string;
}

export function resolveBudgetAmountForReferenceCurrency(
  expense: BudgetAmountInput,
): number | null {
  if (expense.amountConverted != null) {
    return expense.amountConverted;
  }

  if (
    expense.currency.toUpperCase() === expense.referenceCurrency.toUpperCase()
  ) {
    return expense.amount;
  }

  return null;
}
