// Moved from index.html
// Simple client-only social app using localStorage
// Data model in localStorage keys: "ss_users" (array), "ss_current" (username), "ss_posts" (array)

// ----------------- Utilities -----------------
const qs = s => document.querySelector(s);
const el = (tag, attrs={}, ...children) => {const e=document.createElement(tag);for(let k in attrs) e.setAttribute(k,attrs[k]); children.forEach(c=>{ if(typeof c==='string') e.appendChild(document.createTextNode(c)); else if(c) e.appendChild(c)}); return e}

function loadJSON(key, fallback){try{const v=localStorage.getItem(key); return v?JSON.parse(v):fallback}catch(e){return fallback}}
function saveJSON(key,val){localStorage.setItem(key,JSON.stringify(val))}

// ----------------- App state -----------------
let users = loadJSON('ss_users', []);
let posts = loadJSON('ss_posts', []);
let current = localStorage.getItem('ss_current') || null;

// ----------------- Auth -----------------
function openModal(html){const root=qs('#modal-root');root.innerHTML='';root.style.display='flex';const overlay=el('div',{class:'overlay'});overlay.addEventListener('click', e=>{ if(e.target===overlay){root.style.display='none'} });
  const modal = el('div',{class:'modal'}); modal.appendChild(html); overlay.appendChild(modal); root.appendChild(overlay);
}

function showLogin(){
  const form = el('div',{}, el('h3',{}, 'Login'),
    el('input',{type:'text',placeholder:'username',id:'login-username'}),
    el('input',{type:'password',placeholder:'password',id:'login-password'}),
    el('div',{}, el('button',{class:'primary',id:'do-login'}, 'Login'), el('button',{id:'open-register', style:'margin-left:8px'}, 'Register'))
  );
  openModal(form);
  qs('#do-login').addEventListener('click', ()=>{
    const u=qs('#login-username').value.trim(); const p=qs('#login-password').value;
    const user = users.find(x=>x.username===u && x.password===p);
    if(!user){alert('Invalid credentials'); return}
    current = u; localStorage.setItem('ss_current', current); renderApp(); qs('#modal-root').style.display='none';
  });
  qs('#open-register').addEventListener('click', ()=>{qs('#modal-root').style.display='none'; showRegister()});
}

function showRegister(){
  const form = el('div',{}, el('h3',{}, 'Register'),
    el('input',{type:'text',placeholder:'username',id:'reg-username'}),
    el('input',{type:'email',placeholder:'email',id:'reg-email'}),
    el('input',{type:'password',placeholder:'password',id:'reg-password'}),
    el('div',{}, el('button',{class:'primary',id:'do-register'}, 'Create account'))
  );
  openModal(form);
  qs('#do-register').addEventListener('click', ()=>{
    const u=qs('#reg-username').value.trim();const e=qs('#reg-email').value.trim();const p=qs('#reg-password').value;
    if(!u||!p){alert('Provide username and password');return}
    if(users.find(x=>x.username===u)){alert('Username taken');return}
    users.push({username:u,email:e,password:p,joined:new Date().toISOString()}); saveJSON('ss_users',users);
    current = u; localStorage.setItem('ss_current', current); renderApp(); qs('#modal-root').style.display='none';
  });
}

function logout(){current=null;localStorage.removeItem('ss_current');renderApp();}

// ----------------- Posts -----------------
function createPost(text, fileData, fileName, fileType){
  if(!current){alert('Please login first'); return}
  posts.unshift({
    id:Date.now(),
    author:current,
    content:text,
    created:new Date().toISOString(),
    likes:0,
    fileData:fileData||null,
    fileName:fileName||null,
    fileType:fileType||null
  });
  saveJSON('ss_posts',posts);
  renderApp(); // Ensure full app re-render after posting
}

function deletePost(id){posts = posts.filter(p=>p.id!==id); saveJSON('ss_posts',posts); renderFeed();}

function toggleLike(id){posts = posts.map(p=> p.id===id ? {...p, likes: p._likedBy && p._likedBy.includes(current) ? p.likes-1 : p.likes+1, _likedBy: (p._likedBy||[]).slice() } : p);
  // simple per-client like tracking
  posts = posts.map(p=>{ if(p.id===id){ p._likedBy = p._likedBy || []; const idx=p._likedBy.indexOf(current); if(idx===-1){p._likedBy.push(current)} else {p._likedBy.splice(idx,1)} p.likes = p._likedBy.length} return p});
  saveJSON('ss_posts',posts); renderFeed();
}

// ----------------- Rendering -----------------
function renderTopActions(){const ta = qs('#top-actions'); ta.innerHTML='';
  if(current){ const user = users.find(u=>u.username===current) || {username:current};
    ta.appendChild(el('div',{}, el('span',{}, 'Hi, '+user.username)));
    const btn = el('button',{class:'primary',id:'logout-btn'}, 'Logout');
    btn.addEventListener('click', logout); ta.appendChild(btn);
  } else {
    const btn1 = el('button',{id:'open-login'}, 'Login'); btn1.addEventListener('click', showLogin); ta.appendChild(btn1);
    const btn2 = el('button',{class:'primary',id:'open-register-top'}, 'Register'); btn2.addEventListener('click', showRegister); ta.appendChild(btn2);
  }
}

function renderLeftCard(){
  const left=qs('#left-card'); left.innerHTML='';
  if(current){
    const user = users.find(u=>u.username===current) || {username:current};
    // Profile photo
    let avatarContent;
    if(user.photo){
      avatarContent = el('img', {src:user.photo, alt:'Profile', style:'width:56px;height:56px;border-radius:50%;object-fit:cover;'});
    } else {
      avatarContent = user.username.charAt(0).toUpperCase();
    }
    const profile = el('div',{class:'profile'},
      el('div',{class:'avatar'}, avatarContent),
      el('div',{},
        el('div',{}, user.username),
        el('div',{class:'muted small'}, user.email || '—')
      )
    );
    left.appendChild(profile);
    left.appendChild(el('div',{style:'height:10px'}));
    left.appendChild(el('div',{}, el('button',{id:'edit-profile'}, 'Edit Profile'), el('button',{class:'btn-ghost', id:'my-posts', style:'margin-left:8px'}, 'My Posts')));
    qs('#edit-profile').addEventListener('click', ()=>{
      // Edit profile modal with photo upload
      const f = el('div',{},
        el('h3',{},'Edit Profile'),
        el('input',{type:'text',id:'ep-name', value:user.username}),
        el('input',{type:'email',id:'ep-email', value:user.email||''}),
        el('input',{type:'file',id:'ep-photo',accept:'image/*'}),
        el('div',{}, el('button',{class:'primary',id:'save-ep'}, 'Save'))
      );
      openModal(f);
      let photoData = user.photo || null;
      qs('#ep-photo').addEventListener('change', e => {
        const file = e.target.files[0];
        if(file){
          const reader = new FileReader();
          reader.onload = function(evt){ photoData = evt.target.result; };
          reader.readAsDataURL(file);
        }
      });
      qs('#save-ep').addEventListener('click', ()=>{
        const nu=qs('#ep-name').value.trim(); const ne=qs('#ep-email').value.trim(); if(!nu){alert('Username required');return}
        // update user
        users = users.map(u=> u.username===user.username ? {...u, username:nu, email:ne, photo:photoData} : u);
        saveJSON('ss_users',users);
        // update posts author names as well
        posts = posts.map(p=> p.author===user.username ? {...p, author:nu} : p); saveJSON('ss_posts',posts);
        if(current===user.username) current = nu; localStorage.setItem('ss_current', current);
        qs('#modal-root').style.display='none'; renderApp();
      })
    });

  } else {
    left.appendChild(el('div',{}, el('h3',{},'Welcome!'), el('div',{class:'muted'}, 'Please login or register to post and like.')));
  }
}

function renderComposer(){
  const c=qs('#composer-area'); c.innerHTML='';
  if(current){
    const area = el('div',{class:'composer'},
      el('textarea',{id:'post-text',placeholder:'What\'s happening?'}),
      el('input',{type:'file',id:'file-upload',accept:'image/*,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx'}),
      el('div',{}, el('button',{class:'primary',id:'post-btn'}, 'Post'))
    );
    c.appendChild(area);
    let fileData = null, fileName = null, fileType = null, fileLoading = false;
    const postBtn = qs('#post-btn');
    const fileInput = qs('#file-upload');
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if(file){
        fileName = file.name;
        fileType = file.type;
        fileLoading = true;
        postBtn.disabled = true;
        const reader = new FileReader();
        reader.onload = function(evt){
          fileData = evt.target.result;
          fileLoading = false;
          postBtn.disabled = false;
        };
        reader.onerror = function(){
          alert('Error reading file');
          fileData = null; fileName = null; fileType = null; fileLoading = false;
          postBtn.disabled = false;
        };
        reader.readAsDataURL(file);
      } else {
        fileData = null; fileName = null; fileType = null; fileLoading = false;
        postBtn.disabled = false;
      }
    });
    postBtn.addEventListener('click', ()=>{
      const text=qs('#post-text').value.trim();
      if(fileLoading){alert('Please wait for the file to finish loading.');return;}
      if(!text && !fileData){alert('Write something or select a file');return}
      createPost(text, fileData, fileName, fileType);
      qs('#post-text').value='';
      fileInput.value='';
      fileData = null; fileName = null; fileType = null; fileLoading = false;
      postBtn.disabled = false;
    });
  } else {
    c.appendChild(el('div',{}, el('h3',{},'Join the conversation'), el('div',{class:'muted'}, 'Login or register to share posts.')));
  }
}

function renderFeed(){
  const f=qs('#feed'); f.innerHTML='';
  if(posts.length===0){ f.appendChild(el('div',{class:'card'}, el('div',{}, 'No posts yet — be the first!'))); return }
  posts.forEach(p=>{
    const post = el('div',{class:'post'});
    const meta = el('div',{class:'meta'}, el('div',{}, el('strong',{}, p.author||'unknown'), el('span',{class:'muted small', style:'margin-left:8px'}, new Date(p.created).toLocaleString())), el('div',{}, p.author===current? el('button',{class:'btn-ghost',title:'delete', 'data-id':p.id}, 'Delete') : el('span',{}, '')) );
    post.appendChild(meta);
    post.appendChild(el('div',{class:'content'}, p.content));
    // File preview
    if(p.fileData && p.fileName){
      let preview;
      if(p.fileType && p.fileType.startsWith('image/')){
        preview = el('div',{}, el('img',{src:p.fileData, alt:p.fileName, style:'max-width:200px;max-height:200px;border-radius:8px;margin-top:8px'}));
      } else {
        preview = el('div',{}, el('a',{href:p.fileData, download:p.fileName, target:'_blank', style:'margin-top:8px;display:inline-block'}, `Download: ${p.fileName}`));
      }
      post.appendChild(preview);
    }
    const actions = el('div',{style:'margin-top:8px;display:flex;gap:8px;align-items:center'},
      el('button',{class:'btn-ghost', 'data-like':p.id}, '❤️ '+(p.likes||0)),
      el('button',{class:'btn-ghost', 'data-share':p.id}, 'Share')
    );
    post.appendChild(actions);
    f.appendChild(post);
  });

  // attach event listeners
  f.querySelectorAll('[data-like]').forEach(btn=>{btn.addEventListener('click', e=>{const id=Number(btn.getAttribute('data-like')); if(!current){alert('Login to like');return} toggleLike(id)})});
  f.querySelectorAll('[data-share]').forEach(btn=>{btn.addEventListener('click', ()=>{navigator.clipboard?.writeText(window.location.href + '#post-' + btn.getAttribute('data-share')).then(()=>alert('Post link copied to clipboard'), ()=>alert('Could not copy'))})});
  f.querySelectorAll('[data-id]').forEach(btn=>{btn.addEventListener('click', ()=>{ if(confirm('Delete this post?')) deletePost(Number(btn.getAttribute('data-id'))); })});
}

function renderApp(){ renderTopActions(); renderLeftCard(); renderComposer(); renderFeed(); }

// first time sample content if empty
if(posts.length===0){ posts = [{id:1,author:'Admin',content:'Welcome to Simple Social! Create an account and post something.',created:new Date().toISOString(),likes:0}]; saveJSON('ss_posts',posts)}
renderApp();

// expose debug functions to console
window.SS = {users, posts, current, save(){saveJSON('ss_posts',posts); saveJSON('ss_users',users); localStorage.setItem('ss_current', current||'')}}
