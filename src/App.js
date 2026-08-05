import React, { useState, useMemo } from 'react';
import {
  Search,
  User,
  Users,
  BookOpen,
  Calendar,
  CheckCircle2,
  Edit,
  Plus,
  Trash2,
  AlertTriangle,
  X,
  Lock,
  Unlock,
  Key,
  ShieldAlert,
  Eraser,
  ArrowRightLeft,
  FileText,
  Printer,
  Check,
  Clock,
  Mail,
  Upload,
} from 'lucide-react';

// --- 模擬資料庫 (Mock Data) ---
const INITIAL_CLASSES = [
  { id: '701', name: '7年01班' },
  { id: '702', name: '7年02班' },
  { id: '703', name: '7年03班' },
  { id: '704', name: '7年04班' },
  { id: '801', name: '8年01班' },
  { id: '802', name: '8年02班' },
  { id: '803', name: '8年03班' },
  { id: '804', name: '8年04班' },
  { id: '901', name: '9年01班' },
  { id: '902', name: '9年02班' },
  { id: '903', name: '9年03班' },
  { id: '904', name: '9年04班' },
  { id: '905', name: '9年05班' },
];

const INITIAL_TEACHERS = [
  { id: 'T001', name: '溫盛傑', subject: '國文' },
  { id: 'T002', name: '王品勻', subject: '國文' },
  { id: 'T005', name: '王品文', subject: '國文' },
  { id: 'T012', name: '楊育珽', subject: '英文' },
  { id: 'T014', name: '王亞萍', subject: '數學' },
  { id: 'T015', name: '林秀錦', subject: '數學' },
  { id: 'T019', name: '吳英慶', subject: '自然' },
  { id: 'T024', name: '李淑珍', subject: '歷史' },
  { id: 'T026', name: '莊曼曦', subject: '地理/公民' },
  { id: 'T034', name: '丁毅銘', subject: '童軍' },
];

let MOCK_LESSONS = [
  {
    id: 'L1',
    classId: '905',
    teacherId: 'T001',
    subject: '國文',
    day: 1,
    period: 1,
  },
  {
    id: 'L2',
    classId: '905',
    teacherId: 'T001',
    subject: '國文',
    day: 1,
    period: 6,
  },
  {
    id: 'L3',
    classId: '905',
    teacherId: 'T001',
    subject: '國文',
    day: 2,
    period: 2,
  },
  {
    id: 'L4',
    classId: '905',
    teacherId: 'T001',
    subject: '國文',
    day: 3,
    period: 2,
  },
  {
    id: 'L5',
    classId: '905',
    teacherId: 'T001',
    subject: '輔導',
    day: 2,
    period: 8,
  },
  {
    id: 'L6',
    classId: '701',
    teacherId: 'T015',
    subject: '數學',
    day: 1,
    period: 4,
  },
  {
    id: 'L7',
    classId: '701',
    teacherId: 'T015',
    subject: '數學',
    day: 2,
    period: 4,
  },
  {
    id: 'L8',
    classId: '701',
    teacherId: 'T015',
    subject: '數學',
    day: 4,
    period: 7,
  },
  {
    id: 'L9',
    classId: '701',
    teacherId: 'T015',
    subject: '輔導',
    day: 1,
    period: 8,
  },
];

const DAYS = ['星期一', '星期二', '星期三', '星期四', '星期五'];
const PERIODS = [
  { id: 1, name: '第一節', time: '08:25-09:10' },
  { id: 2, name: '第二節', time: '09:20-10:05' },
  { id: 3, name: '第三節', time: '10:15-11:00' },
  { id: 4, name: '第四節', time: '11:10-11:55' },
  { id: 'noon', name: '午休', time: '12:00-13:20', isBreak: true },
  { id: 5, name: '第五節', time: '13:20-14:05' },
  { id: 6, name: '第六節', time: '14:15-15:00' },
  { id: 7, name: '第七節', time: '15:15-16:00' },
  { id: 8, name: '第八節\n(輔導課)', time: '16:10-16:55', isTutor: true },
];

export default function App() {
  // --- 檢視狀態 ---
  const [activeTab, setActiveTab] = useState('schedule');
  const [viewMode, setViewMode] = useState('class');

  // --- 基本資料狀態 ---
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [teachers, setTeachers] = useState(INITIAL_TEACHERS);
  const [selectedClass, setSelectedClass] = useState(INITIAL_CLASSES[0].id);
  const [selectedTeacher, setSelectedTeacher] = useState(
    INITIAL_TEACHERS[0].id
  );
  const [lessons, setLessons] = useState(MOCK_LESSONS);
  const [teacherSortMode, setTeacherSortMode] = useState('default');

  // --- 身分驗證 (Auth) ---
  const [userRole, setUserRole] = useState('guest');
  const [loggedTeacherId, setLoggedTeacherId] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedLoginTeacher, setSelectedLoginTeacher] = useState(
    INITIAL_TEACHERS[0].id
  );
  const [teacherPassword, setTeacherPassword] = useState('');

  // --- 調代課申請狀態 (Workflow) ---
  const [requests, setRequests] = useState([
    {
      id: 'REQ001',
      type: 'sub',
      requesterId: 'T001',
      targetTeacherId: 'T012',
      lessonId: 'L3',
      targetDate: '2026-08-03',
      status: 'pending',
      timestamp: new Date().toISOString(),
      reason: '公假開會',
    },
    {
      id: 'REQ002',
      type: 'swap',
      requesterId: 'T015',
      targetTeacherId: 'T014',
      lessonId: 'L6',
      targetDate: '2026-08-04',
      targetLessonId: null,
      status: 'approved',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      reason: '事假調課',
    },
  ]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestTargetLesson, setRequestTargetLesson] = useState(null);
  const [editRequestData, setEditRequestData] = useState(null);
  const [filterTeacherId, setFilterTeacherId] = useState('');

  // --- 系統訊息狀態 ---
  const [importStatus, setImportStatus] = useState({ type: '', message: '' });

  // --- 管理功能狀態 ---
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassId, setNewClassId] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [showClearClassModal, setShowClearClassModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const jumpToTeacher = (teacherId) => {
    setSelectedTeacher(teacherId);
    setViewMode('teacher');
  };

  const jumpToClass = (classId) => {
    setSelectedClass(classId);
    setViewMode('class');
  };

  const showMessage = (type, message) => {
    setImportStatus({ type, message });
    setTimeout(() => setImportStatus({ type: '', message: '' }), 3000);
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin888') {
      setUserRole('admin');
      setLoggedTeacherId(null);
      setShowLoginModal(false);
      setAdminPassword('');
      showMessage('success', '✅ 已解鎖管理者權限！');
    } else {
      showMessage('error', '❌ 密碼錯誤，請重試。');
    }
  };

  const handleTeacherLogin = () => {
    // 支援原本的教師密碼(1234) 以及 教學組萬用密碼(admin888)
    if (teacherPassword === '1234' || teacherPassword === 'admin888') {
      setUserRole('teacher');
      setLoggedTeacherId(selectedLoginTeacher);
      setSelectedTeacher(selectedLoginTeacher);
      setViewMode('teacher');
      setActiveTab('schedule');
      setShowLoginModal(false);
      setTeacherPassword('');
      const teacherName = teachers.find(
        (t) => t.id === selectedLoginTeacher
      )?.name;
      const loginMode = teacherPassword === 'admin888' ? ' (管理員代登)' : '';
      showMessage('success', `👨‍🏫 歡迎登入，${teacherName}老師！${loginMode}`);
    } else {
      showMessage('error', '❌ 密碼錯誤，請重新輸入。');
    }
  };

  const handleLogout = () => {
    setUserRole('guest');
    setLoggedTeacherId(null);
    setIsEditing(false);
    setActiveTab('schedule');
    showMessage('success', '🔒 已登出，切換為訪客模式。');
  };

  const startEditing = () => {
    const currentClassLessons = lessons.filter(
      (l) => l.classId === selectedClass
    );
    const initialEditData = {};
    currentClassLessons.forEach((l) => {
      const teacher = teachers.find((t) => t.id === l.teacherId);
      initialEditData[`${l.day}_${l.period}`] = `${l.subject} ${
        teacher ? teacher.name : ''
      }`.trim();
    });
    setEditData(initialEditData);
    setIsEditing(true);
  };

  const saveEditing = () => {
    let newLessons = lessons.filter((l) => l.classId !== selectedClass);
    const classLessons = [];
    let currentTeachers = [...teachers];

    Object.keys(editData).forEach((key) => {
      const text = (editData[key] || '').trim();
      if (!text) return;

      const [dayStr, periodStr] = key.split('_');
      const day = parseInt(dayStr);
      const period = isNaN(parseInt(periodStr))
        ? periodStr
        : parseInt(periodStr);

      let subject = text;
      let teacherName = '未知';

      if (text.includes(' ')) {
        const parts = text.split(' ');
        subject = parts[0].trim();
        teacherName = parts.slice(1).join('').trim();
      } else if (text.length >= 4) {
        teacherName = text.slice(-3);
        subject = text.slice(0, -3);
        if (text.length === 5) {
          subject = text.slice(0, 2);
          teacherName = text.slice(2);
        }
      }

      if (subject) {
        let teacher = currentTeachers.find((t) => t.name === teacherName);
        if (!teacher) {
          const newId = `T_NEW_${Math.floor(Math.random() * 10000)}`;
          teacher = {
            id: newId,
            name: teacherName,
            subject: subject || '未知科目',
          };
          currentTeachers.push(teacher);
        }

        classLessons.push({
          id: `manual_${Date.now()}_${day}_${period}`,
          classId: selectedClass,
          teacherId: teacher.id,
          subject,
          day,
          period,
        });
      }
    });

    setTeachers(currentTeachers);
    setLessons([...newLessons, ...classLessons]);
    setIsEditing(false);
    showMessage('success', `✅ 儲存成功！${selectedClass} 課表已更新。`);
  };

  const executeClearClass = () => {
    setLessons(lessons.filter((l) => l.classId !== selectedClass));
    setShowClearClassModal(false);
    setIsEditing(false);
    showMessage('success', '🧹 已清空本班課表！');
  };

  const executeClearAll = () => {
    setLessons([]);
    setShowClearAllModal(false);
    setIsEditing(false);
    showMessage('success', '🔥 已清空所有班級課表！');
  };

  const handleAddClass = () => {
    if (!newClassId || !newClassName) return;
    setClasses([...classes, { id: newClassId, name: newClassName }]);
    setSelectedClass(newClassId);
    setShowAddClassModal(false);
    setNewClassId('');
    setNewClassName('');
    showMessage('success', `✅ 已新增班級：${newClassName}`);
  };

  const executeDeleteClass = () => {
    if (!classToDelete) return;
    const newClasses = classes.filter((c) => c.id !== classToDelete);
    setClasses(newClasses);
    setLessons(lessons.filter((l) => l.classId !== classToDelete));
    if (selectedClass === classToDelete)
      setSelectedClass(newClasses[0]?.id || '');
    setShowDeleteClassModal(false);
    setClassToDelete(null);
    showMessage('success', '🗑️ 已刪除班級');
  };

  const sortedTeachers = useMemo(() => {
    let list = [...teachers];
    if (teacherSortMode === 'name') {
      list.sort((a, b) =>
        a.name.localeCompare(b.name, 'zh-TW', { collation: 'stroke' })
      );
    } else if (teacherSortMode === 'class') {
      const getMinClass = (tId) => {
        const tLessons = lessons.filter((l) => l.teacherId === tId);
        return tLessons.length > 0
          ? tLessons.map((l) => l.classId).sort()[0]
          : '9999';
      };
      list.sort((a, b) => {
        const classA = getMinClass(a.id);
        const classB = getMinClass(b.id);
        if (classA !== classB) return classA.localeCompare(classB, 'zh-TW');
        return a.name.localeCompare(b.name, 'zh-TW', { collation: 'stroke' });
      });
    } else if (teacherSortMode === 'subject') {
      list.sort((a, b) => {
        const subA = a.subject || '';
        const subB = b.subject || '';
        if (subA !== subB)
          return subA.localeCompare(subB, 'zh-TW', { collation: 'stroke' });
        return a.name.localeCompare(b.name, 'zh-TW', { collation: 'stroke' });
      });
    }
    return list;
  }, [teachers, lessons, teacherSortMode]);

  const handleSendEmail = (req) => {
    const requester =
      teachers.find((t) => t.id === req.requesterId)?.name || '未知';
    const target =
      teachers.find((t) => t.id === req.targetTeacherId)?.name || '未知';
    const lesson = lessons.find((l) => l.id === req.lessonId);
    const className =
      classes.find((c) => c.id === lesson?.classId)?.name || '未知班級';
    const lessonTime = lesson
      ? `${DAYS[lesson.day - 1]} 第${lesson.period}節 (${className})`
      : '未知課堂';
    const dateStr = req.targetDate ? `【日 期】：${req.targetDate}\n` : '';

    const subject = `[教務處通知] 調代課異動 - ${requester} 申請 (${
      req.type === 'sub' ? '代課' : '調課'
    })`;
    const targetLesson = req.targetLessonId
      ? lessons.find((l) => l.id === req.targetLessonId)
      : null;

    let body = `敬愛的老師 您好：\n\n`;
    body += `系統發送了一筆新的調代課通知，詳情如下：\n\n`;
    body += `【申請人】：${requester} 老師\n`;
    body += `【事 由】：${req.reason}\n`;
    body += dateStr;
    body += `【類 型】：${req.type === 'sub' ? '請您代課' : '與您調課'}\n`;
    body += `【對 象】：${target} 老師\n`;
    body += `【原定課堂】：${lessonTime} - ${lesson ? lesson.subject : ''}\n`;

    if (req.type === 'swap' && targetLesson) {
      const targetClassName =
        classes.find((c) => c.id === targetLesson.classId)?.name || '未知班級';
      body += `【互換課堂】：${req.targetSwapDate || '未定日期'} ${
        DAYS[targetLesson.day - 1]
      } 第${targetLesson.period}節 (${targetClassName}) - ${
        targetLesson.subject
      }\n`;
    }

    body += `【審核狀態】：${
      req.status === 'approved' ? '教務處已核准 ✅' : '目前審核中 ⏳'
    }\n\n`;
    body += `再請您留意個人課表之異動。若有疑問請洽教務處，謝謝您！\n`;
    body += `(此為智慧課表系統自動生成之信件)`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  const RequestModal = ({ data, editReq, onClose }) => {
    const lesson = data
      ? data.lesson
      : lessons.find((l) => l.id === editReq.lessonId);
    const day = data ? data.day : lesson.day;
    const period = data ? data.period : lesson.period;

    const [requestType, setRequestType] = useState(
      editReq ? editReq.type : 'sub'
    );
    const [targetTeacher, setTargetTeacher] = useState(
      editReq ? editReq.targetTeacherId : ''
    );
    const [targetLessonId, setTargetLessonId] = useState(
      editReq ? editReq.targetLessonId || '' : ''
    );
    const [targetSwapDate, setTargetSwapDate] = useState(
      editReq
        ? editReq.targetSwapDate || editReq.targetDate
        : new Date().toISOString().split('T')[0]
    );
    const [reason, setReason] = useState(editReq ? editReq.reason : '');
    const [targetDate, setTargetDate] = useState(
      editReq ? editReq.targetDate : new Date().toISOString().split('T')[0]
    );
    const targetClass = classes.find((c) => c.id === lesson.classId) || {
      name: lesson.classId,
    };

    const allOtherTeachers = teachers.filter((t) => t.id !== loggedTeacherId);

    const targetTeacherLessons = useMemo(() => {
      if (!targetTeacher) return [];
      return lessons
        .filter((l) => l.teacherId === targetTeacher)
        .sort((a, b) => a.day - b.day || a.period - b.period);
    }, [targetTeacher, lessons]);

    const handleSubmit = () => {
      if (!targetDate) {
        showMessage('error', '請選擇發生日期');
        return;
      }
      if (!reason) {
        showMessage('error', '請選擇假別或事由');
        return;
      }
      if (requestType === 'swap' && !targetLessonId) {
        showMessage('error', '請選擇要與對方互調的具體課堂');
        return;
      }

      if (editReq) {
        setRequests(
          requests.map((r) =>
            r.id === editReq.id
              ? {
                  ...r,
                  type: requestType,
                  targetTeacherId: targetTeacher,
                  targetLessonId:
                    requestType === 'swap' ? targetLessonId : null,
                  targetSwapDate:
                    requestType === 'swap' ? targetSwapDate : null,
                  targetDate: targetDate,
                  reason: reason,
                }
              : r
          )
        );
        onClose();
        showMessage('success', '✅ 申請已成功修改！');
      } else {
        const newReq = {
          id: `REQ${Math.floor(Math.random() * 10000)}`,
          type: requestType,
          requesterId: loggedTeacherId,
          targetTeacherId: targetTeacher,
          lessonId: lesson.id,
          targetLessonId: requestType === 'swap' ? targetLessonId : null,
          targetSwapDate: requestType === 'swap' ? targetSwapDate : null,
          targetDate: targetDate,
          status: 'pending',
          timestamp: new Date().toISOString(),
          reason: reason,
        };
        setRequests([newReq, ...requests]);
        onClose();
        showMessage('success', '📝 申請已送出！請至「我的申請紀錄」查看進度。');
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" /> 提出調/代課申請
            </h3>
            <button
              onClick={onClose}
              className="hover:bg-indigo-700 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto">
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-4 text-sm grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500">我的班級：</span>
                <span className="font-bold">{targetClass.name}</span>
              </div>
              <div>
                <span className="text-gray-500">上課科目：</span>
                <span className="font-bold">{lesson.subject}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">原定時間：</span>
                <span className="font-bold">
                  {DAYS[day - 1]} 第{period}節
                </span>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setRequestType('sub');
                  setTargetTeacher('');
                  setTargetLessonId('');
                }}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
                  requestType === 'sub'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                找人代課
              </button>
              <button
                onClick={() => {
                  setRequestType('swap');
                  setTargetTeacher('');
                  setTargetLessonId('');
                }}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
                  requestType === 'swap'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                與人調課
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    發生日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    假別 / 事由 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">-- 請選擇假別 --</option>
                    {[
                      '事假',
                      '病假',
                      '公假',
                      '差假',
                      '休假',
                      '身心調適假',
                      '喪假',
                      '產假',
                      '公傷假',
                      '其他',
                    ].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    {/* 為了相容舊資料中自訂的事由 */}
                    {reason &&
                      ![
                        '事假',
                        '病假',
                        '公假',
                        '差假',
                        '休假',
                        '身心調適假',
                        '喪假',
                        '產假',
                        '公傷假',
                        '其他',
                      ].includes(reason) && (
                        <option value={reason}>{reason}</option>
                      )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {requestType === 'sub'
                    ? '選擇代課老師'
                    : '選擇你想調課的對象老師'}
                </label>
                <select
                  value={targetTeacher}
                  onChange={(e) => {
                    setTargetTeacher(e.target.value);
                    setTargetLessonId('');
                  }}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 text-sm"
                >
                  <option value="">-- 請選擇老師 --</option>
                  {allOtherTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subject})
                    </option>
                  ))}
                </select>
              </div>

              {requestType === 'swap' && targetTeacher && (
                <div className="animate-in fade-in slide-in-from-top-2 p-3 bg-blue-50 border border-blue-100 rounded-lg space-y-3 mt-4">
                  <label className="block text-sm font-bold text-blue-800 border-b border-blue-200 pb-2">
                    你要用對方的哪一堂課來換？{' '}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-blue-700 mb-1">
                        對方該堂課的發生日期 (跨週調課請改日期)
                      </label>
                      <input
                        type="date"
                        value={targetSwapDate}
                        onChange={(e) => setTargetSwapDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-blue-700 mb-1">
                        選擇對方的原定課堂
                      </label>
                      <select
                        value={targetLessonId}
                        onChange={(e) => setTargetLessonId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 text-sm bg-white"
                      >
                        <option value="">-- 請選擇對方要互調的課堂 --</option>
                        {targetTeacherLessons.map((l) => {
                          const cName =
                            classes.find((c) => c.id === l.classId)?.name ||
                            l.classId;
                          return (
                            <option key={l.id} value={l.id}>
                              {DAYS[l.day - 1]} 第{l.period}節 - {cName} (
                              {l.subject})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !targetTeacher || (requestType === 'swap' && !targetLessonId)
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                {editReq ? '儲存修改' : '送出申請'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRequestsView = () => {
    let displayRequests =
      userRole === 'admin'
        ? requests
        : requests.filter(
            (r) =>
              r.requesterId === loggedTeacherId ||
              r.targetTeacherId === loggedTeacherId
          );

    if (filterTeacherId) {
      displayRequests = displayRequests.filter(
        (r) =>
          r.requesterId === filterTeacherId ||
          r.targetTeacherId === filterTeacherId
      );
    }

    const handleAction = (id, newStatus) => {
      setRequests(
        requests.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in">
        <div className="hidden print:block text-center py-6 border-b-2 border-black mb-4">
          <h1 className="text-2xl font-bold">嘉新國中 調代課通知單</h1>
          {filterTeacherId ? (
            <h2 className="text-xl font-bold mt-2 border-b border-gray-400 inline-block pb-1">
              {teachers.find((t) => t.id === filterTeacherId)?.name} 老師
              專屬紀錄表
            </h2>
          ) : (
            <h2 className="text-lg font-bold mt-2">全校總表</h2>
          )}
          <p className="text-sm mt-2 text-gray-600">
            列印時間：{new Date().toLocaleString()}
          </p>
        </div>

        <div className="p-4 border-b bg-gray-50 flex justify-between items-center print:hidden flex-wrap gap-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            {userRole === 'admin' ? '全校調代課審核中心' : '我的調代課申請紀錄'}
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={filterTeacherId}
              onChange={(e) => setFilterTeacherId(e.target.value)}
              className="bg-white border border-gray-300 text-sm rounded-lg px-3 py-1.5 focus:ring-indigo-500 font-medium"
            >
              <option value="">顯示全部紀錄</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  篩選：{t.name} 老師
                </option>
              ))}
            </select>
            {filterTeacherId && userRole === 'admin' && (
              <button
                onClick={handleSendBulkEmail}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2"
              >
                <Mail className="w-4 h-4" /> 寄送總表
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm font-bold hover:bg-gray-700 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> 列印表格
            </button>
          </div>
        </div>

        <div className="overflow-x-auto p-4">
          {displayRequests.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-medium">
              目前沒有任何申請紀錄。
            </div>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 border-b print:bg-gray-200 print:text-black">
                  <th className="p-3 font-semibold">單號</th>
                  <th className="p-3 font-semibold">日期</th>
                  <th className="p-3 font-semibold">申請人</th>
                  <th className="p-3 font-semibold">類型</th>
                  <th className="p-3 font-semibold">原定課堂</th>
                  <th className="p-3 font-semibold">對象老師</th>
                  <th className="p-3 font-semibold">事由</th>
                  <th className="p-3 font-semibold text-center">狀態</th>
                  <th className="p-3 font-semibold text-center print:hidden">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayRequests.map((req) => {
                  const requester =
                    teachers.find((t) => t.id === req.requesterId)?.name ||
                    '未知';
                  const target =
                    teachers.find((t) => t.id === req.targetTeacherId)?.name ||
                    '未知';
                  const lesson = lessons.find((l) => l.id === req.lessonId);
                  const className =
                    classes.find((c) => c.id === lesson?.classId)?.name ||
                    '未知班級';
                  const lessonTime = lesson
                    ? `${DAYS[lesson.day - 1]} 第${
                        lesson.period
                      }節 (${className})`
                    : '未知課堂';

                  const targetLesson = req.targetLessonId
                    ? lessons.find((l) => l.id === req.targetLessonId)
                    : null;
                  const targetClassName = targetLesson
                    ? classes.find((c) => c.id === targetLesson.classId)
                        ?.name || targetLesson.classId
                    : '';
                  const swapDateStr = req.targetSwapDate
                    ? `[${req.targetSwapDate}] `
                    : '';
                  const targetLessonTime = targetLesson
                    ? `${swapDateStr}${DAYS[targetLesson.day - 1]} 第${
                        targetLesson.period
                      }節 (${targetClassName})`
                    : '';

                  return (
                    <tr
                      key={req.id}
                      className="border-b hover:bg-gray-50 print:border-black"
                    >
                      <td className="p-3 text-gray-500 font-mono text-xs">
                        {req.id}
                      </td>
                      <td className="p-3 font-bold text-blue-700">
                        {req.targetDate || '-'}
                      </td>
                      <td className="p-3 font-bold text-gray-800">
                        {requester}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            req.type === 'sub'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {req.type === 'sub' ? '代課' : '調課'}
                        </span>
                      </td>
                      <td className="p-3">{lessonTime}</td>
                      <td className="p-3 font-bold text-indigo-700">
                        {target}
                        {req.type === 'swap' && targetLessonTime && (
                          <div className="text-xs font-normal text-purple-600 mt-1">
                            互換: {targetLessonTime}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-gray-600">{req.reason}</td>
                      <td className="p-3 text-center">
                        {req.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-100 px-2 py-1 rounded-full text-xs font-bold">
                            <Clock className="w-3 h-3" />
                            審核中
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs font-bold">
                            <Check className="w-3 h-3" />
                            已核准
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs font-bold">
                            <X className="w-3 h-3" />
                            已退回
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center print:hidden">
                        <div className="flex justify-center gap-1">
                          {userRole === 'admin' && req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAction(req.id, 'approved')}
                                className="px-2 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded text-xs font-bold border border-green-200"
                              >
                                核准
                              </button>
                              <button
                                onClick={() => handleAction(req.id, 'rejected')}
                                className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-bold border border-red-200"
                              >
                                退回
                              </button>
                            </>
                          )}
                          {userRole === 'teacher' &&
                            req.requesterId === loggedTeacherId &&
                            req.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => setEditRequestData(req)}
                                  className="px-2 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-xs font-bold border border-indigo-200 flex items-center gap-1"
                                >
                                  <Edit className="w-3 h-3" />
                                  修改
                                </button>
                                <button
                                  onClick={() => {
                                    setRequests(
                                      requests.filter((r) => r.id !== req.id)
                                    );
                                    showMessage(
                                      'success',
                                      '🗑️ 申請紀錄已撤銷刪除'
                                    );
                                  }}
                                  className="px-2 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded text-xs font-bold border border-gray-200 flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  刪除
                                </button>
                              </>
                            )}
                          {userRole === 'admin' && (
                            <button
                              onClick={() => handleSendEmail(req)}
                              className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-bold border border-blue-200 flex items-center gap-1"
                              title="寄送 Gmail 通知"
                            >
                              <Mail className="w-3 h-3" /> 通知
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
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-sm text-center border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="border-b border-r p-3 w-24 text-gray-500 font-medium bg-gray-100">
                節次
              </th>
              {DAYS.map((day, idx) => (
                <th
                  key={idx}
                  className="border-b p-3 font-semibold text-gray-700 w-[18%]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period, periodIdx) => {
              if (period.isBreak) {
                return (
                  <tr key="break" className="bg-green-50/50">
                    <td className="border-r border-b p-2 font-medium text-green-700 bg-green-100/30">
                      {period.name}
                    </td>
                    <td
                      colSpan={5}
                      className="border-b p-2 text-green-600/70 tracking-widest text-xs"
                    >
                      休息時間
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={period.id}
                  className={
                    period.isTutor ? 'bg-amber-50/30' : 'hover:bg-gray-50/50'
                  }
                >
                  <td className="border-r border-b p-2 bg-gray-50/50">
                    <div className="font-bold text-gray-700">{period.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {period.time}
                    </div>
                  </td>

                  {DAYS.map((_, dayIdx) => {
                    const dayNum = dayIdx + 1;

                    if (
                      isEditing &&
                      viewMode === 'class' &&
                      userRole === 'admin'
                    ) {
                      const tIndex = dayIdx * 100 + periodIdx + 1;
                      return (
                        <td
                          key={dayIdx}
                          className="border-b border-l border-gray-100 p-1 relative h-20 bg-blue-50/20"
                        >
                          <input
                            type="text"
                            tabIndex={tIndex}
                            className="w-full h-full p-2 text-center text-sm font-bold border-2 border-dashed border-gray-300 focus:border-solid focus:border-blue-500 focus:outline-none focus:bg-yellow-50 rounded-lg text-blue-800 transition-all placeholder:text-gray-300 placeholder:font-normal"
                            placeholder="例: 國文 王品文"
                            value={
                              editData[`${dayNum}_${period.id}`] !== undefined
                                ? editData[`${dayNum}_${period.id}`]
                                : ''
                            }
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                [`${dayNum}_${period.id}`]: e.target.value,
                              })
                            }
                          />
                        </td>
                      );
                    }

                    const lesson = lessons.find((l) => {
                      if (viewMode === 'class')
                        return (
                          l.classId === selectedClass &&
                          l.day === dayNum &&
                          l.period === period.id
                        );
                      if (viewMode === 'teacher')
                        return (
                          l.teacherId === selectedTeacher &&
                          l.day === dayNum &&
                          l.period === period.id
                        );
                      return false;
                    });

                    const teacherName = lesson
                      ? teachers.find((t) => t.id === lesson.teacherId)?.name ||
                        '未知'
                      : '';
                    const className = lesson
                      ? classes.find((c) => c.id === lesson.classId)?.name ||
                        lesson.classId
                      : '';

                    const isMyOwnSchedule =
                      userRole === 'teacher' &&
                      viewMode === 'teacher' &&
                      selectedTeacher === loggedTeacherId;

                    return (
                      <td
                        key={dayIdx}
                        className="border-b border-l border-gray-100 p-2 relative h-20 group"
                      >
                        {lesson ? (
                          <div
                            onClick={() => {
                              if (isMyOwnSchedule)
                                setRequestTargetLesson({
                                  lesson,
                                  day: dayNum,
                                  period: period.id,
                                });
                            }}
                            className={`h-full flex flex-col items-center justify-center rounded-lg p-2 
                              ${
                                period.isTutor
                                  ? 'bg-amber-100/50 border border-amber-200'
                                  : 'bg-blue-50 border border-blue-100'
                              } 
                              shadow-sm relative transition-all group-hover:shadow-md
                              ${
                                isMyOwnSchedule
                                  ? 'cursor-pointer hover:bg-indigo-100 hover:border-indigo-300 ring-2 ring-transparent hover:ring-indigo-200'
                                  : ''
                              }
                            `}
                          >
                            {viewMode === 'class' ? (
                              <>
                                <div className="font-bold text-blue-900 mb-1">
                                  {lesson.subject}
                                </div>
                                <button
                                  onClick={() =>
                                    jumpToTeacher(lesson.teacherId)
                                  }
                                  className="text-xs bg-white text-blue-600 px-2 py-1 rounded-md shadow-sm hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1 w-full justify-center"
                                >
                                  <User className="w-3 h-3" /> {teacherName}
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="font-bold text-blue-900 mb-1">
                                  {className}
                                </div>
                                <div className="flex gap-1 w-full relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      jumpToClass(lesson.classId);
                                    }}
                                    className="text-xs bg-white text-blue-600 px-1 py-1 rounded-md shadow-sm hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1 flex-1 justify-center z-10"
                                  >
                                    <BookOpen className="w-3 h-3" />{' '}
                                    {lesson.subject}
                                  </button>
                                </div>
                                {isMyOwnSchedule && (
                                  <div className="absolute inset-0 bg-indigo-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-xs transition-opacity pointer-events-none">
                                    申請調/代課
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-200 text-xs">
                            -
                          </div>
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-10">
      <header className="bg-white shadow-sm sticky top-0 z-10 print:hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xl">
              <Calendar className="w-6 h-6" />
              <span>智慧課表暨調代課系統</span>
              {userRole === 'admin' && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">
                  管理者
                </span>
              )}
              {userRole === 'teacher' && (
                <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full border border-indigo-200">
                  教師登入
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <nav className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => {
                    setActiveTab('schedule');
                    setViewMode('class');
                    setIsEditing(false);
                  }}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'schedule' && viewMode === 'class'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4 inline-block mr-1 -mt-1" /> 班級課表
                </button>
                <button
                  onClick={() => {
                    setActiveTab('schedule');
                    setViewMode('teacher');
                    setIsEditing(false);
                  }}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'schedule' && viewMode === 'teacher'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <User className="w-4 h-4 inline-block mr-1 -mt-1" /> 教師課表
                </button>

                {(userRole === 'admin' || userRole === 'teacher') && (
                  <button
                    onClick={() => {
                      setActiveTab('requests');
                      setIsEditing(false);
                    }}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                      activeTab === 'requests'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    {userRole === 'admin' ? '審核中心' : '我的申請'}
                    {userRole === 'admin' &&
                      requests.filter((r) => r.status === 'pending').length >
                        0 && (
                        <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          {
                            requests.filter((r) => r.status === 'pending')
                              .length
                          }
                        </span>
                      )}
                  </button>
                )}
              </nav>

              <button
                onClick={() =>
                  userRole !== 'guest'
                    ? handleLogout()
                    : setShowLoginModal(true)
                }
                className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                  userRole !== 'guest'
                    ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                    : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                }`}
              >
                {userRole !== 'guest' ? (
                  <>
                    <Unlock className="w-4 h-4" /> 登出
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> 教師登入
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 print:p-0 print:m-0">
        <div className="space-y-6 animate-in fade-in duration-300">
          {}
          {importStatus.message && (
            <div
              className={`print:hidden border px-4 py-3 rounded-lg flex items-center gap-2 font-bold shadow-sm ${
                importStatus.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" /> {importStatus.message}
            </div>
          )}

          {activeTab === 'requests' ? (
            renderRequestsView()
          ) : (
            <>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-medium">當前檢視：</span>
                  {viewMode === 'class' ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedClass}
                        onChange={(e) => {
                          setSelectedClass(e.target.value);
                          setIsEditing(false);
                        }}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block p-2.5 font-semibold focus:ring-blue-500 focus:border-blue-500"
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>

                      {userRole === 'admin' && (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={() => setShowAddClassModal(true)}
                            className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors shadow-sm flex items-center gap-1 text-sm font-bold"
                            title="新增班級"
                          >
                            <Plus className="w-4 h-4" /> 新增
                          </button>
                          {classes.length > 0 && (
                            <button
                              onClick={() => {
                                setClassToDelete(selectedClass);
                                setShowDeleteClassModal(true);
                              }}
                              className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors shadow-sm flex items-center gap-1 text-sm font-bold"
                              title="刪除當前班級"
                            >
                              <Trash2 className="w-4 h-4" /> 刪除
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 animate-in fade-in duration-300">
                      <select
                        value={teacherSortMode}
                        onChange={(e) => setTeacherSortMode(e.target.value)}
                        className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg block p-2.5 font-medium focus:ring-blue-500 focus:border-blue-500 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <option value="default">預設排序</option>
                        <option value="subject">依科目排序</option>
                        <option value="class">依任課班級</option>
                        <option value="name">依姓名筆畫</option>
                      </select>
                      <select
                        value={selectedTeacher}
                        onChange={(e) => setSelectedTeacher(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block p-2.5 font-semibold focus:ring-blue-500 focus:border-blue-500 shadow-sm cursor-pointer"
                      >
                        {sortedTeachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.subject})
                          </option>
                        ))}
                      </select>
                      {userRole === 'teacher' &&
                        selectedTeacher === loggedTeacherId && (
                          <span className="ml-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded flex items-center gap-1">
                            <User className="w-3 h-3" /> 我的專屬課表
                          </span>
                        )}
                      {userRole === 'teacher' &&
                        selectedTeacher !== loggedTeacherId && (
                          <button
                            onClick={() => setSelectedTeacher(loggedTeacherId)}
                            className="ml-2 text-xs font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <User className="w-3 h-3" /> 返回我的課表
                          </button>
                        )}
                    </div>
                  )}
                </div>

                {viewMode === 'class' &&
                  userRole === 'admin' &&
                  (isEditing ? (
                    <div className="flex gap-2 animate-in slide-in-from-right-4">
                      <span className="text-xs text-gray-400 self-center mr-2 hidden md:inline">
                        💡 提示：按 Tab 鍵可跳下一格
                      </span>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={saveEditing}
                        className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" /> 儲存課表
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowClearClassModal(true)}
                        className="px-4 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-orange-100 transition-colors"
                      >
                        <Eraser className="w-4 h-4" /> 清空本班
                      </button>
                      <button
                        onClick={() => setShowClearAllModal(true)}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> 清空全部
                      </button>
                      <div className="w-px bg-gray-300 mx-1 h-6 self-center"></div>
                      <button
                        onClick={() => setShowImportModal(true)}
                        className="px-5 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-100 transition-colors shadow-sm"
                      >
                        <Upload className="w-4 h-4" /> 匯入 CSV 課表
                      </button>
                      <button
                        onClick={startEditing}
                        className="px-5 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-100 transition-colors shadow-sm"
                      >
                        <Edit className="w-4 h-4" /> 快速編輯本班
                      </button>
                    </div>
                  ))}
              </div>
              {renderSchedule()}
            </>
          )}
        </div>
      </main>

      {}
      {requestTargetLesson && (
        <RequestModal
          data={requestTargetLesson}
          onClose={() => setRequestTargetLesson(null)}
        />
      )}
      {editRequestData && (
        <RequestModal
          editReq={editRequestData}
          onClose={() => setEditRequestData(null)}
        />
      )}

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Lock className="w-5 h-5" /> 教師登入
              </h3>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setAdminPassword('');
                  setTeacherPassword('');
                }}
                className="hover:bg-blue-700 p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" /> 教師登入
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  請選擇您的姓名並輸入密碼進行身分驗證。
                </p>
                <div className="flex flex-col gap-2">
                  <select
                    value={selectedLoginTeacher}
                    onChange={(e) => setSelectedLoginTeacher(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.subject})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleTeacherLogin()
                      }
                      placeholder="請輸入密碼"
                      className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500"
                    />
                    <button
                      onClick={handleTeacherLogin}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"
                    >
                      登入
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative flex py-2 items-center mb-6">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">
                  或
                </span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500" /> 管理者登入
                </h4>
                <div className="relative mb-4">
                  <Key className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                    className="w-full border border-gray-300 rounded-lg pl-10 p-2.5 text-sm focus:ring-blue-500"
                    placeholder="請輸入管理者密碼"
                  />
                </div>
                <button
                  onClick={handleAdminLogin}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm"
                >
                  管理者登入
                </button>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setAdminPassword('');
                    setTeacherPassword('');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-800 underline"
                >
                  取消並以訪客繼續
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddClassModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">新增班級</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  班級代號 (例: 705)
                </label>
                <input
                  type="text"
                  value={newClassId}
                  onChange={(e) => setNewClassId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="輸入班級代號"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  顯示名稱 (例: 7年05班)
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="輸入顯示名稱"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddClassModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleAddClass}
                disabled={!newClassId || !newClassName}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                確認新增
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearClassModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border-t-4 border-orange-500">
            <h3 className="text-lg font-bold text-orange-600 mb-2">
              確認清空本班課表？
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              您即將清空{' '}
              <span className="font-bold">
                {classes.find((c) => c.id === selectedClass)?.name}
              </span>{' '}
              的所有課表資料。此操作無法復原。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowClearClassModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={executeClearClass}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600"
              >
                確認清空
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearAllModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border-t-4 border-red-600">
            <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              危險：清空全校課表？
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              您即將刪除{' '}
              <strong className="text-red-600">所有班級與教師的課表排程</strong>
              ！此操作絕對無法復原。確定要繼續嗎？
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200"
              >
                取消返回
              </button>
              <button
                onClick={executeClearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
              >
                確定全部刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteClassModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5">
            <h3 className="text-lg font-bold text-red-600 mb-2">
              警告：確認刪除班級？
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              您即將刪除{' '}
              <span className="font-bold">
                {classes.find((c) => c.id === classToDelete)?.name}
              </span>
              ，並清空其排課紀錄。確定嗎？
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteClassModal(false);
                  setClassToDelete(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={executeDeleteClass}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-purple-700 mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5" /> 批次匯入 CSV 課表
            </h3>
            <div className="text-sm text-gray-600 space-y-3 mb-6 bg-purple-50 p-3 rounded-lg border border-purple-100">
              <p>
                請整理您的 Excel 檔案，確保包含以下 <strong>5個直欄</strong>{' '}
                (第一行必須是這五個標題)：
              </p>
              <ul className="list-disc pl-5 font-mono text-purple-800 font-bold space-y-1">
                <li>班級 (例: 701 或 7年01班)</li>
                <li>老師 (例: 王品文)</li>
                <li>科目 (例: 國文)</li>
                <li>星期 (只能填寫數字 1~5)</li>
                <li>節次 (只能填寫數字 1~8)</li>
              </ul>
              <p className="text-xs text-red-600 font-bold mt-2">
                ※ 重要提示：請在 Excel 中點選「另存新檔」，檔案格式選擇「CSV
                UTF-8 (逗號分隔)」，然後上傳該檔案。
              </p>
            </div>

            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                  const text = evt.target.result;
                  const lines = text
                    .split('\n')
                    .filter((line) => line.trim() !== '');
                  if (lines.length < 2) {
                    showMessage('error', '檔案內容空白或格式不符');
                    return;
                  }

                  let newClassesMap = new Map();
                  let newTeachersMap = new Map();
                  let parsedLessons = [];

                  // 保留現有資料
                  classes.forEach((c) => newClassesMap.set(c.name, c));
                  teachers.forEach((t) => newTeachersMap.set(t.name, t));

                  // 解析 CSV
                  for (let i = 1; i < lines.length; i++) {
                    const row = lines[i].split(',').map((item) => item.trim());
                    if (row.length < 5) continue;

                    const [cName, tName, subject, dStr, pStr] = row;
                    if (!cName || !tName || !dStr || !pStr) continue;

                    // 處理班級 ID
                    let cId = cName.replace(/\D/g, '');
                    if (!cId) cId = `C_${Math.floor(Math.random() * 1000)}`;
                    if (!newClassesMap.has(cName)) {
                      newClassesMap.set(cName, { id: cId, name: cName });
                    } else {
                      cId = newClassesMap.get(cName).id;
                    }

                    // 處理老師 ID
                    let tId = '';
                    if (!newTeachersMap.has(tName)) {
                      tId = `T${Math.floor(Math.random() * 10000)}`;
                      newTeachersMap.set(tName, {
                        id: tId,
                        name: tName,
                        subject: subject,
                      });
                    } else {
                      tId = newTeachersMap.get(tName).id;
                    }

                    const day = parseInt(dStr);
                    const period = isNaN(parseInt(pStr))
                      ? pStr
                      : parseInt(pStr);

                    parsedLessons.push({
                      id: `IMP_${Date.now()}_${i}`,
                      classId: cId,
                      teacherId: tId,
                      subject: subject,
                      day: day,
                      period: period,
                    });
                  }

                  if (parsedLessons.length > 0) {
                    setClasses(Array.from(newClassesMap.values()));
                    setTeachers(Array.from(newTeachersMap.values()));
                    setLessons([...lessons, ...parsedLessons]);
                    setShowImportModal(false);
                    showMessage(
                      'success',
                      `✅ 成功匯入 ${parsedLessons.length} 堂課表！班級與教師清單已自動更新。`
                    );
                  } else {
                    showMessage('error', '❌ 解析失敗，請確認欄位格式是否正確');
                  }
                };
                reader.readAsText(file);
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer"
            />

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
