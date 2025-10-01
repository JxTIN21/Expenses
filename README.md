# Expense Tracker Application

A full-stack expense tracking application with React frontend and Flask backend.

## Features

✅ **Core Features:**
- Log daily expenses with categories
- Set monthly budgets per category
- Budget alerts when exceeded
- Monthly spending reports
- Compare spending vs budget

✅ **Extra Credit Features:**
- Different budgets for different months
- Custom alert thresholds (e.g., alert at 10% remaining)
- Email notifications for budget alerts
- Group expense sharing (Splitwise-style)

## Tech Stack

- **Backend:** Flask, SQLAlchemy, SQLite
- **Frontend:** React, Recharts
- **Styling:** Custom CSS
- **Deployment:** Docker, Docker Compose

## Installation

### Option 1: Docker (Recommended)

The easiest way to run the application is using Docker:

1. **Prerequisites:**
   - Install [Docker](https://docs.docker.com/get-docker/)
   - Install [Docker Compose](https://docs.docker.com/compose/install/)

2. **Clone and run:**
```bash
# Start the application
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

4. **Stop the application:**
```bash
docker-compose down
```

5. **View logs:**
```bash
docker-compose logs -f
```

**Docker Files Required:**
- `docker-compose.yml` - Orchestrates frontend and backend
- `Dockerfile.frontend` - Frontend container configuration
- `Dockerfile.backend` - Backend container configuration

### Option 2: Manual Setup

#### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. (Optional) Set up email notifications in environment variables:
```bash
export MAIL_USERNAME=your-email@gmail.com
export MAIL_PASSWORD=your-app-password
```

5. Run the backend:
```bash
python app.py
```

Backend will run on http://localhost:5000

#### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

Frontend will run on http://localhost:3000

## Usage

1. **Create Account:** Start by creating your user account
2. **Add Expenses:** Log your daily expenses with categories
3. **Set Budgets:** Configure monthly budgets for each category
4. **View Reports:** Analyze your spending with visual charts
5. **Configure Alerts:** Set custom thresholds for budget alerts
6. **Create Groups:** Share expenses with friends and family

## API Endpoints

### Users
- `POST /api/users` - Create user
- `GET /api/users` - Get all users
- `GET /api/users/<id>` - Get user by ID

### Expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses` - Get expenses (filter by user, category, month, year)
- `DELETE /api/expenses/<id>` - Delete expense

### Budgets
- `POST /api/budgets` - Create/update budget
- `GET /api/budgets` - Get budgets (filter by user, month, year)
- `DELETE /api/budgets/<id>` - Delete budget

### Reports
- `GET /api/reports/monthly-summary` - Get monthly summary

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - Get user's groups
- `POST /api/groups/<id>/expenses` - Add group expense
- `GET /api/groups/<id>/expenses` - Get group expenses
- `GET /api/groups/<id>/balance` - Get balance settlement

### Alert Settings
- `POST /api/alert-settings` - Create/update alert setting
- `GET /api/alert-settings` - Get user's alert settings

## Categories

- Food
- Transport
- Entertainment
- Shopping
- Bills
- Healthcare
- Education
- Other

## Environment Variables

### Backend (.env)
Create a `.env` file in the `backend/` directory:

```properties
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
FLASK_DEBUG=True

DATABASE_URL=sqlite:///expense.db

MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

**Note:** For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

### Frontend (.env)
Create a `.env` file in the `frontend/` directory:

```properties
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

## Project Structure

```
expense-tracker/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Alerts.js
│   │   │   ├── BudgetManager.js
│   │   │   ├── Dashboard.js
│   │   │   ├── ExpenseForm.js
│   │   │   ├── GroupExpenses.js
│   │   │   └── Reports.js
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.js
│   ├── public/
│   ├── package.json
│   └── .env
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── config.py
│   ├── utils.py
│   ├── requirements.txt
│   └── .env
├── docker-compose.yml
├── Dockerfile.frontend
├── Dockerfile.backend
└── README.md
```

## License

MIT