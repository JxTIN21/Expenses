import React, { useState, useEffect } from 'react';
import { getBudgets, createBudget, deleteBudget } from '../services/api';

function BudgetManager({ userId, categories }) {
  const [budgets, setBudgets] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({ category: '', amount: '' });

  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData({ category: categories[0], amount: '' });
    }
  }, [categories]);

  useEffect(() => {
    loadBudgets();
  }, [userId, selectedMonth, selectedYear]);

  const loadBudgets = async () => {
    try {
      const response = await getBudgets({ user_id: userId, month: selectedMonth, year: selectedYear });
      setBudgets(response.data);
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createBudget({ ...formData, user_id: userId, month: selectedMonth, year: selectedYear });
      setFormData({ category: categories[0] || '', amount: '' });
      loadBudgets();
      window.alert('Budget saved successfully!');
    } catch (error) {
      window.alert('Error saving budget: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteBudget(id);
        loadBudgets();
      } catch (error) {
        window.alert('Error deleting budget: ' + error.message);
      }
    }
  };

  const budgetByCategory = budgets.reduce((acc, budget) => {
    acc[budget.category] = budget;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Budget Manager</h2>
      
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

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget Amount ($)</label>
            <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition">
            Set Budget
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Current Budgets</h3>
        <div className="space-y-3">
          {categories.map(category => {
            const budget = budgetByCategory[category];
            return (
              <div key={category} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">{category}</p>
                  <p className="text-blue-500 font-bold">{budget ? `$${budget.amount.toFixed(2)}` : 'Not set'}</p>
                </div>
                {budget && (
                  <button onClick={() => handleDelete(budget.id)} className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition">
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default BudgetManager;