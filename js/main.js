/* ==========================================================================
   Jeff Livingston — Brochure Site Scripts
   ========================================================================== */

(function () {
  'use strict';

  // ---------- Navigation scroll effect ----------
  const nav = document.getElementById('nav');

  function handleNavScroll() {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });

  // ---------- Mobile menu toggle ----------
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');

  toggle.addEventListener('click', function () {
    toggle.classList.toggle('active');
    menu.classList.toggle('open');
  });

  // Close menu when a link is clicked
  document.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      toggle.classList.remove('active');
      menu.classList.remove('open');
    });
  });

  // ---------- Active nav link on scroll ----------
  const sections = document.querySelectorAll('.section, .hero');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateActiveLink() {
    var scrollPos = window.scrollY + 150;

    sections.forEach(function (section) {
      var top = section.offsetTop;
      var height = section.offsetHeight;
      var id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });

  // ---------- Scroll-reveal animations ----------
  function initScrollReveal() {
    var elements = document.querySelectorAll(
      '.about-grid, .about-photo, .about-text, ' +
      '.timeline-item, ' +
      '.interest-card, ' +
      '.contact-info, .contact-form'
    );

    elements.forEach(function (el) {
      el.classList.add('fade-in');
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  initScrollReveal();

  // ---------- Contact form ----------
  var form = document.getElementById('contact-form');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = form.querySelector('#name').value.trim();
    var email = form.querySelector('#email').value.trim();
    var message = form.querySelector('#message').value.trim();

    if (!name || !email || !message) return;

    // Build mailto link as a simple fallback (no backend required)
    var subject = encodeURIComponent('Message from ' + name);
    var body = encodeURIComponent(
      'Name: ' + name + '\nEmail: ' + email + '\n\n' + message
    );

    window.location.href =
      'mailto:jeff@jefflivingston.com?subject=' + subject + '&body=' + body;
  });
})();
