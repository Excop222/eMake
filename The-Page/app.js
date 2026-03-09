import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// --- ZONE 1: CONFIGURATION ---
const supabase = createClient('https://ymxyuvqunsbrghaggdzg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteHl1dnF1bnNicmdoYWdnZHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjI4NDgsImV4cCI6MjA4ODAzODg0OH0.RrvwdPPff9P5FMuMXFss1TPvA13T523CHu38jiqEEkY');
const app = document.getElementById('app');

// --- ZONE 2: STATE ---
let state = {
    user: null,
    currentPage: 0,
    postsPerPage: 5,
    isLoading: false // Add this
};

// --- ZONE 3: ROUTER ---
function router(view) {
    const nav = document.getElementById('bottom-nav');
    nav.style.display = (view === 'login' || view === 'signup' || view === 'upload') ? 'none' : 'flex';

    if (view === 'home') showHome();
    else if (view === 'upload') showUpload();
    else if (view === 'profile') showProfile(state.user.id);
    else if (view === 'login') showLogin();
    else if (view === 'signup') showSignup();

    setActiveNav(view); 
}

function setActiveNav(view) {
    document.querySelectorAll('#bottom-nav button svg').forEach(svg => {
        svg.setAttribute('stroke', '#1c1e21');
        svg.setAttribute('fill', 'none');
    });
    const map = { home: 'nav-home', upload: 'nav-upload', profile: 'nav-profile' };
    if (map[view]) {
        const svg = document.querySelector(`#${map[view]} svg`);
        if (svg) { svg.setAttribute('stroke', '#0866ff'); svg.setAttribute('fill', '#0866ff'); }
    }
}

// --- ZONE 4: HELPER ---
function showSpinner() {
    app.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh;">
            <div class="spinner"></div>
            <p style="color:#606770; margin-top:15px;">Processing...</p>
        </div>
    `;
}

// -------------------------------------------------------------------------
// --- ZONE 5: AUTHENTICATION VIEWS ---
// -------------------------------------------------------------------------

function showLogin() {
    app.innerHTML = `
        <div class="auth-card">
            <h1>eMake</h1>
            <input type="email" id="login-email" placeholder="Email address or WhatsApp">
            <input type="password" id="login-pass" placeholder="Password">
            <button class="login-btn" id="do-login">Log In</button>
            <p class="link-text">Forgotten password?</p>
            <div class="divider"></div>
            <button class="signup-btn" id="go-signup">Create New Account</button>
        </div>
    `;

    document.getElementById('go-signup').onclick = () => router('signup');
    
    document.getElementById('do-login').onclick = async () => {
    // 1. Get the button and inputs
    const btn = document.getElementById('do-login');
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;
    
    // 2. Change state to "loading"
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner" style="width:20px; height:20px; border-width:2px; display:inline-block; vertical-align:middle;"></div> Loading...`;
    
    // 3. Perform the login
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        alert(error.message);
        // Reset the button so they can try again
        btn.disabled = false;
        btn.innerHTML = "Log In";
    } else { 
        state.user = data.user; 
        router('home'); 
    }
};

}

// -------------------------------------------------------------------------

function showSignup() {
    app.innerHTML = `
        <div class="auth-card" style="max-width: 450px; text-align: left;">
            <h2 style="margin: 0; font-size: 28px;">Sign Up</h2>
            <div class="divider" style="margin: 10px 0;"></div>
            
            <input type="text" id="s-username" placeholder="eFootball Username">
            <div class="input-row">
                <input type="text" id="f-name" placeholder="First name">
                <input type="text" id="l-name" placeholder="Last name">
            </div>
            <input type="email" id="s-email" placeholder="Email address">
            <input type="number" id="s-whatsapp" placeholder="WhatsApp number">
            <input type="text" id="s-location" placeholder="Location">
            <input type="password" id="s-pass" placeholder="New password">
            
            <div class="label-text">Birthday</div>
            <div class="input-row">
                <select id="b-day">${Array.from({length: 31}, (_, i) => `<option>${i+1}</option>`).join('')}</select>
                <select id="b-month">
                    <option value="01">Jan</option><option value="02">Feb</option><option value="03">Mar</option>
                    <option value="04">Apr</option><option value="05">May</option><option value="06">Jun</option>
                    <option value="07">Jul</option><option value="08">Aug</option><option value="09">Sep</option>
                    <option value="10">Oct</option><option value="11">Nov</option><option value="12">Dec</option>
                </select>
                <select id="b-year">${Array.from({length: 50}, (_, i) => `<option>${2026-i}</option>`).join('')}</select>
            </div>
            
            <div style="text-align: center;">
                <button class="signup-btn" id="do-signup" style="width:100%;">Sign Up</button>
                <br>
                <p class="link-text" id="go-login" style="cursor:pointer; margin-top:15px;">Already have an account?</p>
            </div>
        </div>
    `;

    // Hook up the Navigation Link
    document.getElementById('go-login').onclick = () => router('login');

    document.getElementById('do-signup').onclick = async () => {
    // 1. Get the button
    const btn = document.getElementById('do-signup');
    
    // 2. Change state to "loading"
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner" style="width:20px; height:20px; border-width:2px; display:inline-block; vertical-align:middle;"></div> Loading...`;

    // 3. Now collect the data (this works because the inputs are still in the DOM!)
    const email = document.getElementById('s-email').value;
    const password = document.getElementById('s-pass').value;
    
    const metadata = {
        username: document.getElementById('s-username').value,
        first_name: document.getElementById('f-name').value,
        last_name: document.getElementById('l-name').value,
        whatsapp: document.getElementById('s-whatsapp').value,
        location: document.getElementById('s-location').value,
        birthday: `${document.getElementById('b-year').value}-${document.getElementById('b-month').value}-${document.getElementById('b-day').value}`
    };

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
    });

    if (error) {
        alert(error.message);
        // Reset the button so they can try again
        btn.disabled = false;
        btn.innerHTML = "Sign Up";
    } else {
        state.user = data.user;
        router('home');
    }
};
}
// --------------------------------------------------

// -------------------------------------------------------------------------
// --- ZONE 6: INNER APP ---
// -------------------------------------------------------------------------

async function showUpload() {
    app.style.display = 'block';
    app.style.padding = '0';
    app.style.minHeight = '100vh';
    app.style.alignItems = 'unset';    
    app.style.justifyContent = 'unset'; 

    // Fetch current user profile for avatar + username
    const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', state.user.id)
        .single();

    const username = profile?.username || state.user.user_metadata?.username || 'You';
    const avatarUrl = profile?.avatar_url;
    const whatsapp = state.user.user_metadata?.whatsapp || '';

    const avatarHtml = avatarUrl
        ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8">
               <circle cx="12" cy="8" r="4"/>
               <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
           </svg>`;

    app.innerHTML = `
        <div style="width:100%;max-width:100%;min-height:100vh;background:white;display:flex;flex-direction:column;font-family:Helvetica,Arial,sans-serif;">

            <!-- HEADER -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 18px 12px;border-bottom:1px solid #efefef;">
                <button id="cancel-post" style="background:none;border:none;cursor:pointer;color:#1c1e21;padding:4px;display:flex;align-items:center;justify-content:center;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
                <span style="font-weight:700;font-size:16px;color:#1c1e21;">New ePost</span>
                <div style="width:28px;"></div>
            </div>

            <!-- BODY -->
            <div style="flex:1;padding:16px 18px;display:flex;gap:12px;">

                <!-- Avatar + thread line -->
                <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                    <div style="width:42px;height:42px;border-radius:50%;overflow:hidden;background:#e4e6ea;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        ${avatarHtml}
                    </div>
                    <div style="width:2px;flex:1;background:#e4e6ea;border-radius:2px;min-height:40px;"></div>
                </div>

                <!-- Right side -->
                <div style="flex:1;display:flex;flex-direction:column;gap:10px;">

                    <!-- Username -->
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-weight:700;font-size:15px;color:#1c1e21;">${username}</span>
                        <span style="color:#aaa;font-size:14px;">›</span>
                        <span style="color:#aaa;font-size:14px;">Add a topic</span>
                    </div>

                    <!-- Caption -->
                    <textarea id="post-caption" placeholder="What's new?" rows="3"
    style="border:none;resize:none;font-size:15px;color:#1c1e21;background:transparent;padding:0;line-height:1.5;font-family:Helvetica,Arial,sans-serif;width:100%;outline:none;"></textarea>

                    <!-- Media preview card (hidden initially) -->
                    <div id="media-card" style="display:none;position:relative;border-radius:12px;overflow:hidden;max-width:280px;">
                        <img id="media-img" style="display:none;width:100%;max-height:400px;object-fit:cover;display:block;">
                        <video id="media-vid" muted autoplay loop playsinline style="display:none;width:100%;max-height:400px;object-fit:cover;display:block;"></video>

                        <!-- X remove button -->
                        <button id="remove-media" style="position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,0.55);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>

                        <!-- Sound toggle (video only) -->
                        <button id="sound-toggle" style="display:none;position:absolute;bottom:8px;right:8px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,0.55);border:none;cursor:pointer;align-items:center;justify-content:center;">
                            <svg id="sound-icon" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1.5">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Gallery & Camera icons -->
                    <div style="display:flex;gap:18px;align-items:center;padding-top:4px;">
                        <button id="open-gallery" style="background:none;border:none;cursor:pointer;padding:4px;display:flex;">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="3"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                            </svg>
                        </button>
                        <button id="open-camera" style="background:none;border:none;cursor:pointer;padding:4px;display:flex;">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                <circle cx="12" cy="13" r="4"/>
                            </svg>
                        </button>
                        <!-- Hidden file inputs -->
                        <input id="gallery-input" type="file" accept="image/*,video/*" style="display:none;">
                        <input id="camera-input" type="file" accept="image/*,video/*" capture="environment" style="display:none;">
                    </div>

                </div>
            </div>

            <!-- FOOTER -->
            <div style="padding:12px 18px 28px;border-top:1px solid #efefef;display:flex;align-items:center;justify-content:space-between;">
                <span style="color:#aaa;font-size:13px;">Everyone can see</span>
                <button id="post-btn" disabled
                    style="padding:10px 28px;border-radius:24px;border:none;cursor:default;background:#e4e6ea;color:#aaa;font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px;min-width:90px;justify-content:center;transition:all 0.2s ease;">
                    Post
                </button>
            </div>

        </div>
    `;

    // --- Wire up all the logic ---

    let selectedFile = null;
    let isMuted = true;

    const caption = document.getElementById('post-caption');
    const postBtn = document.getElementById('post-btn');
    const mediaCard = document.getElementById('media-card');
    const mediaImg = document.getElementById('media-img');
    const mediaVid = document.getElementById('media-vid');
    const soundToggle = document.getElementById('sound-toggle');
    const galleryInput = document.getElementById('gallery-input');
    const cameraInput = document.getElementById('camera-input');

    // Cancel → go back home
    document.getElementById('cancel-post').onclick = () => router('home');

    // Enable/disable post button
    function updatePostBtn() {
        const hasContent = caption.value.trim() || selectedFile;
        postBtn.disabled = !hasContent;
        postBtn.style.background = hasContent ? '#0866ff' : '#e4e6ea';
        postBtn.style.color = hasContent ? 'white' : '#aaa';
        postBtn.style.cursor = hasContent ? 'pointer' : 'default';
    }
    caption.addEventListener('input', updatePostBtn);

    // Open gallery / camera
    document.getElementById('open-gallery').onclick = () => galleryInput.click();
    document.getElementById('open-camera').onclick = () => cameraInput.click();

    // Handle file selected
    function handleFileSelected(file) {
        if (!file) return;
        selectedFile = file;
        const url = URL.createObjectURL(file);
        const isVideo = file.type.startsWith('video');

        mediaCard.style.display = 'block';

        if (isVideo) {
            mediaImg.style.display = 'none';
            mediaVid.style.display = 'block';
            mediaVid.src = url;
            soundToggle.style.display = 'flex';
        } else {
            mediaVid.style.display = 'none';
            mediaImg.style.display = 'block';
            mediaImg.src = url;
            soundToggle.style.display = 'none';
        }
        updatePostBtn();
    }

    galleryInput.addEventListener('change', e => handleFileSelected(e.target.files[0]));
    cameraInput.addEventListener('change', e => handleFileSelected(e.target.files[0]));

    // Remove media
    document.getElementById('remove-media').onclick = () => {
        selectedFile = null;
        mediaCard.style.display = 'none';
        mediaImg.src = '';
        mediaVid.src = '';
        galleryInput.value = '';
        cameraInput.value = '';
        updatePostBtn();
    };

    // Sound toggle
    soundToggle.onclick = () => {
        isMuted = !isMuted;
        mediaVid.muted = isMuted;
        document.getElementById('sound-icon').innerHTML = isMuted
            ? `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>`
            : `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>`;
    };

    // POST button
    postBtn.onclick = async () => {
        if (postBtn.disabled) return;

        // Show spinner
        postBtn.disabled = true;
        postBtn.innerHTML = `
            <div style="width:18px;height:18px;border:2.5px solid rgba(255,255,255,0.35);border-top:2.5px solid white;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
            Posting...
        `;

        try {
            let mediaUrl = null;

            // Upload file to Supabase storage if exists
            if (selectedFile) {
                const ext = selectedFile.name.split('.').pop();
                const fileName = `${state.user.id}_${Date.now()}.${ext}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('content')
                    .upload(fileName, selectedFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('content')
                    .getPublicUrl(fileName);

                mediaUrl = urlData.publicUrl;
            }

            // Insert post into posts table
            const { error: insertError } = await supabase
                .from('posts')
                .insert({
                    user_id: state.user.id,
                    caption: caption.value.trim() || null,
                    media_url: mediaUrl,
                    whatsapp: whatsapp
                });

            if (insertError) throw insertError;

            // Success — go to home feed
            router('home');

        } catch (err) {
            alert('Failed to post: ' + err.message);
            postBtn.disabled = false;
            postBtn.innerHTML = 'Post';
            postBtn.style.background = '#0866ff';
            postBtn.style.color = 'white';
        }
    };

    // Inject spinner animation
    if (!document.getElementById('upload-style')) {
        const style = document.createElement('style');
        style.id = 'upload-style';
        style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    }
}

//--------------------------------------------------//

async function showHome() {
    app.style.display = 'block';
    app.style.padding = '0';
    app.style.minHeight = '100vh';
    app.style.alignItems = 'unset';
    app.style.justifyContent = 'unset';

    app.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
            <div class="spinner"></div>
            <p style="color:#606770;margin-top:15px;">Loading feed...</p>
        </div>
    `;

    const { data: myProfile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', state.user.id)
        .single();

    const myUsername = myProfile?.username || state.user.user_metadata?.username || 'You';
    const myAvatar = myProfile?.avatar_url;

    const myAvatarHtml = myAvatar
        ? `<img src="${myAvatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;

    let currentPage = 0;
    const perPage = 5;
    let isLoadingMore = false;
    let hasMore = true;

    function timeAgo(dateStr) {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff/60)}m`;
        if (diff < 86400) return `${Math.floor(diff/3600)}h`;
        return `${Math.floor(diff/86400)}d`;
    }

    // Fix Tanzania numbers: replace leading 0 with +255
    function fixWhatsApp(num) {
        if (!num) return '';
        const digits = num.replace(/\D/g, '');
        if (digits.startsWith('0')) return '255' + digits.slice(1);
        if (digits.startsWith('255')) return digits;
        return digits;
    }

    function buildPostCard(post) {
        const profile = post.profiles || {};
        const username = profile.username || 'Unknown';
        const avatar = profile.avatar_url;
        const isOwn = post.user_id === state.user.id;

        const avatarHtml = avatar
            ? `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;

        const mediaHtml = post.media_url ? (() => {
            const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(post.media_url) || post.media_url.includes('video');
            if (isVideo) {
                return `
                    <div style="position:relative;border-radius:12px;overflow:hidden;max-width:280px;margin-top:8px;">
                        <video src="${post.media_url}" muted  loop playsinline style="width:100%;max-height:400px;object-fit:cover;display:block;"></video>
                        <button class="sound-btn" data-id="${post.id}" style="position:absolute;bottom:8px;right:8px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,0.55);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                        </button>
                    </div>`;
            } else {
                return `<div style="border-radius:12px;overflow:hidden;max-width:280px;margin-top:8px;">
                            <img src="${post.media_url}" style="width:100%;max-height:400px;object-fit:cover;display:block;">
                        </div>`;
            }
        })() : '';

        const deleteBtn = isOwn ? `
            <button class="delete-btn" data-id="${post.id}" style="background:none;border:none;cursor:pointer;color:#e41e3f;font-size:12px;padding:4px 8px;border-radius:6px;">🗑️</button>` : '';

        const waNum = fixWhatsApp(post.whatsapp);
        const inquireBtn = waNum ? `
            <button class="inquire-btn" data-wa="${waNum}" data-postid="${post.id}"style="background:#25D366;color:white;border:none;cursor:pointer;padding:5px 12px;border-radius:16px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:4px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2 22l5.112-1.337A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="none" stroke="white" stroke-width="1.5"/></svg>
                Inquire
            </button>` : '';

        return `
            <div class="post-card" data-id="${post.id}" style="padding:16px 16px 0;border-bottom:1px solid #efefef;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:10px;cursor:pointer;" onclick="showProfile('${post.user_id}')">
                        <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;background:#e4e6ea;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${avatarHtml}</div>
                        <div>
                            <span style="font-weight:700;font-size:14px;color:#1c1e21;">${username}</span>
                            <span style="color:#aaa;font-size:12px;margin-left:6px;">${timeAgo(post.created_at)}</span>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:4px;">
                        ${deleteBtn}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#aaa"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                    </div>
                </div>
                ${post.caption ? `<p style="margin:0 0 4px;font-size:14px;color:#1c1e21;line-height:1.5;">${post.caption}</p>` : ''}
                ${mediaHtml}
                <div style="display:flex;align-items:center;gap:16px;padding:12px 0 14px;flex-wrap:wrap;">
                    <button class="like-btn" data-id="${post.id}" style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;color:#606770;font-size:13px;padding:0;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        <span class="like-count-${post.id}">0</span>
                    </button>
                    <button class="comment-btn" data-id="${post.id}"
    style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;color:#606770;font-size:13px;padding:0;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <span class="comment-count-${post.id}">0</span>
</button>
                   <button class="share-btn" data-id="${post.id}" data-caption="${post.caption || ''}" data-url="${post.media_url || ''}" style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;color:#606770;font-size:13px;padding:0;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
</button>
                    ${post.media_url ? `
                    <button class="save-btn" data-url="${post.media_url}" data-name="emake-${post.id}" style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;color:#606770;font-size:13px;padding:0;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>` : ''}
                    ${inquireBtn}
                </div>
            </div>
        `;
    }

    async function fetchPosts(page) {
        const from = page * perPage;
        const to = from + perPage - 1;
        return await supabase
            .from('posts')
            .select(`*, profiles(username, avatar_url)`)
            .order('created_at', { ascending: false })
            .range(from, to);
    }

    function wireEvents() {
    // REAL LIKES
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.onclick = () => toggleLike(btn.dataset.id, btn);
    });

    // COMMENTS — open sheet
    document.querySelectorAll('.comment-btn').forEach(btn => {
        btn.onclick = () => openComments(btn.dataset.id);
    });

    // SHARE
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.onclick = async () => {
            const caption = btn.dataset.caption || 'Check this out on eMake!';
            const mediaUrl = btn.dataset.url || '';
            if (navigator.share) {
                await navigator.share({ title: 'eMake', text: caption, url: mediaUrl || window.location.href });
            } else {
                navigator.clipboard.writeText(mediaUrl || window.location.href);
                alert('Link copied to clipboard!');
            }
        };
    });

    // SAVE / DOWNLOAD
    document.querySelectorAll('.save-btn').forEach(btn => {
        btn.onclick = () => {
            const a = document.createElement('a');
            a.href = btn.dataset.url;
            a.download = btn.dataset.name;
            a.target = '_blank';
            a.click();
        };
    });

    // INQUIRE — opens WhatsApp + silently tracks click
    document.querySelectorAll('.inquire-btn').forEach(btn => {
        btn.onclick = () => {
            trackInquiry(btn.dataset.postid);
            window.open(`https://wa.me/${btn.dataset.wa}`, '_blank');
        };
    });

    // DELETE
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            if (!confirm('Delete this post?')) return;
            await supabase.from('posts').delete().eq('id', btn.dataset.id);
            btn.closest('.post-card').remove();
        };
    });

    // SOUND TOGGLE
    document.querySelectorAll('.sound-btn').forEach(btn => {
        btn.onclick = () => {
            const video = btn.closest('div').querySelector('video');
            video.muted = !video.muted;
            btn.innerHTML = video.muted
                ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
                : `<svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
        };
    });
}

    
    let videoObserver = null;

function setupVideoAutoplay() {
    if (!videoObserver) {
        videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.play();
                } else {
                    entry.target.pause();
                }
            });
        }, { threshold: 0.6 });
    }

    // Only observe videos that aren't already being observed
    document.querySelectorAll('video').forEach(v => {
        if (!v.dataset.observed) {
            videoObserver.observe(v);
            v.dataset.observed = 'true';
        }
    });
}


    // Load first batch
    const { data: firstPosts, error } = await fetchPosts(0);
    if (error) {
        app.innerHTML = `<div style="text-align:center;padding:40px;color:#606770;">Failed to load feed.<br><small>${error.message}</small></div>`;
        return;
    }
    if (firstPosts.length < perPage) hasMore = false;

    app.innerHTML = `
        <div style="width:100%;max-width:100%;min-height:100vh;background:white;font-family:Helvetica,Arial,sans-serif;padding-bottom:70px;">

            <!-- ONLY LOGO IS STICKY -->
            <div style="position:sticky;top:0;z-index:100;background:white;border-bottom:1px solid #efefef;display:flex;justify-content:center;align-items:center;padding:10px 0;">
                <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="22" fill="#0866ff"/>
                    <path d="M14 24 C14 17 19 13 24 13 C30 13 34 17 34 23 C34 24 33 25 32 25 L14.5 25" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/>
                    <path d="M14 24 C14 31 19 35 24 35 C28 35 31 33 33 30" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/>
                </svg>
            </div>

            <!-- SCROLLS WITH FEED -->
            <div style="display:flex;align-items:center;gap:12px;padding:10px 16px 12px;border-bottom:1px solid #efefef;cursor:pointer;" id="quick-post-bar">
                <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;background:#e4e6ea;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${myAvatarHtml}</div>
                <div style="flex:1;">
                    <div style="font-weight:700;font-size:13px;color:#1c1e21;">${myUsername}</div>
                    <div style="font-size:13px;color:#aaa;">What's new?</div>
                </div>
            </div>

            <!-- FEED -->
            <div id="feed-container">
                ${firstPosts.length === 0
                    ? `<div style="text-align:center;padding:60px 20px;color:#aaa;"><p style="margin:0;font-size:15px;">No posts yet.<br>Be the first to post!</p></div>`
                    : firstPosts.map(buildPostCard).join('')}
            </div>

            <!-- INFINITE SCROLL SENTINEL -->
            <div id="load-more-sentinel" style="height:60px;display:flex;align-items:center;justify-content:center;">
                ${hasMore ? '<div class="spinner" style="width:24px;height:24px;border-width:3px;"></div>' : '<p style="color:#aaa;font-size:13px;margin:0;">All caught up! 🎉</p>'}
            </div>

        </div>
    `;

    wireEvents();
    setupVideoAutoplay();
    document.getElementById('quick-post-bar').onclick = () => router('upload');
    const postIds = firstPosts.map(p => p.id);
   loadLikeCounts(postIds);
   loadCommentCounts(postIds); 

    // Infinite scroll
    const sentinel = document.getElementById('load-more-sentinel');
    new IntersectionObserver(async (entries) => {
        if (!entries[0].isIntersecting || isLoadingMore || !hasMore) return;
        isLoadingMore = true;
        currentPage++;

        const { data: morePosts } = await fetchPosts(currentPage);
        if (!morePosts || morePosts.length < perPage) hasMore = false;

        if (morePosts && morePosts.length > 0) {
            document.getElementById('feed-container').insertAdjacentHTML('beforeend', morePosts.map(buildPostCard).join(''));
            wireEvents();
            const newIds = morePosts.map(p => p.id);
   loadLikeCounts(newIds);
   loadCommentCounts(newIds);
            setupVideoAutoplay();
        }

        sentinel.innerHTML = hasMore
            ? '<div class="spinner" style="width:24px;height:24px;border-width:3px;"></div>'
            : '<p style="color:#aaa;font-size:13px;margin:0;">All caught up! 🎉</p>';

        isLoadingMore = false;
    }, { threshold: 0.1 }).observe(sentinel);
}


// -------------------------------------------------------------------------
// --- COMMENTS BOTTOM SHEET + REAL LIKES ---
// -------------------------------------------------------------------------

async function openComments(postId) {
    // Remove existing sheet if any
    const existing = document.getElementById('comment-sheet');
    if (existing) existing.remove();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'comment-sheet-overlay';
    overlay.style.cssText = `
        position:fixed;top:0;left:0;width:100%;height:100%;
        background:rgba(0,0,0,0.4);z-index:999;
    `;
    overlay.onclick = () => closeComments();
    document.body.appendChild(overlay);

    // Create sheet
    const sheet = document.createElement('div');
    sheet.id = 'comment-sheet';
    sheet.style.cssText = `
        position:fixed;bottom:0;left:0;width:100%;
        height:80vh;background:white;border-radius:20px 20px 0 0;
        z-index:1000;display:flex;flex-direction:column;
        font-family:Helvetica,Arial,sans-serif;
        transform:translateY(100%);transition:transform 0.3s ease;
    `;

    sheet.innerHTML = `
        <!-- Handle -->
        <div style="display:flex;justify-content:center;padding:12px 0 4px;">
            <div style="width:40px;height:4px;background:#e4e6ea;border-radius:4px;"></div>
        </div>

        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 16px 12px;border-bottom:1px solid #efefef;">
            <span style="font-weight:700;font-size:16px;color:#1c1e21;">Comments</span>
            <button onclick="closeComments()" style="background:none;border:none;cursor:pointer;color:#606770;font-size:22px;padding:0;line-height:1;">×</button>
        </div>

        <!-- Comments list -->
        <div id="comments-list" style="flex:1;overflow-y:auto;padding:12px 16px;">
            <div style="display:flex;justify-content:center;padding:30px 0;">
                <div class="spinner" style="width:24px;height:24px;border-width:3px;"></div>
            </div>
        </div>

        <!-- Reply indicator -->
        <div id="reply-indicator" style="display:none;padding:6px 16px;background:#f0f2f5;font-size:12px;color:#606770;border-top:1px solid #efefef;">
            Replying to <span id="reply-name" style="font-weight:700;color:#0866ff;"></span>
            <button onclick="cancelReply()" style="float:right;background:none;border:none;color:#aaa;cursor:pointer;font-size:16px;padding:0;">×</button>
        </div>

        <!-- Input bar -->
        <div style="padding:10px 16px 24px;border-top:1px solid #efefef;display:flex;align-items:center;gap:10px;background:white;">
            <div id="comment-avatar-bar" style="width:32px;height:32px;border-radius:50%;overflow:hidden;background:#e4e6ea;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            </div>
            <input id="comment-input" type="text" placeholder="Write a comment..."
                style="flex:1;border:none;background:#f0f2f5;border-radius:20px;padding:10px 16px;font-size:14px;outline:none;font-family:Helvetica,Arial,sans-serif;">
            <button id="send-comment" style="background:none;border:none;cursor:pointer;padding:4px;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0866ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
            </button>
        </div>
    `;

    document.body.appendChild(sheet);

    // Animate in
    requestAnimationFrame(() => {
        sheet.style.transform = 'translateY(0)';
    });

    // State
    let replyToId = null;
    let replyToUsername = null;

    // Load my avatar for input bar
    const { data: myProfile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', state.user.id)
        .single();

    if (myProfile?.avatar_url) {
        document.getElementById('comment-avatar-bar').innerHTML =
            `<img src="${myProfile.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    }

    // Time ago helper
    function timeAgo(dateStr) {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff/60)}m`;
        if (diff < 86400) return `${Math.floor(diff/3600)}h`;
        return `${Math.floor(diff/86400)}d`;
    }

    // Build single comment HTML
    function buildComment(comment, isReply = false) {
        const profile = comment.profiles || {};
        const username = profile.username || 'Unknown';
        const avatar = profile.avatar_url;

        const avatarHtml = avatar
            ? `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;

        return `
            <div style="display:flex;gap:10px;margin-bottom:14px;${isReply ? 'margin-left:42px;' : ''}">
                <div style="width:${isReply ? '28' : '34'}px;height:${isReply ? '28' : '34'}px;border-radius:50%;overflow:hidden;background:#e4e6ea;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    ${avatarHtml}
                </div>
                <div style="flex:1;">
                    <div style="background:#f0f2f5;border-radius:16px;padding:10px 14px;display:inline-block;max-width:100%;">
                        <span style="font-weight:700;font-size:13px;color:#1c1e21;">${username}</span>
                        <p style="margin:3px 0 0;font-size:14px;color:#1c1e21;line-height:1.4;">${comment.content}</p>
                    </div>
                    <div style="display:flex;gap:16px;padding:4px 4px 0;align-items:center;">
                        <span style="font-size:11px;color:#aaa;">${timeAgo(comment.created_at)}</span>
                        <button class="reply-btn" data-id="${comment.id}" data-username="${username}"
                            style="background:none;border:none;cursor:pointer;font-size:12px;font-weight:700;color:#606770;padding:0;">
                            Reply
                        </button>
                    </div>
                    <!-- Replies container -->
                    <div id="replies-${comment.id}"></div>
                </div>
            </div>
        `;
    }

    // Load and render comments
    async function loadComments() {
        const list = document.getElementById('comments-list');

        // Fetch top-level comments (parent_id is null)
        const { data: comments, error } = await supabase
            .from('comments')
            .select(`*, profiles(username, avatar_url)`)
            .eq('post_id', postId)
            .is('parent_id', null)
            .order('created_at', { ascending: true });

        if (error || !comments) {
    list.innerHTML = `<p style="text-align:center;color:#aaa;font-size:14px;">${error?.message || 'Unknown error'}</p>`;
    return;
}

        if (comments.length === 0) {
            list.innerHTML = `
                <div style="text-align:center;padding:40px 0;color:#aaa;">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" style="display:block;margin:0 auto 10px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <p style="margin:0;font-size:14px;">No comments yet.<br>Be the first!</p>
                </div>`;
            wireReplyBtns();
            return;
        }

        list.innerHTML = comments.map(c => buildComment(c)).join('');

        // Fetch all replies for these comments
        const commentIds = comments.map(c => c.id);
        const { data: replies } = await supabase
            .from('comments')
            .select(`*, profiles(username, avatar_url)`)
            .in('parent_id', commentIds)
            .order('created_at', { ascending: true });

        if (replies && replies.length > 0) {
            replies.forEach(reply => {
                const container = document.getElementById(`replies-${reply.parent_id}`);
                if (container) {
                    container.insertAdjacentHTML('beforeend', buildComment(reply, true));
                }
            });
        }

        wireReplyBtns();
    }

    // Wire reply buttons
    function wireReplyBtns() {
        document.querySelectorAll('.reply-btn').forEach(btn => {
            btn.onclick = () => {
                replyToId = btn.dataset.id;
                replyToUsername = btn.dataset.username;
                document.getElementById('reply-indicator').style.display = 'block';
                document.getElementById('reply-name').textContent = `@${replyToUsername}`;
                document.getElementById('comment-input').focus();
                document.getElementById('comment-input').placeholder = `Reply to @${replyToUsername}...`;
            };
        });
    }

    // Cancel reply
    window.cancelReply = () => {
        replyToId = null;
        replyToUsername = null;
        document.getElementById('reply-indicator').style.display = 'none';
        document.getElementById('comment-input').placeholder = 'Write a comment...';
    };

    // Send comment
    document.getElementById('send-comment').onclick = async () => {
        const input = document.getElementById('comment-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        input.disabled = true;

        const { data: newComment, error } = await supabase
            .from('comments')
            .insert({
                post_id: postId,
                user_id: state.user.id,
                content: text,
                parent_id: replyToId || null
            })
            .select(`*, profiles(username, avatar_url)`)
            .single();

        input.disabled = false;

        if (error) {
            alert('Failed to send comment: ' + error.message);
            return;
        }

        cancelReply();

        // Update comment count on post card
        const countEl = document.querySelector(`.comment-count-${postId}`);
        if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + 1;

        // Add comment to UI
        const list = document.getElementById('comments-list');
        const emptyMsg = list.querySelector('div[style*="text-align:center"]');
        if (emptyMsg) emptyMsg.remove();

        if (newComment.parent_id) {
            // It's a reply — add to parent's replies container
            const container = document.getElementById(`replies-${newComment.parent_id}`);
            if (container) {
                container.insertAdjacentHTML('beforeend', buildComment(newComment, true));
            }
        } else {
            // Top-level comment
            list.insertAdjacentHTML('beforeend', buildComment(newComment));
        }

        wireReplyBtns();

        // Scroll to bottom
        list.scrollTop = list.scrollHeight;
    };

    // Also send on Enter key
    document.getElementById('comment-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('send-comment').click();
    });

    await loadComments();
}

window.closeComments = function () {
    const sheet = document.getElementById('comment-sheet');
    const overlay = document.getElementById('comment-sheet-overlay');
    if (sheet) {
        sheet.style.transform = 'translateY(100%)';
        setTimeout(() => {
            sheet.remove();
            if (overlay) overlay.remove();
        }, 300);
    }
}

// -------------------------------------------------------------------------
// --- REAL LIKES (connected to Supabase likes table) ---
// -------------------------------------------------------------------------

async function toggleLike(postId, btn) {
    const countEl = document.querySelector(`.like-count-${postId}`);
    const svg = btn.querySelector('svg');
    const isLiked = svg.getAttribute('fill') === '#e41e3f';

    // Optimistic UI update first
    svg.setAttribute('fill', isLiked ? 'none' : '#e41e3f');
    svg.setAttribute('stroke', isLiked ? '#606770' : '#e41e3f');
    countEl.textContent = isLiked
        ? Math.max(0, parseInt(countEl.textContent) - 1)
        : parseInt(countEl.textContent) + 1;

    if (isLiked) {
    const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', state.user.id)
        .eq('story_id', postId);
    if (error) console.log('DELETE ERROR:', error.message);
} else {
    const { error } = await supabase
        .from('likes')
        .insert({ user_id: state.user.id, story_id: postId });
    if (error) console.log('INSERT ERROR:', error.message);
}
}

// Load real like counts + check if current user liked each post
async function loadLikeCounts(postIds) {
    if (!postIds || postIds.length === 0) return;

    // Get all likes for these posts
    const { data: likes } = await supabase
        .from('likes')
        .select('story_id, user_id')
        .in('story_id', postIds);

    if (!likes) return;

    postIds.forEach(postId => {
        const postLikes = likes.filter(l => l.story_id === postId);
        const userLiked = postLikes.some(l => l.user_id === state.user.id);
        const count = postLikes.length;

        // Update count
        const countEl = document.querySelector(`.like-count-${postId}`);
        if (countEl) countEl.textContent = count;

        // Update heart color if user already liked
        if (userLiked) {
            const likeBtn = document.querySelector(`.like-btn[data-id="${postId}"] svg`);
            if (likeBtn) {
                likeBtn.setAttribute('fill', '#e41e3f');
                likeBtn.setAttribute('stroke', '#e41e3f');
            }
        }
    });
}
async function loadCommentCounts(postIds) {
    for (const id of postIds) {
        const { count } = await supabase
            .from('comments')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', id);
        const el = document.querySelector(`.comment-count-${id}`);
        if (el) el.textContent = count || 0;
    }
}

// -------------------------------------------------------------------------
// --- INQUIRY TRACKER (silent - user never sees this) ---
// -------------------------------------------------------------------------

async function trackInquiry(postId) {
    await supabase
        .from('inquiries')
        .insert({
            post_id: postId,
            user_id: state.user.id
        });
}



// --------------------------------------------------

// --------------------------------------------------
// --- SHOW PROFILE (own + other users) ---
// --------------------------------------------------

async function showProfile(userId) {
    app.style.display = 'block';
    app.style.padding = '0';
    app.style.minHeight = '100vh';
    app.style.alignItems = 'unset';
    app.style.justifyContent = 'unset';

    const nav = document.getElementById('bottom-nav');
    nav.style.display = 'flex';

    const isOwnProfile = userId === state.user.id;

    // Show spinner
    app.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
            <div class="spinner"></div>
        </div>
    `;

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (!profile) {
        app.innerHTML = `<div style="text-align:center;padding:40px;color:#606770;">Profile not found.</div>`;
        return;
    }

    // Fetch total likes for this user's posts
    const { data: userPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', userId);

    let totalLikes = 0;
    if (userPosts && userPosts.length > 0) {
        const postIds = userPosts.map(p => p.id);
        const { count } = await supabase
            .from('likes')
            .select('id', { count: 'exact', head: true })
            .in('story_id', postIds);
        totalLikes = count || 0;
    }

    const fullName = profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username;
    const username = profile.username || 'Unknown';
    const avatarUrl = profile.avatar_url;

    const avatarHtml = avatarUrl
        ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;

    // Fix WhatsApp
    function fixWhatsApp(num) {
        if (!num) return '';
        const digits = num.replace(/\D/g, '');
        if (digits.startsWith('0')) return '255' + digits.slice(1);
        if (digits.startsWith('255')) return digits;
        return digits;
    }

    const waNum = fixWhatsApp(profile.whatsapp);

    // Right side buttons
    const rightButtons = isOwnProfile ? `
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:12px;">
            <!-- Hamburger -->
            <button onclick="showSettings()" style="background:none;border:none;cursor:pointer;padding:4px;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2" stroke-linecap="round">
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
            </button>
            <!-- Avatar circle -->
            <div onclick="showEditProfile()" style="width:72px;height:72px;border-radius:50%;overflow:hidden;background:#e4e6ea;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid #e4e6ea;">
                ${avatarHtml}
            </div>
        </div>` : `
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:12px;">
            <!-- Back button -->
            <button onclick="router('home')" style="background:none;border:none;cursor:pointer;padding:4px;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2" stroke-linecap="round">
                    <polyline points="15 18 9 12 15 6"/>
                </svg>
            </button>
            <!-- Avatar circle -->
            <div style="width:72px;height:72px;border-radius:50%;overflow:hidden;background:#e4e6ea;display:flex;align-items:center;justify-content:center;">
                ${avatarHtml}
            </div>
        </div>`;

    // Bottom button
    const actionButton = isOwnProfile ? `
        <div style="display:flex;gap:12px;padding:0 16px 16px;">
            <button onclick="showEditProfile()" style="flex:1;padding:10px;border:1.5px solid #dddfe2;border-radius:10px;background:white;font-weight:700;font-size:14px;cursor:pointer;color:#1c1e21;">
                Edit Profile
            </button>
            <div style="flex:1;"></div>
        </div>` : waNum ? `
        <div style="display:flex;gap:12px;padding:0 16px 16px;">
            <button onclick="window.open('https://wa.me/${waNum}','_blank')" style="flex:1;padding:10px;border:none;border-radius:10px;background:#25D366;font-weight:700;font-size:14px;cursor:pointer;color:white;display:flex;align-items:center;justify-content:center;gap:8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2 22l5.112-1.337A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="none" stroke="white" stroke-width="1.5"/></svg>
                Message
            </button>
            <div style="flex:1;"></div>
        </div>` : '';

    app.innerHTML = `
        <div style="width:100%;min-height:100vh;background:white;font-family:Helvetica,Arial,sans-serif;padding-bottom:70px;">

            <!-- STICKY HEADER: hamburger stays sticky -->
            <div id="profile-sticky-header" style="position:sticky;top:0;z-index:100;background:white;">
                <!-- Top row: name + right buttons -->
                <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:16px 16px 8px;">
                    <div>
                        <h2 style="margin:0;font-size:22px;font-weight:800;color:#1c1e21;">${fullName}</h2>
                        <p style="margin:4px 0 2px;font-size:14px;color:#606770;">@${username}</p>
                        <p style="margin:0;font-size:13px;color:#606770;">❤️ ${totalLikes} likes</p>
                    </div>
                    ${rightButtons}
                </div>

                ${actionButton}

                <!-- TABS -->
                <div style="display:flex;border-bottom:1px solid #efefef;position:relative;">
                    <button class="profile-tab active-tab" data-tab="eprofile"
                        style="flex:1;padding:12px 0;background:none;border:none;cursor:pointer;font-size:14px;font-weight:700;color:#1c1e21;">
                        eProfile
                    </button>
                    <button class="profile-tab" data-tab="media"
                        style="flex:1;padding:12px 0;background:none;border:none;cursor:pointer;font-size:14px;font-weight:400;color:#aaa;">
                        Media
                    </button>
                    <!-- Sliding indicator -->
                    <div id="tab-indicator" style="position:absolute;bottom:0;left:0;width:50%;height:2px;background:#1c1e21;transition:left 0.25s ease;"></div>
                </div>
            </div>

            <!-- TAB CONTENT -->
            <div id="profile-tab-content">
                <!-- eProfile tab shown by default -->
                <div id="tab-eprofile" style="padding:16px;">
                    <!-- Find Challenge Card -->
                    <div onclick="showFriendlies()" style="background:#f0f2f5;border-radius:16px;padding:20px;margin-bottom:12px;cursor:pointer;">
                        <div style="width:44px;height:44px;border-radius:50%;background:#e4e6ea;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                        </div>
                        <p style="margin:0 0 4px;font-weight:700;font-size:15px;color:#1c1e21;">Find Challenge</p>
                        <p style="margin:0;font-size:13px;color:#aaa;line-height:1.4;">Look for eFootball friendlies across the community</p>
                    </div>

                    ${isOwnProfile ? `
                    <!-- Add profile photo card (own profile only) -->
                    <div style="background:#f0f2f5;border-radius:16px;padding:20px;cursor:pointer;" id="add-photo-card">
                        <div style="width:44px;height:44px;border-radius:50%;background:#e4e6ea;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        </div>
                        <p style="margin:0 0 4px;font-weight:700;font-size:15px;color:#1c1e21;">Add profile photo</p>
                        <p style="margin:0 0 16px;font-size:13px;color:#aaa;line-height:1.4;">Make it easier for people to recognize you.</p>
                        <button id="add-photo-btn" style="width:100%;padding:10px;border:1.5px solid #1c1e21;border-radius:10px;background:white;font-weight:700;font-size:14px;cursor:pointer;">
                            Add
                        </button>
                        <input id="profile-pic-input" type="file" accept="image/*" style="display:none;">
                    </div>` : ''}
                </div>

                <!-- Media tab (hidden initially) -->
                <div id="tab-media" style="display:none;">
                    <div id="media-feed" style="padding-bottom:20px;">
                        <div style="display:flex;justify-content:center;padding:40px;">
                            <div class="spinner" style="width:24px;height:24px;border-width:3px;"></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    `;

    // --- Tab switching ---
    let mediaLoaded = false;
    document.querySelectorAll('.profile-tab').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.profile-tab').forEach(b => {
                b.style.fontWeight = '400';
                b.style.color = '#aaa';
                b.classList.remove('active-tab');
            });
            btn.style.fontWeight = '700';
            btn.style.color = '#1c1e21';
            btn.classList.add('active-tab');

            document.getElementById('tab-indicator').style.left = index === 0 ? '0%' : '50%';

            const tab = btn.dataset.tab;
            document.getElementById('tab-eprofile').style.display = tab === 'eprofile' ? 'block' : 'none';
            document.getElementById('tab-media').style.display = tab === 'media' ? 'block' : 'none';

            if (tab === 'media' && !mediaLoaded) {
                mediaLoaded = true;
                loadMediaTab(userId);
            }
        });
    });

    // --- Add profile photo card ---
    if (isOwnProfile) {
        const addPhotoBtn = document.getElementById('add-photo-btn');
        const profilePicInput = document.getElementById('profile-pic-input');

        if (addPhotoBtn) {
            addPhotoBtn.onclick = (e) => {
                e.stopPropagation();
                profilePicInput.click();
            };
        }

        document.getElementById('add-photo-card').onclick = () => profilePicInput.click();

        profilePicInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (addPhotoBtn) {
                addPhotoBtn.disabled = true;
                addPhotoBtn.innerHTML = `<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;"></div> Uploading...`;
            }

            try {
                const ext = file.name.split('.').pop();
                const fileName = `avatar_${state.user.id}.${ext}`;
                await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
                await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', state.user.id);
                showProfile(state.user.id);
            } catch (err) {
                alert('Failed to upload: ' + err.message);
                if (addPhotoBtn) {
                    addPhotoBtn.disabled = false;
                    addPhotoBtn.innerHTML = 'Add';
                }
            }
        });
    }
}


// -------------------------------------------------------------------------
// --- LOAD MEDIA TAB (posts feed for a user) ---
// -------------------------------------------------------------------------

async function loadMediaTab(userId) {
    const container = document.getElementById('media-feed');

    const { data: posts, error } = await supabase
        .from('posts')
        .select(`*, profiles(username, avatar_url)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error || !posts || posts.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:#aaa;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" style="display:block;margin:0 auto 10px;"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <p style="margin:0;font-size:14px;">No posts yet.</p>
            </div>`;
        return;
    }

    function timeAgo(dateStr) {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff/60)}m`;
        if (diff < 86400) return `${Math.floor(diff/3600)}h`;
        return `${Math.floor(diff/86400)}d`;
    }

    function fixWhatsApp(num) {
        if (!num) return '';
        const digits = num.replace(/\D/g, '');
        if (digits.startsWith('0')) return '255' + digits.slice(1);
        if (digits.startsWith('255')) return digits;
        return digits;
    }

    function buildMediaCard(post) {
        const profile = post.profiles || {};
        const username = profile.username || 'Unknown';
        const avatar = profile.avatar_url;
        const isOwn = post.user_id === state.user.id;

        const avatarHtml = avatar
            ? `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;

        const mediaHtml = post.media_url ? (() => {
            const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(post.media_url) || post.media_url.includes('video');
            if (isVideo) {
                return `
                    <div style="position:relative;border-radius:12px;overflow:hidden;max-width:280px;margin-top:8px;">
                        <video src="${post.media_url}" muted loop playsinline style="width:100%;max-height:400px;object-fit:cover;display:block;"></video>
                        <button class="sound-btn" data-id="${post.id}" style="position:absolute;bottom:8px;right:8px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,0.55);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                        </button>
                    </div>`;
            } else {
                return `<div style="border-radius:12px;overflow:hidden;max-width:280px;margin-top:8px;">
                            <img src="${post.media_url}" style="width:100%;max-height:400px;object-fit:cover;display:block;">
                        </div>`;
            }
        })() : '';

        const deleteBtn = isOwn ? `
            <button class="delete-btn" data-id="${post.id}" style="background:none;border:none;cursor:pointer;color:#e41e3f;font-size:12px;padding:4px 8px;border-radius:6px;">🗑️</button>` : '';

        const waNum = fixWhatsApp(post.whatsapp);
        const inquireBtn = waNum ? `
            <button class="inquire-btn" data-wa="${waNum}" data-postid="${post.id}" style="background:#25D366;color:white;border:none;cursor:pointer;padding:5px 12px;border-radius:16px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:4px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2 22l5.112-1.337A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="none" stroke="white" stroke-width="1.5"/></svg>
                Inquire
            </button>` : '';

        return `
            <div class="post-card" data-id="${post.id}" style="padding:16px 16px 0;border-bottom:1px solid #efefef;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;background:#e4e6ea;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${avatarHtml}</div>
                        <div>
                            <span style="font-weight:700;font-size:14px;color:#1c1e21;">${username}</span>
                            <span style="color:#aaa;font-size:12px;margin-left:6px;">${timeAgo(post.created_at)}</span>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:4px;">
                        ${deleteBtn}
                    </div>
                </div>
                ${post.caption ? `<p style="margin:0 0 4px;font-size:14px;color:#1c1e21;line-height:1.5;">${post.caption}</p>` : ''}
                ${mediaHtml}
                <div style="display:flex;align-items:center;gap:16px;padding:12px 0 14px;flex-wrap:wrap;">
                    <button class="like-btn" data-id="${post.id}" style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;color:#606770;font-size:13px;padding:0;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        <span class="like-count-${post.id}">0</span>
                    </button>
                    <button class="comment-btn" data-id="${post.id}" style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;color:#606770;font-size:13px;padding:0;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <span class="comment-count-${post.id}">0</span>
                    </button>
                    <button class="share-btn" data-id="${post.id}" data-caption="${post.caption || ''}" data-url="${post.media_url || ''}" style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;color:#606770;font-size:13px;padding:0;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                        0
                    </button>
                    ${inquireBtn}
                </div>
            </div>
        `;
    }

    container.innerHTML = posts.map(buildMediaCard).join('');

    // Wire events
    document.querySelectorAll('#media-feed .like-btn').forEach(btn => {
        btn.onclick = () => toggleLike(btn.dataset.id, btn);
    });
    document.querySelectorAll('#media-feed .comment-btn').forEach(btn => {
        btn.onclick = () => openComments(btn.dataset.id);
    });
    document.querySelectorAll('#media-feed .share-btn').forEach(btn => {
        btn.onclick = async () => {
            const caption = btn.dataset.caption || 'Check this out on eMake!';
            const mediaUrl = btn.dataset.url || '';
            if (navigator.share) {
                await navigator.share({ title: 'eMake', text: caption, url: mediaUrl || window.location.href });
            } else {
                navigator.clipboard.writeText(mediaUrl || window.location.href);
                alert('Link copied!');
            }
        };
    });
    document.querySelectorAll('#media-feed .inquire-btn').forEach(btn => {
        btn.onclick = () => {
            trackInquiry(btn.dataset.postid);
            window.open(`https://wa.me/${btn.dataset.wa}`, '_blank');
        };
    });
    document.querySelectorAll('#media-feed .delete-btn').forEach(btn => {
        btn.onclick = async () => {
            if (!confirm('Delete this post?')) return;
            await supabase.from('posts').delete().eq('id', btn.dataset.id);
            btn.closest('.post-card').remove();
        };
    });
    document.querySelectorAll('#media-feed .sound-btn').forEach(btn => {
        btn.onclick = () => {
            const video = btn.closest('div').querySelector('video');
            video.muted = !video.muted;
            btn.innerHTML = video.muted
                ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
                : `<svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
        };
    });

    // Load real like counts
    const postIds = posts.map(p => p.id);
    loadLikeCounts(postIds);
}


// -------------------------------------------------------------------------
// --- SHOW EDIT PROFILE ---
// -------------------------------------------------------------------------

async function showEditProfile() {
    const nav = document.getElementById('bottom-nav');
    nav.style.display = 'none';

    app.style.display = 'block';
    app.style.padding = '0';
    app.style.minHeight = '100vh';
    app.style.alignItems = 'unset';
    app.style.justifyContent = 'unset';

    // Fetch current profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', state.user.id)
        .single();

    const fullName = profile?.full_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || '';
    const username = profile?.username || '';
    const whatsapp = profile?.whatsapp || '';
    const avatarUrl = profile?.avatar_url;

    const avatarHtml = avatarUrl
        ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;

    app.innerHTML = `
        <div style="width:100%;min-height:100vh;background:#f0f2f5;font-family:Helvetica,Arial,sans-serif;">

            <!-- Header -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;background:white;border-bottom:1px solid #efefef;">
                <button onclick="showProfile('${state.user.id}')" style="background:none;border:none;cursor:pointer;color:#1c1e21;font-size:22px;padding:0;line-height:1;">×</button>
                <span style="font-weight:700;font-size:16px;color:#1c1e21;">Edit profile</span>
                <button id="done-btn" style="background:none;border:none;cursor:pointer;font-weight:700;font-size:15px;color:#0866ff;">Done</button>
            </div>

            <!-- Big empty space like in screenshot -->
            <div style="height:80px;"></div>

            <!-- Form card -->
            <div style="margin:0 16px;background:white;border-radius:16px;overflow:hidden;position:relative;">

                <!-- Profile picture circle (top right of card) -->
                <div onclick="document.getElementById('edit-avatar-input').click()" id="edit-avatar-circle"
                    style="position:absolute;top:16px;right:16px;width:56px;height:56px;border-radius:50%;overflow:hidden;background:#e4e6ea;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;">
                    ${avatarHtml}
                </div>
                <input id="edit-avatar-input" type="file" accept="image/*" style="display:none;">

                <!-- Username -->
                <div style="padding:16px 80px 16px 16px;border-bottom:1px solid #efefef;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#606770;">USERNAME</p>
                    <input id="edit-username" type="text" value="${username}"
                        style="width:100%;border:none;outline:none;font-size:15px;color:#1c1e21;background:transparent;font-family:Helvetica,Arial,sans-serif;">
                </div>

                <!-- Full name -->
                <div style="padding:16px 80px 16px 16px;border-bottom:1px solid #efefef;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#606770;">NAME</p>
                    <input id="edit-fullname" type="text" value="${fullName}"
                        style="width:100%;border:none;outline:none;font-size:15px;color:#1c1e21;background:transparent;font-family:Helvetica,Arial,sans-serif;">
                </div>

                <!-- WhatsApp -->
                <div style="padding:16px 80px 16px 16px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#606770;">WHATSAPP NUMBER</p>
                    <input id="edit-whatsapp" type="tel" value="${whatsapp}"
                        style="width:100%;border:none;outline:none;font-size:15px;color:#1c1e21;background:transparent;font-family:Helvetica,Arial,sans-serif;">
                </div>
            </div>

        </div>
    `;

    // Avatar circle bottom overlay
    const editAvatarInput = document.getElementById('edit-avatar-input');
    document.getElementById('edit-avatar-circle').onclick = () => {
        // Show small overlay
        const existing = document.getElementById('avatar-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'avatar-overlay';
        overlay.style.cssText = `position:fixed;bottom:0;left:0;width:100%;background:white;border-radius:20px 20px 0 0;z-index:2000;padding:20px 16px 36px;font-family:Helvetica,Arial,sans-serif;box-shadow:0 -4px 20px rgba(0,0,0,0.1);`;

        const hasAvatar = !!avatarUrl;
        overlay.innerHTML = `
            <div style="display:flex;justify-content:center;margin-bottom:16px;">
                <div style="width:40px;height:4px;background:#e4e6ea;border-radius:4px;"></div>
            </div>
            <button id="new-pic-btn" style="width:100%;padding:16px;background:none;border:none;cursor:pointer;font-size:16px;font-weight:600;color:#1c1e21;text-align:left;">
                ${hasAvatar ? '🔄 Change profile picture' : '📷 New profile picture'}
            </button>
            ${hasAvatar ? `<button id="remove-pic-btn" style="width:100%;padding:16px;background:none;border:none;cursor:pointer;font-size:16px;font-weight:600;color:#e41e3f;text-align:left;">🗑️ Remove profile picture</button>` : ''}
        `;

        document.body.appendChild(overlay);

        document.getElementById('new-pic-btn').onclick = () => {
            overlay.remove();
            editAvatarInput.click();
        };

        if (hasAvatar) {
            document.getElementById('remove-pic-btn').onclick = async () => {
                overlay.remove();
                await supabase.from('profiles').update({ avatar_url: null }).eq('id', state.user.id);
                showEditProfile();
            };
        }

        // Tap outside to close
        setTimeout(() => {
            document.addEventListener('click', function closeOverlay(e) {
                if (!overlay.contains(e.target) && e.target !== document.getElementById('edit-avatar-circle')) {
                    overlay.remove();
                    document.removeEventListener('click', closeOverlay);
                }
            });
        }, 100);
    };

    // Handle avatar file selected
    editAvatarInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const doneBtn = document.getElementById('done-btn');
        doneBtn.innerHTML = `<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;"></div>`;
        doneBtn.disabled = true;

        try {
            const ext = file.name.split('.').pop();
            const fileName = `avatar_${state.user.id}.${ext}`;
            await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

            // Update avatar circle preview
            document.getElementById('edit-avatar-circle').innerHTML =
                `<img src="${urlData.publicUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;

            await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', state.user.id);
        } catch (err) {
            alert('Failed to upload photo: ' + err.message);
        }

        doneBtn.innerHTML = 'Done';
        doneBtn.disabled = false;
    });

    // Done button — save all fields
    document.getElementById('done-btn').onclick = async () => {
        const btn = document.getElementById('done-btn');
        btn.innerHTML = `<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;"></div>`;
        btn.disabled = true;

        const newUsername = document.getElementById('edit-username').value.trim();
        const newFullName = document.getElementById('edit-fullname').value.trim();
        const newWhatsapp = document.getElementById('edit-whatsapp').value.trim();

        const { error } = await supabase
            .from('profiles')
            .update({
                username: newUsername,
                full_name: newFullName,
                whatsapp: newWhatsapp
            })
            .eq('id', state.user.id);

        if (error) {
            alert('Failed to save: ' + error.message);
            btn.innerHTML = 'Done';
            btn.disabled = false;
            return;
        }

        showProfile(state.user.id);
    };
}


// -------------------------------------------------------------------------
// --- SHOW FRIENDLIES SEARCH ---
// -------------------------------------------------------------------------

async function showFriendlies() {
    const nav = document.getElementById('bottom-nav');
    nav.style.display = 'none';

    app.style.display = 'block';
    app.style.padding = '0';
    app.style.minHeight = '100vh';
    app.style.alignItems = 'unset';
    app.style.justifyContent = 'unset';

    app.innerHTML = `
        <div style="width:100%;min-height:100vh;background:white;font-family:Helvetica,Arial,sans-serif;">

            <!-- Header -->
            <div style="display:flex;align-items:center;padding:16px;border-bottom:1px solid #efefef;">
                <button onclick="showProfile('${state.user.id}')" style="background:none;border:none;cursor:pointer;padding:4px;margin-right:12px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <div style="flex:1;">
                    <h2 style="margin:0;font-size:18px;font-weight:800;color:#1c1e21;">Find eFootball Friendlies</h2>
                    <p style="margin:0;font-size:12px;color:#aaa;">Search for people who want friendlies</p>
                </div>
            </div>

            <!-- Search bar -->
            <div style="padding:12px 16px;border-bottom:1px solid #efefef;position:relative;">
                <div style="display:flex;align-items:center;background:#f0f2f5;border-radius:20px;padding:10px 16px;gap:10px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input id="friendlies-search" type="text" placeholder="Search by username..."
                        style="flex:1;border:none;background:transparent;outline:none;font-size:14px;color:#1c1e21;font-family:Helvetica,Arial,sans-serif;">
                    <button id="clear-search" style="display:none;background:none;border:none;cursor:pointer;padding:0;color:#aaa;font-size:18px;line-height:1;">×</button>
                </div>
            </div>

            <!-- Users list -->
            <div id="friendlies-list" style="padding:8px 0;">
                <div style="display:flex;justify-content:center;padding:40px;">
                    <div class="spinner" style="width:24px;height:24px;border-width:3px;"></div>
                </div>
            </div>

        </div>
    `;

    function fixWhatsApp(num) {
        if (!num) return '';
        const digits = num.replace(/\D/g, '');
        if (digits.startsWith('0')) return '255' + digits.slice(1);
        if (digits.startsWith('255')) return digits;
        return digits;
    }

    function buildUserRow(user) {
        const avatar = user.avatar_url;
        const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
        const waNum = fixWhatsApp(user.whatsapp);

        const avatarHtml = avatar
            ? `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;

        const messageBtn = waNum ? `
            <button onclick="window.open('https://wa.me/${waNum}','_blank')"
                style="background:#25D366;color:white;border:none;cursor:pointer;padding:8px 16px;border-radius:20px;font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px;white-space:nowrap;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2 22l5.112-1.337A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="none" stroke="white" stroke-width="1.5"/></svg>
                Message
            </button>` : '';

        return `
            <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #f5f5f5;">
                <div onclick="showProfile('${user.id}')" style="width:46px;height:46px;border-radius:50%;overflow:hidden;background:#e4e6ea;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;">
                    ${avatarHtml}
                </div>
                <div style="flex:1;min-width:0;" onclick="showProfile('${user.id}')" style="cursor:pointer;">
                    <p style="margin:0;font-weight:700;font-size:14px;color:#1c1e21;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${fullName}</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#aaa;">@${user.username || 'unknown'}</p>
                </div>
                ${messageBtn}
            </div>
        `;
    }

    async function loadUsers(query = '') {
        const list = document.getElementById('friendlies-list');
        list.innerHTML = `<div style="display:flex;justify-content:center;padding:40px;"><div class="spinner" style="width:24px;height:24px;border-width:3px;"></div></div>`;

        let req = supabase.from('profiles').select('*').neq('id', state.user.id);

        if (query) {
            req = req.ilike('username', `%${query}%`);
        } else {
            req = req.limit(10);
        }

        const { data: users } = await req;

        if (!users || users.length === 0) {
            list.innerHTML = `<div style="text-align:center;padding:40px;color:#aaa;"><p style="margin:0;font-size:14px;">No users found.</p></div>`;
            return;
        }

        list.innerHTML = users.map(buildUserRow).join('');
    }

    // Load default 10 users
    await loadUsers();

    // Search input
    let searchTimer;
    const searchInput = document.getElementById('friendlies-search');
    const clearBtn = document.getElementById('clear-search');

    searchInput.addEventListener('input', () => {
        const val = searchInput.value.trim();
        clearBtn.style.display = val ? 'block' : 'none';
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => loadUsers(val), 400);
    });

    clearBtn.onclick = () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        loadUsers();
    };
}


// -------------------------------------------------------------------------
// --- SHOW SETTINGS ---
// -------------------------------------------------------------------------

function showSettings() {
    const nav = document.getElementById('bottom-nav');
    nav.style.display = 'none';

    app.style.display = 'block';
    app.style.padding = '0';
    app.style.minHeight = '100vh';
    app.style.alignItems = 'unset';
    app.style.justifyContent = 'unset';

    app.innerHTML = `
        <div style="width:100%;min-height:100vh;background:#f0f2f5;font-family:Helvetica,Arial,sans-serif;">

            <!-- Header -->
            <div style="display:flex;align-items:center;gap:16px;padding:16px;background:white;border-bottom:1px solid #efefef;">
                <button onclick="showProfile('${state.user.id}')" style="background:none;border:none;cursor:pointer;padding:4px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span style="font-weight:700;font-size:18px;color:#1c1e21;">Settings</span>
            </div>

            <!-- Settings items -->
            <div style="margin:16px;background:white;border-radius:16px;overflow:hidden;">

                <div style="padding:16px;border-bottom:1px solid #efefef;display:flex;align-items:center;gap:14px;cursor:pointer;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span style="font-size:15px;color:#1c1e21;">Account</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" style="margin-left:auto;"><polyline points="9 18 15 12 9 6"/></svg>
                </div>

                <div style="padding:16px;border-bottom:1px solid #efefef;display:flex;align-items:center;gap:14px;cursor:pointer;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <span style="font-size:15px;color:#1c1e21;">Notifications</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" style="margin-left:auto;"><polyline points="9 18 15 12 9 6"/></svg>
                </div>

                <div style="padding:16px;border-bottom:1px solid #efefef;display:flex;align-items:center;gap:14px;cursor:pointer;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span style="font-size:15px;color:#1c1e21;">Privacy</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" style="margin-left:auto;"><polyline points="9 18 15 12 9 6"/></svg>
                </div>

                <div style="padding:16px;display:flex;align-items:center;gap:14px;cursor:pointer;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    <span style="font-size:15px;color:#1c1e21;">More settings</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" style="margin-left:auto;"><polyline points="9 18 15 12 9 6"/></svg>
                </div>

            </div>

            <!-- Logout -->
            <div style="margin:0 16px;">
                <button id="logout-btn" style="width:100%;padding:16px;background:white;border:none;border-radius:16px;cursor:pointer;font-size:15px;font-weight:700;color:#e41e3f;text-align:left;">
                    Log out
                </button>
            </div>

        </div>
    `;

    document.getElementById('logout-btn').onclick = async () => {
        if (!confirm('Log out?')) return;
        await supabase.auth.signOut();
        state.user = null;
        router('login');
    };
}

//---- Zone 7: log out function and others-----------
window.showProfile = showProfile;
window.showEditProfile = showEditProfile;
window.showSettings = showSettings;
window.showFriendlies = showFriendlies;
window.loadMediaTab = loadMediaTab;

async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    state.user = session?.user || null;
    router(state.user ? 'home' : 'login');
}

window.onload = () => {
    init();
};
window.state = state;
window.router = router;