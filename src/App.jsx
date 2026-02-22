import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/Layout/AdminLayout';
import Login from './pages/Login';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseForm = lazy(() => import('./pages/CourseForm'));
const Topics = lazy(() => import('./pages/Topics'));
const TopicForm = lazy(() => import('./pages/TopicForm'));

const Spinner = () => (
  <div className="min-h-screen bg-dark-bg flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-2 border-dark-accent border-t-transparent rounded-full" />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-dark-accent border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Suspense fallback={<Spinner />}><Dashboard /></Suspense>} />
                <Route path="courses" element={<Suspense fallback={<Spinner />}><Courses /></Suspense>} />
                <Route path="courses/new" element={<Suspense fallback={<Spinner />}><CourseForm /></Suspense>} />
                <Route path="courses/:id/edit" element={<Suspense fallback={<Spinner />}><CourseForm /></Suspense>} />
                <Route path="courses/:courseId/topics" element={<Suspense fallback={<Spinner />}><Topics /></Suspense>} />
                <Route path="courses/:courseId/topics/new" element={<Suspense fallback={<Spinner />}><TopicForm /></Suspense>} />
                <Route path="courses/:courseId/topics/:topicId/edit" element={<Suspense fallback={<Spinner />}><TopicForm /></Suspense>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
