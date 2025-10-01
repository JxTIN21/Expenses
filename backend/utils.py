from datetime import datetime
from models import db, Budget, Expense, AlertSetting
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other']

def check_budget_alerts(user_id, category, month, year):
    """Check if expense exceeds budget and return alert info"""
    budget = Budget.query.filter_by(
        user_id=user_id,
        category=category,
        month=month,
        year=year
    ).first()
    
    if not budget:
        return None
    
    # Calculate total spending for this category in this month
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
    
    total_spent = db.session.query(db.func.sum(Expense.amount)).filter(
        Expense.user_id == user_id,
        Expense.category == category,
        Expense.date >= start_date,
        Expense.date < end_date
    ).scalar() or 0
    
    percentage_used = (total_spent / budget.amount * 100) if budget.amount > 0 else 0
    
    # Check alert settings
    alert_setting = AlertSetting.query.filter_by(
        user_id=user_id,
        category=category
    ).first()
    
    threshold = alert_setting.threshold_percentage if alert_setting else 90
    
    alert = {
        'budget_amount': budget.amount,
        'spent_amount': total_spent,
        'percentage_used': round(percentage_used, 2),
        'exceeded': total_spent > budget.amount,
        'threshold_reached': percentage_used >= threshold,
        'threshold': threshold
    }
    
    return alert

def send_alert_email(user_email, user_name, alert_info, category):
    """Send email alert to user"""
    try:
        from flask import current_app
        
        # Check if email is configured
        if not current_app.config.get('MAIL_USERNAME') or not current_app.config.get('MAIL_PASSWORD'):
            print("⚠️  Email not configured. Skipping email notification.")
            print(f"To enable email alerts, set these environment variables:")
            print(f"  - MAIL_USERNAME (your email)")
            print(f"  - MAIL_PASSWORD (your email password or app password)")
            return False
        
        msg = MIMEMultipart()
        msg['From'] = current_app.config['MAIL_DEFAULT_SENDER']
        msg['To'] = user_email
        msg['Subject'] = f'Budget Alert: {category}'
        
        body = f"""
Hi {user_name},

This is an alert regarding your {category} budget:

Budget Amount: ${alert_info['budget_amount']:.2f}
Amount Spent: ${alert_info['spent_amount']:.2f}
Percentage Used: {alert_info['percentage_used']:.2f}%

{'⚠️ You have exceeded your budget!' if alert_info['exceeded'] else f"⚠️ You have reached {alert_info['threshold']}% of your budget!"}

Please review your expenses.

Best regards,
Expense Tracker Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(current_app.config['MAIL_SERVER'], current_app.config['MAIL_PORT'])
        server.starttls()
        server.login(current_app.config['MAIL_USERNAME'], current_app.config['MAIL_PASSWORD'])
        text = msg.as_string()
        server.sendmail(current_app.config['MAIL_DEFAULT_SENDER'], user_email, text)
        server.quit()
        
        print(f"✅ Email sent successfully to {user_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {str(e)}")
        return False