/* NAV — add scrolled class once user scrolls */
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


/* KLAVIYO SUBSCRIBE — shared submit handler for popup + on-page forms */
function kkBindWaitlistForm(cfg) {
    const form      = document.getElementById(cfg.form);
    if (!form) return;

    const nameIn    = document.getElementById(cfg.name);
    const emailIn   = document.getElementById(cfg.email);
    const errName   = document.getElementById(cfg.errName);
    const errEmail  = document.getElementById(cfg.errEmail);
    const submitBtn = document.getElementById(cfg.submit);
    const formBlock = document.getElementById(cfg.formBlock);
    const successEl = document.getElementById(cfg.success);

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const submitLabel = submitBtn.textContent.trim();

    function markErr(input, msg)  { input.classList.add('is-error');    msg.classList.add('show'); }
    function clearErr(input, msg) { input.classList.remove('is-error'); msg.classList.remove('show'); }

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

        /* Klaviyo client subscriptions API.
           NOTE: from revision 2024-02-15 onward the list must be passed as a
           relationship (data.relationships.list) — passing `list_id` inside
           attributes returns 400 "'list_id' is not a valid field for the
           resource 'subscription'". Content-Type must be vnd.api+json. */
        fetch('https://a.klaviyo.com/client/subscriptions/?company_id=YpD5LG', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/vnd.api+json',
                'revision': '2024-02-15'
            },
            body: JSON.stringify({
                data: {
                    type: 'subscription',
                    attributes: {
                        custom_source: cfg.source || 'Website signup form',
                        profile: {
                            data: {
                                type: 'profile',
                                attributes: {
                                    email: email,
                                    first_name: name
                                }
                            }
                        }
                    },
                    relationships: {
                        list: {
                            data: { type: 'list', id: 'SiJFQa' }
                        }
                    }
                }
            })
        })
        .then(function (res) {
            if (!res.ok && res.status !== 202) throw new Error('Klaviyo error');

            try { localStorage.setItem('kk_jetset_joined', '1'); } catch (err) {}

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
            submitBtn.textContent = submitLabel;
            errEmail.textContent = 'Something went wrong — please try again.';
            errEmail.classList.add('show');
        });
    });
}


/* JET-SET CLUB POPUP — open / close / soft auto-trigger */
(function () {
    const overlay  = document.getElementById('jetset-overlay');
    const closeBtn = document.getElementById('jetset-close');

    const SHOWN_KEY  = 'kk_jetset_shown';
    const JOINED_KEY = 'kk_jetset_joined';

    function store(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
    function read(key)       { try { return localStorage.getItem(key); } catch (e) { return null; } }

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

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closePopup();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('open')) closePopup();
    });

    /* Explicit openers: hero CTA, sidebar link, product-card CTAs */
    document.querySelectorAll('#hero-jetset-btn, .jetset-open').forEach(function (btn) {
        btn.addEventListener('click', openPopup);
    });

    const sidebarBtn = document.getElementById('sidebar-jetset-btn');
    if (sidebarBtn) {
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
    }

    /* Soft auto-trigger: once per visitor, after 8s OR 40% scroll depth —
       and never for visitors who already joined the list. */
    if (!read(SHOWN_KEY) && !read(JOINED_KEY)) {
        let fired = false;

        function fire() {
            if (fired) return;
            if (overlay.classList.contains('open')) return;
            fired = true;
            store(SHOWN_KEY, '1');
            openPopup();
            window.removeEventListener('scroll', onScroll);
        }

        function onScroll() {
            const depth = (window.scrollY + window.innerHeight) /
                          document.documentElement.scrollHeight;
            if (depth > 0.4) fire();
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        setTimeout(fire, 8000);
    }

    /* Bind popup form */
    kkBindWaitlistForm({
        form: 'popup-waitlist-form',
        name: 'popup-field-name',
        email: 'popup-field-email',
        errName: 'popup-err-name',
        errEmail: 'popup-err-email',
        submit: 'popup-submit-btn',
        formBlock: 'popup-form-block',
        success: 'popup-success-block',
        source: 'Jet-Set Club popup'
    });

    /* Bind on-page waitlist form */
    kkBindWaitlistForm({
        form: 'waitlist-form',
        name: 'waitlist-field-name',
        email: 'waitlist-field-email',
        errName: 'waitlist-err-name',
        errEmail: 'waitlist-err-email',
        submit: 'waitlist-submit-btn',
        formBlock: 'waitlist-form-block',
        success: 'waitlist-success-block',
        source: 'Homepage waitlist section'
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


/* ============================================================
   COMMERCE — cart drawer, add to cart, PDP  (launch build)
   ============================================================ */
(function () {
    'use strict';

    var drawer  = document.getElementById('kk-cart');
    var overlay = document.getElementById('kk-cart-overlay');
    if (!drawer || !overlay) return;

    var closeBtn   = document.getElementById('kk-cart-close');
    var toggleBtn  = document.getElementById('cart-toggle');
    var badge      = document.getElementById('cart-count');
    var linesEl    = document.getElementById('kk-cart-lines');
    var emptyEl    = document.getElementById('kk-cart-empty');
    var footEl     = document.getElementById('kk-cart-foot');
    var subtotalEl = document.getElementById('kk-cart-subtotal');
    var titleCount = document.getElementById('kk-cart-title-count');

    var currencyCode = 'USD';

    function money(cents) {
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode
            }).format(cents / 100);
        } catch (e) {
            return '$' + (cents / 100).toFixed(2);
        }
    }

    function esc(str) {
        var d = document.createElement('div');
        d.textContent = str == null ? '' : String(str);
        return d.innerHTML;
    }

    /* ---------- drawer open / close ---------- */
    function openDrawer() {
        drawer.classList.add('open');
        overlay.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    }

    function closeDrawer() {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            refreshCart().then(openDrawer);
        });
    }

    /* ---------- cart state ---------- */
    function fetchCart() {
        return fetch('/cart.js', { headers: { 'Accept': 'application/json' } })
            .then(function (r) { return r.json(); });
    }

    function renderCart(cart) {
        currencyCode = cart.currency || currencyCode;

        if (badge) {
            badge.textContent = cart.item_count;
            badge.hidden = cart.item_count === 0;
        }
        if (titleCount) {
            titleCount.textContent = cart.item_count > 0 ? '(' + cart.item_count + ')' : '';
        }

        if (cart.item_count === 0) {
            linesEl.innerHTML = '';
            emptyEl.hidden = false;
            footEl.hidden  = true;
            return;
        }

        emptyEl.hidden = true;
        footEl.hidden  = false;
        subtotalEl.textContent = money(cart.items_subtotal_price);

        linesEl.innerHTML = cart.items.map(function (item) {
            var variantLine = (item.variant_title && item.variant_title !== 'Default Title')
                ? '<span class="kk-line__variant">' + esc(item.variant_title) + '</span>'
                : '';
            var img = item.image
                ? '<img src="' + esc(item.image) + '" alt="' + esc(item.product_title) + '" loading="lazy">'
                : '';
            return (
                '<div class="kk-line" data-key="' + esc(item.key) + '">' +
                  '<a class="kk-line__img" href="' + esc(item.url) + '">' + img + '</a>' +
                  '<div class="kk-line__info">' +
                    '<a class="kk-line__title" href="' + esc(item.url) + '">' + esc(item.product_title) + '</a>' +
                    variantLine +
                    '<span class="kk-line__price">' + money(item.final_line_price) + '</span>' +
                    '<div class="kk-line__controls">' +
                      '<button type="button" class="kk-qty-btn" data-action="minus" aria-label="Decrease quantity">&minus;</button>' +
                      '<span class="kk-qty">' + item.quantity + '</span>' +
                      '<button type="button" class="kk-qty-btn" data-action="plus" aria-label="Increase quantity">+</button>' +
                      '<button type="button" class="kk-line__remove" data-action="remove">Remove</button>' +
                    '</div>' +
                  '</div>' +
                '</div>'
            );
        }).join('');
    }

    function refreshCart() {
        return fetchCart().then(renderCart).catch(function () {});
    }

    /* ---------- quantity changes / remove ---------- */
    linesEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var line = btn.closest('.kk-line');
        var key  = line.getAttribute('data-key');
        var qty  = parseInt(line.querySelector('.kk-qty').textContent, 10);

        var action = btn.getAttribute('data-action');
        if (action === 'plus')   qty += 1;
        if (action === 'minus')  qty -= 1;
        if (action === 'remove') qty = 0;
        if (qty < 0) qty = 0;

        line.classList.add('kk-line--busy');
        fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ id: key, quantity: qty })
        })
        .then(function (r) { return r.json(); })
        .then(renderCart)
        .catch(function () { line.classList.remove('kk-line--busy'); });
    });

    /* ---------- add to cart ---------- */
    function addToCart(variantId) {
        return fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ items: [{ id: parseInt(variantId, 10), quantity: 1 }] })
        }).then(function (r) {
            if (!r.ok) {
                return r.json().then(function (err) {
                    throw new Error(err.description || err.message || 'Could not add to bag.');
                });
            }
            return r.json();
        });
    }

    function showMsg(scope, text) {
        var msg = scope.querySelector('.kk-buy-msg');
        if (!msg) return;
        msg.textContent = text || '';
        msg.classList.toggle('show', !!text);
    }

    /* pill selection (homepage cards + PDP) */
    document.addEventListener('click', function (e) {
        var pill = e.target.closest('.kk-pill');
        if (!pill || pill.disabled) return;
        var group = pill.closest('.kk-pills');
        group.querySelectorAll('.kk-pill').forEach(function (p) { p.classList.remove('selected'); });
        pill.classList.add('selected');

        /* PDP: sync hidden input + price */
        var pdpInput = document.getElementById('pdp-variant-id');
        if (pdpInput && group.classList.contains('kk-pills--pdp')) {
            pdpInput.value = pill.getAttribute('data-variant-id');
            var priceEl = document.getElementById('pdp-price');
            var p = pill.getAttribute('data-price');
            if (priceEl && p) priceEl.textContent = p;
        }
        showMsg(pill.closest('.kk-buy') || pill.closest('.pdp__form') || document, '');
    });

    /* homepage card add buttons */
    document.querySelectorAll('.kk-add-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var buy = btn.closest('.kk-buy');
            var variantId = null;

            var single = buy.querySelector('.kk-single-variant');
            if (single) variantId = single.value;

            var selected = buy.querySelector('.kk-pill.selected');
            if (selected) variantId = selected.getAttribute('data-variant-id');

            if (!variantId) {
                showMsg(buy, 'Please select a size.');
                return;
            }

            var label = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Adding…';
            showMsg(buy, '');

            addToCart(variantId)
                .then(refreshCart)
                .then(function () {
                    btn.disabled = false;
                    btn.textContent = label;
                    openDrawer();
                })
                .catch(function (err) {
                    btn.disabled = false;
                    btn.textContent = label;
                    showMsg(buy, err.message);
                });
        });
    });

    /* PDP form: AJAX add, native POST as fallback */
    var pdpForm = document.getElementById('pdp-form');
    if (pdpForm) {
        pdpForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = pdpForm.querySelector('.kk-pdp-add');
            var variantId = document.getElementById('pdp-variant-id').value;
            var label = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Adding…';
            showMsg(pdpForm, '');

            addToCart(variantId)
                .then(refreshCart)
                .then(function () {
                    btn.disabled = false;
                    btn.textContent = label;
                    openDrawer();
                })
                .catch(function (err) {
                    btn.disabled = false;
                    btn.textContent = label;
                    showMsg(pdpForm, err.message || 'Something went wrong — please try again.');
                });
        });
    }

    /* PDP thumbnails */
    document.querySelectorAll('.pdp__thumb').forEach(function (thumb) {
        thumb.addEventListener('click', function () {
            var main = document.getElementById('pdp-main-image');
            if (!main) return;
            main.src = thumb.getAttribute('data-full');
            document.querySelectorAll('.pdp__thumb').forEach(function (t) { t.classList.remove('active'); });
            thumb.classList.add('active');
        });
    });

    /* boot */
    refreshCart();
}());
