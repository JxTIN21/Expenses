import React, { useState, useEffect } from 'react';
import { getMonthlySummary } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Reports({ userId }) {
  const [summary, setSummary] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadSummary();
  }, [userId, selectedMonth, selectedYear]);

  const loadSummary = async () => {
    try {
      const response = await getMonthlySummary(userId, selectedMonth, selectedYear);
      setSummary(response.data);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  if (!summary) return <div className="text-center py-8 text-gray-600">Loading...</div>;

  const chartData = summary.comparison.map(item => ({
    category: item.category,
    Spent: item.spent,
    Budget: item.budget
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Monthly Reports</h2>
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

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-600 text-sm font-medium mb-2">Total Spending</p>
        <p className="text-3xl font-bold text-blue-500">${summary.total_spending.toFixed(2)}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Spending vs Budget</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Spent" fill="#ef4444" />
            <Bar dataKey="Budget" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Category Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Spent</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Budget</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Difference</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Usage %</th>
              </tr>
            </thead>
            <tbody>
              {summary.comparison.map(item => (
                <tr key={item.category} className={`border-b border-gray-100 ${item.spent > item.budget ? 'bg-red-50' : ''}`}>
                  <td className="py-3 px-4 font-medium text-gray-800">{item.category}</td>
                  <td className="text-right py-3 px-4 text-gray-700">${item.spent.toFixed(2)}</td>
                  <td className="text-right py-3 px-4 text-gray-700">${item.budget.toFixed(2)}</td>
                  <td className={`text-right py-3 px-4 font-semibold ${item.difference < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    ${item.difference.toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-700">{item.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;