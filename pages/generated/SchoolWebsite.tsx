
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { SchoolProfile, SchoolType } from '../../types';

const SchoolWebsite: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchSchool = async () => {
      if (!slug) return;

      // MOCK DATA FOR DEMO
      if (slug === 'demo-school') {
        const demoDate = new Date();
        demoDate.setDate(demoDate.getDate() - 25);
        setSchool({
          id: 'demo-school',
          ownerUid: 'demo-user-123',
          name: 'Green Valley International School',
          zone: 'Central',
          district: 'Metro City',
          state: 'California',
          address: '123 Education Lane, Academic District',
          udiseCode: 'UDISE-2024-001',
          type: SchoolType.HIGHER_SECONDARY,
          headmasterName: 'Dr. Robert Smith',
          slug: 'demo-school',
          createdAt: demoDate,
          websiteConfig: {
            welcomeMessage: 'Empowering the next generation of leaders through excellence in education.',
            abbreviation: 'GVIS',
            heroImageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=2832&auto=format&fit=crop',
            logoUrl: '', // Can add a mock logo url here if needed
            aboutText: 'Founded in 1995, Green Valley International School has been a pioneer in providing quality education. Our mission is to foster an environment where students can explore their potential and develop into responsible global citizens with a passion for learning and integrity.',
            facilities: ['Smart Classrooms', 'Science Lab', 'Computer Lab', 'Library', 'Sports Complex', 'Transport', 'Wi-Fi Campus', 'Auditorium'],
            socialLinks: { facebook: 'https://fb.com', instagram: 'https://insta.com' },
            admissionOpen: true,
            themeColor: 'indigo',
            contactEmail: 'info@greenvalley.edu',
            contactPhone: '+1 (123) 456-7890',
            notifications: [
              { id: '1', title: 'Annual Sports Day scheduled for next month.', date: '2 days ago' },
              { id: '2', title: 'Parent-Teacher Meeting for Class 10th.', date: '5 days ago' },
              { id: '3', title: 'Winter vacation notice.', date: '1 week ago' },
            ],
          }
        });
        setLoading(false);
        return;
      }

      // Real Firestore Fetch
      try {
        const docRef = doc(db, 'schools', slug);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSchool(snap.data() as SchoolProfile);
        }
      } catch (e) {
        console.error("Failed to load school site");
      } finally {
        setLoading(false);
      }
    };
    fetchSchool();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium tracking-wide animate-pulse">Loading School Website...</div>;

  if (!school) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-4">
      <h1 className="text-4xl font-bold text-slate-900 mb-4">School Not Found</h1>
      <p className="text-slate-500 mb-8">The website you are looking for does not exist or has been moved.</p>
      <Link to="/" className="text-indigo-600 font-bold hover:underline">Go to BrightLoop Home</Link>
    </div>
  );
  
  const theme = school.websiteConfig.themeColor || 'indigo';
  const config = school.websiteConfig;

  // Dynamic Classes based on Theme
  const bgTheme = `bg-${theme}-600`;
  const textTheme = `text-${theme}-600`;
  const borderTheme = `border-${theme}-200`;
  const hoverTheme = `hover:bg-${theme}-700`;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-slate-900 selection:text-white">
       
       {/* NAVBAR */}
       <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-lg py-3' : 'bg-transparent py-6'}`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                 {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
                 ) : (
                    <div className={`h-12 w-12 ${bgTheme} text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg`}>
                       {school.name[0]}
                    </div>
                 )}
                 <div>
                    <h1 className={`text-xl md:text-2xl font-bold leading-none ${scrolled ? 'text-slate-900' : 'text-white'} font-display tracking-tight`}>{school.name}</h1>
                    <p className={`text-xs font-bold uppercase tracking-widest ${scrolled ? 'text-slate-500' : 'text-white/80'}`}>{config.abbreviation}</p>
                 </div>
              </div>
              
              <nav className={`hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider ${scrolled ? 'text-slate-600' : 'text-white/90'}`}>
                 <a href="#" className="hover:text-slate-400 transition-colors">Home</a>
                 {config.aboutText && <a href="#about" className="hover:text-slate-400 transition-colors">About</a>}
                 {config.facilities && config.facilities.length > 0 && <a href="#facilities" className="hover:text-slate-400 transition-colors">Facilities</a>}
                 <a href="#notices" className="hover:text-slate-400 transition-colors">Notices</a>
                 <a href="#contact" className="hover:text-slate-400 transition-colors">Contact</a>
              </nav>

              {/* Mobile Menu Button (Hidden logic for brevity, assume simple hidden on mobile for now or use a simple implementation) */}
          </div>
       </header>

       {/* HERO SECTION */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                {config.heroImageUrl ? (
                    <img src={config.heroImageUrl} alt="Campus" className="w-full h-full object-cover transition-transform duration-[20s] hover:scale-110" />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br from-${theme}-800 to-slate-900`}></div>
                )}
                <div className="absolute inset-0 bg-slate-900/60"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-20">
                {config.logoUrl && <img src={config.logoUrl} className="h-24 w-auto mx-auto mb-8 animate-fade-in-down drop-shadow-2xl" alt="School Logo" />}
                <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 font-display tracking-tight leading-tight animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
                    {config.welcomeMessage || `Welcome to ${school.name}`}
                </h2>
                <p className="text-xl text-slate-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in-down" style={{ animationDelay: '0.2s' }}>
                   {school.address} &bull; {school.district}
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-down" style={{ animationDelay: '0.3s' }}>
                    {config.admissionOpen && (
                        <button className={`${bgTheme} ${hoverTheme} text-white px-10 py-4 rounded-full font-bold text-lg shadow-2xl shadow-${theme}-900/50 transition-all hover:-translate-y-1`}>
                            Apply for Admission
                        </button>
                    )}
                    <a href="#contact" className="px-10 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-lg hover:bg-white hover:text-slate-900 transition-all">
                        Contact Us
                    </a>
                </div>
            </div>
        </section>

       {/* NOTICE TICKER */}
       {config.notifications.length > 0 && (
           <div className="bg-slate-900 text-white py-3 overflow-hidden relative z-20 border-b border-slate-800">
               <div className="max-w-7xl mx-auto px-6 flex items-center gap-6">
                   <span className="bg-red-600 text-white text-[10px] font-bold uppercase px-2 py-1 rounded animate-pulse shrink-0">Updates</span>
                   <div className="flex-1 overflow-hidden">
                       <div className="whitespace-nowrap animate-scroll inline-block">
                           {config.notifications.map(n => (
                               <span key={n.id} className="mr-12 text-sm font-medium text-slate-300">
                                   <span className="text-white font-bold mr-2">[{n.date}]</span>
                                   {n.title}
                               </span>
                           ))}
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* ABOUT SECTION */}
       {config.aboutText && (
        <section id="about" className="py-24 px-6 bg-white">
            <div className="max-w-4xl mx-auto text-center">
                <h3 className={`text-sm font-bold ${textTheme} uppercase tracking-widest mb-4`}>Our Story</h3>
                <h2 className="text-4xl font-bold text-slate-900 mb-8 font-display">About Our School</h2>
                <div className="text-lg text-slate-600 leading-loose font-light">
                    {config.aboutText}
                </div>
                <div className="mt-12 pt-12 border-t border-slate-100 flex justify-center gap-12">
                    <div>
                        <div className={`text-4xl font-bold ${textTheme}`}>100%</div>
                        <div className="text-sm font-bold text-slate-400 uppercase mt-2">Result</div>
                    </div>
                    <div>
                        <div className={`text-4xl font-bold ${textTheme}`}>25+</div>
                        <div className="text-sm font-bold text-slate-400 uppercase mt-2">Years</div>
                    </div>
                    <div>
                        <div className={`text-4xl font-bold ${textTheme}`}>500+</div>
                        <div className="text-sm font-bold text-slate-400 uppercase mt-2">Students</div>
                    </div>
                </div>
            </div>
        </section>
       )}

       {/* FACILITIES GRID */}
       {config.facilities && config.facilities.length > 0 && (
        <section id="facilities" className="py-24 px-6 bg-slate-50">
             <div className="max-w-7xl mx-auto">
                 <div className="text-center mb-16">
                    <h3 className={`text-sm font-bold ${textTheme} uppercase tracking-widest mb-4`}>Campus Life</h3>
                    <h2 className="text-4xl font-bold text-slate-900 font-display">World Class Facilities</h2>
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {config.facilities.map((facility, i) => (
                        <div key={i} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 text-center group border border-slate-100">
                            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-${theme}-50 ${textTheme} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                                {/* Simple Icon Logic based on first letter or a default icon */}
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                            <h4 className="text-lg font-bold text-slate-800">{facility}</h4>
                        </div>
                    ))}
                 </div>
             </div>
        </section>
       )}

       {/* NOTICE BOARD & PRINCIPAL */}
       <section id="notices" className="py-24 px-6 bg-white">
           <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
               
               {/* Notices Card */}
               <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-12 border border-slate-200 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-2 ${bgTheme}`}></div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span> Notice Board
                    </h3>
                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {config.notifications.length === 0 ? (
                            <p className="text-slate-500 italic">No active notices at this time.</p>
                        ) : (
                            config.notifications.map(n => (
                                <div key={n.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                    <div className={`text-xs font-bold uppercase tracking-wider ${textTheme} mb-2`}>{n.date}</div>
                                    <h4 className="text-lg font-bold text-slate-800 leading-tight">{n.title}</h4>
                                </div>
                            ))
                        )}
                    </div>
               </div>

               {/* Principal Message */}
               <div className="flex flex-col justify-center">
                   <div className="mb-8">
                        <h3 className={`text-sm font-bold ${textTheme} uppercase tracking-widest mb-4`}>Leadership</h3>
                        <h2 className="text-4xl font-bold text-slate-900 font-display mb-6">Principal's Message</h2>
                        <p className="text-lg text-slate-600 italic leading-relaxed mb-6">
                           "Education is the passport to the future, for tomorrow belongs to those who prepare for it today. At {school.name}, we strive for nothing less than excellence."
                        </p>
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-full ${bgTheme} flex items-center justify-center text-white font-bold text-xl`}>
                                {school.headmasterName[0]}
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 text-lg">{school.headmasterName}</div>
                                <div className="text-slate-500 text-sm">Headmaster / Principal</div>
                            </div>
                        </div>
                   </div>
                   {school.signatureUrl && (
                       <img src={school.signatureUrl} alt="Signature" className="h-16 w-auto object-contain opacity-70" />
                   )}
               </div>
           </div>
       </section>

       {/* FOOTER */}
       <footer id="contact" className="bg-slate-900 text-white py-20 px-6 border-t border-slate-800">
           <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
               <div className="col-span-1 md:col-span-2">
                   <h2 className="text-3xl font-bold font-display mb-6">{school.name}</h2>
                   <p className="text-slate-400 leading-relaxed max-w-sm mb-8">
                       {school.address}, {school.district}, {school.state}.
                       <br/>
                       UDISE Code: {school.udiseCode}
                   </p>
                   {config.socialLinks && (
                       <div className="flex gap-4">
                           {config.socialLinks.facebook && <a href={config.socialLinks.facebook} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-600 transition-colors">F</a>}
                           {config.socialLinks.instagram && <a href={config.socialLinks.instagram} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-pink-600 transition-colors">I</a>}
                           {config.socialLinks.twitter && <a href={config.socialLinks.twitter} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-sky-500 transition-colors">T</a>}
                       </div>
                   )}
               </div>
               
               <div>
                   <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Contact</h3>
                   <ul className="space-y-4 text-slate-300">
                       <li className="flex items-start gap-3">
                           <span className="mt-1 text-slate-500">@</span>
                           {config.contactEmail || 'No email provided'}
                       </li>
                       <li className="flex items-start gap-3">
                           <span className="mt-1 text-slate-500">#</span>
                           {config.contactPhone || 'No phone provided'}
                       </li>
                   </ul>
               </div>

               <div>
                   <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Quick Links</h3>
                   <ul className="space-y-2 text-slate-400 text-sm font-medium">
                       <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                       <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                       <li><a href="#facilities" className="hover:text-white transition-colors">Facilities</a></li>
                       <li><a href="#notices" className="hover:text-white transition-colors">Admissions</a></li>
                   </ul>
               </div>
           </div>
           <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800 text-center text-slate-500 text-xs">
               &copy; {new Date().getFullYear()} {school.name}. All rights reserved. Powered by <span className="text-indigo-500 font-bold">BrightLoop</span>.
           </div>
       </footer>
    </div>
  );
};

export default SchoolWebsite;
