import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Users, BookOpen, Calendar, CheckCircle2, Edit, Plus, Trash2, AlertTriangle, X, Lock, Unlock, Key, ShieldAlert, Eraser, ArrowRightLeft, FileText, Printer, Check, Clock, Mail, Upload, Save, Database, ArrowLeft, Archive, Info, Moon, Sun, Download } from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDyqxSFKnQIbgL-PCl6BTi_IvJyDgjIRB8",
  authDomain: "chia-hsin-db.firebaseapp.com",
  projectId: "chia-hsin-db",
  storageBucket: "chia-hsin-db.firebasestorage.app",
  messagingSenderId: "744043549182",
  appId: "1:744043549182:web:e729de500f3426f05870af"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const INITIAL_CLASSES = [
  { id: '701', name: '7年01班' }, { id: '702', name: '7年02班' }, { id: '703', name: '7年03班' }, { id: '704', name: '7年04班' },
  { id: '801', name: '8年01班' }, { id: '802', name: '8年02班' }, { id: '803', name: '8年03班' }, { id: '804', name: '8年04班' },
  { id: '901', name: '9年01班' }, { id: '902', name: '9年02班' }, { id: '903', name: '9年03班' }, { id: '904', name: '9年04班' }, { id: '905', name: '9年05班' }
];

const INITIAL_TEACHERS = [
  { id: 'T001', name: '溫盛傑', subject: '數學', password: '1234' }, 
  { id: 'T002', name: '林秀錦', subject: '國文', password: '1234' },
  { id: 'T003', name: '陳建銘', subject: '英文', password: '1234' }, 
  { id: 'T004', name: '黃美惠', subject: '理化', password: '1234' }
];

const DAYS = ['星期一', '星期二', '星期三', '星期四', '星期五'];
const PERIODS = [
  { id: 1, name: '第一節', time: '08:25 - 09:10' }, { id: 2, name: '第二節', time: '09:20 - 10:05' },
  { id: 3, name: '第三節', time: '10:15 - 11:00' }, { id: 4, name: '第四節', time: '11:10 - 11:55' },
  { id: 'noon', name: '午休', time: '11:55-13:10', isBreak: true },
  { id: 5, name: '第五節', time: '13:20 - 14:05' }, { id: 6, name: '第六節', time: '14:15 - 15:00' },
  { id: 7, name: '第七節', time: '15:15 - 16:00' }, { id: 8, name: '第八節', time: '16:10 - 16:55', isTutor: true },
];

// 取得台灣時區 (GMT+8) 的當前日期字串 (YYYY-MM-DD)
const getTaiwanDateString = () => {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [viewMode, setViewMode] = useState('class'); 
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    // 1. 設定瀏覽器分頁標題
    document.title = "嘉新課表與調代課系統";

    // 2. 加入 viewport 設定，確保手機版能雙指縮放，且不鎖死比例
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = "viewport";
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes";

    // 3. 動態產生並注入 Favicon
    const setFavicon = () => {
      const emoji = '🏫';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emoji}</text></svg>`;
      const iconUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = iconUrl;
    };
    
    setFavicon();

    // 4. 初始化深色模式：加入 LocalStorage 記憶與強制淺色預設
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('theme-preference');
      if (savedMode === 'dark') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      } else if (savedMode === 'light') {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      } else {
        // 第一次開啟，不管系統設定，強制為淺色
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme-preference', 'light');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
      localStorage.setItem('theme-preference', 'light'); // 記住使用者選擇淺色
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
      localStorage.setItem('theme-preference', 'dark'); // 記住使用者選擇深色
    }
  };

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [requests, setRequests] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [teacherSortMode, setTeacherSortMode] = useState('subject'); // 修改這裡：預設改為 subject
  
  const [userRole, setUserRole] = useState('guest'); 
  const [loggedTeacherId, setLoggedTeacherId] = useState(null); 
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedLoginTeacher, setSelectedLoginTeacher] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdOld, setPwdOld] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdMessage, setPwdMessage] = useState({ type: '', text: '' });

  const [requestTargetLesson, setRequestTargetLesson] = useState(null);
  const [editRequestData, setEditRequestData] = useState(null);
  
  const [filterTeacherId, setFilterTeacherId] = useState(''); 
  const [filterPrintClassId, setFilterPrintClassId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterRequestType, setFilterRequestType] = useState(''); // 新增：類型篩選狀態

  const [importStatus, setImportStatus] = useState({ type: '', message: '' });
  
  const [isEditing, setIsEditing] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 }); // 用於記錄滑動起始點
  const [editData, setEditData] = useState({});
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassId, setNewClassId] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [showDeleteAllClassesModal, setShowDeleteAllClassesModal] = useState(false);
  const [showClearClassModal, setShowClearClassModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteArchivedModal, setShowDeleteArchivedModal] = useState(false);

  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('');
  const [showDeleteTeacherModal, setShowDeleteTeacherModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [showDeleteAllTeachersModal, setShowDeleteAllTeachersModal] = useState(false);
  const [showDeduplicateModal, setShowDeduplicateModal] = useState(false);

  const [showFeeReportModal, setShowFeeReportModal] = useState(false);
  const [feeReportMonth, setFeeReportMonth] = useState(() => {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const handleFirebaseError = (err) => {
      console.error("Firebase Database Error:", err);
      if (err.code === 'permission-denied') {
        showMessage('error', '❌ 讀取失敗：Firebase 權限不足，請至後台修改 Security Rules！');
      } else if (err.code === 'resource-exhausted') {
        showMessage('error', '❌ 讀取失敗：已達到 Firebase 每日免費配額限制！');
      }
    };

    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const data = snapshot.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => a.id.localeCompare(b.id));
      setClasses(data);
    }, handleFirebaseError);

    const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snapshot) => {
      const data = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
      setTeachers(data);
      if (data.length > 0 && !selectedLoginTeacher) setSelectedLoginTeacher(data[0].id);
    }, handleFirebaseError);

    const unsubLessons = onSnapshot(collection(db, 'lessons'), (snapshot) => {
      const data = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
      setLessons(data);
    }, handleFirebaseError);

    const unsubRequests = onSnapshot(collection(db, 'requests'), (snapshot) => {
      const data = snapshot.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRequests(data);
    }, handleFirebaseError);

    setTimeout(() => setIsDataLoaded(true), 800);

    return () => { 
      unsubClasses(); 
      unsubTeachers(); 
      unsubLessons(); 
      unsubRequests(); 
    };
  }, []);

  const showMessage = (type, message) => {
    setImportStatus({ type, message });
    setTimeout(() => setImportStatus({ type: '', message: '' }), 6000);
  };

  // 完美列印修復：強制暫時關閉深色模式再列印
  const handlePrint = () => {
    const wasDark = document.documentElement.classList.contains('dark');
    if (wasDark) {
      document.documentElement.classList.remove('dark'); // 暫時移除深色
    }
    
    setTimeout(() => {
      window.print();
      
      // 等待列印視窗關閉後，如果原本是深色，再把深色加回來
      if (wasDark) {
        setTimeout(() => {
          document.documentElement.classList.add('dark');
        }, 100); 
      }
    }, 100); // 給瀏覽器一點時間渲染淺色畫面
  };

  const initializeDatabase = async () => {
    showMessage('success', '🔄 正在建立預設資料庫...');
    try {
      const batches = [];
      let currentBatch = writeBatch(db);
      let opCount = 0;

      const pushToBatch = (ref, data) => {
        currentBatch.set(ref, data);
        opCount++;
        if (opCount >= 450) {
          batches.push(currentBatch.commit());
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      };

      INITIAL_CLASSES.forEach(c => pushToBatch(doc(db, 'classes', c.id), c));
      INITIAL_TEACHERS.forEach(t => pushToBatch(doc(db, 'teachers', t.id), t));
      
      if (opCount > 0) batches.push(currentBatch.commit());
      await Promise.all(batches);
      
      showMessage('success', '✅ 雲端資料庫建置成功！');
    } catch (err) {
      if (err.code === 'permission-denied') showMessage('error', '❌ 建置失敗：Firebase Security Rules 阻擋！');
      else showMessage('error', '❌ 建置失敗：' + err.message);
    }
  };

  const jumpToTeacher = (teacherId) => {
    if (!teacherId) return;
    setSelectedTeacher(teacherId);
    setViewMode('teacher');
    setActiveTab('schedule');
  };

  const jumpToClass = (classId) => {
    if (!classId) return;
    setSelectedClass(classId);
    setViewMode('class');
    setActiveTab('schedule');
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin888') {
      setUserRole('admin');
      setLoggedTeacherId(null);
      setShowLoginModal(false);
      setAdminPassword('');
      showMessage('success', '✅ 已成功登入為管理者！');
    } else {
      showMessage('error', '❌ 管理者密碼錯誤');
    }
  };

  const handleTeacherLogin = () => {
    const teacherData = teachers.find(t => t.id === selectedLoginTeacher);
    const validPassword = teacherData?.password || '1234'; 

    if (teacherPassword === validPassword || teacherPassword === 'admin888') {
      setUserRole('teacher');
      setLoggedTeacherId(selectedLoginTeacher);
      setSelectedTeacher(selectedLoginTeacher); 
      setViewMode('teacher');
      setActiveTab('schedule');
      setShowLoginModal(false);
      
      const teacherName = teacherData?.name;
      showMessage('success', `👨‍🏫 歡迎登入，${teacherName} 老師！`);
      setTeacherPassword('');
    } else {
      showMessage('error', '❌ 教師密碼錯誤');
    }
  };

  const handleChangePassword = async () => {
    const teacherData = teachers.find(t => t.id === loggedTeacherId);
    const currentValidPassword = teacherData?.password || '1234';

    if (pwdOld !== currentValidPassword && pwdOld !== 'admin888') {
      setPwdMessage({ type: 'error', text: '❌ 原密碼輸入錯誤' });
      return;
    }
    if (pwdNew.length < 4) {
      setPwdMessage({ type: 'error', text: '❌ 新密碼至少需要 4 個字元' });
      return;
    }
    if (pwdNew !== pwdConfirm) {
      setPwdMessage({ type: 'error', text: '❌ 兩次輸入的新密碼不一致' });
      return;
    }

    try {
      await updateDoc(doc(db, 'teachers', loggedTeacherId), { password: pwdNew });
      setPwdMessage({ type: 'success', text: '✅ 個人密碼修改成功！視窗即將關閉...' });
      showMessage('success', '✅ 個人密碼修改成功！');
      
      setTimeout(() => {
        setShowPwdModal(false);
        setPwdOld(''); 
        setPwdNew(''); 
        setPwdConfirm('');
        setPwdMessage({ type: '', text: '' });
      }, 1500);
    } catch (e) {
      setPwdMessage({ type: 'error', text: '❌ 密碼修改失敗：' + e.message });
    }
  };

  const handleLogout = () => {
    setUserRole('guest');
    setLoggedTeacherId(null);
    setIsEditing(false);
    setActiveTab('schedule');
    showMessage('success', '🔒 已安全登出');
  };

  const startEditing = () => {
    const currentClassLessons = lessons.filter(l => l.classId === selectedClass);
    const initialEditData = {};
    currentClassLessons.forEach(l => {
      const teacher = teachers.find(t => t.id === l.teacherId);
      initialEditData[`${l.day}_${l.period}`] = `${l.subject} ${teacher ? teacher.name : ''}`.trim();
    });
    setEditData(initialEditData);
    setIsEditing(true);
  };

  const saveEditing = async () => {
    showMessage('success', '🔄 正在將課表同步至雲端...');
    try {
      const batches = [];
      let currentBatch = writeBatch(db);
      let opCount = 0;

      const pushToBatch = (operation, ref, data = null) => {
        if (operation === 'delete') currentBatch.delete(ref);
        else currentBatch.set(ref, data);
        opCount++;
        if (opCount >= 450) {
          batches.push(currentBatch.commit());
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      };

      const oldLessons = lessons.filter(l => l.classId === selectedClass);
      oldLessons.forEach(l => pushToBatch('delete', doc(db, 'lessons', l.id)));

      let currentTeachers = [...teachers]; 

      for (const key of Object.keys(editData)) {
        const text = (editData[key] || '').trim();
        if (!text) continue; 

        const [dayStr, periodStr] = key.split('_');
        const day = parseInt(dayStr);
        const period = isNaN(parseInt(periodStr)) ? periodStr : parseInt(periodStr);

        let subject = text;
        let teacherName = '未知';

        if (text.includes(' ')) {
          const parts = text.split(' ');
          subject = parts[0].trim();
          teacherName = parts.slice(1).join('').trim();
        }

        if (subject) {
          let teacher = currentTeachers.find(t => t.name.trim() === teacherName.trim());
          if (!teacher) {
            const newId = `T${Math.floor(Math.random()*100000)}`;
            teacher = { id: newId, name: teacherName.trim(), subject: subject || '未知', password: '1234' };
            currentTeachers.push(teacher);
            pushToBatch('set', doc(db, 'teachers', teacher.id), teacher);
          }

          const lessonId = `L_${selectedClass}_${day}_${period}_${Date.now()}`;
          pushToBatch('set', doc(db, 'lessons', lessonId), {
            id: lessonId, classId: selectedClass, teacherId: teacher.id, subject, day, period
          });
        }
      }

      if (opCount > 0) batches.push(currentBatch.commit());
      await Promise.all(batches);
      
      setIsEditing(false);
      showMessage('success', `✅ 儲存成功！`);
    } catch (err) {
      if (err.code === 'permission-denied') showMessage('error', '❌ 儲存失敗：無寫入權限 (Security Rules 阻擋)！');
      else if (err.code === 'resource-exhausted') showMessage('error', '❌ 儲存失敗：超過 Firebase 每日寫入配額！');
      else showMessage('error', '❌ 儲存失敗：' + err.message);
    }
  };

  const executeClearClass = async () => {
    try {
      const batches = [];
      let currentBatch = writeBatch(db);
      let opCount = 0;
      
      const oldLessons = lessons.filter(l => l.classId === selectedClass);
      oldLessons.forEach(l => {
        currentBatch.delete(doc(db, 'lessons', l.id));
        opCount++;
        if (opCount >= 450) {
          batches.push(currentBatch.commit());
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      });
      
      if (opCount > 0) batches.push(currentBatch.commit());
      await Promise.all(batches);

      setShowClearClassModal(false);
      setIsEditing(false);
      showMessage('success', '🧹 已清空本班課表！');
    } catch (err) {
      showMessage('error', '❌ 清空失敗：' + err.message);
    }
  };

  const executeClearAll = async () => {
    try {
      const batches = [];
      let currentBatch = writeBatch(db);
      let opCount = 0;

      lessons.forEach(l => {
        currentBatch.delete(doc(db, 'lessons', l.id));
        opCount++;
        if (opCount >= 450) {
          batches.push(currentBatch.commit());
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      });

      if (opCount > 0) batches.push(currentBatch.commit());
      await Promise.all(batches);

      setShowClearAllModal(false);
      setIsEditing(false);
      showMessage('success', '🔥 已清空所有課表！');
    } catch(err) {
      if (err.code === 'permission-denied') showMessage('error', '❌ 失敗：Firebase 權限不足！');
      else showMessage('error', '❌ 刪除失敗：' + err.message);
    }
  };

  const handleAddClass = async () => {
    if (!newClassId || !newClassName) return;
    await setDoc(doc(db, 'classes', newClassId), { id: newClassId, name: newClassName });
    setSelectedClass(newClassId); 
    setShowAddClassModal(false);
    setNewClassId(''); setNewClassName('');
    showMessage('success', `✅ 已新增班級：${newClassName}`);
  };

  const executeDeleteClass = async () => {
    if (!classToDelete) return;
    const targetId = classToDelete;
    setShowDeleteClassModal(false); 
    setClassToDelete(null);

    if (selectedClass === targetId) {
      const remaining = classes.filter(c => c.id !== targetId);
      setSelectedClass(remaining.length > 0 ? remaining[0].id : '');
    }

    try {
      const batches = [];
      let currentBatch = writeBatch(db);
      let opCount = 0;

      currentBatch.delete(doc(db, 'classes', targetId));
      opCount++;

      const oldLessons = lessons.filter(l => l.classId === targetId);
      oldLessons.forEach(l => {
        currentBatch.delete(doc(db, 'lessons', l.id));
        opCount++;
        if (opCount >= 450) {
          batches.push(currentBatch.commit());
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      });

      if (opCount > 0) batches.push(currentBatch.commit());
      await Promise.all(batches);

      showMessage('success', '🗑️ 已刪除班級');
    } catch (e) {
      showMessage('error', '❌ 刪除失敗：' + e.message);
    }
  };

  const executeDeleteAllClasses = async () => {
    try {
      const batches = [];
      let currentBatch = writeBatch(db);
      let opCount = 0;

      const pushToDelete = (ref) => {
        currentBatch.delete(ref);
        opCount++;
        if (opCount >= 450) {
          batches.push(currentBatch.commit());
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      };

      classes.forEach(c => pushToDelete(doc(db, 'classes', c.id)));
      lessons.forEach(l => pushToDelete(doc(db, 'lessons', l.id)));

      if (opCount > 0) batches.push(currentBatch.commit());
      await Promise.all(batches);

      setShowDeleteAllClassesModal(false);
      setSelectedClass('');
      showMessage('success', '🗑️ 已刪除所有班級及相關課表');
    } catch (e) {
      showMessage('error', '❌ 刪除失敗：' + e.message);
    }
  };

  const executeDeleteGarbledClasses = async () => {
    try {
      const batches = [];
      let currentBatch = writeBatch(db);
      let opCount = 0;

      const pushToDelete = (ref) => {
        currentBatch.delete(ref);
        opCount++;
        if (opCount >= 450) {
          batches.push(currentBatch.commit());
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      };

      const garbledClasses = classes.filter(c => c.name.length > 30 || c.name.includes('') || c.name.includes('?'));
      const garbledClassIds = garbledClasses.map(c => c.id);
      garbledClasses.forEach(c => pushToDelete(doc(db, 'classes', c.id)));
      
      const garbledTeachers = teachers.filter(t => t.name.length > 30 || t.name.includes('') || t.name.includes('?'));
      const garbledTeacherIds = garbledTeachers.map(t => t.id);
      garbledTeachers.forEach(t => pushToDelete(doc(db, 'teachers', t.id)));

      const garbledLessons = lessons.filter(l => garbledClassIds.includes(l.classId) || garbledTeacherIds.includes(l.teacherId));
      garbledLessons.forEach(l => pushToDelete(doc(db, 'lessons', l.id)));

      if (opCount > 0) batches.push(currentBatch.commit());
      await Promise.all(batches);

      if (garbledClassIds.includes(selectedClass)) setSelectedClass('');
      if (garbledTeacherIds.includes(selectedTeacher)) setSelectedTeacher('');

      showMessage('success', `🧹 已成功清除 ${garbledClasses.length} 個亂碼班級與 ${garbledTeachers.length} 個亂碼教師！`);
    } catch (e) {
      showMessage('error', '❌ 清除失敗：' + e.message);
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacherName) return;
    const newId = `T${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const teacher = {
      id: newId,
      name: newTeacherName,
      subject: newTeacherSubject || '無',
      password: '1234'
    };
    await setDoc(doc(db, 'teachers', newId), teacher);
    setSelectedTeacher(newId);
    setShowAddTeacherModal(false);
    setNewTeacherName(''); setNewTeacherSubject('');
    showMessage('success', `✅ 已新增教師：${newTeacherName}`);
  };

  const executeDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    const targetId = teacherToDelete;
    setShowDeleteTeacherModal(false); 
    setTeacherToDelete(null);

    if (selectedTeacher === targetId) {
      const remaining = teachers.filter(t => t.id !== targetId);
      setSelectedTeacher(remaining.length > 0 ? remaining[0].id : '');
    }

    try {
      const batches = [];
      let currentBatch = writeBatch(db);
      let opCount = 0;

      currentBatch.delete(doc(db, 'teachers', targetId));
      opCount++;

      const oldLessons = lessons.filter(l => l.teacherId === targetId);
      oldLessons.forEach(l => {
        currentBatch.delete(doc(db, 'lessons', l.id));
        opCount++;
        if (opCount >= 450) {
          batches.push(currentBatch.commit());
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      });

      if (opCount > 0) batches.push(currentBatch.commit());
      await Promise.all(batches);

      showMessage('success', '🗑️ 已刪除教師及其所有排課紀錄');
    } catch (e) {
      showMessage('error', '❌ 刪除失敗：' + e.message);
    }
  };

  const executeDeleteAllTeachers = async () => {
    try {
      const batches = [];
      let currentBatch = writeBatch(db);
      let opCount = 0;

      const pushToDelete = (ref) => {
        currentBatch.delete(ref);
        opCount++;
        if (opCount >= 450) {
          batches.push(currentBatch.commit());
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      };

      teachers.forEach(t => pushToDelete(doc(db, 'teachers', t.id)));
      lessons.forEach(l => pushToDelete(doc(db, 'lessons', l.id)));

      if (opCount > 0) batches.push(currentBatch.commit());
      await Promise.all(batches);

      setShowDeleteAllTeachersModal(false);
      setSelectedTeacher('');
      showMessage('success', '🗑️ 已刪除所有教師及相關課表');
    } catch (e) {
      showMessage('error', '❌ 刪除失敗：' + e.message);
    }
  };

  const executeDeduplicateTeachers = async () => {
    try {
      const batches = [];
      let currentBatch = writeBatch(db);
      let opCount = 0;

      const pushToBatch = (op, ref, data) => {
        if (op === 'delete') currentBatch.delete(ref);
        else if (op === 'update') currentBatch.update(ref, data);
        opCount++;
        if (opCount >= 450) {
          batches.push(currentBatch.commit());
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      };

      const teacherGroups = {};
      teachers.forEach(t => {
        const name = t.name.trim();
        if (!teacherGroups[name]) teacherGroups[name] = [];
        teacherGroups[name].push(t);
      });

      let mergedCount = 0;

      for (const name in teacherGroups) {
        const group = teacherGroups[name];
        if (group.length > 1) {
          group.sort((a, b) => a.id.localeCompare(b.id));
          const keepTeacher = group[0];
          const dupTeachers = group.slice(1);
          const dupIds = dupTeachers.map(t => t.id);

          const affectedLessons = lessons.filter(l => dupIds.includes(l.teacherId));
          affectedLessons.forEach(l => {
            pushToBatch('update', doc(db, 'lessons', l.id), { teacherId: keepTeacher.id });
          });

          const affectedRequests = requests.filter(r => dupIds.includes(r.requesterId) || dupIds.includes(r.targetTeacherId));
          affectedRequests.forEach(r => {
            const updateData = {};
            if (dupIds.includes(r.requesterId)) updateData.requesterId = keepTeacher.id;
            if (dupIds.includes(r.targetTeacherId)) updateData.targetTeacherId = keepTeacher.id;
            pushToBatch('update', doc(db, 'requests', r.id), updateData);
          });

          dupTeachers.forEach(t => {
            pushToBatch('delete', doc(db, 'teachers', t.id));
            mergedCount++;
          });
        }
      }

      if (opCount > 0) batches.push(currentBatch.commit());
      await Promise.all(batches);

      setShowDeduplicateModal(false);
      if (mergedCount > 0) {
        showMessage('success', `✅ 已成功合併 ${mergedCount} 筆重複教師紀錄，並自動更新所有課表！`);
      } else {
        showMessage('success', `✅ 檢查完畢，目前沒有重複的教師名字。`);
      }
    } catch (e) {
      showMessage('error', '❌ 合併失敗：' + e.message);
    }
  };

  const SUBJECT_PRIORITY = ['國文', '英文', '英語', '數學', '自然', '理化', '生物', '地球科學', '地理', '歷史', '公民'];

  const enhancedTeachers = useMemo(() => {
    return teachers.map(t => {
      const tLessons = lessons.filter(l => l.teacherId === t.id);
      let displaySubject = t.subject || '無';
      
      if (tLessons.length > 0) {
        // 在收集科目時，自動過濾掉星號
        const uniqueSubjects = [...new Set(tLessons.map(l => l.subject.replace(/\*/g, '').trim()))];
        if (uniqueSubjects.length > 1) {
          uniqueSubjects.sort((a, b) => {
            let indexA = SUBJECT_PRIORITY.findIndex(p => a.includes(p));
            let indexB = SUBJECT_PRIORITY.findIndex(p => b.includes(p));
            indexA = indexA === -1 ? 999 : indexA;
            indexB = indexB === -1 ? 999 : indexB;
            return indexA - indexB;
          });
        }
        displaySubject = uniqueSubjects[0] || displaySubject;
      }
      
      // 同時清除名字中可能夾帶的星號
      const cleanName = t.name.replace(/\*/g, '').trim();
      
      return { ...t, name: cleanName, displaySubject: displaySubject.replace(/\*/g, '').trim() };
    });
  }, [teachers, lessons]);

  const sortedTeachers = useMemo(() => {
    let list = [...enhancedTeachers];
    if (teacherSortMode === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW', { collation: 'stroke' }));
    } else if (teacherSortMode === 'subject') {
      list.sort((a, b) => {
        let indexA = SUBJECT_PRIORITY.findIndex(p => (a.displaySubject || '').includes(p));
        let indexB = SUBJECT_PRIORITY.findIndex(p => (b.displaySubject || '').includes(p));
        indexA = indexA === -1 ? 999 : indexA;
        indexB = indexB === -1 ? 999 : indexB;
        
        if (indexA !== indexB) {
          return indexA - indexB;
        }
        return a.name.localeCompare(b.name, 'zh-TW', { collation: 'stroke' });
      });
    }
    return list;
  }, [enhancedTeachers, teacherSortMode]);

  useEffect(() => {
    if (classes.length > 0 && !classes.some(c => c.id === selectedClass)) {
      setSelectedClass(classes[0].id);
    }
  }, [classes, selectedClass]);

  useEffect(() => {
    if (sortedTeachers.length > 0 && !selectedTeacher && sortedTeachers.some(t => t.id !== undefined)) {
      setSelectedTeacher(sortedTeachers[0].id);
    }
  }, [sortedTeachers, selectedTeacher]);

  const getSingleEmailUrl = (req) => {
    const requester = teachers.find(t => t.id === req.requesterId)?.name || '未知';
    const target = teachers.find(t => t.id === req.targetTeacherId)?.name || '未知';
    
    const lesson = lessons.find(l => l.id === req.lessonId);
    const className = classes.find(c => c.id === lesson?.classId)?.name || '未知班級';
    const lessonTime = lesson ? `${DAYS[lesson.day-1]} 第 ${lesson.period} 節` : '未知';

    const targetLesson = lessons.find(l => l.id === req.targetLessonId);
    const targetClassName = classes.find(c => c.id === targetLesson?.classId)?.name || '未知班級';
    const targetLessonTime = targetLesson ? `${DAYS[targetLesson.day-1]} 第 ${targetLesson.period} 節` : '未知';

    const getSubReasonText = (r) => r === '是' ? '公假/學校排代' : (r === '否' ? '私人自行排代' : r);

    const subject = `【嘉新國中】調代課通知 - ${requester}老師`;
    let body = `各位老師好：\n\n`;
    body += `老師 ${requester} 提出了調代課申請，詳細內容如下：\n`;
    body += `- 申請類型：${req.type === 'sub' ? `請假代課 (${getSubReasonText(req.reason)})` : '跨週調課'}\n\n`;
    
    if (req.type === 'sub') {
      body += `【原授課/代課資訊】\n`;
      body += `- 發生日期：${req.targetDate || '未指定'}\n`;
      body += `- 授課班級：${className}\n`;
      body += `- 上課時間：${lessonTime}\n`;
      body += `- 課程科目：${lesson?.subject || '未知'}\n`;
      body += `- 原授課老師：${requester}\n`;
      body += `- 委託代課老師：${target}\n`;
    } else {
      body += `【我方課程資訊】\n`;
      body += `- 日期：${req.targetDate || '未指定'}\n`;
      body += `- 班級：${className}\n`;
      body += `- 時間：${lessonTime}\n`;
      body += `- 科目：${lesson?.subject || '未知'}\n`;
      body += `- 原授課老師：${requester}\n\n`;

      body += `【對方換課資訊】\n`;
      body += `- 日期：${req.targetSwapDate || '未指定'}\n`;
      body += `- 班級：${targetClassName}\n`;
      body += `- 時間：${targetLessonTime}\n`;
      body += `- 科目：${targetLesson?.subject || '未知'}\n`;
      body += `- 對象老師：${target}\n`;
    }
    body += `\n教務處已完成審核。特此通知相關人員，感謝配合！\n\n嘉新國中教務處 敬上`;
    
    return `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const getBulkEmailUrl = (entityName, reqsToEmail, isClass) => {
    const subject = `【嘉新國中】調代課通知總表 - ${entityName}${isClass ? '導師' : '老師'} 收`;
    let body = `老師好：\n\n以下為近期與您或貴班相關的調代課異動總表，請查照：\n\n`;
    
    const getSubReasonText = (r) => r === '是' ? '公假/學校排代' : (r === '否' ? '私人自行排代' : r);

    reqsToEmail.forEach((req, idx) => {
      const requester = teachers.find(t => t.id === req.requesterId)?.name || '未知';
      const target = teachers.find(t => t.id === req.targetTeacherId)?.name || '未知';
      
      const lesson = lessons.find(l => l.id === req.lessonId);
      const className = classes.find(c => c.id === lesson?.classId)?.name || '未知班級';
      const lessonTime = lesson ? `${DAYS[lesson.day-1]} 第 ${lesson.period} 節` : '未知';

      const targetLesson = lessons.find(l => l.id === req.targetLessonId);
      const targetClassName = classes.find(c => c.id === targetLesson?.classId)?.name || '未知班級';
      const targetLessonTime = targetLesson ? `${DAYS[targetLesson.day-1]} 第 ${targetLesson.period} 節` : '未知';

      body += `【異動 ${idx + 1}】 ${req.type === 'sub' ? `請假代課 (${getSubReasonText(req.reason)})` : '跨週調課'}\n`;
      if (req.type === 'sub') {
        body += `- 日期：${req.targetDate || '未指定'}\n`;
        body += `- 班級：${className}\n`;
        body += `- 時間：${lessonTime}\n`;
        body += `- 科目：${lesson?.subject || '未知'}\n`;
        body += `- 原授課老師：${requester}\n`;
        body += `- 委託代課老師：${target}\n`;
      } else {
        body += `- 我方：${req.targetDate || '未指定'} | ${className} (${lessonTime}) | 原授課：${requester}\n`;
        body += `- 對方：${req.targetSwapDate || '未指定'} | ${targetClassName} (${targetLessonTime}) | 對象師：${target}\n`;
      }
      body += `\n`;
    });
    
    body += `嘉新國中教務處 敬上`;
    return `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const FeeReportModal = () => {
    const reportData = useMemo(() => {
      const filtered = requests.filter(r => 
        r.status === 'approved' && 
        r.type === 'sub' && 
        r.reason === '是' && 
        r.targetDate && r.targetDate.startsWith(feeReportMonth)
      );
      
      const stats = {};
      filtered.forEach(req => {
        const subTeacherId = req.targetTeacherId;
        if (!subTeacherId) return;
        
        if (!stats[subTeacherId]) {
          stats[subTeacherId] = {
            teacher: teachers.find(t => t.id === subTeacherId),
            count: 0,
            details: []
          };
        }
        
        const originalTeacher = teachers.find(t => t.id === req.requesterId)?.name || '未知';
        const lesson = lessons.find(l => l.id === req.lessonId);
        const className = classes.find(c => c.id === lesson?.classId)?.name || '未知班級';
        const periodStr = lesson ? `${DAYS[lesson.day-1]} 第${lesson.period}節` : '未知';
        
        stats[subTeacherId].count += 1;
        stats[subTeacherId].details.push({
          date: req.targetDate,
          originalTeacher,
          className,
          periodStr,
          reason: req.reason
        });
      });
      
      return Object.values(stats).sort((a, b) => b.count - a.count);
    }, [feeReportMonth, requests, teachers, classes, lessons]);

    const totalFees = reportData.reduce((sum, item) => sum + item.count, 0);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm print:static print:block print:p-0 print:bg-white print:backdrop-blur-none print:h-auto print:min-h-0">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none print:max-h-none print:h-auto print:overflow-visible print:block print:m-0 border border-slate-200 dark:border-slate-700 transition-colors duration-200">
          <div className="bg-indigo-700 dark:bg-indigo-900 p-4 flex justify-between items-center text-white print:hidden transition-colors duration-200">
            <h3 className="text-lg font-bold flex items-center gap-2"><Calendar className="w-5 h-5" /> 每月代課節數統計與費用結算表</h3>
            <button onClick={() => setShowFeeReportModal(false)} className="hover:bg-indigo-800 dark:hover:bg-indigo-800 p-1 rounded-full transition-colors"><X className="w-5 h-5"/></button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 print:p-0 print:overflow-visible print:bg-white print:block print:flex-none transition-colors duration-200">
            <div className="flex flex-wrap justify-between items-end mb-6 print:hidden gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">請選擇結算月份</label>
                <input 
                  type="month" 
                  value={feeReportMonth} 
                  onChange={e => setFeeReportMonth(e.target.value)} 
                  className="border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 shadow-sm bg-white dark:bg-slate-800 dark:text-white cursor-pointer transition-colors duration-200"
                />
              </div>
              <button onClick={handlePrint} className="px-5 py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-sm font-bold hover:bg-slate-700 dark:hover:bg-slate-600 flex items-center gap-2 shadow-sm transition-colors">
                <Printer className="w-4 h-4"/> 列印此報表
              </button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm print:border-none print:shadow-none print:p-0 transition-colors duration-200">
              <div className="text-center mb-6 hidden print:block border-b-2 border-black pb-4">
                <h2 className="text-2xl font-bold text-black">嘉新國中 {feeReportMonth.split('-')[0]}年{feeReportMonth.split('-')[1]}月 代課節數統計表</h2>
                <p className="text-sm mt-2 text-black">列印日期：{new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>
              </div>
              
              {reportData.length === 0 ? (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 print:hidden transition-colors duration-200">
                  該月份目前沒有任何已核准的請假代課紀錄。
                </div>
              ) : (
                <>
                  <div className="mb-6 text-base font-bold text-indigo-900 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-sm flex items-center justify-between print:border-black print:bg-white print:shadow-none print:mb-4 print:p-2 transition-colors duration-200">
                    <span>本月全校代課總計與鐘點費結算</span>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl print:text-lg">{totalFees} <span className="text-sm font-medium">節</span></span>
                      <span className="text-indigo-300 dark:text-indigo-700 print:text-slate-400">|</span>
                      <span className="text-2xl print:text-lg text-red-600 dark:text-red-400 print:text-black font-extrabold">{(totalFees * 455).toLocaleString()} <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200 print:text-black">元</span></span>
                    </div>
                  </div>
                  
                  <div className="grid gap-6 print:gap-2">
                    {reportData.map((data, idx) => (
                      <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden print:border-black shadow-sm print:rounded-none transition-colors duration-200">
                        <div className="bg-slate-100 dark:bg-slate-700/50 p-3.5 font-bold text-slate-800 dark:text-slate-200 flex flex-wrap justify-between items-center gap-3 border-b border-slate-200 dark:border-slate-700 print:bg-transparent print:p-1 transition-colors duration-200">
                          <span className="text-base flex items-center gap-2 print:text-sm">
                            <User className="w-4 h-4 text-slate-500 dark:text-slate-400 print:hidden"/>
                            代課教師：<span className="text-indigo-700 dark:text-indigo-300 print:text-black text-lg print:text-base">{data.teacher?.name || '未知'}</span>
                          </span>
                          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                            <div className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-1.5 rounded-full text-sm font-bold print:text-black print:bg-transparent print:border print:border-black shadow-sm flex items-center gap-2 print:px-2 print:py-0 print:text-[11px] print:rounded-sm transition-colors duration-200">
                              <span>本月共代 <span className="text-lg print:text-xs mx-1">{data.count}</span> 節</span>
                              <span className="w-px h-4 bg-indigo-400 print:bg-slate-400"></span>
                              <span>共計 <span className="text-lg print:text-xs mx-1 text-amber-300 dark:text-amber-200 print:text-black">{(data.count * 455).toLocaleString()}</span> 元</span>
                            </div>
                            <div className="flex items-end gap-1 pt-1">
                              <span className="text-slate-500 dark:text-slate-400 print:text-black font-bold text-sm print:text-xs mb-0.5">簽名：</span>
                              <div className="w-32 sm:w-40 border-b-2 border-slate-300 dark:border-slate-500 print:border-black h-4"></div>
                            </div>
                          </div>
                        </div>
                        <div className="p-0 overflow-x-auto print:overflow-visible bg-white dark:bg-slate-800 transition-colors duration-200">
                          <table className="w-full text-sm text-left border-collapse print:text-[11px]">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b dark:border-slate-700 print:bg-transparent print:border-black transition-colors duration-200">
                                <th className="p-3 pl-5 font-semibold w-28 whitespace-nowrap print:p-1 print:pl-1">代課日期</th>
                                <th className="p-3 font-semibold w-24 whitespace-nowrap print:p-1">請假老師</th>
                                <th className="p-3 font-semibold w-20 whitespace-nowrap print:p-1">排代類型</th>
                                <th className="p-3 font-semibold w-28 whitespace-nowrap print:p-1">授課班級</th>
                                <th className="p-3 font-semibold whitespace-nowrap print:p-1">代課節次</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.details.sort((a,b) => a.date.localeCompare(b.date)).map((det, i) => (
                                <tr key={i} className="border-b dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 print:border-b print:border-slate-300 transition-colors duration-150">
                                  <td className="p-3 pl-5 text-indigo-700 dark:text-indigo-300 font-bold whitespace-nowrap print:p-1 print:pl-1 print:text-black">{det.date}</td>
                                  <td className="p-3 text-slate-700 dark:text-slate-300 font-medium print:p-1">{det.originalTeacher}</td>
                                  <td className="p-3 print:p-1"><span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 shadow-xs print:bg-transparent print:border-none print:shadow-none print:p-0 print:text-[11px]">{det.reason === '是' ? '公假(學校排代)' : det.reason}</span></td>
                                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200 print:p-1 print:text-black">{det.className}</td>
                                  <td className="p-3 text-slate-600 dark:text-slate-400 font-medium print:p-1">{det.periodStr}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RequestModal = ({ data, editReq, onClose }) => {
    const lesson = data ? data.lesson : lessons.find(l => l.id === editReq.lessonId);
    const day = data ? data.day : lesson.day;
    const period = data ? data.period : lesson.period;

    const actualRequesterId = editReq ? editReq.requesterId : (data?.requesterId || loggedTeacherId);

    const initReason = editReq ? (['是', '否'].includes(editReq.reason) ? editReq.reason : '否') : '否';

    const [requestType, setRequestType] = useState(editReq ? editReq.type : 'sub'); 
    const [targetTeacher, setTargetTeacher] = useState(editReq ? editReq.targetTeacherId : '');
    const [targetLessonId, setTargetLessonId] = useState(editReq ? (editReq.targetLessonId || '') : ''); 
    const [targetSwapDate, setTargetSwapDate] = useState(editReq ? (editReq.targetSwapDate || getTaiwanDateString()) : getTaiwanDateString()); 
    const [reason, setReason] = useState(initReason);
    const [targetDate, setTargetDate] = useState(editReq ? editReq.targetDate : getTaiwanDateString()); 
    const targetClass = classes.find(c => c.id === lesson.classId) || { name: lesson.classId };

    const requesterTeacherObj = enhancedTeachers.find(t => t.id === actualRequesterId);
    const allOtherTeachers = enhancedTeachers.filter(t => t.id !== actualRequesterId);

    const prioritizedTeachers = useMemo(() => {
      if (requestType !== 'sub') return allOtherTeachers;
      const sameSubject = allOtherTeachers.filter(t => t.displaySubject === requesterTeacherObj?.displaySubject);
      const otherTeachers = allOtherTeachers.filter(t => t.displaySubject !== requesterTeacherObj?.displaySubject);
      return [...sameSubject, ...otherTeachers];
    }, [allOtherTeachers, requestType, requesterTeacherObj]);

    const targetTeacherLessons = useMemo(() => {
      if (!targetTeacher) return [];
      return lessons
        .filter(l => l.teacherId === targetTeacher)
        .sort((a, b) => {
          if (a.day !== b.day) return a.day - b.day;
          const periodA = parseInt(a.period) || 0;
          const periodB = parseInt(b.period) || 0;
          return periodA - periodB;
        });
    }, [targetTeacher, lessons]);

    const handleSubmit = async () => {
      if (!targetDate) { showMessage('error', requestType === 'sub' ? "請選擇請假代課日期" : "請選擇您的原授課日期"); return; }
      
      if (requestType === 'swap') {
        if (!targetSwapDate) { showMessage('error', "請選擇對方的換課日期"); return; }
        if (!targetLessonId) { showMessage('error', "請選擇要與對方互調的具體課堂"); return; }
      } else {
        if (!reason) { showMessage('error', "請選擇假別或事由"); return; }
      }
      
      try {
        if (editReq) {
          await updateDoc(doc(db, 'requests', editReq.id), {
            type: requestType,
            targetTeacherId: targetTeacher,
            targetLessonId: requestType === 'swap' ? targetLessonId : null,
            targetSwapDate: requestType === 'swap' ? targetSwapDate : null,
            targetDate: targetDate,
            reason: requestType === 'swap' ? '調課' : reason
          });
          onClose();
          showMessage('success', '✅ 申請已成功修改！');
        } else {
          const reqId = `REQ${Date.now()}`;
          const newReq = {
            id: reqId,
            type: requestType,
            requesterId: actualRequesterId,
            targetTeacherId: targetTeacher,
            lessonId: lesson.id,
            targetLessonId: requestType === 'swap' ? targetLessonId : null,
            targetSwapDate: requestType === 'swap' ? targetSwapDate : null,
            targetDate: targetDate,
            status: 'pending',
            timestamp: new Date().toISOString(),
            reason: requestType === 'swap' ? '調課' : reason
          };
          await setDoc(doc(db, 'requests', reqId), newReq);
          onClose();
          showMessage('success', '📝 申請已送出，等待教務處審核！');
        }
      } catch (err) {
        if (err.code === 'permission-denied') showMessage('error', '❌ 寫入失敗：無權限 (Security Rules 阻擋)');
        else showMessage('error', '❌ 寫入失敗：' + err.message);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
          <div className="bg-blue-700 dark:bg-blue-900 p-4 flex justify-between items-center text-white">
            <h3 className="text-lg font-bold flex items-center gap-2"><Lock className="w-5 h-5" /> 教師登入</h3>
            <button onClick={() => {setShowLoginModal(false); setAdminPassword(''); setTeacherPassword('');}} className="hover:bg-blue-800 dark:hover:bg-blue-800 p-1 rounded-full"><X className="w-5 h-5"/></button>
          </div>
          <div className="p-6 space-y-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 space-y-3 transition-colors">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2"><User className="w-4 h-4 text-blue-600 dark:text-blue-400"/> 教師身分登入</h4>
              <select value={selectedLoginTeacher} onChange={e=>setSelectedLoginTeacher(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800 dark:text-white font-medium focus:ring-blue-500 transition-colors">
                {sortedTeachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.displaySubject})</option>)}
              </select>
              <div className="flex gap-2">
                <input type="password" value={teacherPassword} onChange={e=>setTeacherPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTeacherLogin()} placeholder="請輸入密碼" className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white transition-colors" />
                <button onClick={handleTeacherLogin} className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-700 dark:hover:bg-blue-600 shadow-sm transition-colors">登入</button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-slate-600"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-xs">管理員專區</span>
                <div className="flex-grow border-t border-gray-200 dark:border-slate-600"></div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50 space-y-3 transition-colors">
                <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-500"/> 管理者登入</h4>
                <div className="flex gap-2">
                  <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} className="flex-1 border border-amber-300 dark:border-amber-700/50 rounded-lg p-2 text-sm focus:ring-amber-500 bg-white dark:bg-slate-800 dark:text-white transition-colors" placeholder="請輸入管理者密碼" />
                  <button onClick={handleAdminLogin} className="px-4 py-2 bg-amber-600 dark:bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-700 dark:hover:bg-amber-600 shadow-sm transition-colors">登入</button>
                </div>
              </div>

              <div className="text-center pt-2">
                <button onClick={() => {setShowLoginModal(false); setAdminPassword(''); setTeacherPassword('');}} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline">取消並以訪客繼續</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddClassModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 transition-colors">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">新增班級</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">班級代號 (例: 705)</label>
                <input type="text" value={newClassId} onChange={e => setNewClassId(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm bg-white dark:bg-slate-700 dark:text-white transition-colors" placeholder="705" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">顯示名稱 (例: 7年05班)</label>
                <input type="text" value={newClassName} onChange={e => setNewClassName(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm bg-white dark:bg-slate-700 dark:text-white transition-colors" placeholder="7年05班" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddClassModal(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <button onClick={handleAddClass} disabled={!newClassId || !newClassName} className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors">確認新增</button>
            </div>
          </div>
        </div>
      )}

      {showClearClassModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 border-t-4 border-orange-500 transition-colors">
            <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-2">確認清空本班課表？</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">您即將清空本班在雲端上的所有課表資料。</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowClearClassModal(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <button onClick={executeClearClass} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors">確認清空</button>
            </div>
          </div>
        </div>
      )}

      {showClearAllModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 border-t-4 border-red-600 dark:border-red-500 transition-colors">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">危險：清空全校課表？</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">您即將刪除雲端資料庫中所有班級的課表！此操作無法復原。</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowClearAllModal(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <button onClick={executeClearAll} className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-700 dark:hover:bg-red-600 transition-colors">確定全部刪除</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteClassModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 border-t-4 border-red-500 transition-colors">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">確認刪除班級？</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">您即將刪除該班級及其所有排課紀錄。</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => {setShowDeleteClassModal(false); setClassToDelete(null);}} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <button onClick={executeDeleteClass} className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-700 dark:hover:bg-red-600 transition-colors">確認刪除</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllClassesModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 border-t-4 border-slate-900 dark:border-slate-500 transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">刪除「所有班級」？</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">此操作將清空系統內所有班級名單與相關課表，且無法復原！</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteAllClassesModal(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <button onClick={executeDeleteAllClasses} className="px-4 py-2 bg-slate-900 dark:bg-slate-600 text-white rounded-lg text-sm font-bold hover:bg-black dark:hover:bg-slate-500 transition-colors">確認全部刪除</button>
            </div>
          </div>
        </div>
      )}

      {showAddTeacherModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 transition-colors">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">新增教師</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">教師姓名</label>
                <input type="text" value={newTeacherName} onChange={e => setNewTeacherName(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm bg-white dark:bg-slate-700 dark:text-white transition-colors" placeholder="例: 王小明" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">任教科目</label>
                <input type="text" value={newTeacherSubject} onChange={e => setNewTeacherSubject(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm bg-white dark:bg-slate-700 dark:text-white transition-colors" placeholder="例: 數學" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddTeacherModal(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <button onClick={handleAddTeacher} disabled={!newTeacherName} className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors">確認新增</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteTeacherModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 border-t-4 border-red-500 transition-colors">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">確認刪除教師？</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">刪除老師將同步清除其相關排課紀錄。</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => {setShowDeleteTeacherModal(false); setTeacherToDelete(null);}} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <button onClick={executeDeleteTeacher} className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-700 dark:hover:bg-red-600 transition-colors">確認刪除</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllTeachersModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 border-t-4 border-slate-900 dark:border-slate-500 transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">刪除「所有教師」？</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">此操作將清空系統內所有教師名單與相關課表，且無法復原！</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteAllTeachersModal(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <button onClick={executeDeleteAllTeachers} className="px-4 py-2 bg-slate-900 dark:bg-slate-600 text-white rounded-lg text-sm font-bold hover:bg-black dark:hover:bg-slate-500 transition-colors">確認全部刪除</button>
            </div>
          </div>
        </div>
      )}

      {showDeduplicateModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6 border-t-4 border-green-500 transition-colors">
            <h3 className="text-lg font-bold text-green-700 dark:text-green-400 mb-2">合併重複教師？</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">系統將掃描同名的教師紀錄並自動合併為一筆，同時更新所有對應的課表與調代課紀錄。</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeduplicateModal(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">取消</button>
              <button onClick={executeDeduplicateTeachers} className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-700 dark:hover:bg-green-600 transition-colors">確認合併</button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transition-colors">
            <h3 className="text-lg font-bold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-2"><Upload className="w-5 h-5"/> 批次匯入 CSV 課表</h3>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2 mb-4 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl border border-purple-100 dark:border-purple-800/50 transition-colors">
              <p>請上傳包含 <strong>5 個直欄</strong>的 CSV 檔 (標題依序為：班級, 老師, 科目, 星期, 節次)</p>
            </div>
            
            <input 
              type="file" 
              accept=".csv"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                if (!file.name.toLowerCase().endsWith('.csv')) {
                  showMessage('error', '❌ 匯入失敗：請上傳 .csv 逗號分隔檔，不支援 Excel (.xls或.xlsx) 檔案');
                  e.target.value = '';
                  return;
                }
                
                showMessage('success', '🔄 正在讀取並準備寫入雲端 (請勿關閉網頁)...');
                
                const readFileAs = (f, encoding) => new Promise((resolve) => {
                  const r = new FileReader();
                  r.onload = evt => resolve(evt.target.result);
                  r.readAsText(f, encoding);
                });

                try {
                  let text = await readFileAs(file, 'utf-8');
                  
                  if (text.includes('')) {
                    console.log("偵測到可能的 Big5 編碼，系統正在自動切換解碼器...");
                    text = await readFileAs(file, 'big5');
                  }
                  
                  if (text.includes('\x00')) {
                     showMessage('error', '❌ 匯入失敗：這似乎是 Excel 檔 (.xlsx) 直接修改副檔名造成的。請在 Excel 中打開該檔案，並點選「另存新檔 -> CSV (逗號分隔)」來產生標準檔案。');
                     setShowImportModal(false);
                     e.target.value = '';
                     return;
                  }
                  
                  const lines = text.split('\n').filter(line => line.trim() !== '');
                  if (lines.length < 2) {
                    showMessage('error', '❌ 檔案內容空白或格式不符 (至少需要包含標題列與一筆資料)');
                    return;
                  }
                  
                  let newClassesMap = new Map();
                  let newTeachersMap = new Map();
                  let parsedLessons = [];

                  classes.forEach(c => newClassesMap.set(c.name.trim(), c));
                  teachers.forEach(t => newTeachersMap.set(t.name.trim(), t));
                  
                  let skippedCount = 0;

                  for (let i = 1; i < lines.length; i++) {
                    const row = lines[i].split(',').map(item => item.trim());
                    if (row.length < 5) continue;
                    
                    const [cNameRaw, tNameRaw, subject, dStr, pStr] = row;
                    const cName = cNameRaw.trim();
                    const tName = tNameRaw.trim();
                    if (!cName || !tName || !dStr || !pStr) continue;

                    const isInvalidTeacherName = (name) => {
                      if (/^\s*\d+\s*$/.test(name)) return true;
                      if (/^\d{2,4}\s*(?:\(\d+\)|-\d+)$/.test(name)) return true; 
                      if (/^[^\u4e00-\u9fa5a-zA-Z]+$/.test(name)) return true;
                      return false;
                    };

                    if (isInvalidTeacherName(tName)) {
                      console.warn(`已自動跳過異常教師名稱資料列 - [${tName}]`);
                      skippedCount++;
                      continue; 
                    }

                    let cId = cName.replace(/\D/g, ''); 
                    if(!cId) cId = `C_${Math.floor(Math.random()*1000)}`;
                    if (!newClassesMap.has(cName)) {
                      newClassesMap.set(cName, { id: cId, name: cName });
                    } else {
                      cId = newClassesMap.get(cName).id;
                    }

                    let tId = '';
                    if (!newTeachersMap.has(tName)) {
                      tId = `T${Math.floor(Math.random()*10000)}`;
                      newTeachersMap.set(tName, { id: tId, name: tName, subject: subject, password: '1234' });
                    } else {
                      tId = newTeachersMap.get(tName).id;
                    }

                    const day = parseInt(dStr);
                    const period = isNaN(parseInt(pStr)) ? pStr : parseInt(pStr);
                    const lessonId = `IMP_${Date.now()}_${i}_${Math.floor(Math.random()*1000)}`;
                    
                    parsedLessons.push({
                      id: lessonId,
                      classId: cId,
                      teacherId: tId,
                      subject: subject,
                      day: day,
                      period: period
                    });
                  }
                  
                  if (parsedLessons.length > 0) {
                        const batches = [];
                        let currentBatch = writeBatch(db);
                        let opCount = 0;

                        const pushToBatch = (ref, data) => {
                            currentBatch.set(ref, data);
                            opCount++;
                            if (opCount >= 450) {
                                batches.push(currentBatch.commit());
                                currentBatch = writeBatch(db);
                                opCount = 0;
                            }
                        };

                        parsedLessons.forEach(l => pushToBatch(doc(db, 'lessons', l.id), l));
                        newClassesMap.forEach(c => pushToBatch(doc(db, 'classes', c.id), c));
                        newTeachersMap.forEach(t => pushToBatch(doc(db, 'teachers', t.id), t));
                        
                        if (opCount > 0) {
                            batches.push(currentBatch.commit());
                        }
                        
                        await Promise.all(batches);
                        setShowImportModal(false);
                        const skipMsg = skippedCount > 0 ? ` (已自動過濾 ${skippedCount} 筆異常格式)` : '';
                        showMessage('success', `✅ 成功匯入 ${parsedLessons.length} 筆課表至雲端！${skipMsg}`);
                  } else {
                     showMessage('error', '❌ 解析失敗，請確認上傳的檔案包含正確的排課資料');
                  }
                } catch(err) {
                    console.error("Batch Import Error:", err);
                    if (err.code === 'permission-denied') {
                      showMessage('error', '❌ 寫入失敗：權限不足，請檢查 Firebase Security Rules！');
                    } else if (err.code === 'resource-exhausted') {
                      showMessage('error', '❌ 寫入失敗：超過 Firebase 每日免費寫入配額！');
                    } else {
                      showMessage('error', '❌ 處理檔案時發生錯誤：' + err.message);
                    }
                } finally {
                  e.target.value = ''; 
                }
              }}
              className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-100 dark:file:bg-purple-900/30 file:text-purple-700 dark:file:text-purple-400 hover:file:bg-purple-200 dark:hover:file:bg-purple-900/50 cursor-pointer transition-colors"
            />
            
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">關閉</button>
            </div>
          </div>
        </div>
      )}

      {showFeeReportModal && userRole === 'admin' && <FeeReportModal />}
    </div>
  );
}