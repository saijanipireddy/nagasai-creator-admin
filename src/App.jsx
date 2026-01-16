
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/Layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseForm from './pages/CourseForm';
import Topics from './pages/Topics';
import TopicForm from './pages/TopicForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/new" element={<CourseForm />} />
          <Route path="courses/:id/edit" element={<CourseForm />} />
          <Route path="courses/:courseId/topics" element={<Topics />} />
          <Route path="courses/:courseId/topics/new" element={<TopicForm />} />
          <Route path="courses/:courseId/topics/:topicId/edit" element={<TopicForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
