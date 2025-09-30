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
     * 重置 GIF 以实现循环播放。
     * 对于浏览器中作为 <img> 的 GIF，没有原生 loop 属性控制每次播放结束后的事件；
     * 通过替换 src（追加一个虚拟查询参数）强制浏览器重新加载，从而实现无缝循环。
     * 只有当元素进入视窗时才开始循环，离开视窗时停止，避免资源浪费。
     * @returns {void}
     */
    (function setupLoopingGifs() {
        const gifs = document.querySelectorAll('img.looping-gif');
        if (gifs.length === 0) return;

        /**
         * 为单个 GIF 启动循环刷新。
         * @param {HTMLImageElement} img - 目标 GIF 图像元素
         * @returns {() => void} 取消函数
         */
        function startLoop(img) {
            // 若作者提前设置了 data-interval(ms)，则使用；否则默认 0 代表按自然时长刷新
            const customInterval = Number(img.getAttribute('data-interval'));

            let rafId = 0;
            let lastWidth = 0;

            // 使用 setTimeout 基于 naturalWidth 的变化估计 GIF 加载完成后再触发首次刷新
            let timerId = 0;

            // 估算一帧刷新：通过重置 src 实现
            const refresh = () => {
                const baseSrc = img.getAttribute('data-src') || img.src.split('?')[0];
                img.setAttribute('data-src', baseSrc);
                img.src = baseSrc + '?_=' + Date.now();
            };

            // 如果未提供间隔，则尝试通过观察 naturalWidth 与完整解码来延后刷新触发
            const scheduleNext = () => {
                if (Number.isFinite(customInterval) && customInterval > 0) {
                    timerId = window.setTimeout(refresh, customInterval);
                } else {
                    // 回退策略：大多数浏览器会在 GIF 末尾停住最后一帧一小段时间；
                    // 这里保守选取 3000ms，用户可通过 data-interval 覆盖。
                    timerId = window.setTimeout(refresh, 3000);
                }
            };

            // 当尺寸首次稳定后开始调度
            const onFrame = () => {
                const w = img.naturalWidth;
                if (w !== 0 && w === lastWidth) {
                    scheduleNext();
                    return;
                }
                lastWidth = w;
                rafId = window.requestAnimationFrame(onFrame);
            };

            rafId = window.requestAnimationFrame(onFrame);

            return () => {
                window.clearTimeout(timerId);
                if (rafId) window.cancelAnimationFrame(rafId);
            };
        }

        const stopFns = new Map();

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const img = entry.target;
                if (entry.isIntersecting) {
                    if (!stopFns.has(img)) {
                        const stop = startLoop(img);
                        stopFns.set(img, stop);
                    }
                } else {
                    const stop = stopFns.get(img);
                    if (stop) {
                        stop();
                        stopFns.delete(img);
                    }
                }
            });
        }, { threshold: 0.2 });

        gifs.forEach(img => observer.observe(img));
    })();
})
