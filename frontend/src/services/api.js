import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Users
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const getUser = (id) => api.get(`/users/${id}`);

// Expenses
export const getExpenses = (params) => api.get('/expenses', { params });
export const createExpense = (data) => api.post('/expenses', data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

// Budgets
export const getBudgets = (params) => api.get('/budgets', { params });
export const createBudget = (data) => api.post('/budgets', data);
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);

// Alert Settings
export const getAlertSettings = (userId) => api.get('/alert-settings', { params: { user_id: userId } });
export const createAlertSetting = (data) => api.post('/alert-settings', data);

// Reports
export const getMonthlySummary = (userId, month, year) =>
    api.get('/reports/monthly-summary', { params: { user_id: userId, month, year } });

// Groups
export const getGroups = (userId) => api.get('/groups', { params: { user_id: userId } });
export const createGroup = (data) => api.post('/groups', data);
export const getGroupExpenses = (groupId) => api.get(`/groups/${groupId}/expenses`);
export const createGroupExpense = (data) => api.post(`/groups/${data.group_id}/expenses`, data);
export const getGroupBalance = (groupId) => api.get(`/groups/${groupId}/balance`);

// Categories
export const getCategories = () => api.get('/categories');

export default api;