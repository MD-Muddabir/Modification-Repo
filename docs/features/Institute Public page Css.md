
ZF Solution PLATFORM
Institute Public Web Page
UI/UX Design — Complete Implementation Phases

Basic to Advanced — All Sections Covered
Document	UI/UX Implementation Guide
Design Source	institute-public-page.html
Phases	10 Phases
Tech Stack	React + Tailwind CSS + Axios
Fonts	Playfair Display + DM Sans
Theme	Navy Blue (#1A3C5E) + Gold (#F4A61D)

 
Section 1 — Design System & Tokens

These are the exact design values extracted from your institute-public-page.html file. Every color, font, spacing and shadow must match exactly when you convert this to React.

1.1  Color Palette
Copy these as CSS variables in your globals.css or as a Tailwind theme extension.

CSS Variable	Hex Value	Used In
--primary	#1A3C5E	Navbar, hero bg, buttons, footer bg
--accent	#F4A61D	Highlights, hover states, gold numbers, CTA buttons
--accent2	#E8F4FD	About section bg, icon backgrounds
--text	#1C2B3A	All body text
--muted	#6B7E8F	Subtitles, placeholders, secondary text
--bg	#F8FBFF	Page background, input backgrounds
--border	#E2ECF5	All card borders, input borders
--success	#22C55E	Form submit success state
--shadow	0 4px 32px rgba(26,60,94,0.10)	Card default shadow
--shadow-lg	0 12px 60px rgba(26,60,94,0.16)	Card hover shadow
--radius	16px	All card border-radius

1.2  Typography

Element	Font Family	Size / Weight	Color
Hero Title	Playfair Display	clamp(36px,5vw,64px) / 900	white
Section Title	Playfair Display	clamp(28px,3.5vw,44px) / 800	--primary
Nav Brand Name	Playfair Display	20px / 700	--primary
Section Label	DM Sans	12px / 700, UPPERCASE, 2px spacing	--accent
Body Text	DM Sans	16-17px / 400, line-height 1.7	--muted
Stat Numbers	Playfair Display	28px (hero) / 48px (strip) / 700	--accent
Button Text	DM Sans	14-16px / 600	varies
Badge / Label	DM Sans	12px / 700	--accent
Course Name	DM Sans	16px / 700	--primary
Faculty Name	DM Sans	15px / 700	--primary
Form Label	DM Sans	12px / 600 UPPERCASE 0.5px spacing	--text

1.3  Button Styles — Exact Variants

Class	Background	Padding	Hover Effect
.btn-primary	--accent (gold)	10px 22px	translateY(-2px) + stronger shadow
.btn-outline	transparent + border: --primary	10px 22px	fill: --primary bg, white text
.btn-white	white + shadow	10px 22px	translateY(-2px) + larger shadow
.btn-lg	(add to any btn)	15px 36px, font 16px	same as base
.enroll-btn	--primary (dark blue)	7px 16px, font 12px	--accent bg, --primary text
.submit-btn	--primary full width	14px, full width	--accent bg, --primary text, translateY(-2px)

1.4  Animation Tokens

Animation	Definition	Used On
fadeUp	translateY(24px)→0, opacity 0→1	Hero title, badge, description, stats, actions
slideDown	translateY(-100%)→0, opacity 0→1	Sticky navbar on page load
pulse	scale(1)→scale(1.15), infinite alternate	Hero background blobs
blink	opacity 1→0.3→1, 1.5s infinite	Admission open badge dot
reveal (scroll)	IntersectionObserver, opacity+translateY	All section cards on scroll
transition: all .3s	Standard card hover	Course cards, faculty cards, review cards
transition: .2s	Fast hover	Buttons, nav links, social icons

 
  PHASE 1    Project Setup & Folder Structure  — React + Tailwind + Google Fonts

Step 1 — Install Dependencies
  # In your frontend folder:
  npm install axios react-helmet-async react-router-dom
  npm install @headlessui/react
  
  # Tailwind (if not already):
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p

Step 2 — Google Fonts in index.html
  <!-- In public/index.html <head> -->
  <link rel='preconnect' href='https://fonts.googleapis.com'>
  <link href='https://fonts.googleapis.com/css2?family=Playfair+Display:
    wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap'
    rel='stylesheet'>

Step 3 — CSS Variables in globals.css or index.css
  :root {
    --primary:   #1a3c5e;
    --accent:    #f4a61d;
    --accent2:   #e8f4fd;
    --text:      #1c2b3a;
    --muted:     #6b7e8f;
    --bg:        #f8fbff;
    --border:    #e2ecf5;
    --success:   #22c55e;
    --radius:    16px;
    --shadow:    0 4px 32px rgba(26,60,94,0.10);
    --shadow-lg: 0 12px 60px rgba(26,60,94,0.16);
  }
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'DM Sans', sans-serif; background: var(--bg);
         color: var(--text); overflow-x: hidden; }

Step 4 — Folder Structure
  src/
    pages/
      PublicPage.jsx          ← Main public page component
    components/public/
      PublicNav.jsx
      PublicHero.jsx
      PublicAbout.jsx
      PublicCourses.jsx
      PublicAchievements.jsx
      PublicFaculty.jsx
      PublicGallery.jsx
      PublicReviews.jsx
      PublicEnrollForm.jsx
      PublicContact.jsx
      PublicFooter.jsx
    hooks/
      useScrollReveal.js      ← IntersectionObserver hook
      usePublicPage.js        ← API fetch hook
    styles/
      public-page.css         ← All page CSS (from HTML file)

Step 5 — React Router Setup
  // In App.jsx
  import { BrowserRouter, Routes, Route } from 'react-router-dom';
  import PublicPage from './pages/PublicPage';
  
  <Routes>
    <Route path='/p/:slug' element={<PublicPage />} />
    {/* ...your other admin/student routes */}
  </Routes>

  PHASE 2    Sticky Navigation Bar  — Logo + Institute Name + Tagline + Nav Links + CTA Buttons

The navbar is sticky (top:0), glassmorphism (backdrop-filter: blur(14px)), animates in on page load with slideDown, and highlights the active section on scroll.

2.1 — Exact CSS for Navbar
  nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255,255,255,0.96);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 48px;
    box-shadow: 0 2px 18px rgba(26,60,94,0.07);
    animation: slideDown .5s ease;
  }
  @keyframes slideDown {
    from { transform: translateY(-100%); opacity: 0; }
    to   { transform: translateY(0);     opacity: 1; }
  }

2.2 — Logo Box (initials if no image)
  .nav-logo {
    width: 46px; height: 46px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--primary) 60%, var(--accent));
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 22px; font-weight: 900; color: white;
  }
  /* If logo image exists: */
  .nav-logo img { width:100%; height:100%; object-fit:cover; border-radius:12px; }

2.3 — PublicNav.jsx Component
  const PublicNav = ({ institute }) => {
    const initials = institute?.name
      ?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  
    return (
      <nav>
        <div className='nav-brand'>
          <div className='nav-logo'>
            {institute?.logo
              ? <img src={institute.logo} alt='logo' />
              : initials}
          </div>
          <div>
            <div className='nav-name'>{institute?.name}</div>
            <div className='nav-tagline'>{institute?.tagline}</div>
          </div>
        </div>
  
        <ul className='nav-links'>
          {['about','courses','faculty','gallery','contact'].map(id => (
            <li key={id}>
              <a href={`#${id}`}>{id.charAt(0).toUpperCase()+id.slice(1)}</a>
            </li>
          ))}
        </ul>
  
        <div className='nav-cta'>
          <a href='/login' className='btn btn-outline'>Login</a>
          <a href='#enroll' className='btn btn-primary'>Enroll Now</a>
        </div>
      </nav>
    );
  };

2.4 — Active Link on Scroll (JavaScript)
  useEffect(() => {
    const sections = document.querySelectorAll('section[id], div[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    const handleScroll = () => {
      let cur = '';
      sections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 100) cur = s.id;
      });
      navLinks.forEach(a => {
        const isActive = a.getAttribute('href') === '#' + cur;
        a.style.color      = isActive ? 'var(--primary)' : '';
        a.style.fontWeight = isActive ? '700' : '';
      });
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

 
  PHASE 3    Hero Section  — Dark gradient bg + blobs + stats + CTA + quick-info card

The hero is the most complex section. It has a dark navy gradient background, two animated blob circles, a two-column grid, animated stats, and a glassmorphism info card on the right.

3.1 — Hero Background & Blobs
  .hero { position:relative; min-height:92vh;
          display:flex; align-items:center; overflow:hidden; }
  
  .hero-bg {
    position:absolute; inset:0;
    background: linear-gradient(125deg, #1a3c5e 0%, #0f2640 55%, #1a3c5e 100%);
  }
  .hero-bg::after {   /* subtle dot pattern */
    content:''; position:absolute; inset:0;
    background: url("data:image/svg+xml,...") repeat;
    opacity: 0.5;
  }
  .hero-blob {
    position:absolute; width:600px; height:600px; border-radius:50%;
    background: radial-gradient(circle, rgba(244,166,29,.18) 0%, transparent 70%);
    right:-100px; top:-100px;
    animation: pulse 6s ease-in-out infinite alternate;
  }
  @keyframes pulse {
    from { transform: scale(1); } to { transform: scale(1.15); }
  }

3.2 — Admission Badge (animated dot)
  .hero-badge {
    display:inline-flex; align-items:center; gap:8px;
    background: rgba(244,166,29,.15);
    border: 1px solid rgba(244,166,29,.3);
    color: var(--accent);
    padding: 7px 16px; border-radius: 99px;
    font-size:13px; font-weight:600; margin-bottom:24px;
    animation: fadeUp .7s .1s both;
  }
  .badge-dot {
    width:7px; height:7px; border-radius:50%;
    background: var(--accent);
    animation: blink 1.5s infinite;
  }
  @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:.3;} }

3.3 — Staggered fadeUp animations
  @keyframes fadeUp {
    from { transform: translateY(24px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  /* Apply with increasing delays: */
  .hero-badge     { animation: fadeUp .7s 0.1s both; }
  .hero-title     { animation: fadeUp .7s 0.2s both; }
  .hero-desc      { animation: fadeUp .7s 0.3s both; }
  .hero-stats     { animation: fadeUp .7s 0.4s both; }
  .hero-actions   { animation: fadeUp .7s 0.5s both; }
  .hero-card      { animation: fadeUp .8s 0.3s both; }

3.4 — Stats Row (dynamic from API)
  /* 4 stats: Students | Pass Rate | Years | Faculty */
  .hero-stats { display:flex; gap:32px; margin-bottom:36px; }
  .stat-num {
    font-family: 'Playfair Display', serif;
    font-size: 28px; font-weight: 700;
    color: var(--accent); line-height: 1;
  }
  .stat-label { font-size:12px; color:rgba(255,255,255,.6); margin-top:4px; }
  
  /* React: */
  const yearsRunning = new Date().getFullYear() - institute.established_year;
  <div className='stat-num'>{studentCount}+</div>
  <div className='stat-num'>{institute.pass_rate}</div>
  <div className='stat-num'>{yearsRunning}+</div>
  <div className='stat-num'>{facultyCount}</div>

3.5 — Right Glassmorphism Info Card
  .hero-card {
    background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.14);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    padding: 36px;
  }
  /* Cover photo area: */
  .hero-img-wrap {
    border-radius: 18px; overflow:hidden; height: 280px;
    background: linear-gradient(135deg,
      rgba(244,166,29,.2), rgba(26,60,94,.4));
  }
  /* Quick info rows: address, phone, hours, affiliation */
  .quick-icon {
    width:32px; height:32px; border-radius:8px;
    background: rgba(244,166,29,.18);
  }

 
  PHASE 4    About Section + Scroll Reveal  — Image grid + USP value cards

4.1 — useScrollReveal Hook
  // src/hooks/useScrollReveal.js
  import { useEffect } from 'react';
  
  export const useScrollReveal = () => {
    useEffect(() => {
      const els = document.querySelectorAll('.reveal');
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              e.target.classList.add('visible');
              observer.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      els.forEach(el => observer.observe(el));
      return () => observer.disconnect();
    }, []);
  };

4.2 — Reveal CSS (put in globals.css)
  .reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity .7s ease, transform .7s ease;
  }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  
  /* Stagger with transition-delay on elements: */
  <div className='reveal' style={{transitionDelay:'0.1s'}}>
  <div className='reveal' style={{transitionDelay:'0.2s'}}>

4.3 — About Image Grid (2x2 with tall left col)
  .about-images {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .about-img {
    border-radius: 16px; overflow:hidden;
    background: linear-gradient(135deg, var(--accent2), var(--border));
    aspect-ratio: 1;
    display:flex; align-items:center; justify-content:center;
    transition: transform .3s;
    position: relative;
  }
  .about-img.tall { grid-row: span 2; aspect-ratio: auto; }
  .about-img:hover { transform: scale(1.03); }
  
  /* Label overlay: */
  .about-img-label {
    position:absolute; bottom:10px; left:10px;
    background: rgba(26,60,94,.82); color:white;
    font-size:11px; font-weight:600;
    padding: 4px 10px; border-radius:6px;
  }

4.4 — USP Value List (icon + title + desc)
  .value-item { display:flex; align-items:flex-start; gap:14px; }
  .value-icon {
    width:40px; height:40px; border-radius:10px;
    background: var(--accent2);
    display:flex; align-items:center; justify-content:center;
    font-size:20px; flex-shrink:0;
  }
  
  /* React: render from institute.usp_points[] */
  {institute.usp_points?.map((usp, i) => (
    <li key={i} className='value-item'>
      <div className='value-icon'>{usp.icon}</div>
      <div className='value-text'>
        <strong>{usp.title}</strong>
        <p>{usp.description}</p>
      </div>
    </li>
  ))}

 
  PHASE 5    Courses Section  — White rounded container + course cards + hover effects

5.1 — White Rounded Courses Container
  /* This section breaks out of the page BG */
  .courses-section {
    background: #fff;
    border-radius: 32px;
    padding: 80px;
    margin: 0 48px;   /* does NOT use max-width */
  }
  .courses-header {
    display:flex; justify-content:space-between;
    align-items:flex-end; margin-bottom:48px;
  }
  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 24px;
  }

5.2 — Course Card Structure & CSS
  .course-card {
    background: var(--bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    transition: all .3s; cursor:pointer;
  }
  .course-card:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow-lg);
    border-color: var(--accent);
  }
  .course-thumb {
    height:140px;
    display:flex; align-items:center;
    justify-content:center; font-size:48px;
    position:relative; overflow:hidden;
  }
  .course-thumb::after {   /* overlay gradient */
    content:''; position:absolute; inset:0;
    background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,.2));
  }
  .course-badge {
    position:absolute; top:12px; right:12px;
    background: var(--accent); color: var(--primary);
    font-size:11px; font-weight:700;
    padding:4px 10px; border-radius:6px; z-index:1;
  }

5.3 — Course Colors (per course from DB)
Course Type	gradient CSS value
Science (PCM/PCB)	linear-gradient(135deg,#1a3c5e,#2563a8)
JEE / NEET	linear-gradient(135deg,#7c3aed,#a855f7)
Commerce	linear-gradient(135deg,#065f46,#10b981)
MPSC / Competitive	linear-gradient(135deg,#9a3412,#f97316)
Default fallback	linear-gradient(135deg,var(--primary),#2563a8)

 
  PHASE 6    Achievements Strip + Faculty Grid  — Dark strip + avatar initials fallback

6.1 — Achievements Dark Strip
  .achievements-strip {
    background: linear-gradient(135deg, var(--primary) 0%, #0f2640 100%);
    padding: 64px 48px;
    border-radius: 28px;
    margin: 0 48px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 32px;
  }
  .ach-num {
    font-family: 'Playfair Display', serif;
    font-size: 48px; font-weight: 900;
    color: var(--accent); line-height:1; margin-bottom:8px;
  }
  .ach-label { font-size:14px; color:rgba(255,255,255,.7); font-weight:500; }

6.2 — Faculty Grid Cards
  .faculty-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 24px; margin-top:48px;
  }
  .faculty-card {
    background:white; border: 1.5px solid var(--border);
    border-radius: var(--radius);
    padding: 28px 20px; text-align:center;
    transition: all .3s;
  }
  .faculty-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow);
    border-color: var(--primary);
  }
  .faculty-avatar {
    width:80px; height:80px; border-radius:50%;
    margin: 0 auto 14px;
    background: linear-gradient(135deg, var(--primary), #2563a8);
    display:flex; align-items:center; justify-content:center;
    font-family:'Playfair Display',serif;
    font-size:28px; font-weight:700; color:white;
    border: 3px solid var(--accent2);
  }
  /* Initials from name: */
  const initials = name.split(' ').slice(0,2).map(w=>w[0]).join('');

 
  PHASE 7    Gallery + Reviews  — Photo grid with hover overlay + testimonial cards

7.1 — Gallery Grid (CSS Grid, first item spans 2x2)
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: 200px 200px;
    gap: 14px; margin-top:48px;
  }
  .gallery-item { border-radius:14px; overflow:hidden;
    cursor:pointer; transition:all .3s; position:relative; }
  .gallery-item:first-child {
    grid-column: span 2;   /* takes 2 columns */
    grid-row: span 2;      /* takes 2 rows    */
  }
  .gallery-item:hover { transform: scale(1.02); }
  
  /* Hover overlay: */
  .gallery-overlay {
    position:absolute; inset:0;
    background: rgba(26,60,94,.6);
    display:flex; align-items:center; justify-content:center;
    color:white; font-weight:600; font-size:14px;
    opacity:0; transition: opacity .3s;
  }
  .gallery-item:hover .gallery-overlay { opacity: 1; }

7.2 — Reviews Cards
  .reviews-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px; margin-top:48px;
  }
  .review-card {
    background:white; border:1.5px solid var(--border);
    border-radius: var(--radius);
    padding: 28px; transition: all .3s;
  }
  .review-card:hover { transform:translateY(-4px); box-shadow: var(--shadow); }
  .stars { color:#f59e0b; font-size:16px; margin-bottom:14px; }
  .review-text { font-style:italic; font-size:14px;
                 color:var(--muted); line-height:1.7; margin-bottom:18px; }
  .reviewer-avatar {
    width:40px; height:40px; border-radius:50%;
    background: var(--primary);
    display:flex; align-items:center; justify-content:center;
    color:white; font-weight:700; font-size:14px;
  }

 
  PHASE 8    Enrollment CTA + Form  — Dark two-column section + white form card

8.1 — Enrollment CTA Dark Section
  .enroll-cta {
    background: linear-gradient(125deg, var(--primary) 0%, #0f2640 100%);
    border-radius: 28px;
    padding: 72px 80px;
    margin: 0 48px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px; align-items:center;
    position:relative; overflow:hidden;
  }
  /* Glow blob in background: */
  .enroll-cta::before {
    content:''; position:absolute;
    width:400px; height:400px; border-radius:50%;
    background: radial-gradient(circle, rgba(244,166,29,.15) 0%, transparent 70%);
    right:-80px; top:-80px;
  }
  /* Checkmark list items: */
  .enroll-features li::before {
    content: 'checkmark symbol';
    width:22px; height:22px; border-radius:50%;
    background: rgba(244,166,29,.2);
    color: var(--accent); font-size:12px;
    font-weight:700; flex-shrink:0;
  }

8.2 — White Form Card
  .form-card {
    background:white; border-radius:20px;
    padding:36px;
    box-shadow: 0 20px 60px rgba(0,0,0,.25);
    position:relative; z-index:1;
  }
  .form-input, .form-select {
    width:100%; padding:12px 14px;
    border: 1.5px solid var(--border);
    border-radius:10px; font-size:14px;
    background: var(--bg); transition: border .2s;
  }
  .form-input:focus, .form-select:focus {
    border-color: var(--primary); background:white; outline:none;
  }
  .form-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  
  /* Submit button: */
  .submit-btn {
    width:100%; padding:14px;
    background: var(--primary); color:white;
    border:none; border-radius:12px;
    font-size:15px; font-weight:700; cursor:pointer;
    transition: all .25s;
  }
  .submit-btn:hover {
    background: var(--accent); color:var(--primary);
    transform: translateY(-2px);
  }

8.3 — Form Submit Handler (React + Axios)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`/api/public/${slug}/enquiry`, formData);
      setSubmitted(true);
    } catch (err) {
      setError('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  /* Button state: */
  {submitted
    ? <button disabled className='submit-btn success'>
        Submitted! We will call you soon.
      </button>
    : <button className='submit-btn' onClick={handleSubmit}>
        {loading ? 'Submitting...' : 'Submit Enquiry →'}
      </button>
  }

 
  PHASE 9    Contact + Footer + WhatsApp FAB  — Map placeholder + 4-col footer + floating button

9.1 — Contact Grid
  .contact-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 60px; align-items:start; margin-top:48px;
  }
  .contact-icon {
    width:48px; height:48px; border-radius:12px;
    background: var(--accent2);
    display:flex; align-items:center; justify-content:center;
    font-size:22px; flex-shrink:0;
  }
  /* Google Maps embed: */
  {institute.map_embed_url
    ? <iframe src={institute.map_embed_url}
        width='100%' height='280'
        style={{border:0,borderRadius:'16px'}}
        allowFullScreen loading='lazy' />
    : <div className='map-placeholder'>🗺️<p>Map coming soon</p></div>
  }

9.2 — Footer (4 column grid)
  footer {
    background: var(--primary); color:rgba(255,255,255,.8);
    padding: 60px 48px 28px; margin-top:60px;
  }
  .footer-grid {
    max-width:1200px; margin:0 auto;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap:48px; margin-bottom:40px;
  }
  /* Social icon buttons: */
  .social-btn {
    width:36px; height:36px; border-radius:8px;
    background: rgba(255,255,255,.1);
    transition: background .2s;
  }
  .social-btn:hover { background: var(--accent); }
  
  /* Bottom bar: */
  .footer-bottom {
    border-top: 1px solid rgba(255,255,255,.1);
    display:flex; justify-content:space-between;
  }
  /* Powered badge: */
  .powered-badge {
    background: rgba(255,255,255,.08);
    padding: 5px 12px; border-radius:6px;
    font-size:11px;
  }

9.3 — WhatsApp Floating Action Button
  .whatsapp-fab {
    position:fixed; bottom:28px; right:28px;
    width:56px; height:56px; border-radius:50%;
    background: #25d366;
    box-shadow: 0 6px 24px rgba(37,211,102,.4);
    z-index:200; transition: transform .2s;
    display:flex; align-items:center; justify-content:center;
    font-size:26px; color:white;
  }
  .whatsapp-fab:hover { transform: scale(1.1); }
  
  /* React: */
  <a href={`https://wa.me/91${institute.whatsapp_number}`}
     className='whatsapp-fab' title='Chat on WhatsApp'>
    💬
  </a>

 
  PHASE 10    Full Page Data Flow — API to UI  — usePublicPage hook + skeleton loader + 404

10.1 — usePublicPage Hook (fetch all data)
  // src/hooks/usePublicPage.js
  import { useState, useEffect } from 'react';
  import axios from 'axios';
  
  export const usePublicPage = (slug) => {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);
  
    useEffect(() => {
      if (!slug) return;
      setLoading(true);
      axios.get(`/api/public/${slug}`)
        .then(res => setData(res.data))
        .catch(err => {
          if (err.response?.status === 404) setError('404');
          else setError('error');
        })
        .finally(() => setLoading(false));
    }, [slug]);
  
    return { data, loading, error };
  };

10.2 — PublicPage.jsx Main Component
  // src/pages/PublicPage.jsx
  import { useParams } from 'react-router-dom';
  import { usePublicPage } from '../hooks/usePublicPage';
  import { useScrollReveal } from '../hooks/useScrollReveal';
  
  const PublicPage = () => {
    const { slug } = useParams();
    const { data, loading, error } = usePublicPage(slug);
    useScrollReveal();
  
    if (loading) return <PageSkeleton />;
    if (error === '404') return <NotFound />;
    if (error) return <ErrorState />;
  
    const { institute, courses, faculty, reviews,
            gallery, usps, studentCount } = data;
  
    return (
      <>
        <PublicNav institute={institute} />
        <PublicHero institute={institute} studentCount={studentCount}
                    facultyCount={faculty.length} />
        <PublicAbout institute={institute} usps={usps} />
        <PublicCourses courses={courses} />
        <PublicAchievements institute={institute} studentCount={studentCount} />
        <PublicFaculty faculty={faculty} />
        <PublicGallery gallery={gallery} institute={institute} />
        <PublicReviews reviews={reviews} />
        <PublicEnrollForm slug={slug} courses={courses} institute={institute}/>
        <PublicContact institute={institute} />
        <PublicFooter institute={institute} courses={courses} />
        <a href={`https://wa.me/91${institute.whatsapp_number}`}
           className='whatsapp-fab'>💬</a>
      </>
    );
  };
  export default PublicPage;

10.3 — Skeleton Loader (while loading)
  const PageSkeleton = () => (
    <div>
      {/* Hero skeleton */}
      <div style={{height:'92vh', background:'linear-gradient(125deg,
        #1a3c5e,#0f2640)'}} />
      {/* Section skeletons */}
      {[1,2,3].map(i => (
        <div key={i} style={{
          height:'300px', margin:'40px 48px',
          background:'#e2ecf5', borderRadius:'16px',
          animation:'pulse 1.5s ease-in-out infinite'
        }} />
      ))}
    </div>
  );

10.4 — SEO Meta Tags (react-helmet-async)
  import { Helmet } from 'react-helmet-async';
  
  <Helmet>
    <title>{institute.name} — {institute.tagline}</title>
    <meta name='description' content={institute.about_text} />
    <meta property='og:title' content={institute.name} />
    <meta property='og:description' content={institute.tagline} />
    <meta property='og:image' content={institute.cover_photo} />
    <meta property='og:url'
      content={`https://yoursaas.com/p/${institute.page_slug}`} />
    <meta property='og:type' content='website' />
    <link rel='icon' href={institute.logo || '/favicon.ico'} />
  </Helmet>

 
Section 2 — Responsive Breakpoints

The exact media queries from your HTML file. Apply these in your CSS file.

  @media (max-width: 900px) {
    nav { padding: 12px 20px; }
    .nav-links { display: none; }         /* hide links, show hamburger */
    .hero-inner { grid-template-columns: 1fr;
                  padding: 60px 24px; gap: 40px; }
    .hero-card { display: none; }         /* hide right card on mobile */
    section { padding: 60px 24px; }
    .about-grid { grid-template-columns: 1fr; }
    .courses-section { margin:0 24px; padding:48px 24px; }
    .achievements-strip { margin:0 24px;
                          grid-template-columns: 1fr 1fr; }
    .enroll-cta { margin:0 24px; padding:48px 28px;
                  grid-template-columns: 1fr; }
    .contact-grid { grid-template-columns: 1fr; }
    .footer-grid { grid-template-columns: 1fr 1fr; }
    .reviews-grid { grid-template-columns: 1fr; }
    .gallery-grid { grid-template-columns: repeat(2,1fr);
                    grid-template-rows: auto; }
    .gallery-item:first-child { grid-column: span 2; }
    footer { padding: 48px 24px 24px; }
    .footer-bottom { flex-direction: column; gap: 10px; }
  }

Section 3 — Implementation Checklist


#	Task	Phase	Status
1	Install packages: axios, react-helmet-async	Phase 1	Todo
2	Add Google Fonts to index.html	Phase 1	Todo
3	Add all CSS variables to globals.css	Phase 1	Todo
4	Add @keyframes: fadeUp, slideDown, pulse, blink	Phase 1	Todo
5	Create folder structure (components/public/)	Phase 1	Todo
6	Add /p/:slug route in React Router	Phase 1	Todo
7	Build PublicNav.jsx with logo fallback initials	Phase 2	Todo
8	Implement scroll active-link highlight	Phase 2	Todo
9	Build PublicHero.jsx with blobs + badge + stats	Phase 3	Todo
10	Years calculation: new Date().getFullYear() - established_year	Phase 3	Todo
11	Create useScrollReveal.js hook	Phase 4	Todo
12	Build PublicAbout.jsx with image grid + USP list	Phase 4	Todo
13	Build PublicCourses.jsx with dynamic color per course	Phase 5	Todo
14	Build PublicAchievements.jsx dark strip	Phase 6	Todo
15	Build PublicFaculty.jsx with avatar initials fallback	Phase 6	Todo
16	Build PublicGallery.jsx with hover overlay	Phase 7	Todo
17	Build PublicReviews.jsx with star rating + initials avatar	Phase 7	Todo
18	Build PublicEnrollForm.jsx with Axios submit + success state	Phase 8	Todo
19	Build PublicContact.jsx with Maps embed	Phase 9	Todo
20	Build PublicFooter.jsx with 4-col grid + powered badge	Phase 9	Todo
21	Add WhatsApp FAB with institute.whatsapp_number	Phase 9	Todo
22	Create usePublicPage.js hook with Axios	Phase 10	Todo
23	Build PublicPage.jsx main wrapper component	Phase 10	Todo
24	Add skeleton loader for loading state	Phase 10	Todo
25	Add react-helmet-async SEO meta tags	Phase 10	Todo
26	Apply responsive CSS media query (max-width: 900px)	Section 2	Todo

End of Document
ZF Solution Platform — UI/UX Implementation Guide
