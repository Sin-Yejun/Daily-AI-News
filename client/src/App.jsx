import { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  Folder, FileText, Search, Menu, ChevronRight, BookOpen,
  GraduationCap, Newspaper, Zap, LayoutGrid, ArrowRight, Clock
} from 'lucide-react';
import './index.css';

function App() {
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/folders')
      .then(res => res.json())
      .then(data => setFolders(data))
      .catch(err => console.error("Error loading folders:", err));
  }, []);

  const selectFolder = (folderName) => {
    setCurrentFolder(folderName);
    setSearchQuery('');
    setSidebarOpen(false);
    // Clear content temporarily while loading new folder
    setContent('');
    setCurrentFile(null);

    fetch(`/api/files/${encodeURIComponent(folderName)}`)
      .then(res => res.json())
      .then(data => {
        setFiles(data);
        // Auto-load the first file if exists
        if (data && data.length > 0) {
          loadFile(data[0], folderName);
        }
      })
      .catch(err => console.error("Error loading files:", err));
  };

  // Modified to optionally accept folderName (because state update might be async)
  const loadFile = (filename, folderName = currentFolder) => {
    if (!folderName) return; 
    
    setCurrentFile(filename);
    setSidebarOpen(false);
    fetch(`/api/content/${encodeURIComponent(folderName)}/${encodeURIComponent(filename)}`)
      .then(res => res.json())
      .then(data => {
        setContent(data.content);
      })
      .catch(err => console.error("Error loading content:", err));
  };

  const formatDisplayName = (filename) => {
    const stem = filename.replace(".md", "");
    const regex = /^(\d{4})-(\d{2})-(\d{2})-(\d{2}:\d{2}:\d{2})$/;
    const match = stem.match(regex);
    
    if (match) {
      const [_, year, month, day, time] = match;
      const date = new Date(`${year}-${month}-${day}T${time}`);
      if (!isNaN(date.getTime())) {
        const days = ["일", "월", "화", "수", "목", "금", "토"];
        const dayOfWeek = days[date.getDay()];
        const timeShort = time.substring(0, 5); 
        return {
           full: `${year}년 ${month}월 ${day}일`,
           meta: `${dayOfWeek}요일 ${timeShort}`,
           isDate: true
        };
      }
    }
    return { full: stem, isDate: false };
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전 업데이트`;
    if (diffHour < 24) return `${diffHour}시간 전 업데이트`;
    if (diffDay < 7) return `${diffDay}일 전 업데이트`;
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일 업데이트`;
  };

  const getFolderIcon = (name) => {
    if (name.includes('논문')) return <GraduationCap size={24} />;
    if (name.includes('뉴스레터')) return <Newspaper size={24} />;
    if (name.includes('프로덕트')) return <Zap size={24} />;
    return <Folder size={24} />;
  };
  
  const getFolderColor = (name) => {
    if (name.includes('논문')) return 'var(--accent-primary)';
    if (name.includes('뉴스레터')) return '#10b981'; // Emerald
    if (name.includes('프로덕트')) return '#f59e0b'; // Amber
    return 'var(--text-muted)';
  };

  const filteredFiles = files.filter(file => 
    file.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMarkdownHtml = () => {
    if (!content) return { __html: '' };
    
    const renderer = new marked.Renderer();
    renderer.image = function({href, title, text}) {
        let cleanHref = href;
        if (cleanHref && !cleanHref.startsWith('http') && !cleanHref.startsWith('/') && !cleanHref.startsWith('data:')) {
           cleanHref = `${currentFolder}/${cleanHref}`;
        }
        return `<img src="${cleanHref}" alt="${text || ''}" title="${title || ''}" />`;
    };

    const rawHtml = marked.parse(content, { renderer });
    return { __html: DOMPurify.sanitize(rawHtml) };
  };

  // Dashboard View Component
  const Dashboard = () => (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={22} />
        </button>
        <h1>Welcome Back</h1>
        <p>오늘의 인사이트를 확인해 보세요.</p>
      </div>
      <div className="cards-grid">
        {folders.map(folder => {
          const relTime = getRelativeTime(folder.latestDate);
          return (
            <button
              key={folder.name}
              className="folder-card"
              onClick={() => selectFolder(folder.name)}
              style={{ '--hover-color': getFolderColor(folder.name) }}
            >
              <div className="card-icon" style={{ color: getFolderColor(folder.name) }}>
                {getFolderIcon(folder.name)}
              </div>
              <div className="card-info">
                <h3>{folder.name}</h3>
                {relTime ? (
                  <p className="card-updated"><Clock size={13} />{relTime}</p>
                ) : (
                  <p>최신 {folder.name} 모아보기</p>
                )}
              </div>
              <div className="card-arrow">
                <ArrowRight size={20} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo-area" onClick={() => { setCurrentFolder(null); setSidebarOpen(false); }} style={{cursor: 'pointer'}}>
          <BookOpen size={24} className="logo-icon" />
          <div className="logo-text">Daily<span>News</span></div>
        </div>
        
        <div className="nav-group">
           <h3 className="nav-title">Collections</h3>
           <ul className="folder-list">
             {folders.map(f => (
               <li key={f.name}>
                 <button
                   className={`nav-item ${currentFolder === f.name ? 'active' : ''}`}
                   onClick={() => selectFolder(f.name)}
                 >
                   <div className="nav-icon-small" style={{ color: currentFolder === f.name ? getFolderColor(f.name) : '' }}>
                      {f.name.includes('논문') ? <GraduationCap size={18}/> :
                       f.name.includes('뉴스레터') ? <Newspaper size={18}/> :
                       f.name.includes('프로덕트') ? <Zap size={18}/> : <Folder size={18}/>}
                   </div>
                   <span>{f.name}</span>
                   {currentFolder === f.name && <ChevronRight size={16} className="active-indicator" />}
                 </button>
               </li>
             ))}
           </ul>
        </div>
        
        {currentFolder && (
          <div className="nav-group file-group">
             <h3 className="nav-title">Documents</h3>
             <div className="search-wrapper">
               <Search size={16} className="search-icon" />
               <input 
                 type="text" 
                 className="search-input" 
                 placeholder="Search..." 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
               />
             </div>
             
             <div className="file-list-wrapper">
                 <ul className="file-list">
                   {filteredFiles.map(file => {
                     const formatted = formatDisplayName(file);
                     return (
                       <li key={file}>
                         <button 
                           className={`file-item ${currentFile === file ? 'active' : ''}`}
                           onClick={() => loadFile(file)}
                         >
                           <div className="file-icon-wrapper">
                             <FileText size={16} />
                           </div>
                           <div className="file-info">
                             <span className="file-name">{formatted.full}</span>
                             {formatted.isDate && <span className="file-meta">{formatted.meta}</span>}
                           </div>
                         </button>
                       </li>
                     );
                   })}
                   {filteredFiles.length === 0 && <div className="empty-state-small">No files match</div>}
                 </ul>
             </div>
          </div>
        )}
      </nav>
      
      <main className="main-content">
        {!currentFolder ? (
          <Dashboard />
        ) : (
          <>
            <header className="content-header">
               <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
                 <Menu size={20} />
               </button>
               <div className="header-breadcrumbs">
                 <span className="crumb-folder">{currentFolder}</span>
                 {currentFile && (
                   <>
                     <ChevronRight size={14} className="crumb-divider" />
                     <span className="crumb-file">{currentFile.replace('.md', '')}</span>
                   </>
                 )}
               </div>
               <div className="header-actions">
                 {/* Future: Add Theme Toggle or Actions here */}
               </div>
            </header>
            
            <div className="scroll-area">
              {content ? (
                   <article className="markdown-body" dangerouslySetInnerHTML={getMarkdownHtml()} />
              ) : (
                   <div className="empty-state-main">
                      <div className="spinner">Loading...</div>
                   </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
