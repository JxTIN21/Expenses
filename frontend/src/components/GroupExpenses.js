import React, { useState, useEffect } from 'react';
import { getGroups, createGroup, getGroupExpenses, createGroupExpense, getGroupBalance } from '../services/api';
import axios from 'axios';

function GroupExpenses({ userId, users, categories }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupExpenses, setGroupExpenses] = useState([]);
  const [balance, setBalance] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: '', description: '', member_ids: [] });
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    total_amount: '',
    category: '',
    split_type: 'equal'
  });

  // Email search states
  const [emailSearch, setEmailSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !expenseForm.category) {
      setExpenseForm(prev => ({ ...prev, category: categories[0] }));
    }
  }, [categories]);

  useEffect(() => {
    loadGroups();
  }, [userId]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupExpenses();
      loadGroupBalance();
    }
  }, [selectedGroup]);

  // Debounced email search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (emailSearch.trim().length >= 2) {
        searchUsersByEmail();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [emailSearch]);

  const searchUsersByEmail = async () => {
    try {
      setIsSearching(true);
      const response = await axios.get(`http://localhost:5000/api/users/search?email=${encodeURIComponent(emailSearch)}`);
      // Filter out current user and already selected members
      const filtered = response.data.filter(
        user => user.id !== userId && !selectedMembers.find(m => m.id === user.id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addMemberToSelection = (user) => {
    setSelectedMembers(prev => [...prev, user]);
    setGroupForm(prev => ({ ...prev, member_ids: [...prev.member_ids, user.id] }));
    setEmailSearch('');
    setSearchResults([]);
  };

  const removeMemberFromSelection = (userId) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== userId));
    setGroupForm(prev => ({ ...prev, member_ids: prev.member_ids.filter(id => id !== userId) }));
  };

  const loadGroups = async () => {
    try {
      const response = await getGroups(userId);
      setGroups(response.data);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadGroupExpenses = async () => {
    try {
      const response = await getGroupExpenses(selectedGroup.id);
      setGroupExpenses(response.data);
    } catch (error) {
      console.error('Error loading group expenses:', error);
    }
  };

  const loadGroupBalance = async () => {
    try {
      const response = await getGroupBalance(selectedGroup.id);
      setBalance(response.data);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (selectedMembers.length === 0) {
      alert('Please add at least one member to the group');
      return;
    }
    try {
      await createGroup({ ...groupForm, created_by: userId });
      setGroupForm({ name: '', description: '', member_ids: [] });
      setSelectedMembers([]);
      setEmailSearch('');
      setShowCreateGroup(false);
      loadGroups();
    } catch (error) {
      alert('Error creating group: ' + error.message);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await createGroupExpense({ ...expenseForm, group_id: selectedGroup.id, paid_by: userId });
      setExpenseForm({ description: '', total_amount: '', category: categories[0] || '', split_type: 'equal' });
      setShowAddExpense(false);
      loadGroupExpenses();
      loadGroupBalance();
    } catch (error) {
      alert('Error adding expense: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Group Expenses</h2>

      {!selectedGroup ? (
        <div>
          <button onClick={() => setShowCreateGroup(true)} className="mb-6 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition">
            Create New Group
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.length === 0 ? (
              <p className="col-span-full text-gray-500 text-center py-8">No groups yet. Create your first group!</p>
            ) : (
              groups.map(group => (
                <div key={group.id} onClick={() => setSelectedGroup(group)} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-blue-500 transition">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{group.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{group.description}</p>
                  <p className="text-blue-500 text-sm font-medium">{group.members.length} members</p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setSelectedGroup(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
            ← Back to Groups
          </button>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedGroup.name}</h3>
            <p className="text-gray-600 mb-4">{selectedGroup.description}</p>
            <div className="flex flex-wrap gap-2">
              {selectedGroup.members.map(member => (
                <span key={member.id} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {member.user_name}
                </span>
              ))}
            </div>
          </div>

          {balance && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4">Balances</h4>
              <p className="text-gray-600 mb-4">Total Expenses: <span className="font-bold text-blue-500">${balance.total_expenses.toFixed(2)}</span></p>
              <div className="space-y-2">
                {balance.balances.map(b => {
                  const user = users.find(u => u.id === b.user_id);
                  return (
                    <div key={b.user_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800">{user?.name}</span>
                      <span className={`font-bold ${b.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${Math.abs(b.balance).toFixed(2)} {b.balance >= 0 ? 'is owed' : 'owes'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button onClick={() => setShowAddExpense(true)} className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition">
            Add Group Expense
          </button>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-xl font-bold text-gray-800 mb-4">Recent Expenses</h4>
            <div className="space-y-3">
              {groupExpenses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No expenses yet.</p>
              ) : (
                groupExpenses.map(expense => (
                  <div key={expense.id} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">{expense.description}</p>
                      <p className="text-sm text-gray-600">{expense.category} • Paid by {expense.payer_name}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(expense.date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-lg font-bold text-blue-500">${expense.total_amount.toFixed(2)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Create New Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                <input 
                  type="text" 
                  value={groupForm.name} 
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input 
                  type="text" 
                  value={groupForm.description} 
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Members by Email</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    placeholder="Search by email..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                    {searchResults.map(user => (
                      <div 
                        key={user.id} 
                        onClick={() => addMemberToSelection(user)}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                      >
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Members */}
                {selectedMembers.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Members:</p>
                    <div className="space-y-2">
                      {selectedMembers.map(member => (
                        <div key={member.id} className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{member.name}</p>
                            <p className="text-xs text-gray-600">{member.email}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMemberFromSelection(member.id)}
                            className="text-red-500 hover:text-red-700 font-bold text-lg"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition">
                  Create Group
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreateGroup(false);
                    setSelectedMembers([]);
                    setEmailSearch('');
                    setGroupForm({ name: '', description: '', member_ids: [] });
                  }} 
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddExpense && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Add Group Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input 
                  type="text" 
                  value={expenseForm.description} 
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={expenseForm.total_amount} 
                  onChange={(e) => setExpenseForm({ ...expenseForm, total_amount: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select 
                  value={expenseForm.category} 
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition">
                  Add Expense
                </button>
                <button type="button" onClick={() => setShowAddExpense(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupExpenses;