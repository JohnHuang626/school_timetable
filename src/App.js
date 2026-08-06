import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Users, BookOpen, Calendar, CheckCircle2, Edit, Plus, Trash2, AlertTriangle, X, Lock, Unlock, Key, ShieldAlert, Eraser, ArrowRightLeft, FileText, Printer, Check, Clock, Mail, Upload, Save, Database, ArrowLeft } from 'lucide-react';

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

export default function App() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [viewMode, setViewMode] = useState('class'); 
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [requests, setRequests] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('701');
  const [selectedTeacher, setSelectedTeacher] = useState('溫盛傑');
  const [teacherSortMode, setTeacherSortMode] = useState('default');
  
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

  const [importStatus, setImportStatus] = useState({ type: '', message: '' });
  
  const [isEditing, setIsEditing] = useState(false);
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

  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('');
  const [showDeleteTeacherModal, setShowDeleteTeacherModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [showDeleteAllTeachersModal, setShowDeleteAllTeachersModal] = useState(false);
  const [showDeduplicateModal, setShowDeduplicateModal] = useState(false);

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
      if (data.length > 0 && !selectedClass) setSelectedClass(data[0].id);
    }, handleFirebaseError);

    const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snapshot) => {
      const data = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
      setTeachers(data);
      if (data.length > 0 && !selectedLoginTeacher) setSelectedLoginTeacher(data[0].id);
      if (data.length > 0 && !selectedTeacher) setSelectedTeacher(data[0].id);
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
      showMessage('success', '🗑️ 已刪除所有教師及相關排課紀錄');
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

      // 依據名稱分組 (去除前後空白)
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
          // 以 ID 排序，保留第一筆作為主帳號
          group.sort((a, b) => a.id.localeCompare(b.id));
          const keepTeacher = group[0];
          const dupTeachers = group.slice(1);
          const dupIds = dupTeachers.map(t => t.id);

          // 轉移所有相關課表
          const affectedLessons = lessons.filter(l => dupIds.includes(l.teacherId));
          affectedLessons.forEach(l => {
            pushToBatch('update', doc(db, 'lessons', l.id), { teacherId: keepTeacher.id });
          });

          // 轉移所有調代課申請紀錄 (發起人或對象)
          const affectedRequests = requests.filter(r => dupIds.includes(r.requesterId) || dupIds.includes(r.targetTeacherId));
          affectedRequests.forEach(r => {
            const updateData = {};
            if (dupIds.includes(r.requesterId)) updateData.requesterId = keepTeacher.id;
            if (dupIds.includes(r.targetTeacherId)) updateData.targetTeacherId = keepTeacher.id;
            pushToBatch('update', doc(db, 'requests', r.id), updateData);
          });

          // 刪除重複的教師帳號
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
        // 取得該名老師實際上課的所有不重複科目
        const uniqueSubjects = [...new Set(tLessons.map(l => l.subject))];
        if (uniqueSubjects.length > 1) {
          uniqueSubjects.sort((a, b) => {
            let indexA = SUBJECT_PRIORITY.findIndex(p => a.includes(p));
            let indexB = SUBJECT_PRIORITY.findIndex(p => b.includes(p));
            // 如果不在優先名單內，賦予較大的 index 以往後排
            indexA = indexA === -1 ? 999 : indexA;
            indexB = indexB === -1 ? 999 : indexB;
            return indexA - indexB;
          });
        }
        displaySubject = uniqueSubjects[0]; // 取排序後最高優先級的科目
      }
      
      return { ...t, displaySubject };
    });
  }, [teachers, lessons]);

  const sortedTeachers = useMemo(() => {
    let list = [...enhancedTeachers];
    if (teacherSortMode === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW', { collation: 'stroke' }));
    } else if (teacherSortMode === 'subject') {
      list.sort((a, b) => (a.displaySubject || '').localeCompare(b.displaySubject || '', 'zh-TW'));
    }
    return list;
  }, [enhancedTeachers, teacherSortMode]);

  const handleSendEmail = (req) => {
    const requester = teachers.find(t => t.id === req.requesterId)?.name || '未知';
    const target = teachers.find(t => t.id === req.targetTeacherId)?.name || '未知';
    const lesson = lessons.find(l => l.id === req.lessonId);
    const className = classes.find(c => c.id === lesson?.classId)?.name || '未知班級';
    const lessonTime = lesson ? `${DAYS[lesson.day-1]} 第 ${lesson.period} 節 (${className})` : '未知';

    const subject = `【嘉新國中】調代課通知 - ${requester}老師`;
    let body = `各位老師好：\n\n`;
    body += `老師 ${requester} 提出了調代課申請，內容如下：\n`;
    body += `- 假別/類型：${req.type === 'sub' ? `請假 (${req.reason})` : '調課'}\n`;
    
    if (req.type === 'sub') {
      body += `- 發生日期：${req.targetDate || '未指定'}\n`;
      body += `- 原授課班級：${className}\n`;
      body += `- 原上課時間：${lessonTime} (${lesson?.subject})\n`;
      body += `- 代課老師：${target}\n`;
    } else {
      body += `- 我方調課日期：${req.targetDate || '未指定'}\n`;
      body += `- 原授課班級：${className}\n`;
      body += `- 原上課時間：${lessonTime} (${lesson?.subject})\n`;
      body += `- 調換對象：${target}\n`;
      body += `- 對方換課日期：${req.targetSwapDate || '未指定'}\n`;
      const targetLesson = lessons.find(l => l.id === req.targetLessonId);
      if (targetLesson) {
          const tClassName = classes.find(c => c.id === targetLesson.classId)?.name || targetLesson.classId;
          body += `- 對方換課時段：${DAYS[targetLesson.day-1]} 第 ${targetLesson.period} 節 (${tClassName})\n`;
      }
    }
    body += `\n教務處已完成審核。特此通知相關人員。\n\n嘉新國中教務處 敬上`;
    
    // 使用 Gmail 網頁版開啟，並自動帶入主旨與內文
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  const handleSendBulkEmail = (teacherName, teacherReqs) => {
    const subject = `【嘉新國中】調代課總表通知 - ${teacherName}老師`;
    let body = `敬愛的老師們 您好：\n\n`;
    body += `以下為 ${teacherName} 老師近期已核准之調代課申請總表：\n\n`;
    teacherReqs.forEach((r, idx) => {
      body += `【申請 ${idx + 1}】\n`;
      body += `- 類型：${r.type === 'sub' ? `請假 (${r.reason})` : '調課'}\n`;
      if (r.type === 'sub') {
          body += `- 發生日期：${r.targetDate || '未指定'}\n`;
      } else {
          body += `- 我方日期：${r.targetDate || '未指定'} \n`;
          body += `- 對方換課日期：${r.targetSwapDate || '未指定'}\n`;
      }
      body += `---------------------------\n`;
    });
    body += `\n特此通知相關授課與代課老師，感謝配合！\n\n嘉新國中教務處 敬上`;
    
    // 使用 Gmail 網頁版開啟，並自動帶入主旨與內文
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  const RequestModal = ({ data, editReq, onClose }) => {
    const lesson = data ? data.lesson : lessons.find(l => l.id === editReq.lessonId);
    const day = data ? data.day : lesson.day;
    const period = data ? data.period : lesson.period;

    const [requestType, setRequestType] = useState(editReq ? editReq.type : 'sub'); 
    const [targetTeacher, setTargetTeacher] = useState(editReq ? editReq.targetTeacherId : '');
    const [targetLessonId, setTargetLessonId] = useState(editReq ? (editReq.targetLessonId || '') : ''); 
    const [targetSwapDate, setTargetSwapDate] = useState(editReq ? (editReq.targetSwapDate || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]); 
    const [reason, setReason] = useState(editReq ? editReq.reason : '事假');
    const [targetDate, setTargetDate] = useState(editReq ? editReq.targetDate : new Date().toISOString().split('T')[0]); 
    const targetClass = classes.find(c => c.id === lesson.classId) || { name: lesson.classId };

    const requesterTeacherObj = enhancedTeachers.find(t => t.id === loggedTeacherId);
    const allOtherTeachers = enhancedTeachers.filter(t => t.id !== loggedTeacherId);

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
            requesterId: loggedTeacherId,
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          <div className="bg-blue-700 p-4 flex justify-between items-center text-white">
            <h3 className="text-lg font-bold flex items-center gap-2"><ArrowRightLeft className="w-5 h-5"/> 發起調代課申請</h3>
            <button onClick={onClose} className="hover:bg-blue-800 p-1 rounded-full"><X className="w-5 h-5"/></button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-sm grid grid-cols-2 gap-2">
              <div><span className="text-gray-500">原授課班級：</span><span className="font-bold text-blue-900">{targetClass.name}</span></div>
              <div><span className="text-gray-500">上課科目：</span><span className="font-bold text-blue-900">{lesson.subject}</span></div>
              <div className="col-span-2"><span className="text-gray-500">原上課時段：</span><span className="font-bold text-blue-900">{DAYS[day-1]} 第 {period} 節</span></div>
            </div>
            
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
              <button onClick={() => {setRequestType('sub'); setTargetTeacher(''); setTargetLessonId('');}} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${requestType === 'sub' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>請假找人代課</button>
              <button onClick={() => {setRequestType('swap'); setTargetTeacher(''); setTargetLessonId('');}} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${requestType === 'swap' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>與人調課 (跨週)</button>
            </div>

            {requestType === 'sub' ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">請假事由</label>
                  <select value={reason} onChange={e => setReason(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white font-medium focus:ring-blue-500">
                    {['事假', '病假', '公假', '差假', '休假', '身心調適假', '喪假', '產假', '公傷假', '其他'].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">選擇代課老師 (已優先排列同科目)</label>
                  <select value={targetTeacher} onChange={e => setTargetTeacher(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white font-medium focus:ring-blue-500">
                    <option value="">-- 請選擇代課老師 --</option>
                    {prioritizedTeachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.displaySubject}) {t.displaySubject === requesterTeacherObj?.displaySubject ? ' ⭐[同科目]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">代課確切日期</label>
                  <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500"/>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                  <label className="block text-sm font-bold text-blue-800">1. 我的調課日 (我這堂課發生在哪天)</label>
                  <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full border border-blue-200 rounded-lg p-2 text-sm focus:ring-blue-500 bg-white shadow-sm"/>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-3">
                  <label className="block text-sm font-bold text-emerald-800">2. 對方的換課資訊 (我要跟誰、哪天換)</label>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-700 mb-1">選擇調課對象</label>
                    <select value={targetTeacher} onChange={e => setTargetTeacher(e.target.value)} className="w-full border border-emerald-200 rounded-lg p-2 text-sm bg-white font-medium focus:ring-emerald-500 shadow-sm">
                      <option value="">-- 請選擇調課老師 --</option>
                      {allOtherTeachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.displaySubject})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-emerald-700 mb-1">對方換課日期</label>
                      <input type="date" value={targetSwapDate} onChange={e => setTargetSwapDate(e.target.value)} className="w-full border border-emerald-200 rounded-lg p-2 text-sm focus:ring-emerald-500 bg-white shadow-sm"/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-emerald-700 mb-1">對方這堂課第幾節</label>
                      <select 
                        value={targetLessonId} 
                        onChange={e => setTargetLessonId(e.target.value)} 
                        disabled={!targetTeacher || targetTeacherLessons.length === 0}
                        className="w-full border border-emerald-200 rounded-lg p-2 text-sm bg-white font-medium focus:ring-emerald-500 shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        {!targetTeacher ? (
                          <option value="">-- 請先選老師 --</option>
                        ) : targetTeacherLessons.length === 0 ? (
                          <option value="">-- 該師無課表 --</option>
                        ) : (
                          <>
                            <option value="">-- 選擇對方課堂 --</option>
                            {targetTeacherLessons.map(l => {
                              const cName = classes.find(c => c.id === l.classId)?.name || l.classId;
                              return (
                                <option key={l.id} value={l.id}>
                                  {DAYS[l.day-1]}第{l.period}節 {cName}({l.subject})
                                </option>
                              )
                            })}
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleSubmit} disabled={!targetTeacher || (requestType === 'swap' && !targetLessonId)} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 shadow-sm">
                {editReq ? '儲存修改' : '送出申請'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRequestsView = () => {
    let displayRequests = userRole === 'admin' 
      ? requests 
      : requests.filter(r => r.requesterId === loggedTeacherId || r.targetTeacherId === loggedTeacherId);

    if (filterTeacherId) {
      displayRequests = displayRequests.filter(r => r.requesterId === filterTeacherId || r.targetTeacherId === filterTeacherId);
    }

    if (filterPrintClassId) {
      displayRequests = displayRequests.filter(r => {
        const lesson = lessons.find(l => l.id === r.lessonId);
        return lesson && lesson.classId === filterPrintClassId;
      });
    }

    const handleAction = async (id, newStatus) => {
      try {
        await updateDoc(doc(db, 'requests', id), { status: newStatus });
        showMessage('success', `✅ 申請狀態已更新`);
      } catch(err) {
        if (err.code === 'permission-denied') showMessage('error', '❌ 寫入失敗：無權限 (Security Rules 阻擋)');
        else showMessage('error', '❌ 更新失敗：' + err.message);
      }
    };

    const handleBatchAction = async (newStatus) => {
      const pendingReqs = displayRequests.filter(r => r.status === 'pending');
      if (pendingReqs.length === 0) {
        showMessage('error', '目前沒有待審核的申請');
        return;
      }
      try {
        const batches = [];
        let currentBatch = writeBatch(db);
        let opCount = 0;

        pendingReqs.forEach(r => {
          currentBatch.update(doc(db, 'requests', r.id), { status: newStatus });
          opCount++;
          if (opCount >= 450) {
            batches.push(currentBatch.commit());
            currentBatch = writeBatch(db);
            opCount = 0;
          }
        });

        if (opCount > 0) batches.push(currentBatch.commit());
        await Promise.all(batches);

        showMessage('success', `✅ 已成功批次${newStatus === 'approved' ? '核准' : '退回'} ${pendingReqs.length} 筆申請！`);
      } catch(err) {
        showMessage('error', '❌ 批次操作失敗：' + err.message);
      }
    };

    const handleDeleteRequest = async (id) => {
      try {
        await deleteDoc(doc(db, 'requests', id));
        showMessage('success', '🗑️ 申請紀錄已刪除');
      } catch(e) {
        showMessage('error', '❌ 刪除失敗：' + e.message);
      }
    };

    const selectedTeacherObj = enhancedTeachers.find(t => t.id === filterTeacherId);
    const selectedPrintClassObj = classes.find(c => c.id === filterPrintClassId);
    const currentPendingCount = displayRequests.filter(r => r.status === 'pending').length;

    // 清除所有篩選，回到全校總表
    const resetFilters = () => {
      setFilterTeacherId('');
      setFilterPrintClassId('');
    };

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="hidden print:block text-center py-6 border-b-2 border-black mb-4">
          <h1 className="text-2xl font-bold">嘉義縣立嘉新國民中學 調代課審核總表</h1>
          {selectedPrintClassObj ? (
            <h2 className="text-lg font-bold mt-2">班級：{selectedPrintClassObj.name} 專屬調代課通知表</h2>
          ) : selectedTeacherObj ? (
            <h2 className="text-lg font-bold mt-2">教師：{selectedTeacherObj.name} ({selectedTeacherObj.displaySubject})</h2>
          ) : (
            <h2 className="text-lg font-bold mt-2">全校總表</h2>
          )}
          <p className="text-xs text-gray-600 mt-1">列印時間：{new Date().toLocaleString()}</p>
        </div>

        <div className="p-4 border-b bg-slate-50 flex justify-between items-center print:hidden flex-wrap gap-3">
          <div>
            <h2 
              onClick={resetFilters} 
              className="text-lg font-bold text-slate-800 flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors group"
              title="點擊返回全校總表"
            >
              <FileText className="w-5 h-5 text-blue-600"/> 
              <span className="group-hover:underline">
                {filterTeacherId || filterPrintClassId 
                  ? `篩選檢視中 (點擊此處返回全校總表)` 
                  : (userRole === 'admin' ? '全校調代課審核與紀錄中心' : '我的調代課申請紀錄')}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">點擊列表中的老師姓名或班級可進行快速篩選，隨時點擊上方標題可返回全校總表</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select 
               value={filterPrintClassId} 
               onChange={(e) => setFilterPrintClassId(e.target.value)} 
               className="bg-white border border-gray-300 text-sm rounded-lg px-3 py-2 focus:ring-blue-500 font-medium shadow-xs"
            >
               <option value="">-- 全部班級 (列印篩選) --</option>
               {classes.map(c => <option key={c.id} value={c.id}>篩選班級：{c.name}</option>)}
            </select>

            <select 
               value={filterTeacherId} 
               onChange={(e) => setFilterTeacherId(e.target.value)} 
               className="bg-white border border-gray-300 text-sm rounded-lg px-3 py-2 focus:ring-blue-500 font-medium shadow-xs"
            >
               <option value="">-- 全部教師紀錄 --</option>
               {teachers.map(t => <option key={t.id} value={t.id}>篩選：{t.name} 老師</option>)}
            </select>

            {(filterTeacherId || filterPrintClassId) && (
              <button 
                onClick={resetFilters} 
                className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-300 transition-colors"
              >
                清除篩選
              </button>
            )}

            {userRole === 'admin' && (
              <div className="flex items-center gap-1.5 bg-slate-200/50 border border-slate-300 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-bold text-slate-700">
                  {filterTeacherId || filterPrintClassId ? '目前列表待審' : '全校待審'}: {currentPendingCount}張
                </span>
                <button 
                  onClick={() => handleBatchAction('approved')} 
                  disabled={currentPendingCount === 0}
                  className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 flex items-center gap-1 shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5"/> {filterTeacherId || filterPrintClassId ? '批次核准' : '全部核准'}
                </button>
                <button 
                  onClick={() => handleBatchAction('rejected')} 
                  disabled={currentPendingCount === 0}
                  className="px-2.5 py-1 bg-red-600 text-white rounded-md text-xs font-bold hover:bg-red-700 disabled:opacity-40 flex items-center gap-1 shadow-xs transition-colors"
                >
                  <X className="w-3.5 h-3.5"/> {filterTeacherId || filterPrintClassId ? '批次退回' : '全部退回'}
                </button>
                
                {filterTeacherId && (
                  <button 
                    onClick={() => {
                      const tName = selectedTeacherObj?.name || '';
                      const tReqs = requests.filter(r => r.requesterId === filterTeacherId && r.status === 'approved');
                      if (tReqs.length === 0) {
                        showMessage('error', '該老師目前沒有「已核准」的申請可寄送總表');
                        return;
                      }
                      handleSendBulkEmail(tName, tReqs);
                    }} 
                    className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 flex items-center gap-1 shadow-xs transition-colors ml-1"
                  >
                    <Mail className="w-3.5 h-3.5"/> 發送總表
                  </button>
                )}
              </div>
            )}

            <button onClick={() => window.print()} className="px-3.5 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 flex items-center gap-1.5 shadow-xs">
              <Printer className="w-4 h-4"/> 列印表格
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto p-4">
          {displayRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">目前沒有符合條件的申請紀錄。</div>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b print:bg-slate-200 print:text-black">
                  <th className="p-3 font-semibold">發生日期</th>
                  <th className="p-3 font-semibold">申請人</th>
                  <th className="p-3 font-semibold">類型 / 事由</th>
                  <th className="p-3 font-semibold">原定課堂</th>
                  <th className="p-3 font-semibold">對象老師</th>
                  <th className="p-3 font-semibold text-center">狀態</th>
                  <th className="p-3 font-semibold text-center print:hidden">操作</th>
                </tr>
              </thead>
              <tbody>
                {displayRequests.map(req => {
                  const requester = teachers.find(t => t.id === req.requesterId)?.name || '未知';
                  const target = teachers.find(t => t.id === req.targetTeacherId)?.name || '未知';
                  const lesson = lessons.find(l => l.id === req.lessonId);
                  const classObj = classes.find(c => c.id === lesson?.classId);
                  const className = classObj?.name || '未知班級';
                  const lessonTime = lesson ? `${DAYS[lesson.day-1]} 第 ${lesson.period} 節` : '未知';
                  
                  return (
                    <tr key={req.id} className="border-b hover:bg-slate-50 print:border-black">
                      <td className="p-3 font-bold text-slate-800">
                        {req.type === 'sub' ? (
                          <span className="text-blue-700">{req.targetDate || '-'}</span>
                        ) : (
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="text-blue-700">我方：{req.targetDate || '-'}</span>
                            <span className="text-emerald-700">對方：{req.targetSwapDate || '-'}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        <button onClick={() => setFilterTeacherId(req.requesterId)} className="hover:text-blue-600 hover:underline flex items-center gap-1 transition-colors group">
                          {requester} <Search className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" title="篩選此教師" />
                        </button>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${req.type === 'sub' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-800'}`}>
                          {req.type === 'sub' ? `請假 (${req.reason})` : '調課'}
                        </span>
                      </td>
                      <td className="p-3">
                        {lesson ? (
                          <div className="flex items-center gap-1.5">
                            <span>{lessonTime}</span>
                            <button 
                              onClick={() => lesson.classId && setFilterPrintClassId(lesson.classId)}
                              className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 font-bold transition-colors flex items-center gap-1"
                              title="點擊篩選此班級"
                            >
                              {className} <Search className="w-2.5 h-2.5"/>
                            </button>
                            <span className="text-slate-500 text-xs">({lesson.subject})</span>
                          </div>
                        ) : (
                          <span>未知</span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-blue-600">
                        {req.targetTeacherId ? (
                          <button onClick={() => setFilterTeacherId(req.targetTeacherId)} className="hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors group">
                            {target} <Search className="w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity" title="篩選此教師" />
                          </button>
                        ) : (
                          target
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {req.status === 'pending' && <span className="text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full text-xs font-bold">審核中</span>}
                        {req.status === 'approved' && <span className="text-green-600 bg-green-100 px-2.5 py-1 rounded-full text-xs font-bold">已核准</span>}
                        {req.status === 'rejected' && <span className="text-red-600 bg-red-100 px-2.5 py-1 rounded-full text-xs font-bold">已退回</span>}
                      </td>
                      <td className="p-3 text-center print:hidden">
                        <div className="flex justify-center gap-1.5">
                          {userRole === 'admin' && req.status === 'pending' && (
                            <>
                              <button onClick={()=>handleAction(req.id, 'approved')} className="px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-md text-xs font-bold border border-green-200 shadow-xs">核准</button>
                              <button onClick={()=>handleAction(req.id, 'rejected')} className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-md text-xs font-bold border border-red-200 shadow-xs">退回</button>
                            </>
                          )}
                          {req.status === 'approved' && (
                            <button onClick={()=>handleSendEmail(req)} className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-bold border border-blue-200 flex items-center gap-1 shadow-xs">
                              <Mail className="w-3.5 h-3.5"/> 寄信
                            </button>
                          )}
                          {(userRole === 'admin' || req.requesterId === loggedTeacherId) && (
                            <button onClick={() => handleDeleteRequest(req.id)} className="px-2.5 py-1 bg-gray-100 text-gray-600 hover:bg-red-500 hover:text-white rounded-md text-xs font-bold transition">
                              刪除
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const renderSchedule = () => {
    return (
      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200">
        <table className="w-full text-sm text-center border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th className="border-b border-r p-3 w-28 font-semibold bg-slate-100">節次 / 時間</th>
              {DAYS.map((day, idx) => (
                <th key={idx} className="border-b p-3 font-semibold w-[18%]">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period, periodIdx) => {
              if (period.isBreak) {
                return (
                  <tr key="break" className="bg-slate-50/50">
                    <td className="border-r border-b p-2 font-medium text-slate-500 text-xs bg-slate-100/50">
                      <div>{period.name}</div>
                      <div className="text-[10px] text-slate-400">{period.time}</div>
                    </td>
                    <td colSpan={5} className="border-b p-2 text-slate-400 tracking-widest text-xs">休息時間</td>
                  </tr>
                );
              }

              return (
                <tr key={period.id} className="hover:bg-slate-50/50 transition">
                  <td className="border-r border-b p-2 bg-slate-50/80 text-xs font-medium text-slate-600">
                    <div>{period.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{period.time}</div>
                  </td>
                  
                  {DAYS.map((_, dayIdx) => {
                    const dayNum = dayIdx + 1;
                    
                    if (isEditing && viewMode === 'class' && userRole === 'admin') {
                      const tIndex = dayIdx * 100 + periodIdx + 1; 
                      return (
                        <td key={dayIdx} className="border-b border-l border-gray-100 p-1 relative h-20 bg-blue-50/20">
                          <input
                            type="text" tabIndex={tIndex}
                            className="w-full h-full p-2 text-center text-sm font-bold border-2 border-dashed border-gray-300 focus:border-solid focus:border-blue-500 focus:outline-none focus:bg-yellow-50 rounded-xl text-blue-800 transition-all placeholder:text-gray-300"
                            placeholder="例: 國文 溫盛傑"
                            value={editData[`${dayNum}_${period.id}`] !== undefined ? editData[`${dayNum}_${period.id}`] : ''}
                            onChange={(e) => setEditData({...editData, [`${dayNum}_${period.id}`]: e.target.value})}
                          />
                        </td>
                      );
                    }

                    const lesson = lessons.find(l => {
                      if (viewMode === 'class') return l.classId === selectedClass && l.day === dayNum && l.period === period.id;
                      if (viewMode === 'teacher') return l.teacherId === selectedTeacher && l.day === dayNum && l.period === period.id;
                      return false;
                    });

                    const teacherName = lesson ? (teachers.find(t => t.id === lesson.teacherId)?.name || '未知') : '';
                    const className = lesson ? (classes.find(c => c.id === lesson.classId)?.name || lesson.classId) : '';
                    
                    const isMyOwnSchedule = userRole === 'teacher' && viewMode === 'teacher' && selectedTeacher === loggedTeacherId;

                    return (
                      <td key={dayIdx} className="border-b border-l border-gray-100 p-2 relative h-20 group">
                        {lesson ? (
                          <div 
                            onClick={(e) => { 
                              if(isMyOwnSchedule) {
                                setRequestTargetLesson({lesson, day: dayNum, period: period.id}); 
                              }
                            }}
                            className={`h-full flex flex-col items-center justify-center rounded-xl p-2 
                              ${period.isTutor ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'} 
                              shadow-xs relative transition-all group-hover:shadow-md
                              ${isMyOwnSchedule ? 'cursor-pointer hover:bg-indigo-100 hover:border-indigo-300 ring-2 ring-transparent hover:ring-indigo-200' : ''}
                            `}
                          >
                            {viewMode === 'class' ? (
                              <>
                                <div className="font-bold text-blue-900 text-sm mb-1 relative z-10">{lesson.subject}</div>
                                <button 
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); jumpToTeacher(lesson.teacherId); }} 
                                  className="text-xs bg-white text-blue-700 px-2 py-0.5 rounded shadow-xs hover:bg-blue-600 hover:text-white transition flex items-center gap-1 hover:underline relative z-10"
                                >
                                  <User className="w-3 h-3" /> {teacherName}
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); jumpToClass(lesson.classId); }} 
                                  className="font-bold text-blue-900 text-sm mb-1 hover:underline cursor-pointer relative z-10"
                                >
                                  {className}
                                </button>
                                <div className="text-xs text-blue-700 relative z-10">{lesson.subject}</div>
                                
                                {isMyOwnSchedule && (
                                  <div className="absolute inset-0 bg-indigo-600/90 text-white rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-xs transition-opacity pointer-events-none z-0">
                                    ✨ 點擊空白處申請調代
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-300 text-xs">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-blue-600 gap-4">
        <Database className="w-10 h-10 animate-bounce" />
        <h2 className="text-lg font-bold">正在連線至嘉新國中雲端資料庫...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-10">
      <header className="bg-blue-700 text-white shadow-md sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-blue-200" />
            <div>
              <h1 className="text-xl font-bold tracking-wide">嘉義縣立嘉新國民中學</h1>
              <p className="text-xs text-blue-200">智慧課表與代調課系統</p>
            </div>
          </div>

          <nav className="flex items-center space-x-2 my-2 sm:my-0">
            <button 
              onClick={() => {setActiveTab('schedule'); setViewMode('class'); setIsEditing(false);}}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'schedule' && viewMode === 'class' ? 'bg-blue-800 text-white shadow-inner' : 'text-blue-100 hover:bg-blue-600'}`}
            >
              🏫 班級課表
            </button>
            <button 
              onClick={() => {setActiveTab('schedule'); setViewMode('teacher'); setIsEditing(false);}}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'schedule' && viewMode === 'teacher' ? 'bg-blue-800 text-white shadow-inner' : 'text-blue-100 hover:bg-blue-600'}`}
            >
              📅 教師課表
            </button>
            {(userRole === 'admin' || userRole === 'teacher') && (
              <button 
                onClick={() => {setActiveTab('requests'); setIsEditing(false);}}
                className={`px-4 py-2 rounded-lg text-sm font-medium relative transition ${activeTab === 'requests' ? 'bg-blue-800 text-white shadow-inner' : 'text-blue-100 hover:bg-blue-600'}`}
              >
                📋 {userRole === 'admin' ? '審核中心' : '我的申請'}
                {userRole === 'admin' && requests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                    {requests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            )}
          </nav>

          <div className="flex items-center space-x-3">
            {userRole === 'teacher' && (
              <button onClick={() => { setPwdMessage({ type: '', text: '' }); setShowPwdModal(true); }} className="p-2 text-amber-300 hover:text-white transition" title="修改密碼">
                <Key className="w-5 h-5"/>
              </button>
            )}
            <button 
              onClick={() => userRole !== 'guest' ? handleLogout() : setShowLoginModal(true)}
              className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-semibold shadow transition ${userRole !== 'guest' ? 'bg-blue-800 text-white border border-blue-600' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
            >
              {userRole !== 'guest' ? <><Unlock className="w-4 h-4"/> <span>登出 ({userRole === 'admin' ? '管理者' : '教師'})</span></> : <><Lock className="w-4 h-4"/> <span>教師登入</span></>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 print:p-0">
        <div className="space-y-6">
          {importStatus.message && (
            <div className={`print:hidden border px-4 py-3 rounded-xl flex items-center gap-2 font-bold shadow-sm ${importStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {importStatus.type === 'error' ? <AlertTriangle className="w-5 h-5"/> : <CheckCircle2 className="w-5 h-5"/>} {importStatus.message}
            </div>
          )}

          {userRole === 'admin' && classes.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm print:hidden flex justify-between items-center">
              <div>
                <h3 className="font-bold text-amber-800">雲端資料庫目前為空</h3>
                <p className="text-amber-700 text-sm">請點擊右方按鈕載入初始預設資料。</p>
              </div>
              <button onClick={initializeDatabase} className="px-4 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 shadow">
                🔄 載入初始預設資料
              </button>
            </div>
          )}
          
          {activeTab === 'requests' ? (
            renderRequestsView()
          ) : (
            <>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-slate-700">選擇檢視{viewMode === 'class' ? '班級' : '教師'}：</span>
                  {viewMode === 'class' ? (
                    <div className="flex items-center gap-2">
                      <select value={selectedClass} onChange={(e) => {setSelectedClass(e.target.value); setIsEditing(false);}} className="border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      {userRole === 'admin' && (
                        <div className="flex items-center gap-1 ml-2">
                          <button onClick={() => setShowAddClassModal(true)} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-bold flex items-center gap-1">
                            <Plus className="w-4 h-4"/> 新增
                          </button>
                          {classes.length > 0 && (
                            <button onClick={() => { setClassToDelete(selectedClass); setShowDeleteClassModal(true); }} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-bold flex items-center gap-1">
                              <Trash2 className="w-4 h-4"/> 刪除
                            </button>
                          )}
                          {classes.length > 0 && (
                            <button onClick={() => setShowDeleteAllClassesModal(true)} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 text-sm font-bold flex items-center gap-1 ml-2 shadow-sm">
                              <AlertTriangle className="w-4 h-4"/> 刪除所有班級
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <select value={teacherSortMode} onChange={(e) => setTeacherSortMode(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="default">預設排序</option>
                        <option value="subject">依科目</option>
                        <option value="name">依姓名筆畫</option>
                      </select>
                      <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} className="border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                        {sortedTeachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.displaySubject})</option>)}
                      </select>

                      {userRole === 'admin' && (
                        <div className="flex items-center gap-1 ml-2">
                          <button onClick={() => setShowAddTeacherModal(true)} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm font-bold flex items-center gap-1">
                            <Plus className="w-4 h-4"/> 新增
                          </button>
                          {teachers.length > 0 && (
                            <button onClick={() => { setTeacherToDelete(selectedTeacher); setShowDeleteTeacherModal(true); }} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-bold flex items-center gap-1">
                            <Trash2 className="w-4 h-4"/> 刪除
                          </button>
                        )}
                        {teachers.length > 0 && (
                          <>
                            <button onClick={() => setShowDeduplicateModal(true)} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-bold flex items-center gap-1 ml-2 shadow-sm">
                              <Eraser className="w-4 h-4"/> 合併重複
                            </button>
                            <button onClick={() => setShowDeleteAllTeachersModal(true)} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 text-sm font-bold flex items-center gap-1 ml-2 shadow-sm">
                              <AlertTriangle className="w-4 h-4"/> 刪除所有教師
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {userRole === 'teacher' && selectedTeacher === loggedTeacherId && (
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-200">我的專屬課表</span>
                      )}
                      {userRole === 'teacher' && selectedTeacher !== loggedTeacherId && (
                        <button onClick={() => setSelectedTeacher(loggedTeacherId)} className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg border border-blue-200 flex items-center gap-1 transition shadow-xs">
                          <ArrowLeft className="w-4 h-4"/> 返回我的課表
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {viewMode === 'class' && userRole === 'admin' && (
                  isEditing ? (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">取消</button>
                      <button onClick={saveEditing} className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-sm">
                        <Save className="w-4 h-4"/> 儲存至雲端
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setShowClearClassModal(true)} className="px-3 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-sm font-bold hover:bg-orange-100">清空本班</button>
                      <button onClick={() => setShowClearAllModal(true)} className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-bold hover:bg-red-100">清空全部</button>
                      <button onClick={() => setShowImportModal(true)} className="px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-sm font-bold hover:bg-purple-100 flex items-center gap-1">
                        <Upload className="w-4 h-4"/> 匯入 CSV
                      </button>
                      <button onClick={startEditing} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-blue-700 shadow-sm">
                        <Edit className="w-4 h-4"/> 快速編輯
                      </button>
                    </div>
                  )
                )}
              </div>
              {renderSchedule()}
            </>
          )}
        </div>
      </main>

      {requestTargetLesson && <RequestModal data={requestTargetLesson} onClose={() => setRequestTargetLesson(null)} />}
      {editRequestData && <RequestModal editReq={editRequestData} onClose={() => setEditRequestData(null)} />}

      {/* 修改密碼 Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="bg-amber-500 p-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold flex items-center gap-2"><Key className="w-5 h-5" /> 修改個人密碼</h3>
              <button onClick={() => setShowPwdModal(false)} className="hover:bg-amber-600 p-1 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">原密碼</label>
                <input type="password" value={pwdOld} onChange={e=>setPwdOld(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-amber-500" placeholder="預設為 1234" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">新密碼</label>
                <input type="password" value={pwdNew} onChange={e=>setPwdNew(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-amber-500" placeholder="至少 4 碼" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">確認新密碼</label>
                <input type="password" value={pwdConfirm} onChange={e=>setPwdConfirm(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-amber-500" placeholder="再次輸入新密碼" />
              </div>

              {pwdMessage.text && (
                <div className={`p-3 rounded-lg text-xs font-bold text-center ${pwdMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  {pwdMessage.text}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowPwdModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">取消</button>
                <button onClick={handleChangePassword} className="px-5 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 shadow-sm">確認修改</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 登入 Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="bg-blue-700 p-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold flex items-center gap-2"><Lock className="w-5 h-5" /> 教師登入</h3>
              <button onClick={() => {setShowLoginModal(false); setAdminPassword(''); setTeacherPassword('');}} className="hover:bg-blue-800 p-1 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><User className="w-4 h-4 text-blue-600"/> 教師身分登入</h4>
                <select value={selectedLoginTeacher} onChange={e=>setSelectedLoginTeacher(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white font-medium focus:ring-blue-500">
                  {enhancedTeachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.displaySubject})</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="password" value={teacherPassword} onChange={e=>setTeacherPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTeacherLogin()} placeholder="請輸入密碼" className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500" />
                  <button onClick={handleTeacherLogin} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm">登入</button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">管理員專區</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-600"/> 管理者登入</h4>
                <div className="flex gap-2">
                  <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} className="flex-1 border border-amber-300 rounded-lg p-2 text-sm focus:ring-amber-500 bg-white" placeholder="請輸入管理者密碼" />
                  <button onClick={handleAdminLogin} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 shadow-sm">登入</button>
                </div>
              </div>

              <div className="text-center pt-2">
                <button onClick={() => {setShowLoginModal(false); setAdminPassword(''); setTeacherPassword('');}} className="text-xs text-gray-500 hover:text-gray-800 underline">取消並以訪客繼續</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 以下是各類刪除、新增與匯入的確認視窗...保留原樣 */}
      {showAddClassModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">新增班級</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">班級代號 (例: 705)</label>
                <input type="text" value={newClassId} onChange={e => setNewClassId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="705" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">顯示名稱 (例: 7年05班)</label>
                <input type="text" value={newClassName} onChange={e => setNewClassName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="7年05班" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddClassModal(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleAddClass} disabled={!newClassId || !newClassName} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50">確認新增</button>
            </div>
          </div>
        </div>
      )}

      {showClearClassModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border-t-4 border-orange-500">
            <h3 className="text-lg font-bold text-orange-600 mb-2">確認清空本班課表？</h3>
            <p className="text-gray-600 text-sm mb-6">您即將清空本班在雲端上的所有課表資料。</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowClearClassModal(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold">取消</button>
              <button onClick={executeClearClass} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600">確認清空</button>
            </div>
          </div>
        </div>
      )}

      {showClearAllModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border-t-4 border-red-600">
            <h3 className="text-lg font-bold text-red-600 mb-2">危險：清空全校課表？</h3>
            <p className="text-gray-600 text-sm mb-6">您即將刪除雲端資料庫中所有班級的課表！此操作無法復原。</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowClearAllModal(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold">取消</button>
              <button onClick={executeClearAll} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700">確定全部刪除</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteClassModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-red-600 mb-2">確認刪除班級？</h3>
            <p className="text-gray-600 text-sm mb-6">您即將刪除該班級及其所有排課紀錄。</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => {setShowDeleteClassModal(false); setClassToDelete(null);}} className="px-4 py-2 border rounded-lg text-sm font-semibold">取消</button>
              <button onClick={executeDeleteClass} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700">確認刪除</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllClassesModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border-t-4 border-slate-900">
            <h3 className="text-lg font-bold text-slate-900 mb-2">刪除「所有班級」？</h3>
            <p className="text-gray-600 text-sm mb-6">此操作將清空系統內所有班級名單與相關課表，且無法復原！</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteAllClassesModal(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold">取消</button>
              <button onClick={executeDeleteAllClasses} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-black">確認全部刪除</button>
            </div>
          </div>
        </div>
      )}

      {showAddTeacherModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">新增教師</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">教師姓名</label>
                <input type="text" value={newTeacherName} onChange={e => setNewTeacherName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="例: 王小明" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">任教科目</label>
                <input type="text" value={newTeacherSubject} onChange={e => setNewTeacherSubject(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="例: 數學" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddTeacherModal(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold text-gray-600">取消</button>
              <button onClick={handleAddTeacher} disabled={!newTeacherName} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">確認新增</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteTeacherModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-red-600 mb-2">確認刪除教師？</h3>
            <p className="text-gray-600 text-sm mb-6">刪除老師將同步清除其相關排課紀錄。</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => {setShowDeleteTeacherModal(false); setTeacherToDelete(null);}} className="px-4 py-2 border rounded-lg text-sm font-semibold">取消</button>
              <button onClick={executeDeleteTeacher} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700">確認刪除</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllTeachersModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border-t-4 border-slate-900">
            <h3 className="text-lg font-bold text-slate-900 mb-2">刪除「所有教師」？</h3>
            <p className="text-gray-600 text-sm mb-6">此操作將清空系統內所有教師名單與相關課表，且無法復原！</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteAllTeachersModal(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold">取消</button>
              <button onClick={executeDeleteAllTeachers} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-black">確認全部刪除</button>
            </div>
          </div>
        </div>
      )}

      {showDeduplicateModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border-t-4 border-green-500">
            <h3 className="text-lg font-bold text-green-700 mb-2">合併重複教師？</h3>
            <p className="text-gray-600 text-sm mb-6">系統將掃描同名的教師紀錄並自動合併為一筆，同時更新所有對應的課表與調代課紀錄。</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeduplicateModal(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold">取消</button>
              <button onClick={executeDeduplicateTeachers} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700">確認合併</button>
            </div>
          </div>
        </div>
      )}

      {/* 匯入 Modal */}
      {showImportModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-purple-700 mb-2 flex items-center gap-2"><Upload className="w-5 h-5"/> 批次匯入 CSV 課表</h3>
            <div className="text-sm text-gray-600 space-y-2 mb-4 bg-purple-50 p-3 rounded-xl border border-purple-100">
              <p>請上傳包含 <strong>5 個直欄</strong>的 CSV 檔 (標題依序為：班級, 老師, 科目, 星期, 節次)</p>
            </div>
            
            <input 
              type="file" 
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                showMessage('success', '🔄 正在讀取並準備寫入雲端 (請勿關閉網頁)...');
                const reader = new FileReader();
                reader.onload = async (evt) => {
                  const text = evt.target.result;
                  const lines = text.split('\n').filter(line => line.trim() !== '');
                  if (lines.length < 2) {
                    showMessage('error', '❌ 檔案內容空白或格式不符');
                    return;
                  }
                  
                  let newClassesMap = new Map();
                  let newTeachersMap = new Map();
                  let parsedLessons = [];

                  classes.forEach(c => newClassesMap.set(c.name.trim(), c));
                  teachers.forEach(t => newTeachersMap.set(t.name.trim(), t));
                  
                  for (let i = 1; i < lines.length; i++) {
                    const row = lines[i].split(',').map(item => item.trim());
                    if (row.length < 5) continue;
                    
                    const [cNameRaw, tNameRaw, subject, dStr, pStr] = row;
                    const cName = cNameRaw.trim();
                    const tName = tNameRaw.trim();
                    if (!cName || !tName || !dStr || !pStr) continue;

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

                        parsedLessons.forEach(l => pushToBatch(doc(db, 'lessons', l.id), l));
                        newClassesMap.forEach(c => pushToBatch(doc(db, 'classes', c.id), c));
                        newTeachersMap.forEach(t => pushToBatch(doc(db, 'teachers', t.id), t));
                        
                        if (opCount > 0) {
                            batches.push(currentBatch.commit());
                        }
                        
                        await Promise.all(batches);
                        setShowImportModal(false);
                        showMessage('success', `✅ 成功匯入 ${parsedLessons.length} 筆課表至雲端！`);
                     } catch(err) {
                        console.error("Batch Import Error:", err);
                        if (err.code === 'permission-denied') {
                          showMessage('error', '❌ 寫入失敗：權限不足，請檢查 Firebase Security Rules！');
                        } else if (err.code === 'resource-exhausted') {
                          showMessage('error', '❌ 寫入失敗：超過 Firebase 每日免費寫入配額！');
                        } else {
                          showMessage('error', '❌ 寫入雲端失敗：' + err.message);
                        }
                     }
                  } else {
                     showMessage('error', '❌ 解析失敗，請確認格式');
                  }
                };
                reader.readAsText(file);
              }}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer"
            />
            
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold text-gray-600">關閉</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}