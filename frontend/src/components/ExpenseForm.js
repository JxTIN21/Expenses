import React, { useState, useEffect } from 'react';
import { createExpense, getExpenses, deleteExpense } from '../services/api';

function ExpenseForm({ userId, categories }) {
  const [formData, setFormData] = useState({
    amount: '',
    category: categories[0] || '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [expenses, setExpenses] = useState([]);
  const [budgetAlert, setBudgetAlert] = useState(null);
  const [showExpenses, setShowExpenses] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: categories[0] }));
    }
  }, [categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await createExpense({
        ...formData,
        user_id: userId,
        date: new Date(formData.date).toISOString()
      });
      if (response.data.alert) setBudgetAlert(response.data.alert);
      setFormData({ amount: '', category: categories[0] || '', description: '', date: new Date().toISOString().split('T')[0] });
      window.alert('Expense added successfully!');
      if (showExpenses) loadExpenses();
    } catch (error) {
      window.alert('Error adding expense: ' + error.message);
    }
  };

  const loadExpenses = async () => {
    try {
      const response = await getExpenses({ user_id: userId });
      setExpenses(response.data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
        loadExpenses();
      } catch (error) {
        window.alert('Error deleting expense: ' + error.message);
      }
    }
  };

  useEffect(() => {
    if (showExpenses) loadExpenses();
  }, [showExpenses]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Add Expense</h2>
      
      {budgetAlert && (
        <div className={`p-4 rounded-lg border ${budgetAlert.exceeded || budgetAlert.threshold_reached ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <h4 className="font-bold text-gray-800 mb-2">Budget Alert: {formData.category}</h4>
          <p className="text-sm text-gray-700 mb-1">Spent: ${budgetAlert.spent_amount.toFixed(2)} / ${budgetAlert.budget_amount.toFixed(2)}</p>
          <p className="text-sm text-gray-700 mb-2">Usage: {budgetAlert.percentage_used.toFixed(2)}%</p>
          {budgetAlert.exceeded && <p className="text-sm font-bold text-red-600">⚠️ Budget Exceeded!</p>}
          {budgetAlert.threshold_reached && !budgetAlert.exceeded && <p className="text-sm font-bold text-orange-600">⚠️ {budgetAlert.threshold}% of budget used!</p>}
          <button onClick={() => setBudgetAlert(null)} className="mt-2 px-3 py-1 bg-white text-gray-700 rounded border border-gray-300 text-sm hover:bg-gray-50">
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
            <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition">
            Add Expense
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <button onClick={() => setShowExpenses(!showExpenses)} className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition">
          {showExpenses ? 'Hide' : 'Show'} All Expenses
        </button>
        {showExpenses && (
          <div className="mt-4 space-y-3">
            <h3 className="text-xl font-bold text-gray-800">All Expenses</h3>
            {expenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No expenses found.</p>
            ) : (
              expenses.map(expense => (
                <div key={expense.id} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{expense.category}</p>
                    <p className="text-sm text-gray-600">{expense.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-blue-500">${expense.amount.toFixed(2)}</p>
                    <button onClick={() => handleDelete(expense.id)} className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition">
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpenseForm;