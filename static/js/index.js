window.HELP_IMPROVE_VIDEOJS = false;

// More Works Dropdown Functionality
function toggleMoreWorks() {
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        button.classList.add('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const container = document.querySelector('.more-works-container');
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (container && !container.contains(event.target)) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Close dropdown on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('moreWorksDropdown');
        const button = document.querySelector('.more-works-btn');
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    const copyText = button.querySelector('.copy-text');
    
    if (bibtexElement) {
        navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
            // Success feedback
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bibtexElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        });
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Video carousel autoplay when in view
function setupVideoCarouselAutoplay() {
    const carouselVideos = document.querySelectorAll('.results-carousel video');
    
    if (carouselVideos.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Video is in view, play it
                video.play().catch(e => {
                    // Autoplay failed, probably due to browser policy
                    console.log('Autoplay prevented:', e);
                });
            } else {
                // Video is out of view, pause it
                video.pause();
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the video is visible
    });
    
    carouselVideos.forEach(video => {
        observer.observe(video);
    });
}

$(document).ready(function() {
    // Check for click events on the navbar burger icon

    var options = {
		slidesToScroll: 1,
		slidesToShow: 1,
		loop: true,
		infinite: true,
		autoplay: true,
		autoplaySpeed: 5000,
    }

	// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);
	
    bulmaSlider.attach();
    
    // Setup video autoplay for carousel
    setupVideoCarouselAutoplay();

    /**
     * 稳定循环播放 GIF：
     * - 进入视窗时启动，离开视窗或页面隐藏时暂停
     * - 通过离屏预加载 + decode 后再替换 src，避免闪烁
     * - 支持通过 data-interval(ms) 自定义刷新间隔；未设置时使用保守默认值
     * @returns {void}
     */
    (function setupStableGifLooping() {
        const gifImages = document.querySelectorAll('img.looping-gif');
        if (gifImages.length === 0) return;

        /**
         * 获取基础 URL（去除 cache-busting 查询参数）。
         * @param {HTMLImageElement} img - 目标 GIF
         * @returns {string}
         */
        function getBaseSrc(img) {
            const raw = img.getAttribute('data-src') || img.src || '';
            const idx = raw.indexOf('?');
            return idx >= 0 ? raw.slice(0, idx) : raw;
        }

        /**
         * 预加载并无缝替换 src 以重启 GIF 播放。
         * @param {HTMLImageElement} img - 目标 GIF
         * @param {() => void} onDone - 完成回调
         * @returns {void}
         */
        function reloadGifOnce(img, onDone) {
            const base = getBaseSrc(img);
            img.setAttribute('data-src', base);
            const nextUrl = base + '?_=' + Date.now();

            const preloader = new Image();
            preloader.decoding = 'sync';
            // 尽量继承属性，减少跨域与策略差异
            preloader.crossOrigin = img.crossOrigin || null;
            if (img.referrerPolicy) preloader.referrerPolicy = img.referrerPolicy;

            const finalize = () => {
                img.src = nextUrl;
                if (typeof onDone === 'function') onDone();
            };

            preloader.onload = () => {
                if (typeof preloader.decode === 'function') {
                    preloader.decode().then(finalize).catch(finalize);
                } else {
                    finalize();
                }
            };
            preloader.onerror = finalize;
            preloader.src = nextUrl;
        }

        /**
         * 启动对单个 GIF 的稳定循环。
         * @param {HTMLImageElement} img - 目标 GIF
         * @returns {() => void} 停止函数
         */
        function startStableLoop(img) {
            const customInterval = Number(img.getAttribute('data-interval'));
            const intervalMs = Number.isFinite(customInterval) && customInterval > 0 ? customInterval : 3000;

            let timerId = 0;
            let stopped = false;

            const schedule = () => {
                if (stopped) return;
                timerId = window.setTimeout(() => {
                    reloadGifOnce(img, () => {
                        // 下一次在刷新完成后再排程，避免竞争
                        schedule();
                    });
                }, intervalMs);
            };

            // 首次调度：若 GIF 本身会自然循环，下面的刷新可视为“保底”以避免停顿
            schedule();

            return () => {
                stopped = true;
                window.clearTimeout(timerId);
            };
        }

        const stopHandles = new Map();

        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const img = entry.target;
                if (entry.isIntersecting) {
                    if (!stopHandles.has(img)) {
                        const stop = startStableLoop(img);
                        stopHandles.set(img, stop);
                    }
                } else {
                    const stop = stopHandles.get(img);
                    if (stop) {
                        stop();
                        stopHandles.delete(img);
                    }
                }
            });
        }, { threshold: 0.5 });

        // 页面可见性变化时暂停/恢复，节约资源
        document.addEventListener('visibilitychange', () => {
            const hidden = document.hidden;
            gifImages.forEach((img) => {
                const stop = stopHandles.get(img);
                if (hidden && stop) {
                    stop();
                    stopHandles.delete(img);
                } else if (!hidden && io) {
                    // 触发一次重新判定
                    io.unobserve(img);
                    io.observe(img);
                }
            });
        });

        gifImages.forEach(img => io.observe(img));
    })();
})

