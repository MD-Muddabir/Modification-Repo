import { useState } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import toast from 'react-hot-toast';

export default function Contact() {
  useScrollReveal('reveal', 0.1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.target);
      const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        institute: formData.get('institute'),
        studentCount: formData.get('studentCount'),
        plan: formData.get('plan'),
        message: formData.get('message')
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : (import.meta.env.DEV ? 'http://localhost:5000' : 'https://institutes-saas.onrender.com')}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const resData = await response.json();

      if (resData.success) {
        toast.success(resData.message || 'Message sent! We will contact you within 24 hours.');
        e.target.reset();
      } else {
        toast.error(resData.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      toast.error('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className='lp-section' id='contact' style={{ background: 'white' }}>
      <div className='lp-section-header reveal'>
        <span className='lp-eyebrow'>Get In Touch</span>
        <h2 className='lp-h2'>Ready to Transform Your Institute?</h2>
        <p className='lp-subtitle'>
          Our team is here to help you get started with a free demo, data migration, and answering any specific operational questions.
        </p>
      </div>

      <div className='lp-contact-wrap'>
        <div className='lp-contact-info reveal'>
          <div className='lp-contact-item'>
            <div className='lp-contact-icon'>📧</div>
            <div>
              <div className='lp-contact-title'>Email Us</div>
              <div className='lp-contact-desc'>mmuddabir03@gmail.com<br />support@studentsaas.in</div>
            </div>
          </div>
          <div className='lp-contact-item'>
            <div className='lp-contact-icon'>📞</div>
            <div>
              <div className='lp-contact-title'>Call or WhatsApp</div>
              <div className='lp-contact-desc'>+91 82756 68600<br />Mon-Sat, 9AM to 7PM IST</div>
            </div>
          </div>
          <div className='lp-contact-item'>
            <div className='lp-contact-icon'>📍</div>
            <div>
              <div className='lp-contact-title'>Headquarters</div>
              <div className='lp-contact-desc'>MD Lines, Tolichowki<br />Hyderabad, Telangana 500001</div>
            </div>
          </div>
        </div>

        <form className='lp-form reveal' onSubmit={handleSubmit}>
          <div className='lp-form-row'>
            <div className='lp-form-group'>
              <label className='lp-label'>Full Name *</label>
              <input type='text' name='name' required className='lp-input' placeholder='Rahul Sharma' />
            </div>
            <div className='lp-form-group'>
              <label className='lp-label'>Phone Number *</label>
              <input type='tel' name='phone' required className='lp-input' placeholder='9876543210' maxLength={10} />
            </div>
          </div>
          <div className='lp-form-group'>
            <label className='lp-label'>Email Address *</label>
            <input type='email' name='email' required className='lp-input' placeholder='rahul@institute.com' />
          </div>
          <div className='lp-form-group'>
            <label className='lp-label'>Institute Name *</label>
            <input type='text' name='institute' required className='lp-input' placeholder='Apex Academy' />
          </div>
          <div className='lp-form-row'>
            <div className='lp-form-group'>
              <label className='lp-label'>No. of Students</label>
              <select name='studentCount' className='lp-input'>
                <option>Less than 200</option>
                <option>200 - 800</option>
                <option>800 - 3000</option>
                <option>3000+</option>
              </select>
            </div>
            <div className='lp-form-group'>
              <label className='lp-label'>Plan Interest</label>
              <select name='plan' className='lp-input'>
                <option>Starter</option>
                <option>Basic</option>
                <option>Professional</option>
                <option>Enterprise</option>
              </select>
            </div>
          </div>
          <div className='lp-form-group'>
            <label className='lp-label'>Message (Optional)</label>
            <textarea name='message' className='lp-input' rows={4} placeholder='How can we help you?'></textarea>
          </div>
          <button type='submit' className='lp-btn-primary' style={{ width: '100%', padding: '16px', fontSize: '16px', marginTop: '16px' }} disabled={loading}>
            {loading ? 'Sending...' : 'Send Message →'}
          </button>
        </form>
      </div>
    </section>
  );
}
