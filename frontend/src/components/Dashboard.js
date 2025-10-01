import React, { useState, useEffect } from 'react';
import { getExpenses, getBudgets } from '../services/api';

function Dashboard({ userId, categories }) {
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [userId, selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      const expensesRes = await getExpenses({ user_id: userId, month: selectedMonth, year: selectedYear });
      setExpenses(expensesRes.data);
      const budgetsRes = await getBudgets({ user_id: userId, month: selectedMonth, year: selectedYear });
      setBudgets(budgetsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const spendingByCategory = categories.reduce((acc, cat) => {
    acc[cat] = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
    return acc;
  }, {});
  const budgetByCategory = budgets.reduce((acc, budget) => {
    acc[budget.category] = budget.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <div className="flex gap-2">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            {[...Array(12)].map((_, i) => (
              <option key={i} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-600 text-sm font-medium mb-2">Total Spending</p>
          <p className="text-3xl font-bold text-blue-500">${totalSpending.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-600 text-sm font-medium mb-2">Total Budget</p>
          <p className="text-3xl font-bold text-blue-500">${Object.values(budgetByCategory).reduce((sum, b) => sum + b, 0).toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-600 text-sm font-medium mb-2">Transactions</p>
          <p className="text-3xl font-bold text-blue-500">{expenses.length}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Spending by Category</h3>
        <div className="space-y-4">
          {categories.map(category => {
            const spent = spendingByCategory[category] || 0;
            const budget = budgetByCategory[category] || 0;
            const percentage = budget > 0 ? (spent / budget) * 100 : 0;
            const isOverBudget = spent > budget && budget > 0;
            return (
              <div key={category}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">{category}</span>
                  <span className={`font-semibold ${isOverBudget ? 'text-red-500' : 'text-gray-800'}`}>
                    ${spent.toFixed(2)} / ${budget.toFixed(2)}
                  </span>
                </div>
                {budget > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Expenses</h3>
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No expenses yet. Start tracking your spending!</p>
          ) : (
            expenses.slice(0, 5).map(expense => (
              <div key={expense.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">{expense.category}</p>
                  <p className="text-sm text-gray-600">{expense.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(expense.date).toLocaleDateString()}</p>
                </div>
                <p className="text-lg font-bold text-blue-500">${expense.amount.toFixed(2)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;