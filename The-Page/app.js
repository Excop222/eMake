import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// --- ZONE 1: CONFIGURATION ---
const supabase = createClient('https://ymxyuvqunsbrghaggdzg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteHl1dnF1bnNicmdoYWdnZHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjI4NDgsImV4cCI6MjA4ODAzODg0OH0.RrvwdPPff9P5FMuMXFss1TPvA13T523CHu38jiqEEkY');
const app = document.getElementById('app');

// --------------------------------------------------
// --- MEDIA COMPRESSION UTILITY ---
// --------------------------------------------------

async function compressMedia(file) {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    // -----------------------------------------------------------------------
    // VIDEO — can't compress in browser, just check size limit (50MB)
    // -----------------------------------------------------------------------
    if (isVideo) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            alert(`Video is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed is 50MB. Please trim or compress the video first.`);
            return null;
        }
        // Video is fine — return as is
        return file;
    }

    // -----------------------------------------------------------------------
    // IMAGE — compress to max 1080px width at 75% quality
    // -----------------------------------------------------------------------
    if (isImage) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1080;
                    const MAX_HEIGHT = 1080;

                    let width = img.width;
                    let height = img.height;

                    // Only downscale — never upscale small images
                    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                        if (width > height) {
                            height = Math.round((height * MAX_WIDTH) / width);
                            width = MAX_WIDTH;
                        } else {
                            width = Math.round((width * MAX_HEIGHT) / height);
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to blob at 75% quality
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                // Fallback to original if compression fails
                                resolve(file);
                                return;
                            }

                            // Create a new File from the blob (keeps the filename)
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });

                            console.log(
                                `Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`
                            );

                            resolve(compressedFile);
                        },
                        'image/jpeg',
                        0.75 // 75% quality
                    );
                };
            };
        });
    }

    // Not an image or video — return as is
    return file;
}



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
    else if (view === 'messages') showMessenger();

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
    app.style.display = 'flex';
    app.style.padding = '20px';
    app.style.minHeight = '100vh';
    app.style.alignItems = 'center';
    app.style.justifyContent = 'center';
    
    app.innerHTML = `
        <div class="auth-card">
            <h1>eMake</h1>
            <input type="email" id="login-email" placeholder="Email address or WhatsApp">
          <div style="position:relative;width:100%;">
    <input type="password" id="login-pass" placeholder="Password" style="width:100%;box-sizing:border-box;padding-right:44px;">
    <button onclick="togglePasswordVisibility('login-pass', 'eye-login')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:0;">
        <svg id="eye-login" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8"><eye xmlns="http://www.w3.org/2000/svg"/><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    </button>
</div>
            <button class="login-btn" id="do-login">Log In</button>
           <p class="link-text" onclick="showForgotPassword()" style="cursor:pointer;">Forgotten password?</p>
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
    app.style.display = 'flex';
    app.style.padding = '20px';
    app.style.minHeight = '100vh';
    app.style.alignItems = 'center';
    app.style.justifyContent = 'center';
    
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
            <div style="position:relative;width:100%;">
    <input type="password" id="s-pass" placeholder="New password" style="width:100%;box-sizing:border-box;padding-right:44px;">
    <button onclick="togglePasswordVisibility('s-pass', 'eye-signup')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:0;">
        <svg id="eye-signup" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    </button>
</div>
            
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
    const compressed = await compressMedia(selectedFile);
    if (!compressed) return;
    const ext = compressed.name.split('.').pop();
    const fileName = `${state.user.id}_${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('content')
        .upload(fileName, compressed, { upsert: true });

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

// =========================================================
// SPLASH SCREEN
// Add this function at the TOP of app.js (before everything else)
// Then call showSplash() inside window.onload instead of init()
// =========================================================

function showSplash() {
    const app = document.getElementById('app');
    const nav = document.getElementById('bottom-nav');
    nav.style.display = 'none';

    app.style.display = 'flex';
    app.style.alignItems = 'center';
    app.style.justifyContent = 'center';
    app.style.minHeight = '100vh';
    app.style.padding = '0';

    app.innerHTML = `
        <div id="splash-screen" style="
            position:fixed;
            top:0;left:0;
            width:100%;height:100%;
            background:#000000;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            z-index:9999;
            opacity:1;
            transition:opacity 0.5s ease;
        ">
            <!-- Blue e logo -->
            <div id="splash-logo" style="opacity:0;transform:scale(0.8);transition:opacity 0.6s ease,transform 0.6s ease;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="90" height="90">
                    <path d="M 380 235 C 372 188 344 152 304 132 C 264 112 216 112 176 130 C 134 149 106 185 98 228 C 89 274 103 321 132 353 C 162 387 206 404 250 400 C 288 396 322 378 344 348 C 358 330 364 308 360 286" fill="none" stroke="#0866ff" stroke-width="55" stroke-linecap="round"/>
                    <path d="M 96 250 L 362 235" fill="none" stroke="#0866ff" stroke-width="55" stroke-linecap="round"/>
                </svg>
            </div>

            <!-- App name -->
            <div id="splash-name" style="opacity:0;transition:opacity 0.6s ease 0.3s;margin-top:16px;">
                <span style="color:white;font-size:28px;font-weight:800;font-family:Helvetica,Arial,sans-serif;letter-spacing:1px;">eMake</span>
            </div>

            <!-- Tagline -->
            <div id="splash-tag" style="opacity:0;transition:opacity 0.6s ease 0.5s;margin-top:6px;">
                <span style="color:#555;font-size:13px;font-family:Helvetica,Arial,sans-serif;">eFootball Community</span>
            </div>
        </div>
    `;

    // Animate in
    setTimeout(() => {
        document.getElementById('splash-logo').style.opacity = '1';
        document.getElementById('splash-logo').style.transform = 'scale(1)';
        document.getElementById('splash-name').style.opacity = '1';
        document.getElementById('splash-tag').style.opacity = '1';
    }, 100);

    // Fade out after 2 seconds then init app
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => {
                init();
            }, 500);
        }
    }, 2000);
}
//--------------------------------------------------//

async function showHome() {
    app.style.display = 'block';
    app.style.padding = '0';
    app.style.minHeight = '100vh';
    app.style.alignItems = 'unset';
    app.style.justifyContent = 'unset';

    app.innerHTML = `
    <div style="width:100%;max-width:100%;min-height:100vh;background:white;font-family:Helvetica,Arial,sans-serif;padding-bottom:70px;">

        <!-- HEADER -->
        <div style="position:sticky;top:0;z-index:100;background:white;border-bottom:1px solid #efefef;display:flex;justify-content:space-between;align-items:center;padding:10px 16px;">
            <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" fill="#0866ff"/>
                <path d="M14 24 C14 17 19 13 24 13 C30 13 34 17 34 23 C34 24 33 25 32 25 L14.5 25" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/>
                <path d="M14 24 C14 31 19 35 24 35 C28 35 31 33 33 30" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/>
            </svg>
            <button style="background:none;border:none;cursor:pointer;padding:4px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
        </div>

        <!-- QUICK POST BAR SKELETON -->
        <div style="display:flex;align-items:center;gap:12px;padding:10px 16px 12px;border-bottom:1px solid #efefef;">
            <div class="skeleton" style="width:38px;height:38px;border-radius:50%;flex-shrink:0;"></div>
            <div style="flex:1;">
                <div class="skeleton" style="width:80px;height:10px;border-radius:6px;margin-bottom:6px;"></div>
                <div class="skeleton" style="width:120px;height:10px;border-radius:6px;"></div>
            </div>
        </div>

        <!-- SKELETON CARDS -->
        <div id="feed-container">
            ${Array(4).fill('').map(() => `
                <div style="padding:16px 16px 0;border-bottom:1px solid #efefef;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                        <div class="skeleton" style="width:38px;height:38px;border-radius:50%;flex-shrink:0;"></div>
                        <div>
                            <div class="skeleton" style="width:100px;height:10px;border-radius:6px;margin-bottom:6px;"></div>
                            <div class="skeleton" style="width:60px;height:8px;border-radius:6px;"></div>
                        </div>
                    </div>
                    <div class="skeleton" style="width:100%;height:12px;border-radius:6px;margin-bottom:8px;"></div>
                    <div class="skeleton" style="width:75%;height:12px;border-radius:6px;margin-bottom:12px;"></div>
                    <div class="skeleton" style="width:100%;height:200px;border-radius:12px;margin-bottom:14px;"></div>
                </div>
            `).join('')}
        </div>

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



// Now fetch fresh from Supabase in background

// Load cache instantly if available
const CACHE_KEY = 'emake_feed_v1';
const cached = localStorage.getItem(CACHE_KEY);
if (cached) {
    try {
        const cachedPosts = JSON.parse(cached);
        if (cachedPosts.length > 0) {
            document.getElementById('feed-container').innerHTML = 
                cachedPosts.map(buildPostCard).join('');
            wireEvents();
            setupVideoAutoplay();
            loadLikeCounts(cachedPosts.map(p => p.id));
            loadCommentCounts(cachedPosts.map(p => p.id));
        }
    } catch(e) {}
}

const { data: firstPosts, error } = await fetchPosts(0);
if (error) {
    if (cached) return;
    // Show no internet message inside feed-container only
    const feedContainer = document.getElementById('feed-container');
    if (feedContainer) {
        feedContainer.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;text-align:center;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e4e6ea" stroke-width="1.5" style="margin-bottom:16px;"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
                <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#1c1e21;">No internet connection</p>
                <p style="margin:0 0 20px;font-size:13px;color:#aaa;">Check your connection and try again</p>
                <button onclick="showHome()" style="padding:10px 24px;background:#0866ff;color:white;border:none;border-radius:20px;font-size:14px;font-weight:700;cursor:pointer;">
                    Retry
                </button>
            </div>
        `;
    }
    return;
}
if (firstPosts.length < perPage) hasMore = false;
localStorage.setItem(CACHE_KEY, JSON.stringify(firstPosts));


    app.innerHTML = `
        <div style="width:100%;max-width:100%;min-height:100vh;background:white;font-family:Helvetica,Arial,sans-serif;padding-bottom:70px;">

            <!-- ONLY LOGO IS STICKY -->
            <div style="position:sticky;top:0;z-index:100;background:white;border-bottom:1px solid #efefef;display:flex;justify-content:space-between;align-items:center;padding:10px 16px;">
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="#0866ff"/>
        <path d="M14 24 C14 17 19 13 24 13 C30 13 34 17 34 23 C34 24 33 25 32 25 L14.5 25" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M14 24 C14 31 19 35 24 35 C28 35 31 33 33 30" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/>
    </svg>
    <button onclick="showNotifications()" style="background:none;border:none;cursor:pointer;padding:4px;position:relative;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <div id="notif-badge" style="display:none;position:absolute;top:2px;right:2px;width:8px;height:8px;border-radius:50%;background:#e41e3f;border:1.5px solid white;"></div>
    </button>
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
        const { data: postData } = await supabase.from('posts').select('user_id').eq('id', postId).single();
if (postData) {
    const { data: prefData } = await supabase.from('privacy_settings').select('notif_comments').eq('user_id', postData.user_id).single();
    if (!prefData || prefData.notif_comments !== false) {
        createNotification(postData.user_id, 'comment', postId);
        const { data: profileData } = await supabase.from('profiles').select('username').eq('id', state.user.id).single();
sendPushNotification(postData.user_id, 'New Comment! 💬', `${profileData?.username || 'Someone'} commented on your post`);
    }
}

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
    
// Notify post owner
const { data: postData } = await supabase.from('posts').select('user_id').eq('id', postId).single();
if (postData) {
    const { data: prefData } = await supabase.from('privacy_settings').select('notif_likes').eq('user_id', postData.user_id).single();
    if (!prefData || prefData.notif_likes !== false) {
        createNotification(postData.user_id, 'like', postId);
        const { data: profileData } = await supabase.from('profiles').select('username').eq('id', state.user.id).single();
        sendPushNotification(postData.user_id, 'New Like! ❤️', `${profileData?.username || 'Someone'} liked your post`);
    }
}
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
    if (!postIds || postIds.length === 0) return;
    const { data } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds);
    
    if (!data) return;
    postIds.forEach(id => {
        const count = data.filter(c => c.post_id === id).length;
        const el = document.querySelector(`.comment-count-${id}`);
        if (el) el.textContent = count;
    });
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
    <div style="width:100%;min-height:100vh;background:white;font-family:Helvetica,Arial,sans-serif;padding-bottom:70px;">

        <!-- HEADER SKELETON -->
        <div style="position:sticky;top:0;z-index:100;background:white;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:16px 16px 8px;">
                <div>
                    <div class="skeleton" style="width:140px;height:16px;border-radius:6px;margin-bottom:8px;"></div>
                    <div class="skeleton" style="width:90px;height:12px;border-radius:6px;margin-bottom:6px;"></div>
                    <div class="skeleton" style="width:70px;height:12px;border-radius:6px;"></div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:12px;">
                    ${isOwnProfile ? `
                    <button onclick="showSettings()" style="background:none;border:none;cursor:pointer;padding:4px;">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2" stroke-linecap="round">
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <line x1="3" y1="12" x2="21" y2="12"/>
                            <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                    </button>` : `
                    <button onclick="router('home')" style="background:none;border:none;cursor:pointer;padding:4px;">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2" stroke-linecap="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>`}
                    <div class="skeleton" style="width:72px;height:72px;border-radius:50%;"></div>
                </div>
            </div>

            <!-- ACTION BUTTON SKELETON -->
            <div style="padding:0 16px 16px;">
                <div class="skeleton" style="width:100%;height:40px;border-radius:10px;"></div>
            </div>

            <!-- TABS SKELETON -->
            <div style="display:flex;border-bottom:1px solid #efefef;">
                <div style="flex:1;padding:12px 0;display:flex;justify-content:center;">
                    <div class="skeleton" style="width:60px;height:12px;border-radius:6px;"></div>
                </div>
                <div style="flex:1;padding:12px 0;display:flex;justify-content:center;">
                    <div class="skeleton" style="width:40px;height:12px;border-radius:6px;"></div>
                </div>
            </div>
        </div>

        <!-- CONTENT SKELETON -->
        <div style="padding:16px;">
            <div class="skeleton" style="width:100%;height:100px;border-radius:16px;margin-bottom:12px;"></div>
            <div class="skeleton" style="width:100%;height:100px;border-radius:16px;"></div>
        </div>

    </div>
`;

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (!profile) {
    const content = document.querySelector('[style*="padding:16px"]');
    if (content) content.innerHTML = `
        <div style="text-align:center;padding:40px;">
            <p style="color:#606770;font-size:15px;">Profile not found.</p>
            <button onclick="router('home')" style="margin-top:12px;padding:10px 24px;background:#0866ff;color:white;border:none;border-radius:20px;font-size:14px;font-weight:700;cursor:pointer;">Go Home</button>
        </div>
    `;
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
    </div>` : `
    <div style="display:flex;gap:12px;padding:0 16px 16px;">
        <button onclick="openChat('${userId}')" style="flex:1;padding:10px;border:none;border-radius:10px;background:#0866ff;font-weight:700;font-size:14px;cursor:pointer;color:white;display:flex;align-items:center;justify-content:center;gap:8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Message
        </button>
        <div style="flex:1;"></div>
    </div>`;

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
    loadCommentCounts(postIds);
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
            const compressed = await compressMedia(file);
if (!compressed) return;
await supabase.storage.from('avatars').upload(fileName, compressed, { upsert: true });
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

        const messageBtn = `
    <button onclick="openChat('${user.id}')"
        style="background:#0866ff;color:white;border:none;cursor:pointer;padding:8px 16px;border-radius:20px;font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px;white-space:nowrap;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Message
    </button>`;
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

                <div onclick="showAccountSettings()" style="padding:16px;border-bottom:1px solid #efefef;display:flex;align-items:center;gap:14px;cursor:pointer;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span style="font-size:15px;color:#1c1e21;">Account</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" style="margin-left:auto;"><polyline points="9 18 15 12 9 6"/></svg>
                </div>

                <div onclick="showNotificationSettings()" style="padding:16px;border-bottom:1px solid #efefef;display:flex;align-items:center;gap:14px;cursor:pointer;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <span style="font-size:15px;color:#1c1e21;">Notifications</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" style="margin-left:auto;"><polyline points="9 18 15 12 9 6"/></svg>
                </div>

                <div onclick="showPrivacySettings()" style="padding:16px;border-bottom:1px solid #efefef;display:flex;align-items:center;gap:14px;cursor:pointer;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span style="font-size:15px;color:#1c1e21;">Privacy</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" style="margin-left:auto;"><polyline points="9 18 15 12 9 6"/></svg>
                </div>

                <div onclick="showMoreSettings()" style="padding:16px;display:flex;align-items:center;gap:14px;cursor:pointer;">
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

// --------------------------------------------------
// --- SHOW ACCOUNT SETTINGS ---
// --------------------------------------------------

async function showAccountSettings() {
    const nav = document.getElementById('bottom-nav');
    nav.style.display = 'none';

    app.style.display = 'block';
    app.style.padding = '0';
    app.style.minHeight = '100vh';
    app.style.alignItems = 'unset';
    app.style.justifyContent = 'unset';

    // Fetch current user email from supabase auth
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email || '';

    app.innerHTML = `
        <div style="width:100%;min-height:100vh;background:#f0f2f5;font-family:Helvetica,Arial,sans-serif;">

            <!-- Header -->
            <div style="display:flex;align-items:center;gap:16px;padding:16px;background:white;border-bottom:1px solid #efefef;">
                <button onclick="showSettings()" style="background:none;border:none;cursor:pointer;padding:4px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span style="font-weight:700;font-size:18px;color:#1c1e21;">Account</span>
            </div>

            <!-- Change Email -->
            <div style="margin:16px 16px 0;background:white;border-radius:16px;overflow:hidden;">
                <div style="padding:12px 16px;border-bottom:1px solid #efefef;">
                    <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#606770;text-transform:uppercase;">Email Address</p>
                    <input id="account-email" type="email" value="${email}"
                        style="width:100%;border:none;outline:none;font-size:15px;color:#1c1e21;background:transparent;font-family:Helvetica,Arial,sans-serif;padding:4px 0;">
                </div>
                <button id="save-email-btn" style="width:100%;padding:14px 16px;background:none;border:none;cursor:pointer;font-size:15px;font-weight:700;color:#0866ff;text-align:left;">
                    Save Email
                </button>
            </div>

            <!-- Change Password -->
            <div style="margin:12px 16px 0;background:white;border-radius:16px;overflow:hidden;">
                <div style="padding:12px 16px;border-bottom:1px solid #efefef;">
                    <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#606770;text-transform:uppercase;">New Password</p>
                    <input id="account-password" type="password" placeholder="Enter new password"
                        style="width:100%;border:none;outline:none;font-size:15px;color:#1c1e21;background:transparent;font-family:Helvetica,Arial,sans-serif;padding:4px 0;">
                </div>
                <div style="padding:12px 16px;border-bottom:1px solid #efefef;">
                    <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#606770;text-transform:uppercase;">Confirm Password</p>
                    <input id="account-password-confirm" type="password" placeholder="Confirm new password"
                        style="width:100%;border:none;outline:none;font-size:15px;color:#1c1e21;background:transparent;font-family:Helvetica,Arial,sans-serif;padding:4px 0;">
                </div>
                <button id="save-password-btn" style="width:100%;padding:14px 16px;background:none;border:none;cursor:pointer;font-size:15px;font-weight:700;color:#0866ff;text-align:left;">
                    Save Password
                </button>
            </div>

            <!-- Danger Zone -->
            <div style="margin:12px 16px 0;background:white;border-radius:16px;overflow:hidden;">
                <button id="delete-account-btn" style="width:100%;padding:16px;background:none;border:none;cursor:pointer;font-size:15px;font-weight:700;color:#e41e3f;text-align:left;">
                    Delete Account
                </button>
            </div>

            <!-- Status message -->
            <div id="account-status" style="margin:12px 16px;font-size:13px;text-align:center;display:none;"></div>

        </div>
    `;

    function showStatus(msg, isError = false) {
        const el = document.getElementById('account-status');
        el.textContent = msg;
        el.style.color = isError ? '#e41e3f' : '#25a244';
        el.style.display = 'block';
        setTimeout(() => el.style.display = 'none', 3000);
    }

    // Save Email
    document.getElementById('save-email-btn').onclick = async () => {
        const btn = document.getElementById('save-email-btn');
        const newEmail = document.getElementById('account-email').value.trim();
        if (!newEmail) return showStatus('Please enter an email', true);

        btn.textContent = 'Saving...';
        btn.disabled = true;

        const { error } = await supabase.auth.updateUser({ email: newEmail });

        if (error) {
            showStatus(error.message, true);
        } else {
            showStatus('Confirmation email sent! Check your inbox.');
        }

        btn.textContent = 'Save Email';
        btn.disabled = false;
    };

    // Save Password
    document.getElementById('save-password-btn').onclick = async () => {
        const btn = document.getElementById('save-password-btn');
        const newPassword = document.getElementById('account-password').value;
        const confirmPassword = document.getElementById('account-password-confirm').value;

        if (!newPassword) return showStatus('Please enter a password', true);
        if (newPassword.length < 6) return showStatus('Password must be at least 6 characters', true);
        if (newPassword !== confirmPassword) return showStatus('Passwords do not match', true);

        btn.textContent = 'Saving...';
        btn.disabled = true;

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            showStatus(error.message, true);
        } else {
            showStatus('Password updated successfully!');
            document.getElementById('account-password').value = '';
            document.getElementById('account-password-confirm').value = '';
        }

        btn.textContent = 'Save Password';
        btn.disabled = false;
    };

document.getElementById('delete-account-btn').onclick = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    if (!confirm('Last warning! All your posts and data will be deleted forever.')) return;

    const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', state.user.id)
        .single();

    if (profile?.avatar_url) {
        const path = profile.avatar_url.split('/avatars/')[1];
        if (path) await supabase.storage.from('avatars').remove([path]);
    }

    const { data: posts } = await supabase
        .from('posts')
        .select('media_url')
        .eq('user_id', state.user.id);

    if (posts && posts.length > 0) {
        const paths = posts
            .filter(p => p.media_url)
            .map(p => p.media_url.split('/content/')[1])
            .filter(Boolean);
        if (paths.length > 0) await supabase.storage.from('content').remove(paths);
    }

    await supabase.from('posts').delete().eq('user_id', state.user.id);
    await supabase.from('profiles').delete().eq('id', state.user.id);
    await supabase.rpc('delete_user');
    await supabase.auth.signOut();
    state.user = null;
    router('login');
};
}
// -------------------------------------------------
// --- SHOW NOTIFICATIONS SETTINGS ---
// --------------------------------------------------

async function showNotificationSettings() {
    const nav = document.getElementById('bottom-nav');
    nav.style.display = 'none';

    app.style.display = 'block';
    app.style.padding = '0';
    app.style.minHeight = '100vh';
    app.style.alignItems = 'unset';
    app.style.justifyContent = 'unset';

    // Show spinner while loading
    app.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
            <div class="spinner"></div>
        </div>
    `;

    // Fetch existing preferences
    const { data: prefs } = await supabase
        .from('privacy_settings')
        .select('notif_likes, notif_comments, notif_messages')
        .eq('user_id', state.user.id)
        .single();

    // Defaults are all true
    const notifLikes = prefs?.notif_likes ?? true;
    const notifComments = prefs?.notif_comments ?? true;
    const notifMessages = prefs?.notif_messages ?? true;

    app.innerHTML = `
        <div style="width:100%;min-height:100vh;background:#f0f2f5;font-family:Helvetica,Arial,sans-serif;">

            <!-- Header -->
            <div style="display:flex;align-items:center;gap:16px;padding:16px;background:white;border-bottom:1px solid #efefef;">
                <button onclick="showSettings()" style="background:none;border:none;cursor:pointer;padding:4px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span style="font-weight:700;font-size:18px;color:#1c1e21;">Notifications</span>
            </div>

            <!-- Description -->
            <p style="margin:16px 16px 8px;font-size:12px;color:#aaa;text-transform:uppercase;font-weight:700;">In-app notifications</p>

            <!-- Toggles -->
            <div style="margin:0 16px;background:white;border-radius:16px;overflow:hidden;">

                <!-- Likes -->
                <div style="padding:16px;border-bottom:1px solid #efefef;display:flex;align-items:center;justify-content:space-between;gap:16px;">
                    <div style="flex:1;">
                        <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#1c1e21;">Likes</p>
                        <p style="margin:0;font-size:13px;color:#606770;">Notify when someone likes your post</p>
                    </div>
                    <div id="toggle-notif-likes" data-on="${notifLikes}" onclick="toggleNotifSetting('likes')"
                        style="width:51px;height:31px;border-radius:20px;background:${notifLikes ? '#0866ff' : '#e4e6ea'};cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;">
                        <div id="toggle-notif-likes-knob"
                            style="position:absolute;top:3px;left:${notifLikes ? '23px' : '3px'};width:25px;height:25px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,0.2);transition:left 0.2s;"></div>
                    </div>
                </div>

                <!-- Comments -->
                <div style="padding:16px;border-bottom:1px solid #efefef;display:flex;align-items:center;justify-content:space-between;gap:16px;">
                    <div style="flex:1;">
                        <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#1c1e21;">Comments</p>
                        <p style="margin:0;font-size:13px;color:#606770;">Notify when someone comments on your post</p>
                    </div>
                    <div id="toggle-notif-comments" data-on="${notifComments}" onclick="toggleNotifSetting('comments')"
                        style="width:51px;height:31px;border-radius:20px;background:${notifComments ? '#0866ff' : '#e4e6ea'};cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;">
                        <div id="toggle-notif-comments-knob"
                            style="position:absolute;top:3px;left:${notifComments ? '23px' : '3px'};width:25px;height:25px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,0.2);transition:left 0.2s;"></div>
                    </div>
                </div>

                <!-- Messages -->
                <div style="padding:16px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
                    <div style="flex:1;">
                        <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#1c1e21;">Messages</p>
                        <p style="margin:0;font-size:13px;color:#606770;">Notify when someone sends you a message</p>
                    </div>
                    <div id="toggle-notif-messages" data-on="${notifMessages}" onclick="toggleNotifSetting('messages')"
                        style="width:51px;height:31px;border-radius:20px;background:${notifMessages ? '#0866ff' : '#e4e6ea'};cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;">
                        <div id="toggle-notif-messages-knob"
                            style="position:absolute;top:3px;left:${notifMessages ? '23px' : '3px'};width:25px;height:25px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,0.2);transition:left 0.2s;"></div>
                    </div>
                </div>

            </div>

            <!-- Status -->
            <div id="notif-settings-status" style="margin:12px 16px;font-size:13px;text-align:center;display:none;"></div>

        </div>
    `;

    window.toggleNotifSetting = async (type) => {
        const toggleEl = document.getElementById(`toggle-notif-${type}`);
        const knobEl = document.getElementById(`toggle-notif-${type}-knob`);

        const isOn = toggleEl.dataset.on === 'true';
        const newVal = !isOn;

        // Update UI immediately
        toggleEl.dataset.on = newVal;
        toggleEl.style.background = newVal ? '#0866ff' : '#e4e6ea';
        knobEl.style.left = newVal ? '23px' : '3px';

        // Build update object
        const updateObj = {};
        if (type === 'likes') updateObj.notif_likes = newVal;
        if (type === 'comments') updateObj.notif_comments = newVal;
        if (type === 'messages') updateObj.notif_messages = newVal;

        const { error } = await supabase
            .from('privacy_settings')
            .upsert({ user_id: state.user.id, ...updateObj }, { onConflict: 'user_id' });

        if (error) {
            // Revert on error
            toggleEl.dataset.on = isOn;
            toggleEl.style.background = isOn ? '#0866ff' : '#e4e6ea';
            knobEl.style.left = isOn ? '23px' : '3px';

            const status = document.getElementById('notif-settings-status');
            status.textContent = 'Failed to save. Try again.';
            status.style.color = '#e41e3f';
            status.style.display = 'block';
            setTimeout(() => status.style.display = 'none', 3000);
        }
    };
}


// --------------------------------------------------
// --- SHOW PRIVACY SETTINGS ---
// --------------------------------------------------

async function showPrivacySettings() {
    const nav = document.getElementById('bottom-nav');
    nav.style.display = 'none';

    app.style.display = 'block';
    app.style.padding = '0';
    app.style.minHeight = '100vh';
    app.style.alignItems = 'unset';
    app.style.justifyContent = 'unset';

    // Show spinner while loading
    app.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
            <div class="spinner"></div>
        </div>
    `;

    // Fetch existing privacy settings for this user
    const { data: privacy } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', state.user.id)
        .single();

    // If no row yet, defaults are both true
    const allowMatchRequests = privacy?.allow_match_requests ?? true;
    const allowComments = privacy?.allow_comments ?? true;

    app.innerHTML = `
        <div style="width:100%;min-height:100vh;background:#f0f2f5;font-family:Helvetica,Arial,sans-serif;">

            <!-- Header -->
            <div style="display:flex;align-items:center;gap:16px;padding:16px;background:white;border-bottom:1px solid #efefef;">
                <button onclick="showSettings()" style="background:none;border:none;cursor:pointer;padding:4px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span style="font-weight:700;font-size:18px;color:#1c1e21;">Privacy</span>
            </div>

            <!-- Toggles -->
            <div style="margin:16px;background:white;border-radius:16px;overflow:hidden;">

                <!-- Match Requests -->
                <div style="padding:16px;border-bottom:1px solid #efefef;display:flex;align-items:center;justify-content:space-between;gap:16px;">
                    <div style="flex:1;">
                        <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#1c1e21;">Allow match requests</p>
                        <p style="margin:0;font-size:13px;color:#606770;">Anyone can send you a match request</p>
                    </div>
                    <div id="toggle-match" data-on="${allowMatchRequests}" onclick="togglePrivacy('match')"
                        style="width:51px;height:31px;border-radius:20px;background:${allowMatchRequests ? '#0866ff' : '#e4e6ea'};cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;">
                        <div id="toggle-match-knob"
                            style="position:absolute;top:3px;left:${allowMatchRequests ? '23px' : '3px'};width:25px;height:25px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,0.2);transition:left 0.2s;"></div>
                    </div>
                </div>

                <!-- Comments -->
                <div style="padding:16px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
                    <div style="flex:1;">
                        <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#1c1e21;">Allow comments</p>
                        <p style="margin:0;font-size:13px;color:#606770;">Anyone can comment on your posts</p>
                    </div>
                    <div id="toggle-comments" data-on="${allowComments}" onclick="togglePrivacy('comments')"
                        style="width:51px;height:31px;border-radius:20px;background:${allowComments ? '#0866ff' : '#e4e6ea'};cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;">
                        <div id="toggle-comments-knob"
                            style="position:absolute;top:3px;left:${allowComments ? '23px' : '3px'};width:25px;height:25px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,0.2);transition:left 0.2s;"></div>
                    </div>
                </div>

            </div>

            <!-- Status -->
            <div id="privacy-status" style="margin:0 16px;font-size:13px;text-align:center;color:#606770;display:none;"></div>

        </div>
    `;

    // Toggle handler
    window.togglePrivacy = async (type) => {
        const toggleEl = document.getElementById(`toggle-${type}`);
        const knobEl = document.getElementById(`toggle-${type}-knob`);

        const isOn = toggleEl.dataset.on === 'true';
        const newVal = !isOn;

        // Update UI immediately
        toggleEl.dataset.on = newVal;
        toggleEl.style.background = newVal ? '#0866ff' : '#e4e6ea';
        knobEl.style.left = newVal ? '23px' : '3px';

        // Build update object
        const updateObj = {};
        if (type === 'match') updateObj.allow_match_requests = newVal;
        if (type === 'comments') updateObj.allow_comments = newVal;

        // Upsert — creates row if doesn't exist, updates if it does
        const { error } = await supabase
            .from('privacy_settings')
            .upsert({ user_id: state.user.id, ...updateObj }, { onConflict: 'user_id' });

        if (error) {
            // Revert UI on error
            toggleEl.dataset.on = isOn;
            toggleEl.style.background = isOn ? '#0866ff' : '#e4e6ea';
            knobEl.style.left = isOn ? '23px' : '3px';

            const status = document.getElementById('privacy-status');
            status.textContent = 'Failed to save. Try again.';
            status.style.color = '#e41e3f';
            status.style.display = 'block';
            setTimeout(() => status.style.display = 'none', 3000);
        }
    };
}

// -------------------------------------------------
// --- SHOW MORE SETTINGS ---
// --------------------------------------------------

function showMoreSettings() {
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
                <button onclick="showSettings()" style="background:none;border:none;cursor:pointer;padding:4px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span style="font-weight:700;font-size:18px;color:#1c1e21;">More Settings</span>
            </div>

            <!-- About eMake -->
            <div style="margin:16px 16px 0;background:white;border-radius:16px;overflow:hidden;">

                <!-- App logo + name -->
                <div style="display:flex;flex-direction:column;align-items:center;padding:28px 16px 20px;border-bottom:1px solid #efefef;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="56" height="56" style="margin-bottom:10px;">
                        <path d="M 380 235 C 372 188 344 152 304 132 C 264 112 216 112 176 130 C 134 149 106 185 98 228 C 89 274 103 321 132 353 C 162 387 206 404 250 400 C 288 396 322 378 344 348 C 358 330 364 308 360 286" fill="none" stroke="#0866ff" stroke-width="55" stroke-linecap="round"/>
                        <path d="M 96 250 L 362 235" fill="none" stroke="#0866ff" stroke-width="55" stroke-linecap="round"/>
                    </svg>
                    <p style="margin:0 0 2px;font-size:18px;font-weight:800;color:#1c1e21;">eMake eFootball</p>
                    <p style="margin:0;font-size:13px;color:#aaa;">Version 1.0.0</p>
                </div>

                <!-- Description -->
                <div style="padding:16px;border-bottom:1px solid #efefef;">
                    <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#606770;text-transform:uppercase;">About</p>
                    <p style="margin:0;font-size:14px;color:#1c1e21;line-height:1.6;">
                        eMake is an eFootball community app built for players who want to connect, share highlights, and find friendly matches. Built with ❤️ for the eFootball community.
                    </p>
                </div>

                <!-- Built by -->
                <div style="padding:16px;">
                    <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#606770;text-transform:uppercase;">Built by</p>
                    <p style="margin:0;font-size:14px;color:#1c1e21;">eMake Team</p>
                </div>

            </div>

            <!-- Send Feedback -->
            <div style="margin:12px 16px 0;background:white;border-radius:16px;overflow:hidden;">
                <button onclick="window.location.href='mailto:emaketeamsupport@gmail.com?subject=eMake Feedback'"
                    style="width:100%;padding:16px;background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:14px;text-align:left;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <div style="flex:1;">
                        <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#1c1e21;">Send Feedback</p>
                        <p style="margin:0;font-size:13px;color:#aaa;">emaketeamsupport@gmail.com</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
            </div>

            <!-- Legal -->
            <div style="margin:12px 16px 0;background:white;border-radius:16px;overflow:hidden;">
                <button onclick="showPrivacyPolicy()"
                    style="width:100%;padding:16px;background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:14px;text-align:left;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span style="flex:1;font-size:15px;font-weight:700;color:#1c1e21;">Privacy Policy</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
            </div>

            <!-- Copyright -->
            <p style="text-align:center;font-size:12px;color:#aaa;padding:24px 16px;">© 2026 eMake eFootball. All rights reserved.</p>

        </div>
    `;
}


// -------------------------------------------------------------------------
// --- PRIVACY POLICY PAGE ---
// -------------------------------------------------------------------------

function showPrivacyPolicy() {
    app.innerHTML = `
        <div style="width:100%;min-height:100vh;background:white;font-family:Helvetica,Arial,sans-serif;">

            <!-- Header -->
            <div style="display:flex;align-items:center;gap:16px;padding:16px;border-bottom:1px solid #efefef;">
                <button onclick="showMoreSettings()" style="background:none;border:none;cursor:pointer;padding:4px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span style="font-weight:700;font-size:18px;color:#1c1e21;">Privacy Policy</span>
            </div>

            <div style="padding:20px 16px;line-height:1.7;color:#1c1e21;">
                <p style="font-size:12px;color:#aaa;margin:0 0 20px;">Last updated: March 2026</p>

                <h3 style="margin:0 0 8px;font-size:15px;">What we collect</h3>
                <p style="margin:0 0 16px;font-size:14px;color:#444;">We collect your username, full name, WhatsApp number, profile photo, and posts you share on eMake.</p>

                <h3 style="margin:0 0 8px;font-size:15px;">How we use it</h3>
                <p style="margin:0 0 16px;font-size:14px;color:#444;">Your information is used only to display your profile and connect you with the eFootball community. We do not sell your data to anyone.</p>

                <h3 style="margin:0 0 8px;font-size:15px;">Your rights</h3>
                <p style="margin:0 0 16px;font-size:14px;color:#444;">You can edit or delete your account at any time from Settings → Account. Deleting your account permanently removes all your data.</p>

                <h3 style="margin:0 0 8px;font-size:15px;">Contact</h3>
                <p style="margin:0 0 16px;font-size:14px;color:#444;">For any questions about your privacy, contact us at <a href="mailto:emaketeamsupport@gmail.com" style="color:#0866ff;text-decoration:none;">emaketeamsupport@gmail.com</a></p>
            </div>

        </div>
    `;
}

// -------------------------------------------------------------------------
// --- SCREEN 1: CONVERSATIONS LIST ---
// -------------------------------------------------------------------------

async function showMessenger() {
    const nav = document.getElementById('bottom-nav');
    nav.style.display = 'flex';

    app.style.display = 'block';
    app.style.padding = '0';
    app.style.minHeight = '100vh';
    app.style.alignItems = 'unset';
    app.style.justifyContent = 'unset';

    // Update nav active state
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.style.color = '#606770';
        b.querySelectorAll('svg').forEach(s => s.setAttribute('stroke', '#606770'));
        b.querySelectorAll('span').forEach(s => s.style.color = '#606770');
    });
    const msgNav = document.getElementById('nav-messages');
    if (msgNav) {
        msgNav.querySelectorAll('svg').forEach(s => s.setAttribute('stroke', '#0866ff'));
        msgNav.querySelectorAll('span').forEach(s => s.style.color = '#0866ff');
    }

    app.innerHTML = `
        <div style="width:100%;min-height:100vh;background:white;font-family:Helvetica,Arial,sans-serif;padding-bottom:70px;">

            <!-- Header -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #efefef;position:sticky;top:0;background:white;z-index:100;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <img src="emessenger-192.png" style="width:28px;height:28px;border-radius:6px;">
                    <span style="font-weight:800;font-size:20px;color:#1c1e21;">eMessenger</span>
                </div>
                <button onclick="showNewMessage()" style="background:none;border:none;cursor:pointer;padding:4px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
            </div>

            <!-- Search -->
            <div style="padding:10px 16px;border-bottom:1px solid #efefef;">
                <div style="display:flex;align-items:center;background:#f0f2f5;border-radius:20px;padding:10px 16px;gap:10px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input id="messenger-search" type="text" placeholder="Search conversations..."
                        style="flex:1;border:none;background:transparent;outline:none;font-size:14px;color:#1c1e21;font-family:Helvetica,Arial,sans-serif;">
                </div>
            </div>

            <!-- Conversations list -->
            <div id="conversations-list">
                <div style="display:flex;justify-content:center;padding:40px;">
                    <div class="spinner" style="width:24px;height:24px;border-width:3px;"></div>
                </div>
            </div>

        </div>
    `;

    await loadConversations();

    // Search
    let searchTimer;
    document.getElementById('messenger-search').addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => loadConversations(e.target.value.trim()), 400);
    });

    // Check unread and update badge
    checkUnreadBadge();
}

async function loadConversations(query = '') {
    const list = document.getElementById('conversations-list');
    if (!list) return;

    // Get all messages where user is sender or receiver
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${state.user.id},receiver_id.eq.${state.user.id}`)
        .order('created_at', { ascending: false });

    if (!messages || messages.length === 0) {
        list.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 24px;text-align:center;">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#e4e6ea" stroke-width="1.2" style="margin-bottom:16px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#1c1e21;">No messages yet</p>
                <p style="margin:0 0 24px;font-size:13px;color:#aaa;">Start a conversation with someone!</p>
                <button onclick="showNewMessage()" style="padding:12px 28px;background:#0866ff;color:white;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:Helvetica,Arial,sans-serif;">
                    New Message
                </button>
            </div>
        `;
        return;
    }

    // Build unique conversations — one per other user
    const seen = new Set();
    const conversations = [];

    for (const msg of messages) {
        const otherId = msg.sender_id === state.user.id ? msg.receiver_id : msg.sender_id;
        if (!seen.has(otherId)) {
            seen.add(otherId);
            conversations.push({ otherId, lastMsg: msg });
        }
    }

    // Fetch profiles for all other users
    const otherIds = conversations.map(c => c.otherId);
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', otherIds);

    const profileMap = {};
    (profiles || []).forEach(p => profileMap[p.id] = p);

    // Filter by search query
    const filtered = query
        ? conversations.filter(c => {
            const p = profileMap[c.otherId];
            const name = (p?.full_name || p?.username || '').toLowerCase();
            return name.includes(query.toLowerCase());
        })
        : conversations;

    if (filtered.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:40px;color:#aaa;font-size:14px;">No conversations found.</div>`;
        return;
    }

    // Count unread per conversation
    const { data: unreadData } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', state.user.id)
        .eq('is_read', false);

    const unreadByUser = {};
    (unreadData || []).forEach(m => {
        unreadByUser[m.sender_id] = (unreadByUser[m.sender_id] || 0) + 1;
    });

    function timeAgo(dateStr) {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60) return 'now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return `${Math.floor(diff / 86400)}d`;
    }

    list.innerHTML = filtered.map(({ otherId, lastMsg }) => {
        const profile = profileMap[otherId] || {};
        const name = profile.full_name || profile.username || 'Unknown';
        const avatar = profile.avatar_url;
        const unread = unreadByUser[otherId] || 0;
        const isMine = lastMsg.sender_id === state.user.id;

        const avatarHtml = avatar
            ? `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;

        let preview = '';
        if (lastMsg.media_type === 'image') preview = '📷 Photo';
        else if (lastMsg.media_type === 'video') preview = '🎥 Video';
        else preview = lastMsg.content || '';
        if (preview.length > 32) preview = preview.substring(0, 32) + '...';

        return `
            <div onclick="openChat('${otherId}')"
                style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #f5f5f5;cursor:pointer;">
                <!-- Avatar -->
                <div style="position:relative;flex-shrink:0;">
                    <div style="width:52px;height:52px;border-radius:50%;overflow:hidden;background:#e4e6ea;display:flex;align-items:center;justify-content:center;">
                        ${avatarHtml}
                    </div>
                    ${unread > 0 ? `<div style="position:absolute;bottom:1px;right:1px;width:12px;height:12px;border-radius:50%;background:#e41e3f;border:2px solid white;"></div>` : ''}
                </div>
                <!-- Info -->
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                        <span style="font-weight:${unread > 0 ? '800' : '700'};font-size:15px;color:#1c1e21;">${name}</span>
                        <span style="font-size:12px;color:#aaa;">${timeAgo(lastMsg.created_at)}</span>
                    </div>
                    <p style="margin:0;font-size:13px;color:${unread > 0 ? '#1c1e21' : '#aaa'};font-weight:${unread > 0 ? '600' : '400'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${isMine ? 'You: ' : ''}${preview}
                    </p>
                </div>
            </div>
        `;
    }).join('');
}


// -------------------------------------------------------------------------
// --- NEW MESSAGE (start a conversation) ---
// -------------------------------------------------------------------------

async function showNewMessage() {
    app.innerHTML = `
        <div style="width:100%;min-height:100vh;background:white;font-family:Helvetica,Arial,sans-serif;padding-bottom:70px;">

            <!-- Header -->
            <div style="display:flex;align-items:center;gap:16px;padding:16px;border-bottom:1px solid #efefef;">
                <button onclick="showMessenger()" style="background:none;border:none;cursor:pointer;padding:4px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span style="font-weight:700;font-size:18px;color:#1c1e21;">New Message</span>
            </div>

            <!-- Search people -->
            <div style="padding:10px 16px;border-bottom:1px solid #efefef;">
                <div style="display:flex;align-items:center;background:#f0f2f5;border-radius:20px;padding:10px 16px;gap:10px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input id="new-msg-search" type="text" placeholder="Search people..."
                        style="flex:1;border:none;background:transparent;outline:none;font-size:14px;color:#1c1e21;font-family:Helvetica,Arial,sans-serif;">
                </div>
            </div>

            <!-- People list -->
            <div id="new-msg-list">
                <div style="display:flex;justify-content:center;padding:40px;">
                    <div class="spinner" style="width:24px;height:24px;border-width:3px;"></div>
                </div>
            </div>
        </div>
    `;

    async function loadPeople(query = '') {
        const listEl = document.getElementById('new-msg-list');
        let req = supabase.from('profiles').select('*').neq('id', state.user.id);
        if (query) req = req.ilike('username', `%${query}%`);
        else req = req.limit(20);

        const { data: people } = await req;

        if (!people || people.length === 0) {
            listEl.innerHTML = `<div style="text-align:center;padding:40px;color:#aaa;font-size:14px;">No users found.</div>`;
            return;
        }

        listEl.innerHTML = people.map(p => {
            const name = p.full_name || p.username || 'Unknown';
            const avatarHtml = p.avatar_url
                ? `<img src="${p.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
                : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;

            return `
                <div onclick="openChat('${p.id}')"
                    style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #f5f5f5;cursor:pointer;">
                    <div style="width:46px;height:46px;border-radius:50%;overflow:hidden;background:#e4e6ea;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        ${avatarHtml}
                    </div>
                    <div>
                        <p style="margin:0 0 2px;font-weight:700;font-size:14px;color:#1c1e21;">${name}</p>
                        <p style="margin:0;font-size:12px;color:#aaa;">@${p.username || 'unknown'}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    await loadPeople();

    let searchTimer;
    document.getElementById('new-msg-search').addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => loadPeople(e.target.value.trim()), 400);
    });
}


// -------------------------------------------------------------------------
// --- SCREEN 2: CHAT ---
// -------------------------------------------------------------------------

let chatSubscription = null;

async function openChat(otherUserId) {
    // Unsubscribe from any previous chat
    if (chatSubscription) {
        supabase.removeChannel(chatSubscription);
        chatSubscription = null;
    }

    app.style.display = 'block';
    app.style.padding = '0';

    const nav = document.getElementById('bottom-nav');
    nav.style.display = 'none';

    // Show spinner
    app.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;">
            <div class="spinner"></div>
        </div>
    `;

    // Fetch other user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single();

    const name = profile?.full_name || profile?.username || 'Unknown';
    const avatar = profile?.avatar_url;

    // Build conversation_id — always same regardless of who starts
    const conversationId = [state.user.id, otherUserId].sort().join('_');

    const avatarHtml = avatar
        ? `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;

    app.innerHTML = `
        <div style="width:100%;height:100vh;background:white;font-family:Helvetica,Arial,sans-serif;display:flex;flex-direction:column;">

            <!-- Header -->
            <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #efefef;background:white;flex-shrink:0;">
                <button onclick="showMessenger()" style="background:none;border:none;cursor:pointer;padding:4px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div onclick="showProfile('${otherUserId}')" style="width:38px;height:38px;border-radius:50%;overflow:hidden;background:#e4e6ea;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">
                    ${avatarHtml}
                </div>
                <div onclick="showProfile('${otherUserId}')" style="flex:1;cursor:pointer;">
                    <p style="margin:0;font-weight:700;font-size:15px;color:#1c1e21;">${name}</p>
                </div>
            </div>

            <!-- Messages area -->
            <div id="chat-messages" style="flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;justify-content:center;padding:20px;">
                    <div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>
                </div>
            </div>

            <!-- Input bar -->
            <div style="display:flex;align-items:flex-end;gap:10px;padding:10px 16px;border-top:1px solid #efefef;background:white;flex-shrink:0;">
                <!-- Attach media -->
                <button id="attach-btn" style="background:none;border:none;cursor:pointer;padding:4px;flex-shrink:0;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="1.8"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </button>
                <input id="media-input" type="file" accept="image/*,video/*" style="display:none;">

                <!-- Text input -->
                <div style="flex:1;background:#f0f2f5;border-radius:20px;padding:10px 16px;min-height:40px;max-height:120px;overflow-y:auto;outline:none;font-size:14px;color:#1c1e21;font-family:Helvetica,Arial,sans-serif;line-height:1.4;"
                    id="chat-input" contenteditable="true" data-placeholder="Message..."
                    style=""></div>

                <!-- Send button -->
                <button id="send-btn" style="width:38px;height:38px;border-radius:50%;background:#0866ff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
            </div>

        </div>
    `;

    // Add placeholder style
    const style = document.createElement('style');
    style.textContent = `#chat-input:empty:before { content: attr(data-placeholder); color: #aaa; pointer-events: none; }`;
    document.head.appendChild(style);

    // Load messages
    await loadChatMessages(conversationId, otherUserId);

    // Mark messages as read
    await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', state.user.id)
        .eq('sender_id', otherUserId);

    checkUnreadBadge();

    // Realtime subscription
    chatSubscription = supabase
        .channel(`chat_${conversationId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
        }, async (payload) => {
            const msg = payload.new;
            appendMessage(msg, msg.sender_id === state.user.id);

            // Mark as read if it's for me
            if (msg.receiver_id === state.user.id) {
                await supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
                checkUnreadBadge();
            }
        })
        .subscribe();

    // Send button
    document.getElementById('send-btn').onclick = () => sendMessage(conversationId, otherUserId);

    // Send on Enter (not shift+enter)
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(conversationId, otherUserId);
        }
    });

    // Attach media
    document.getElementById('attach-btn').onclick = () => {
        document.getElementById('media-input').click();
    };

    document.getElementById('media-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        await sendMediaMessage(file, conversationId, otherUserId);
    });
}

async function loadChatMessages(conversationId, otherUserId) {
    const container = document.getElementById('chat-messages');

    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px 20px;color:#aaa;">
                <p style="margin:0;font-size:13px;">Say hi! Start the conversation 👋</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    messages.forEach(msg => {
        appendMessage(msg, msg.sender_id === state.user.id);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function appendMessage(msg, isMine) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    // Remove empty state if present
    const emptyState = container.querySelector('div[style*="Say hi"]');
    if (emptyState) emptyState.remove();

    function timeStr(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `display:flex;flex-direction:column;align-items:${isMine ? 'flex-end' : 'flex-start'};margin-bottom:2px;`;

    let contentHtml = '';

    if (msg.media_type === 'image' && msg.media_url) {
        contentHtml = `
            <div style="max-width:220px;border-radius:${isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};overflow:hidden;">
                <img src="${msg.media_url}" style="width:100%;display:block;" onclick="window.open('${msg.media_url}','_blank')">
            </div>
        `;
    } else if (msg.media_type === 'video' && msg.media_url) {
        contentHtml = `
            <div style="max-width:220px;border-radius:${isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};overflow:hidden;">
                <video src="${msg.media_url}" controls playsinline style="width:100%;display:block;"></video>
            </div>
        `;
    } else {
        contentHtml = `
            <div style="max-width:260px;padding:10px 14px;border-radius:${isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};background:${isMine ? '#0866ff' : '#f0f2f5'};">
                <p style="margin:0;font-size:14px;color:${isMine ? 'white' : '#1c1e21'};line-height:1.5;word-break:break-word;">${msg.content || ''}</p>
            </div>
        `;
    }

    wrapper.innerHTML = `
        ${contentHtml}
        <span style="font-size:11px;color:#aaa;margin-top:3px;margin-${isMine ? 'right' : 'left'}:4px;">
            ${timeStr(msg.created_at)}${isMine ? (msg.is_read ? ' ✓✓' : ' ✓') : ''}
        </span>
    `;

    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
}

async function sendMessage(conversationId, otherUserId) {
    const input = document.getElementById('chat-input');
    const content = input.innerText.trim();
    if (!content) return;

    input.innerText = '';

    const { error } = await supabase.from('messages').insert({
        sender_id: state.user.id,
        receiver_id: otherUserId,
        content: content,
        conversation_id: conversationId,
        is_read: false
    });

    if (error) console.error('Send error:', error);
    const { data: prefData } = await supabase.from('privacy_settings').select('notif_messages').eq('user_id', otherUserId).single();
if (!prefData || prefData.notif_messages !== false) {
    createNotification(otherUserId, 'message', null, null);
    const { data: profileData } = await supabase.from('profiles').select('username').eq('id', state.user.id).single();
sendPushNotification(otherUserId, 'New Message! 💬', `${profileData?.username || 'Someone'} sent you a message`);
}
}

async function sendMediaMessage(file, conversationId, otherUserId) {
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;
    sendBtn.innerHTML = `<div class="spinner" style="width:14px;height:14px;border-width:2px;border-color:white;border-top-color:transparent;display:inline-block;"></div>`;

    try {
        const isVideo = file.type.startsWith('video/');
        const ext = file.name.split('.').pop();
        const fileName = `messages/${Date.now()}_${state.user.id}.${ext}`;

        const compressed = await compressMedia(file);
if (!compressed) return;
const { data: uploadData, error: uploadError } = await supabase.storage
    .from('content')
    .upload(fileName, compressed, { upsert: true });

        if (uploadError) {
            alert('Upload failed: ' + uploadError.message);
            return;
        }

        const { data: urlData } = supabase.storage
            .from('content')
            .getPublicUrl(fileName);

        const { error: msgError } = await supabase.from('messages').insert({
            sender_id: state.user.id,
            receiver_id: otherUserId,
            media_url: urlData.publicUrl,
            media_type: isVideo ? 'video' : 'image',
            conversation_id: conversationId,
            is_read: false
        });

        if (msgError) {
            alert('Message failed: ' + msgError.message);
        }

    } catch (err) {
        alert('Error: ' + err.message);
    }

    sendBtn.disabled = false;
    sendBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
}

// -------------------------------------------------------------------------
// --- UNREAD BADGE ---
// -------------------------------------------------------------------------

async function checkUnreadBadge() {
    const badge = document.getElementById('msg-badge');
    if (!badge) return;

    const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', state.user.id)
        .eq('is_read', false);

    badge.style.display = count > 0 ? 'block' : 'none';
}

// -------------------------------------------------------------------------
// --- NOTIFICATIONS SCREEN ---
// -------------------------------------------------------------------------

async function showNotifications() {
    const nav = document.getElementById('bottom-nav');
    nav.style.display = 'flex';

    app.style.display = 'block';
    app.style.padding = '0';
    app.style.minHeight = '100vh';
    app.style.alignItems = 'unset';
    app.style.justifyContent = 'unset';

    app.innerHTML = `
        <div style="width:100%;min-height:100vh;background:white;font-family:Helvetica,Arial,sans-serif;padding-bottom:70px;">

            <!-- Header -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #efefef;position:sticky;top:0;background:white;z-index:100;">
                <button onclick="showHome()" style="background:none;border:none;cursor:pointer;padding:4px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1c1e21" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span style="font-weight:800;font-size:20px;color:#1c1e21;">Notifications</span>
                <button id="mark-all-read" style="background:none;border:none;cursor:pointer;font-size:13px;font-weight:700;color:#0866ff;">
                    Mark all read
                </button>
            </div>

            <!-- Notifications list -->
            <div id="notif-list">
                <div style="display:flex;justify-content:center;padding:40px;">
                    <div class="spinner" style="width:24px;height:24px;border-width:3px;"></div>
                </div>
            </div>

        </div>
    `;

    await loadNotifications();

    // Mark all read
    document.getElementById('mark-all-read').onclick = async () => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', state.user.id);

        // Update UI — remove all unread highlights
        document.querySelectorAll('.notif-unread').forEach(el => {
            el.style.background = 'white';
            el.classList.remove('notif-unread');
        });

        // Hide badge
        const badge = document.getElementById('notif-badge');
        if (badge) badge.style.display = 'none';
    };

    // Mark all as read when opening
    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', state.user.id)
        .eq('is_read', false);

    checkNotifBadge();
}

async function loadNotifications() {
    const list = document.getElementById('notif-list');
    if (!list) return;

    const { data: notifications } = await supabase
        .from('notifications')
        .select('*, sender:sender_id(username, avatar_url)')
        .eq('user_id', state.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

    if (!notifications || notifications.length === 0) {
        list.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 24px;text-align:center;">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#e4e6ea" stroke-width="1.2" style="margin-bottom:16px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#1c1e21;">No notifications yet</p>
                <p style="margin:0;font-size:13px;color:#aaa;">When someone likes or comments on your posts you'll see it here</p>
            </div>
        `;
        return;
    }

    function timeAgo(dateStr) {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return `${Math.floor(diff / 86400)}d`;
    }

    list.innerHTML = notifications.map(notif => {
        const sender = notif.sender || {};
        const name = sender.username || 'Someone';
        const avatar = sender.avatar_url;
        const isUnread = !notif.is_read;

        const avatarHtml = avatar
            ? `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;

        // Icon and message per type
        let iconHtml = '';
        let message = '';
        let onclick = '';

        if (notif.type === 'like') {
            iconHtml = `<div style="width:32px;height:32px;border-radius:50%;background:#fff0f3;display:flex;align-items:center;justify-content:center;position:absolute;bottom:-2px;right:-2px;border:2px solid white;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#e41e3f" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>`;
            message = `<span style="font-weight:700;color:#1c1e21;">${name}</span> liked your post`;
            onclick = notif.post_id ? `showHome()` : '';
        } else if (notif.type === 'comment') {
            iconHtml = `<div style="width:32px;height:32px;border-radius:50%;background:#f0f4ff;display:flex;align-items:center;justify-content:center;position:absolute;bottom:-2px;right:-2px;border:2px solid white;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0866ff" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>`;
            message = `<span style="font-weight:700;color:#1c1e21;">${name}</span> commented on your post`;
            onclick = notif.post_id ? `openComments('${notif.post_id}')` : '';
        } else if (notif.type === 'message') {
            iconHtml = `<div style="width:32px;height:32px;border-radius:50%;background:#f0fff4;display:flex;align-items:center;justify-content:center;position:absolute;bottom:-2px;right:-2px;border:2px solid white;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#25a244" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>`;
            message = `<span style="font-weight:700;color:#1c1e21;">${name}</span> sent you a message`;
            onclick = `openChat('${notif.sender_id}')`;
        }

        return `
            <div onclick="${onclick}" ${isUnread ? 'class="notif-unread"' : ''}
                style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #f5f5f5;cursor:pointer;background:${isUnread ? '#f0f4ff' : 'white'};">
                <!-- Avatar with icon overlay -->
                <div style="position:relative;flex-shrink:0;">
                    <div style="width:48px;height:48px;border-radius:50%;overflow:hidden;background:#e4e6ea;display:flex;align-items:center;justify-content:center;">
                        ${avatarHtml}
                    </div>
                    ${iconHtml}
                </div>
                <!-- Text -->
                <div style="flex:1;min-width:0;">
                    <p style="margin:0 0 2px;font-size:14px;color:#444;line-height:1.4;">${message}</p>
                    <span style="font-size:12px;color:#aaa;">${timeAgo(notif.created_at)}</span>
                </div>
                ${isUnread ? `<div style="width:8px;height:8px;border-radius:50%;background:#0866ff;flex-shrink:0;"></div>` : ''}
            </div>
        `;
    }).join('');
}


// -------------------------------------------------------------------------
// --- CREATE NOTIFICATION (call this when likes/comments/messages happen) ---
// -------------------------------------------------------------------------

async function createNotification(userId, type, postId = null, messageId = null) {
    // Don't notify yourself
    if (userId === state.user.id) return;

    await supabase.from('notifications').insert({
        user_id: userId,
        sender_id: state.user.id,
        type: type,
        post_id: postId,
        message_id: messageId
    });

    checkNotifBadge();
}


// -------------------------------------------------------------------------
// --- CHECK NOTIFICATION BADGE ---
// -------------------------------------------------------------------------

async function checkNotifBadge() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;

    const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', state.user.id)
        .eq('is_read', false);

    badge.style.display = count > 0 ? 'block' : 'none';
}

// --------------------------------------------------

// -------------------------------------------------
// --- FORGOT PASSWORD + RESET PASSWORD ---
// -------------------------------------------------


// --------------------------------------------------
// --- PAGE 1: FORGOT PASSWORD ---
// --------------------------------------------------

function showForgotPassword() {
    app.style.display = 'flex';
    app.style.padding = '20px';
    app.style.minHeight = '100vh';
    app.style.alignItems = 'center';
    app.style.justifyContent = 'center';

    app.innerHTML = `
        <div class="auth-card" style="width:100%;max-width:400px;">

            <!-- Back button -->
            <button onclick="showLogin()" style="background:none;border:none;cursor:pointer;padding:0;margin-bottom:20px;display:flex;align-items:center;gap:6px;color:#606770;font-family:Helvetica,Arial,sans-serif;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#606770" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Login
            </button>

            <!-- Icon -->
            <div style="display:flex;justify-content:center;margin-bottom:16px;">
                <div style="width:64px;height:64px;border-radius:50%;background:#f0f4ff;display:flex;align-items:center;justify-content:center;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0866ff" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
            </div>

            <h2 style="text-align:center;margin:0 0 8px;font-size:22px;font-weight:800;color:#1c1e21;font-family:Helvetica,Arial,sans-serif;">Forgot Password?</h2>
            <p style="text-align:center;margin:0 0 24px;font-size:14px;color:#606770;font-family:Helvetica,Arial,sans-serif;line-height:1.5;">
                Enter your email address and we'll send you a link to reset your password.
            </p>

            <!-- Email input -->
            <input type="email" id="reset-email" placeholder="Email address"
                style="width:100%;padding:14px 16px;border:1.5px solid #dddfe2;border-radius:12px;font-size:15px;outline:none;font-family:Helvetica,Arial,sans-serif;box-sizing:border-box;margin-bottom:12px;color:#1c1e21;">

            <!-- Status message -->
            <div id="reset-status" style="display:none;padding:12px;border-radius:10px;font-size:13px;text-align:center;margin-bottom:12px;font-family:Helvetica,Arial,sans-serif;"></div>

            <!-- Send button -->
            <button id="send-reset-btn"
                style="width:100%;padding:14px;border:none;border-radius:12px;background:#0866ff;color:white;font-size:15px;font-weight:700;cursor:pointer;font-family:Helvetica,Arial,sans-serif;">
                Send Reset Link
            </button>

        </div>
    `;

    document.getElementById('send-reset-btn').onclick = async () => {
        const btn = document.getElementById('send-reset-btn');
        const email = document.getElementById('reset-email').value.trim();
        const status = document.getElementById('reset-status');

        if (!email) {
            status.textContent = 'Please enter your email address.';
            status.style.background = '#fff0f3';
            status.style.color = '#e41e3f';
            status.style.display = 'block';
            return;
        }

        btn.disabled = true;
        btn.innerHTML = `<div class="spinner" style="width:18px;height:18px;border-width:2px;border-color:rgba(255,255,255,0.4);border-top-color:white;display:inline-block;vertical-align:middle;margin-right:8px;"></div> Sending...`;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://emake.netlify.app'
        });

        if (error) {
            status.textContent = error.message;
            status.style.background = '#fff0f3';
            status.style.color = '#e41e3f';
            status.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = 'Send Reset Link';
        } else {
            // Success!
            status.innerHTML = `✅ Reset link sent! Check your email inbox and spam folder.`;
            status.style.background = '#f0fff4';
            status.style.color = '#25a244';
            status.style.display = 'block';
            btn.disabled = true;
            btn.innerHTML = 'Link Sent!';
            btn.style.background = '#25a244';
        }
    };

    // Allow pressing Enter
    document.getElementById('reset-email').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('send-reset-btn').click();
    });
}


// -------------------------------------------------------------------------
// --- PAGE 2: RESET PASSWORD (shown when user clicks email link) ---
// -------------------------------------------------------------------------

function showResetPassword() {
    app.style.display = 'flex';
    app.style.padding = '20px';
    app.style.minHeight = '100vh';
    app.style.alignItems = 'center';
    app.style.justifyContent = 'center';

    // Hide bottom nav
    const nav = document.getElementById('bottom-nav');
    if (nav) nav.style.display = 'none';

    app.innerHTML = `
        <div class="auth-card" style="width:100%;max-width:400px;">

            <!-- Icon -->
            <div style="display:flex;justify-content:center;margin-bottom:16px;">
                <div style="width:64px;height:64px;border-radius:50%;background:#f0f4ff;display:flex;align-items:center;justify-content:center;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0866ff" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </div>
            </div>

            <h2 style="text-align:center;margin:0 0 8px;font-size:22px;font-weight:800;color:#1c1e21;font-family:Helvetica,Arial,sans-serif;">Set New Password</h2>
            <p style="text-align:center;margin:0 0 24px;font-size:14px;color:#606770;font-family:Helvetica,Arial,sans-serif;">
                Choose a strong password for your account.
            </p>

            <!-- New password -->
           <div style="position:relative;width:100%;margin-bottom:12px;">
    <input type="password" id="new-password" placeholder="New password"
        style="width:100%;padding:14px 44px 14px 16px;border:1.5px solid #dddfe2;border-radius:12px;font-size:15px;outline:none;font-family:Helvetica,Arial,sans-serif;box-sizing:border-box;color:#1c1e21;">
    <button onclick="togglePasswordVisibility('new-password', 'eye-new')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:0;">
        <svg id="eye-new" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    </button>
</div>

            <!-- Confirm password -->
            <div style="position:relative;width:100%;margin-bottom:12px;">
    <input type="password" id="confirm-new-password" placeholder="Confirm new password"
        style="width:100%;padding:14px 44px 14px 16px;border:1.5px solid #dddfe2;border-radius:12px;font-size:15px;outline:none;font-family:Helvetica,Arial,sans-serif;box-sizing:border-box;color:#1c1e21;">
    <button onclick="togglePasswordVisibility('confirm-new-password', 'eye-confirm')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:0;">
        <svg id="eye-confirm" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    </button>
</div>

            <!-- Status -->
            <div id="new-pass-status" style="display:none;padding:12px;border-radius:10px;font-size:13px;text-align:center;margin-bottom:12px;font-family:Helvetica,Arial,sans-serif;"></div>

            <!-- Save button -->
            <button id="save-new-pass-btn"
                style="width:100%;padding:14px;border:none;border-radius:12px;background:#0866ff;color:white;font-size:15px;font-weight:700;cursor:pointer;font-family:Helvetica,Arial,sans-serif;">
                Save Password
            </button>

        </div>
    `;

    document.getElementById('save-new-pass-btn').onclick = async () => {
        const btn = document.getElementById('save-new-pass-btn');
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-new-password').value;
        const status = document.getElementById('new-pass-status');

        // Validation
        if (!newPassword) {
            status.textContent = 'Please enter a new password.';
            status.style.background = '#fff0f3';
            status.style.color = '#e41e3f';
            status.style.display = 'block';
            return;
        }
        if (newPassword.length < 6) {
            status.textContent = 'Password must be at least 6 characters.';
            status.style.background = '#fff0f3';
            status.style.color = '#e41e3f';
            status.style.display = 'block';
            return;
        }
        if (newPassword !== confirmPassword) {
            status.textContent = 'Passwords do not match.';
            status.style.background = '#fff0f3';
            status.style.color = '#e41e3f';
            status.style.display = 'block';
            return;
        }

        btn.disabled = true;
        btn.innerHTML = `<div class="spinner" style="width:18px;height:18px;border-width:2px;border-color:rgba(255,255,255,0.4);border-top-color:white;display:inline-block;vertical-align:middle;margin-right:8px;"></div> Saving...`;

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            status.textContent = error.message;
            status.style.background = '#fff0f3';
            status.style.color = '#e41e3f';
            status.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = 'Save Password';
        } else {
            // Success — go to home!
            status.innerHTML = '✅ Password updated! Taking you home...';
            status.style.background = '#f0fff4';
            status.style.color = '#25a244';
            status.style.display = 'block';

            setTimeout(async () => {
    await supabase.auth.signOut();
    state.user = null;
    router('login');
}, 1500);
        }
    };
}


function togglePasswordVisibility(inputId, eyeId) {
    const input = document.getElementById(inputId);
    const eye = document.getElementById(eyeId);
    if (input.type === 'password') {
        input.type = 'text';
        eye.setAttribute('stroke', '#0866ff');
    } else {
        input.type = 'password';
        eye.setAttribute('stroke', '#aaa');
    }
}


// -------------------------------------------------------------------------
// --- PUSH NOTIFICATIONS (OneSignal) ---
// -------------------------------------------------------------------------

async function requestPushPermission() {
    try {
        if (!window.OneSignalDeferred) return;

        window.OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.Notifications.requestPermission();

            // Tag user with their Supabase ID so we can target them
            await OneSignal.User.addTag('user_id', state.user.id);

            console.log('OneSignal permission granted and user tagged!');
        });
    } catch (err) {
        console.log('Push permission error:', err);
    }
}

async function sendPushNotification(userId, title, body) {
    try {
        await supabase.functions.invoke('send-push-notification', {
            body: { userId, title, body }
        });
    } catch (err) {
        console.log('Push send error:', err);
    }
}
//---- Zone 7: log out function and others-----------
window.showProfile = showProfile;
window.showEditProfile = showEditProfile;
window.showSettings = showSettings;
window.showFriendlies = showFriendlies;
window.loadMediaTab = loadMediaTab;
window.showSplash = showSplash;
window.showAccountSettings = showAccountSettings;
window.showPrivacySettings = showPrivacySettings;
window.showMoreSettings = showMoreSettings;
window.showPrivacyPolicy = showPrivacyPolicy;
window.showMessenger = showMessenger;
window.openChat = openChat;
window.showNewMessage = showNewMessage;
window.checkUnreadBadge = checkUnreadBadge;
window.showNotifications = showNotifications;
window.checkNotifBadge = checkNotifBadge;
window.createNotification = createNotification;
window.showHome = showHome;
window.showNotificationSettings = showNotificationSettings;
window.showForgotPassword = showForgotPassword;
window.showResetPassword = showResetPassword;
window.showLogin = showLogin;
window.togglePasswordVisibility = togglePasswordVisibility;
window.requestPushPermission = requestPushPermission;
window.sendPushNotification = sendPushNotification;


async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    state.user = session?.user || null;

    const hash = window.location.hash;
    if (hash && hash.includes('access_token') && hash.includes('type=recovery')) {
        showResetPassword();
        return;
    }

    router(state.user ? 'home' : 'login');
    if (state.user) {
        checkUnreadBadge();
        checkNotifBadge();
        requestPushPermission();
    }
}
// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('SW registered'))
        .catch(err => console.log('SW error:', err));
}

supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
        showResetPassword();
        return;
    }
});

window.onload = () => {
    showSplash();
};

window.state = state;
window.router = router;