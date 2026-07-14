import { useState } from 'react';
import { FiX, FiCheckCircle } from 'react-icons/fi';
import './ReportModal.css';

const REPORT_REASONS = [
  'Spam or misleading content',
  'Hate speech or symbols',
  'Violence or dangerous organizations',
  'Harassment or bullying',
  'Intellectual property violation',
  'Inappropriate or adult content',
  'Harsh language or abuse',
  'Other',
];

export default function ReportModal({ post, onClose }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedReason) return;
    setSubmitting(true);
    // Simulate API request
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="report-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="report-modal">
        <div className="report-header">
          <span className="report-title">{submitted ? 'Report Submitted' : 'Report Post'}</span>
          <button className="report-close" onClick={onClose} id="report-close-btn">
            <FiX size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="report-success">
            <FiCheckCircle size={48} className="report-success-icon" />
            <h3>Thank you for reporting</h3>
            <p>Our moderation team will review this post shortly. We appreciate you helping us keep the community safe.</p>
            <button className="report-done-btn" onClick={onClose} id="report-done-btn">Done</button>
          </div>
        ) : (
          <form className="report-form" onSubmit={handleSubmit}>
            <p className="report-instruction">Select a reason for reporting this post:</p>
            <div className="report-reasons-list">
              {REPORT_REASONS.map((reason) => (
                <label key={reason} className={`report-reason-item ${selectedReason === reason ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="report-reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="report-radio"
                  />
                  <span className="report-reason-text">{reason}</span>
                </label>
              ))}
            </div>

            <div className="report-details-section">
              <label htmlFor="report-details" className="report-details-label">
                Additional Details (Optional):
              </label>
              <textarea
                id="report-details"
                className="report-textarea"
                placeholder="Please provide any additional details that might help us review this content..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={300}
              />
              <span className="report-char-count">{details.length}/300</span>
            </div>

            <div className="report-footer">
              <button type="button" className="report-cancel-btn" onClick={onClose} id="report-cancel-btn">
                Cancel
              </button>
              <button
                type="submit"
                className="report-submit-btn"
                disabled={!selectedReason || submitting}
                id="report-submit-btn"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
