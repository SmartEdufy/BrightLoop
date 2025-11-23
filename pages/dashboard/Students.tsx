import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Student } from '../../types';

const Students: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialStudentState: Partial<Student> = {
    name: '',
    fatherName: '',
    class: '',
    section: '',
    rollNo: '',
    gender: 'Male',
    dob: '',
    phone: '',
    address: '',
    admissionNo: ''
  };

  const [currentStudent, setCurrentStudent] = useState<Partial<Student>>(initialStudentState);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [userProfile?.schoolId]);

  // Add Escape key listener for the modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  const fetchStudents = async () => {
    if (!userProfile?.schoolId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const q = query(collection(db, 'students'), where('schoolId', '==', userProfile.schoolId));
      const querySnapshot = await getDocs(q);
      const studentData: Student[] = [];
      querySnapshot.forEach((doc) => {
        studentData.push({ id: doc.id, ...doc.data() } as Student);
      });

      // --- ROBUST SORTING LOGIC ---
      const classOrder: { [key: string]: number } = {
        'Nursery': -2, 'LKG': -1, 'UKG': 0, '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5,
        '6th': 6, '7th': 7, '8th': 8, '9th': 9, '10th': 10, '11th': 11, '12th': 12
      };
      const getClassValue = (className: string) => classOrder[className] ?? (parseInt(className.replace(/\D/g, '')) || 99);

      studentData.sort((a, b) => {
        const classComparison = getClassValue(a.class) - getClassValue(b.class);
        if (classComparison !== 0) return classComparison;
        // Sort by roll number numerically
        return (parseInt(a.rollNo, 10) || 0) - (parseInt(b.rollNo, 10) || 0);
      });
      
      setStudents(studentData);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setCurrentStudent(initialStudentState);
    setEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setCurrentStudent(student);
    setEditMode(true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.schoolId || !currentUser) return;

    setSaving(true);
    
    // --- DEMO MODE HANDLING ---
    if (currentUser.uid === 'demo-user-123') {
        alert("Demo Mode: Changes are simulated and will not be saved.");
        // Optimistically update UI for a realistic demo feel
        if (editMode && currentStudent.id) {
            setStudents(prev => prev.map(s => s.id === currentStudent.id ? (currentStudent as Student) : s));
        } else {
            const newStudent = { ...currentStudent, id: `demo-${Date.now()}`, schoolId: userProfile.schoolId, createdAt: new Date().toISOString() } as Student;
            setStudents(prev => [...prev, newStudent]);
        }
        setIsModalOpen(false);
        setSaving(false);
        return;
    }

    try {
      if (editMode && currentStudent.id) {
        // Update
        const studentRef = doc(db, 'students', currentStudent.id);
        const { id, ...dataToUpdate } = currentStudent as Student;
        await updateDoc(studentRef, dataToUpdate);
      } else {
        // Create
        await addDoc(collection(db, 'students'), {
          ...currentStudent,
          schoolId: userProfile.schoolId,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      await fetchStudents(); // Re-fetch to get the latest sorted data
    } catch (error) {
      console.error("Error saving student:", error);
      alert("Failed to save student. Check your connection and permissions.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this student? This cannot be undone.")) return;

    // --- DEMO MODE HANDLING ---
    if (currentUser?.uid === 'demo-user-123') {
        alert("Demo Mode: Deletion is simulated.");
        setStudents(prev => prev.filter(s => s.id !== id));
        return;
    }
    
    try {
      await deleteDoc(doc(db, 'students', id));
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student.");
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.fatherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-display">Student Database</h2>
            <p className="text-slate-500 text-sm">Manage all student records.</p>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add New Student
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input 
              type="text" 
              placeholder="Search by Name, Roll No, or Parent..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-slate-500 font-medium hidden sm:block">
             Total: <span className="text-slate-900 font-bold">{students.length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading students...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
               <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
               </div>
               <h3 className="text-lg font-bold text-slate-900">No Students Found</h3>
               <p className="text-slate-500 max-w-xs mt-1 mb-6">Start by adding students to your database to manage admission and results.</p>
               <button onClick={handleOpenAdd} className="text-indigo-600 font-bold hover:underline">Add your first student</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="px-6 py-4">Roll No</th>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Class/Sec</th>
                    <th className="px-6 py-4 hidden md:table-cell">Father's Name</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Contact</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{student.rollNo}</td>
                      <td className="px-6 py-4">
                         <div className="text-sm font-bold text-slate-900">{student.name}</div>
                         <div className="text-xs text-slate-400 md:hidden">{student.fatherName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {student.class} - {student.section}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">{student.fatherName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 hidden sm:table-cell">{student.phone}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleOpenEdit(student)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                           </button>
                           <button onClick={() => student.id && handleDelete(student.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-down">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="text-lg font-bold text-slate-900">{editMode ? 'Edit Student' : 'Add New Student'}</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
                 <div className="col-span-1 md:col-span-2">
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Personal Details</h4>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                   <input required type="text" value={currentStudent.name} onChange={e => setCurrentStudent({...currentStudent, name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium" placeholder="e.g. Aarav Singh" />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Father's Name</label>
                   <input required type="text" value={currentStudent.fatherName} onChange={e => setCurrentStudent({...currentStudent, fatherName: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium" placeholder="e.g. Vijay Singh" />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Gender</label>
                   <select value={currentStudent.gender} onChange={e => setCurrentStudent({...currentStudent, gender: e.target.value as any})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Date of Birth</label>
                   <input required type="date" value={currentStudent.dob} onChange={e => setCurrentStudent({...currentStudent, dob: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium" />
                 </div>

                 <div className="col-span-1 md:col-span-2 mt-2">
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Academic Info</h4>
                 </div>

                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Class</label>
                   <select required value={currentStudent.class} onChange={e => setCurrentStudent({...currentStudent, class: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium">
                      <option value="">Select Class</option>
                      {['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Section</label>
                   <input type="text" value={currentStudent.section} onChange={e => setCurrentStudent({...currentStudent, section: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium" placeholder="A" />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Roll Number</label>
                   <input required type="text" value={currentStudent.rollNo} onChange={e => setCurrentStudent({...currentStudent, rollNo: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium" placeholder="e.g. 24" />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Admission No.</label>
                   <input type="text" value={currentStudent.admissionNo} onChange={e => setCurrentStudent({...currentStudent, admissionNo: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium" placeholder="Optional" />
                 </div>

                 <div className="col-span-1 md:col-span-2 mt-2">
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Contact Info</h4>
                 </div>

                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number</label>
                   <input type="tel" value={currentStudent.phone} onChange={e => setCurrentStudent({...currentStudent, phone: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium" placeholder="10 digits" />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Address</label>
                   <input type="text" value={currentStudent.address} onChange={e => setCurrentStudent({...currentStudent, address: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium" placeholder="City/Village" />
                 </div>

                 <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-70 flex items-center gap-2">
                       {saving && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                       {editMode ? 'Update Student' : 'Save Student'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Students;
