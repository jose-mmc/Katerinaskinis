/* NAV — add scrolled class once user leaves the hero */
(function () {
    const nav = document.getElementById('nav');

    function tick() {
        nav.classList.toggle('scrolled', window.scrollY > 55);
    }

    window.addEventListener('scroll', tick, { passive: true });
    tick();
}());


/* SCROLL REVEAL — IntersectionObserver for .reveal elements */
(function () {
    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    io.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}());


/* ACCORDION — exclusive open/close with ARIA */
(function () {
    const buttons = document.querySelectorAll('.accordion__btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', function () {
            const wasOpen = this.classList.contains('open');
            const bodyId  = this.getAttribute('aria-controls');
            const body    = document.getElementById(bodyId);

            buttons.forEach(b => {
                b.classList.remove('open');
                b.setAttribute('aria-expanded', 'false');
                document.getElementById(b.getAttribute('aria-controls'))
                        .classList.remove('open');
            });

            if (!wasOpen) {
                this.classList.add('open');
                this.setAttribute('aria-expanded', 'true');
                body.classList.add('open');
            }
        });
    });
}());


/* JET-SET CLUB POPUP — open / close / form submission */
(function () {
    const overlay    = document.getElementById('jetset-overlay');
    const closeBtn   = document.getElementById('jetset-close');
    const heroBtn    = document.getElementById('hero-jetset-btn');
    const sidebarBtn = document.getElementById('sidebar-jetset-btn');
    const form       = document.getElementById('popup-waitlist-form');
    const nameIn     = document.getElementById('popup-field-name');
    const emailIn    = document.getElementById('popup-field-email');
    const errName    = document.getElementById('popup-err-name');
    const errEmail   = document.getElementById('popup-err-email');
    const submitBtn  = document.getElementById('popup-submit-btn');
    const formBlock  = document.getElementById('popup-form-block');
    const successEl  = document.getElementById('popup-success-block');

    const EMAIL_RE   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const SESSION_KEY = 'kk_jetset_shown';

    function openPopup() {
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    }

    function closePopup() {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closePopup);
    heroBtn.addEventListener('click', openPopup);
    sidebarBtn.addEventListener('click', function () {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('open');
        document.getElementById('burger-btn').classList.remove('open');
        document.getElementById('burger-btn').setAttribute('aria-expanded', 'false');
        document.getElementById('sidebar').setAttribute('aria-hidden', 'true');
        document.getElementById('sidebar-overlay').setAttribute('aria-hidden', 'true');
        document.body.classList.remove('sidebar-open');
        openPopup();
    });

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closePopup();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('open')) closePopup();
    });

    if (!sessionStorage.getItem(SESSION_KEY)) {
        // Open on first click anywhere on the page
        document.addEventListener('click', function (e) {
            if (overlay.classList.contains('open')) return;
            if (!sessionStorage.getItem(SESSION_KEY)) {
                openPopup();
                sessionStorage.setItem(SESSION_KEY, '1');
            }
        }, { once: true });

        // Fallback: also open after 2.2s if user hasn't clicked yet
        setTimeout(function () {
            if (!sessionStorage.getItem(SESSION_KEY)) {
                openPopup();
                sessionStorage.setItem(SESSION_KEY, '1');
            }
        }, 2200);
    }

    function markErr(input, msg) {
        input.classList.add('is-error');
        msg.classList.add('show');
    }

    function clearErr(input, msg) {
        input.classList.remove('is-error');
        msg.classList.remove('show');
    }

    nameIn.addEventListener('input',  () => clearErr(nameIn,  errName));
    emailIn.addEventListener('input', () => clearErr(emailIn, errEmail));

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const name  = nameIn.value.trim();
        const email = emailIn.value.trim();
        let ok = true;

        if (!name) { markErr(nameIn, errName); ok = false; }
        else        { clearErr(nameIn, errName); }

        if (!EMAIL_RE.test(email)) { markErr(emailIn, errEmail); ok = false; }
        else                        { clearErr(emailIn, errEmail); }

        if (!ok) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing…';

        fetch('https://a.klaviyo.com/client/subscriptions/?company_id=YpD5LG', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'revision': '2024-02-15'
            },
            body: JSON.stringify({
                data: {
                    type: 'subscription',
                    attributes: {
                        list_id: 'SiJFQa',
                        profile: {
                            data: {
                                type: 'profile',
                                attributes: {
                                    email: email,
                                    first_name: name
                                }
                            }
                        }
                    }
                }
            })
        })
        .then(function (res) {
            if (!res.ok && res.status !== 202) throw new Error('Klaviyo error');
            formBlock.style.transition = 'opacity 0.45s ease';
            formBlock.style.opacity    = '0';

            setTimeout(function () {
                formBlock.style.display = 'none';
                successEl.classList.add('show');

                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        successEl.classList.add('animate');
                    });
                });
            }, 460);
        })
        .catch(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Claim My 15% Off';
            errEmail.textContent = 'Something went wrong — please try again.';
            errEmail.classList.add('show');
        });
    });
}());


/* SIDEBAR — open / close / close-on-nav-click */
(function () {
    const burgerBtn = document.getElementById('burger-btn');
    const sidebar   = document.getElementById('sidebar');
    const overlay   = document.getElementById('sidebar-overlay');
    const closeBtn  = document.getElementById('sidebar-close');
    const sideLinks = sidebar.querySelectorAll('a');

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('open');
        burgerBtn.classList.add('open');
        burgerBtn.setAttribute('aria-expanded', 'true');
        sidebar.setAttribute('aria-hidden', 'false');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('sidebar-open');
        closeBtn.focus();
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        burgerBtn.classList.remove('open');
        burgerBtn.setAttribute('aria-expanded', 'false');
        sidebar.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('sidebar-open');
        burgerBtn.focus();
    }

    burgerBtn.addEventListener('click', function () {
        sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });

    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    sideLinks.forEach(function (link) {
        link.addEventListener('click', closeSidebar);
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });
}());
