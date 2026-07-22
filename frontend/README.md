# Baby Store - E-commerce React Frontend

A premium, modern, and fully responsive user interface for a Baby Products e-commerce application. Built with React, Vite, Tailwind CSS, React Hook Form, Zod validation, Axios, and React Router.

## Technologies Used
- **Vite & React**: Fast development and rendering
- **Tailwind CSS**: Soft pastel styling, premium animations, and dark mode support
- **React Hook Form**: Real-time form state tracking and submission handler
- **Zod**: Robust, declarative data validation schemas
- **Axios**: Promised-based HTTP client for API integration
- **React Router (v6)**: Smooth, declarative client-side routing
- **Lucide React**: Clean icons matching the design language
- **Canvas Confetti**: Celebration effects upon successful sign-up

## Project Structure
```
frontend/
├── index.html                  # HTML template with Google Fonts (Outfit & Inter)
├── package.json                # Project dependencies and script runner configurations
├── vite.config.js              # Vite React configuration with API proxy setting
├── tailwind.config.js          # Tailored pastel brand color theme and animations
├── postcss.config.js           # PostCSS Tailwind wrapper
├── README.md                   # Setup guide and instructions
└── src/
    ├── main.jsx                # React DOM renderer mounting point
    ├── App.jsx                 # Routing core and theme provider (dark mode toggle)
    ├── index.css               # Tailwind directives and custom animation classes
    ├── api/                    # API integration layer
    ├── schemas/
    │   └── registerSchema.js   # Zod validation schema for inputs
    ├── utils/
    │   └── axios.js            # Axios client with proxy-ready configuration
    ├── components/
    │   ├── AuthCard.jsx        # Premium background blurred modal
    │   ├── InputField.jsx      # Icon-supported text input field with error reporting
    │   ├── PasswordField.jsx   # Input field with visibility toggles and real-time indicators
    │   ├── LoadingButton.jsx   # Submit button displaying active spinning wheel states
    │   └── FormError.jsx       # Dismissible warning box for server response validation
    └── pages/
        ├── Register.jsx        # Split-screen responsive sign-up form
        └── Login.jsx           # Cohesive child/parent log-in gate
```

## Running the Application

### 1. Install Dependencies
Navigate into the `frontend` directory and install the packages:
```bash
cd frontend
npm install
```

### 2. Start the Development Server
Run the local dev server:
```bash
npm run dev
```
The application will be accessible at: `http://localhost:3000`

### 3. API Connection
Vite is pre-configured to proxy `/api` requests to your Django backend on `http://127.0.0.1:8000`. Ensure your Django server is running to test live registrations!
