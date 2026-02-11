import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaSpinner, FaPlus, FaTrash, FaUpload, FaLightbulb, FaCode, FaImage, FaTimes, FaLink } from 'react-icons/fa';
import { topicAPI, uploadAPI, courseAPI, BACKEND_URL } from '../services/api';

// Available programming languages
const PROGRAMMING_LANGUAGES = [
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'sql', label: 'SQL' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'swift', label: 'Swift' }
];

const TopicForm = () => {
  const { courseId, topicId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!topicId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [course, setCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    videoUrl: '',
    pdfUrl: '',
    practice: [],
    codingPractice: {
      language: 'javascript',
      title: '',
      description: '',
      referenceImage: '',
      imageLinks: [],
      starterCode: '',
      expectedOutput: '',
      hints: [],
      testScript: '',
      testCases: [],
    },
    isPublished: false
  });
  const [codingPracticeEnabled, setCodingPracticeEnabled] = useState(false);

  useEffect(() => {
    fetchCourse();
    if (isEditing) {
      fetchTopic();
    }
  }, [courseId, topicId]);

  const fetchCourse = async () => {
    try {
      const { data } = await courseAPI.getById(courseId);
      setCourse(data);
    } catch (error) {
      console.error('Failed to fetch course:', error);
    }
  };

  const fetchTopic = async () => {
    setLoading(true);
    try {
      const { data } = await topicAPI.getById(topicId);
      const codingPracticeData = data.codingPractice || { language: 'javascript', title: '', description: '', referenceImage: '', imageLinks: [], starterCode: '', expectedOutput: '', hints: [], testScript: '', testCases: [] };
      setFormData({
        title: data.title || '',
        videoUrl: data.videoUrl || '',
        pdfUrl: data.pdfUrl || '',
        practice: data.practice || [],
        codingPractice: codingPracticeData,
        isPublished: data.isPublished || false
      });
      // Enable coding practice if it has content
      setCodingPracticeEnabled(!!codingPracticeData.title);
    } catch (error) {
      console.error('Failed to fetch topic:', error);
      navigate(`/courses/${courseId}/topics`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        courseId,
        // Only include codingPractice if enabled, otherwise send empty object
        codingPractice: codingPracticeEnabled ? formData.codingPractice : { language: 'javascript', title: '', description: '', referenceImage: '', imageLinks: [], starterCode: '', expectedOutput: '', hints: [], testScript: '', testCases: [] }
      };
      if (isEditing) {
        await topicAPI.update(topicId, payload);
      } else {
        await topicAPI.create(payload);
      }
      navigate(`/courses/${courseId}/topics`);
    } catch (error) {
      console.error('Failed to save topic:', error);
      alert('Failed to save topic');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data } = await uploadAPI.uploadFile(file);
      setFormData((prev) => ({ ...prev, pdfUrl: data.path }));
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Handle reference image upload for coding practice
  const handleReferenceImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { data } = await uploadAPI.uploadFile(file);
      updateCodingPractice('referenceImage', data.path);
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeReferenceImage = () => {
    updateCodingPractice('referenceImage', '');
  };

  // Practice questions handlers
  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      practice: [...prev.practice, { question: '', options: ['', '', '', ''], answer: 0 }]
    }));
  };

  const removeQuestion = (index) => {
    setFormData((prev) => ({
      ...prev,
      practice: prev.practice.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      practice: prev.practice.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateOption = (qIndex, oIndex, value) => {
    setFormData((prev) => ({
      ...prev,
      practice: prev.practice.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, j) => j === oIndex ? value : o) }
          : q
      )
    }));
  };

  // Coding practice handlers
  const updateCodingPractice = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      codingPractice: { ...prev.codingPractice, [field]: value }
    }));
  };

  const addHint = () => {
    setFormData((prev) => ({
      ...prev,
      codingPractice: {
        ...prev.codingPractice,
        hints: [...prev.codingPractice.hints, '']
      }
    }));
  };

  const removeHint = (index) => {
    setFormData((prev) => ({
      ...prev,
      codingPractice: {
        ...prev.codingPractice,
        hints: prev.codingPractice.hints.filter((_, i) => i !== index)
      }
    }));
  };

  const updateHint = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      codingPractice: {
        ...prev.codingPractice,
        hints: prev.codingPractice.hints.map((h, i) => i === index ? value : h)
      }
    }));
  };

  // Test cases handlers (for non-web languages)
  const addTestCase = () => {
    setFormData((prev) => ({
      ...prev,
      codingPractice: {
        ...prev.codingPractice,
        testCases: [...(prev.codingPractice.testCases || []), { input: '', expectedOutput: '' }]
      }
    }));
  };

  const removeTestCase = (index) => {
    setFormData((prev) => ({
      ...prev,
      codingPractice: {
        ...prev.codingPractice,
        testCases: prev.codingPractice.testCases.filter((_, i) => i !== index)
      }
    }));
  };

  const updateTestCase = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      codingPractice: {
        ...prev.codingPractice,
        testCases: prev.codingPractice.testCases.map((tc, i) =>
          i === index ? { ...tc, [field]: value } : tc
        )
      }
    }));
  };

  // Image links handlers
  const addImageLink = () => {
    setFormData((prev) => ({
      ...prev,
      codingPractice: {
        ...prev.codingPractice,
        imageLinks: [...(prev.codingPractice.imageLinks || []), { label: '', url: '' }]
      }
    }));
  };

  const removeImageLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      codingPractice: {
        ...prev.codingPractice,
        imageLinks: prev.codingPractice.imageLinks.filter((_, i) => i !== index)
      }
    }));
  };

  const updateImageLink = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      codingPractice: {
        ...prev.codingPractice,
        imageLinks: prev.codingPractice.imageLinks.map((link, i) =>
          i === index ? { ...link, [field]: value } : link
        )
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-dark-accent border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          to={`/courses/${courseId}/topics`}
          className="inline-flex items-center gap-2 text-dark-muted hover:text-white transition-colors"
        >
          <FaArrowLeft /> Back to {course?.name} Topics
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-dark-card rounded-xl border border-dark-secondary p-6">
          <h2 className="text-xl font-bold mb-4">
            {isEditing ? 'Edit Topic' : 'Create New Topic'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Topic Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent"
                placeholder="e.g., Introduction to HTML"
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublished"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
                className="w-5 h-5 rounded accent-dark-accent"
              />
              <label htmlFor="isPublished" className="text-sm font-medium">
                Publish this topic
              </label>
            </div>
          </div>
        </div>

        {/* Video URL */}
        <div className="bg-dark-card rounded-xl border border-dark-secondary p-6">
          <h3 className="text-lg font-bold mb-4">Video Content</h3>
          <div>
            <label className="block text-sm font-medium mb-2">YouTube Embed URL</label>
            <input
              type="url"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent"
              placeholder="https://www.youtube.com/embed/VIDEO_ID"
            />
            <p className="text-dark-muted text-xs mt-1">
              Use the embed URL format: youtube.com/embed/VIDEO_ID
            </p>
          </div>
        </div>

        {/* PDF Upload */}
        <div className="bg-dark-card rounded-xl border border-dark-secondary p-6">
          <h3 className="text-lg font-bold mb-4">PDF / PPT Material</h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-3 bg-dark-bg border border-dark-secondary rounded-lg cursor-pointer hover:border-dark-accent transition-colors">
              <FaUpload />
              <span>{uploading ? 'Uploading...' : 'Upload PDF'}</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {formData.pdfUrl && (
              <span className="text-green-500 text-sm">File uploaded: {formData.pdfUrl}</span>
            )}
          </div>
        </div>

        {/* Practice Questions */}
        <div className="bg-dark-card rounded-xl border border-dark-secondary p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Practice Questions</h3>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-2 px-3 py-2 bg-dark-secondary rounded-lg hover:bg-dark-secondary/80 transition-colors text-sm"
            >
              <FaPlus /> Add Question
            </button>
          </div>

          {formData.practice.length > 0 ? (
            <div className="space-y-6">
              {formData.practice.map((q, qIndex) => (
                <div key={qIndex} className="p-4 bg-dark-bg rounded-lg">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <span className="text-dark-accent font-medium">Q{qIndex + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-500 hover:bg-red-500/20 p-1 rounded"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                    className="w-full px-3 py-2 bg-dark-card border border-dark-secondary rounded-lg mb-3 focus:outline-none focus:border-dark-accent"
                    placeholder="Enter question"
                  />
                  <div className="space-y-2">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`answer-${qIndex}`}
                          checked={q.answer === oIndex}
                          onChange={() => updateQuestion(qIndex, 'answer', oIndex)}
                          className="accent-dark-accent"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          className="flex-1 px-3 py-2 bg-dark-card border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent text-sm"
                          placeholder={`Option ${oIndex + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dark-muted text-center py-4">No questions added yet</p>
          )}
        </div>

        {/* Coding Practice (Optional) */}
        <div className="bg-dark-card rounded-xl border border-dark-secondary p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FaCode className="text-purple-500 text-xl" />
              <h3 className="text-lg font-bold">Coding Practice</h3>
              <span className="text-xs text-dark-muted bg-dark-secondary px-2 py-1 rounded">Optional</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-dark-muted">Enable</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={codingPracticeEnabled}
                  onChange={(e) => setCodingPracticeEnabled(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${codingPracticeEnabled ? 'bg-purple-500' : 'bg-dark-secondary'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${codingPracticeEnabled ? 'translate-x-5' : 'translate-x-1'}`}></div>
                </div>
              </div>
            </label>
          </div>

          {codingPracticeEnabled && (
            <div className="space-y-4">
              {/* Language Selector */}
              <div>
                <label className="block text-sm font-medium mb-2">Programming Language *</label>
                <select
                  value={formData.codingPractice.language}
                  onChange={(e) => updateCodingPractice('language', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-purple-500"
                >
                  {PROGRAMMING_LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Problem Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Problem Title *</label>
                <input
                  type="text"
                  value={formData.codingPractice.title}
                  onChange={(e) => updateCodingPractice('title', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="e.g., Create a Calculator Function"
                />
              </div>

              {/* Problem Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Problem Description *
                  <span className="text-xs text-dark-muted ml-2">
                    (Use **bold**, ==highlight==, `code` for formatting)
                  </span>
                </label>
                <textarea
                  value={formData.codingPractice.description}
                  onChange={(e) => updateCodingPractice('description', e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Describe the problem in detail.

Example formatting:
**Bold text** for important headings
==Highlighted text== for key points
`code` for inline code

What should the student build? What are the requirements?"
                />
              </div>

              {/* Reference Image */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <FaImage className="text-blue-400" />
                  Reference Image
                  <span className="text-xs text-dark-muted">(Optional - for UI replication tasks)</span>
                </label>
                {formData.codingPractice.referenceImage ? (
                  <div className="relative">
                    <img
                      src={`${BACKEND_URL}${formData.codingPractice.referenceImage}`}
                      alt="Reference"
                      className="w-full max-h-64 object-contain bg-dark-bg rounded-lg border border-dark-secondary"
                    />
                    <button
                      type="button"
                      onClick={removeReferenceImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <FaTimes className="text-white text-sm" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 bg-dark-bg border-2 border-dashed border-dark-secondary rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploadingImage ? (
                        <FaSpinner className="animate-spin text-2xl text-blue-400 mb-2" />
                      ) : (
                        <FaImage className="text-2xl text-dark-muted mb-2" />
                      )}
                      <p className="text-sm text-dark-muted">
                        {uploadingImage ? 'Uploading...' : 'Click to upload reference image'}
                      </p>
                      <p className="text-xs text-dark-muted mt-1">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReferenceImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>

              {/* Image Links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FaLink className="text-cyan-400" />
                    Image Links
                    <span className="text-xs text-dark-muted">(URLs for students to use)</span>
                  </label>
                  <button
                    type="button"
                    onClick={addImageLink}
                    className="flex items-center gap-1 px-3 py-1 bg-dark-secondary rounded-lg hover:bg-dark-secondary/80 transition-colors text-sm"
                  >
                    <FaPlus className="text-xs" /> Add Link
                  </button>
                </div>
                {formData.codingPractice.imageLinks && formData.codingPractice.imageLinks.length > 0 ? (
                  <div className="space-y-3">
                    {formData.codingPractice.imageLinks.map((link, index) => (
                      <div key={index} className="p-3 bg-dark-bg rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-cyan-400 text-sm">#{index + 1}</span>
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => updateImageLink(index, 'label', e.target.value)}
                            className="flex-1 px-3 py-2 bg-dark-card border border-dark-secondary rounded-lg focus:outline-none focus:border-cyan-400 text-sm"
                            placeholder="Label (e.g., Background Image, Logo)"
                          />
                          <button
                            type="button"
                            onClick={() => removeImageLink(index)}
                            className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateImageLink(index, 'url', e.target.value)}
                          className="w-full px-3 py-2 bg-dark-card border border-dark-secondary rounded-lg focus:outline-none focus:border-cyan-400 text-sm font-mono"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-dark-muted text-sm text-center py-3 bg-dark-bg rounded-lg">
                    No image links added. Add URLs for background images, icons, etc.
                  </p>
                )}
              </div>

              {/* Starter Code */}
              <div>
                <label className="block text-sm font-medium mb-2">Starter Code</label>
                <textarea
                  value={formData.codingPractice.starterCode}
                  onChange={(e) => updateCodingPractice('starterCode', e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-purple-500 resize-none font-mono text-sm"
                  placeholder="// Write starter code here that students will begin with..."
                />
              </div>

              {/* Expected Output */}
              <div>
                <label className="block text-sm font-medium mb-2">Expected Output</label>
                <textarea
                  value={formData.codingPractice.expectedOutput}
                  onChange={(e) => updateCodingPractice('expectedOutput', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-purple-500 resize-none font-mono text-sm"
                  placeholder="What output should the correct solution produce?"
                />
              </div>

              {/* Test Script (for web languages: html, css, javascript) */}
              {['html', 'css', 'javascript'].includes(formData.codingPractice.language) && (
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <FaCode className="text-green-400" />
                    Test Script
                    <span className="text-xs text-dark-muted">(JS assertions that run after student's code)</span>
                  </label>
                  <textarea
                    value={formData.codingPractice.testScript || ''}
                    onChange={(e) => updateCodingPractice('testScript', e.target.value)}
                    rows={10}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-green-500 resize-none font-mono text-sm"
                    placeholder={`// This JS runs inside the student's iframe after their code.
// Use DOM queries to check their work.
// Push 'PASS' or 'FAIL: reason' to results array.

const results = [];

const btn = document.querySelector('button');
results.push(btn ? 'PASS' : 'FAIL: No <button> found');
results.push(btn?.textContent.trim() === 'Click Me'
  ? 'PASS' : 'FAIL: Button text should be "Click Me"');

const color = btn ? getComputedStyle(btn).backgroundColor : '';
results.push(color === 'rgb(255, 0, 0)'
  ? 'PASS' : 'FAIL: Button background should be red');

// REQUIRED: send results back
console.log('TEST_RESULTS:' + JSON.stringify(results));`}
                  />
                  <p className="text-xs text-dark-muted mt-1">
                    Must end with: <code className="text-green-400">console.log('TEST_RESULTS:' + JSON.stringify(results))</code>
                  </p>
                </div>
              )}

              {/* Test Cases (for non-web languages) */}
              {!['html', 'css', 'javascript'].includes(formData.codingPractice.language) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <FaCode className="text-green-400" />
                      Test Cases
                      <span className="text-xs text-dark-muted">(Input/Output pairs — validated server-side)</span>
                    </label>
                    <button
                      type="button"
                      onClick={addTestCase}
                      className="flex items-center gap-1 px-3 py-1 bg-dark-secondary rounded-lg hover:bg-dark-secondary/80 transition-colors text-sm"
                    >
                      <FaPlus className="text-xs" /> Add Test Case
                    </button>
                  </div>
                  {formData.codingPractice.testCases && formData.codingPractice.testCases.length > 0 ? (
                    <div className="space-y-3">
                      {formData.codingPractice.testCases.map((tc, index) => (
                        <div key={index} className="p-3 bg-dark-bg rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-green-400 text-sm font-medium">Test #{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeTestCase(index)}
                              className="p-1.5 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-dark-muted mb-1 block">Input (stdin)</label>
                              <textarea
                                value={tc.input}
                                onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 bg-dark-card border border-dark-secondary rounded-lg focus:outline-none focus:border-green-500 font-mono text-sm resize-none"
                                placeholder="e.g. 5&#10;1 2 3 4 5"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-dark-muted mb-1 block">Expected Output</label>
                              <textarea
                                value={tc.expectedOutput}
                                onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 bg-dark-card border border-dark-secondary rounded-lg focus:outline-none focus:border-green-500 font-mono text-sm resize-none"
                                placeholder="e.g. 5 4 3 2 1"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-dark-muted text-sm text-center py-3 bg-dark-bg rounded-lg">
                      No test cases added. Add input/output pairs for server-side validation. Falls back to Expected Output if empty.
                    </p>
                  )}
                </div>
              )}

              {/* Hints */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FaLightbulb className="text-yellow-500" />
                    Hints
                  </label>
                  <button
                    type="button"
                    onClick={addHint}
                    className="flex items-center gap-1 px-3 py-1 bg-dark-secondary rounded-lg hover:bg-dark-secondary/80 transition-colors text-sm"
                  >
                    <FaPlus className="text-xs" /> Add Hint
                  </button>
                </div>
                {formData.codingPractice.hints.length > 0 ? (
                  <div className="space-y-2">
                    {formData.codingPractice.hints.map((hint, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-yellow-500 text-sm mt-3">#{index + 1}</span>
                        <input
                          type="text"
                          value={hint}
                          onChange={(e) => updateHint(index, e.target.value)}
                          className="flex-1 px-3 py-2 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-yellow-500 text-sm"
                          placeholder={`Hint ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeHint(index)}
                          className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-dark-muted text-sm text-center py-3 bg-dark-bg rounded-lg">
                    No hints added. Click "Add Hint" to help students.
                  </p>
                )}
              </div>
            </div>
          )}

          {!codingPracticeEnabled && (
            <p className="text-dark-muted text-center py-4">
              Enable coding practice to add a code editor with problem description, starter code, and hints.
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <FaSpinner className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FaSave />
                {isEditing ? 'Update Topic' : 'Create Topic'}
              </>
            )}
          </button>
          <Link
            to={`/courses/${courseId}/topics`}
            className="px-6 py-3 bg-dark-secondary rounded-lg hover:bg-dark-secondary/80 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default TopicForm;
