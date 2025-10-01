import React, { useState, useEffect } from 'react';
import { getUsers, createUser, getCategories } from './services/api';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import BudgetManager from './components/BudgetManager';
import Reports from './components/Reports';
import GroupExpenses from './components/GroupExpenses';
import Alerts from './components/Alerts';

function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [newUserData, setNewUserData] = useState({ name: '', email: '' });

  useEffect(() => {
    loadUsers();
    loadCategories();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setShowLogin(false);
      setLoginEmail('');
    } else {
      window.alert('User not found! Please check your email or create a new account.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await createUser(newUserData);
      setNewUserData({ name: '', email: '' });
      setShowUserForm(false);
      await loadUsers();
      setCurrentUser(response.data);
      setShowLogin(false);
    } catch (error) {
      window.alert('Error creating user: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowLogin(true);
    setActiveTab('dashboard');
  };

  if (showLogin || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">💰</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Expense Tracker</h1>
            <p className="text-gray-600">Manage your finances with ease</p>
          </div>

          {!showUserForm ? (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Login</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
                >
                  Login
                </button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm mb-2">Don't have an account?</p>
                <button
                  onClick={() => setShowUserForm(true)}
                  className="text-blue-500 font-semibold hover:text-blue-600 transition"
                >
                  Create New Account
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Create Account</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
                >
                  Create Account
                </button>
              </form>
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowUserForm(false)}
                  className="text-blue-500 font-semibold hover:text-blue-600 transition"
                >
                  ← Back to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-500">💰 Expense Tracker</h1>
            <div className="flex items-center gap-3">
              <div className="text-right mr-3">
                <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'expenses', label: 'Add Expense', icon: '➕' },
              { id: 'budgets', label: 'Budgets', icon: '💵' },
              { id: 'reports', label: 'Reports', icon: '📈' },
              { id: 'groups', label: 'Groups', icon: '👥' },
              { id: 'alerts', label: 'Alerts', icon: '🔔' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium whitespace-nowrap transition border-b-2 ${
                  activeTab === tab.id ? 'text-blue-500 border-blue-500' : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard userId={currentUser.id} categories={categories} />}
        {activeTab === 'expenses' && <ExpenseForm userId={currentUser.id} categories={categories} />}
        {activeTab === 'budgets' && <BudgetManager userId={currentUser.id} categories={categories} />}
        {activeTab === 'reports' && <Reports userId={currentUser.id} />}
        {activeTab === 'groups' && <GroupExpenses userId={currentUser.id} users={users} categories={categories} />}
        {activeTab === 'alerts' && <Alerts userId={currentUser.id} categories={categories} />}
      </main>
    </div>
  );
}

export default App;