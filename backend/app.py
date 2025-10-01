from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from models import db, User, Expense, Budget, AlertSetting, ExpenseGroup, GroupMember, GroupExpense
from config import Config
from utils import CATEGORIES, check_budget_alerts, send_alert_email
import json
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

db.init_app(app)

with app.app_context():
    db.create_all()

# ============ USER ENDPOINTS ============

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'error': 'User already exists'}), 400
    
    user = User(name=data['name'], email=data['email'])
    db.session.add(user)
    db.session.commit()
    
    return jsonify(user.to_dict()), 201

@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@app.route('/api/users/search', methods=['GET'])
def search_users():
    """Search users by email"""
    email = request.args.get('email', '').strip()
    
    if not email:
        return jsonify({'error': 'Email parameter is required'}), 400
    
    # Search for users with email containing the search term
    users = User.query.filter(User.email.ilike(f'%{email}%')).limit(10).all()
    
    return jsonify([user.to_dict() for user in users])

# ============ EXPENSE ENDPOINTS ============

@app.route('/api/expenses', methods=['POST'])
def create_expense():
    data = request.json
    
    expense = Expense(
        user_id=data['user_id'],
        amount=float(data['amount']),
        category=data['category'],
        description=data.get('description', ''),
        date=datetime.fromisoformat(data.get('date', datetime.now().isoformat()))
    )
    
    db.session.add(expense)
    db.session.commit()
    
    # Check for budget alerts
    alert = check_budget_alerts(
        expense.user_id,
        expense.category,
        expense.date.month,
        expense.date.year
    )
    
    print(f"🔍 Alert Info: {alert}")  # Debug print
    
    response = {
        'expense': expense.to_dict(),
        'alert': alert
    }
    
    # Send email if threshold reached or exceeded
    if alert:
        print(f"⚠️ Alert triggered! threshold_reached={alert.get('threshold_reached')}, exceeded={alert.get('exceeded')}")
        
        if alert.get('threshold_reached') or alert.get('exceeded'):
            alert_setting = AlertSetting.query.filter_by(
                user_id=expense.user_id,
                category=expense.category
            ).first()
            
            print(f"📧 Alert Setting: {alert_setting.to_dict() if alert_setting else 'None'}")
            
            if alert_setting and alert_setting.email_enabled:
                user = User.query.get(expense.user_id)
                print(f"📨 Attempting to send email to {user.email}...")
                
                email_sent = send_alert_email(user.email, user.name, alert, expense.category)
                
                if email_sent:
                    print(f"✅ Email sent successfully!")
                else:
                    print(f"❌ Email failed to send")
            else:
                print(f"⚠️ Email not enabled or alert setting not found")
        else:
            print(f"ℹ️ Alert exists but threshold not reached")
    else:
        print(f"ℹ️ No alert - budget not set for this category/month")
    
    return jsonify(response), 201

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    user_id = request.args.get('user_id', type=int)
    category = request.args.get('category')
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    
    query = Expense.query
    
    if user_id:
        query = query.filter_by(user_id=user_id)
    if category:
        query = query.filter_by(category=category)
    if month and year:
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        query = query.filter(Expense.date >= start_date, Expense.date < end_date)
    
    expenses = query.order_by(Expense.date.desc()).all()
    return jsonify([expense.to_dict() for expense in expenses])

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    expense = Expense.query.get_or_404(expense_id)
    db.session.delete(expense)
    db.session.commit()
    return jsonify({'message': 'Expense deleted'}), 200

# ============ BUDGET ENDPOINTS ============

@app.route('/api/budgets', methods=['POST'])
def create_budget():
    data = request.json
    
    # Check if budget already exists
    existing = Budget.query.filter_by(
        user_id=data['user_id'],
        category=data['category'],
        month=data['month'],
        year=data['year']
    ).first()
    
    if existing:
        existing.amount = float(data['amount'])
        db.session.commit()
        return jsonify(existing.to_dict()), 200
    
    budget = Budget(
        user_id=data['user_id'],
        category=data['category'],
        amount=float(data['amount']),
        month=data['month'],
        year=data['year']
    )
    
    db.session.add(budget)
    db.session.commit()
    
    return jsonify(budget.to_dict()), 201

@app.route('/api/budgets', methods=['GET'])
def get_budgets():
    user_id = request.args.get('user_id', type=int)
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    
    query = Budget.query
    
    if user_id:
        query = query.filter_by(user_id=user_id)
    if month:
        query = query.filter_by(month=month)
    if year:
        query = query.filter_by(year=year)
    
    budgets = query.all()
    return jsonify([budget.to_dict() for budget in budgets])

@app.route('/api/budgets/<int:budget_id>', methods=['DELETE'])
def delete_budget(budget_id):
    budget = Budget.query.get_or_404(budget_id)
    db.session.delete(budget)
    db.session.commit()
    return jsonify({'message': 'Budget deleted'}), 200

# ============ ALERT SETTINGS ENDPOINTS ============

@app.route('/api/alert-settings', methods=['POST'])
def create_alert_setting():
    data = request.json
    
    existing = AlertSetting.query.filter_by(
        user_id=data['user_id'],
        category=data['category']
    ).first()
    
    if existing:
        existing.threshold_percentage = data.get('threshold_percentage', 90)
        existing.email_enabled = data.get('email_enabled', True)
        db.session.commit()
        return jsonify(existing.to_dict()), 200
    
    alert_setting = AlertSetting(
        user_id=data['user_id'],
        category=data['category'],
        threshold_percentage=data.get('threshold_percentage', 90),
        email_enabled=data.get('email_enabled', True)
    )
    
    db.session.add(alert_setting)
    db.session.commit()
    
    return jsonify(alert_setting.to_dict()), 201

@app.route('/api/alert-settings', methods=['GET'])
def get_alert_settings():
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    settings = AlertSetting.query.filter_by(user_id=user_id).all()
    return jsonify([s.to_dict() for s in settings])

# ============ REPORTS ENDPOINTS ============

@app.route('/api/reports/monthly-summary', methods=['GET'])
def monthly_summary():
    user_id = request.args.get('user_id', type=int)
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    
    if not all([user_id, month, year]):
        return jsonify({'error': 'user_id, month, and year are required'}), 400
    
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
    
    expenses = Expense.query.filter(
        Expense.user_id == user_id,
        Expense.date >= start_date,
        Expense.date < end_date
    ).all()
    
    total_spending = sum(e.amount for e in expenses)
    
    # Group by category
    by_category = {}
    for expense in expenses:
        if expense.category not in by_category:
            by_category[expense.category] = 0
        by_category[expense.category] += expense.amount
    
    # Get budgets
    budgets = Budget.query.filter_by(user_id=user_id, month=month, year=year).all()
    budget_dict = {b.category: b.amount for b in budgets}
    
    # Compare spending vs budget
    comparison = []
    for category in CATEGORIES:
        spent = by_category.get(category, 0)
        budget = budget_dict.get(category, 0)
        comparison.append({
            'category': category,
            'spent': spent,
            'budget': budget,
            'difference': budget - spent,
            'percentage': round((spent / budget * 100) if budget > 0 else 0, 2)
        })
    
    return jsonify({
        'total_spending': total_spending,
        'by_category': by_category,
        'comparison': comparison,
        'month': month,
        'year': year
    })

# ============ GROUP EXPENSE ENDPOINTS ============

@app.route('/api/groups', methods=['POST'])
def create_group():
    data = request.json
    
    group = ExpenseGroup(
        name=data['name'],
        description=data.get('description', ''),
        created_by=data['created_by']
    )
    
    db.session.add(group)
    db.session.flush()
    
    # Add creator as member
    member = GroupMember(group_id=group.id, user_id=data['created_by'])
    db.session.add(member)
    
    # Add other members
    for user_id in data.get('member_ids', []):
        if user_id != data['created_by']:
            member = GroupMember(group_id=group.id, user_id=user_id)
            db.session.add(member)
    
    db.session.commit()
    
    return jsonify(group.to_dict()), 201

@app.route('/api/groups', methods=['GET'])
def get_groups():
    user_id = request.args.get('user_id', type=int)
    
    if user_id:
        memberships = GroupMember.query.filter_by(user_id=user_id).all()
        groups = [m.group for m in memberships]
    else:
        groups = ExpenseGroup.query.all()
    
    return jsonify([g.to_dict() for g in groups])

@app.route('/api/groups/<int:group_id>/expenses', methods=['POST'])
def create_group_expense(group_id):
    data = request.json
    
    splits_json = json.dumps(data.get('splits', {}))
    
    group_expense = GroupExpense(
        group_id=group_id,
        paid_by=data['paid_by'],
        total_amount=float(data['total_amount']),
        description=data['description'],
        category=data['category'],
        date=datetime.fromisoformat(data.get('date', datetime.now().isoformat())),
        split_type=data.get('split_type', 'equal'),
        splits=splits_json
    )
    
    db.session.add(group_expense)
    db.session.commit()
    
    return jsonify(group_expense.to_dict()), 201

@app.route('/api/groups/<int:group_id>/expenses', methods=['GET'])
def get_group_expenses(group_id):
    expenses = GroupExpense.query.filter_by(group_id=group_id).order_by(GroupExpense.date.desc()).all()
    return jsonify([e.to_dict() for e in expenses])

@app.route('/api/groups/<int:group_id>/balance', methods=['GET'])
def get_group_balance(group_id):
    expenses = GroupExpense.query.filter_by(group_id=group_id).all()
    members = GroupMember.query.filter_by(group_id=group_id).all()
    
    # Calculate balances
    balances = {m.user_id: 0 for m in members}
    
    for expense in expenses:
        splits = json.loads(expense.splits) if expense.splits else {}
        
        if expense.split_type == 'equal':
            per_person = expense.total_amount / len(members)
            for member in members:
                if member.user_id == expense.paid_by:
                    balances[member.user_id] += expense.total_amount - per_person
                else:
                    balances[member.user_id] -= per_person
        else:
            for user_id_str, amount in splits.items():
                user_id = int(user_id_str)
                if user_id == expense.paid_by:
                    balances[user_id] += expense.total_amount - amount
                else:
                    balances[user_id] -= amount
    
    # Create settlement suggestions
    balance_list = [{'user_id': uid, 'balance': bal} for uid, bal in balances.items()]
    
    return jsonify({
        'balances': balance_list,
        'total_expenses': sum(e.total_amount for e in expenses)
    })

@app.route('/api/categories', methods=['GET'])
def get_categories():
    return jsonify(CATEGORIES)

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)