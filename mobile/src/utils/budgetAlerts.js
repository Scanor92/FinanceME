export const isInBudgetPeriod = (dateValue, period) => {
  const txDate = new Date(dateValue);
  if (Number.isNaN(txDate.getTime())) {
    return false;
  }

  const now = new Date();
  if (period === 'weekly') {
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return txDate >= start && txDate < end;
  }

  if (period === 'quarterly') {
    return Math.floor(txDate.getMonth() / 3) === Math.floor(now.getMonth() / 3) && txDate.getFullYear() === now.getFullYear();
  }

  if (period === 'semiannual') {
    return (txDate.getMonth() < 6 ? 0 : 1) === (now.getMonth() < 6 ? 0 : 1) && txDate.getFullYear() === now.getFullYear();
  }

  if (period === 'annual') {
    return txDate.getFullYear() === now.getFullYear();
  }

  return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
};

export const findExceededBudgets = ({ budgets = [], transactions = [], category, amount, excludeTransactionId = null }) => {
  if (!category || !amount || amount <= 0) {
    return [];
  }

  return budgets
    .filter((budget) => budget.category === category)
    .map((budget) => {
      const spent = transactions
        .filter((tx) => tx._id !== excludeTransactionId)
        .filter((tx) => tx.type === 'expense')
        .filter((tx) => tx.category === category && isInBudgetPeriod(tx.date, budget.period || 'monthly'))
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

      const nextSpent = spent + amount;
      const target = Number(budget.amount || 0);

      return {
        budget,
        spent,
        nextSpent,
        target,
        exceeded: nextSpent > target,
      };
    })
    .filter((item) => item.exceeded);
};
