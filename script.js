document.addEventListener("DOMContentLoaded", () => {
	const header = document.getElementById("siteHeader");
	const toggleButtons = document.querySelectorAll("[data-toggle]");
	const colorInputs = document.querySelectorAll("[data-color]");
	const canvas = document.getElementById("espCanvas");
	const ctx = canvas?.getContext("2d");
	const characterImg = document.getElementById("characterReference");
	const revealTargets = document.querySelectorAll("[data-reveal]");

	if (!header || !ctx) {
		return;
	}

	const defaultState = {
		esp: true,
		skeleton: true,
		box: true,
		colors: {
			esp: "#3f7fff",
			skeleton: "#000000",
			box: "#000000"
		}
	};

	let state = { ...defaultState };

	try {
		const saved = localStorage.getItem("elysium_cheat_state");
		if (saved) {
			const parsed = JSON.parse(saved);
			state = {
				...defaultState,
				...parsed,
				colors: { ...defaultState.colors, ...(parsed.colors || {}) }
			};
		}
	} catch (e) {
		console.warn("Failed to load state", e);
	}

	function saveState() {
		localStorage.setItem("elysium_cheat_state", JSON.stringify(state));
	}

	// Initialize UI from state
	toggleButtons.forEach((btn) => {
		const key = btn.dataset.toggle;
		if (state.hasOwnProperty(key)) {
			btn.checked = state[key];
		}
	});

	colorInputs.forEach((input) => {
		const key = input.dataset.color;
		if (state.colors && state.colors[key]) {
			input.value = state.colors[key];
		}
	});

	const spriteMeta = {
		dimensions: { width: 274, height: 537 },
		bounds: { left: 0.03, top: 0, right: 0.97, bottom: 0.97 },
		joints: {
			head: { x: 0.5882, y: 0.1713 },
			neck: { x: 0.6292, y: 0.2793 },
			leftShoulder: { x: 0.438, y: 0.3166 },
			rightShoulder: { x: 0.6987, y: 0.3166 },
			leftElbow: { x: 0.3015, y: 0.4169 },
			rightElbow: { x: 0.7464, y: 0.4469 },
			leftHand: { x: 0.0965, y: 0.5100 },
			rightHand: { x: 0.8394, y: 0.5866 },
			spine: { x: 0.5109, y: 0.4842 },
			pelvis: { x: 0.4959, y: 0.5059 },
			leftHip: { x: 0.4591, y: 0.6257 },
			rightHip: { x: 0.6174, y: 0.6257 },
			leftKnee: { x: 0.5027, y: 0.7821 },
			rightKnee: { x: 0.7174, y: 0.7821 },
			leftFoot: { x: 0.5496, y: 0.9311 },
			rightFoot: { x: 0.7900, y: 0.9311 }
		}
	};

	const fallbackRatios = {
		head: { x: 0.5194, y: 0.1766 },
		neck: { x: 0.5311, y: 0.2879 },
		leftShoulder: { x: 0.434, y: 0.3264 },
		rightShoulder: { x: 0.6476, y: 0.3264 },
		leftElbow: { x: 0.3952, y: 0.4607 },
		rightElbow: { x: 0.7834, y: 0.4607 },
		leftHand: { x: 0.3564, y: 0.5952 },
		rightHand: { x: 0.8611, y: 0.6047 },
		spine: { x: 0.5116, y: 0.4992 },
		pelvis: { x: 0.5116, y: 0.6143 },
		leftHip: { x: 0.4884, y: 0.6451 },
		rightHip: { x: 0.5504, y: 0.6451 },
		leftKnee: { x: 0.4922, y: 0.8063 },
		rightKnee: { x: 0.5504, y: 0.8063 },
		leftFoot: { x: 0.5038, y: 0.9599 },
		rightFoot: { x: 0.5582, y: 0.9599 }
	};

	const segments = [
		["head", "neck"],
		["neck", "leftShoulder"],
		["neck", "rightShoulder"],
		["leftShoulder", "leftElbow"],
		["leftElbow", "leftHand"],
		["rightShoulder", "rightElbow"],
		["rightElbow", "rightHand"],
		["neck", "spine"],
		["spine", "pelvis"],
		["pelvis", "leftHip"],
		["pelvis", "rightHip"],
		["leftHip", "leftKnee"],
		["rightHip", "rightKnee"],
		["leftKnee", "leftFoot"],
		["rightKnee", "rightFoot"]
	];

	let imageReady = false;

	// Page Navigation Logic
	const wrapper = document.querySelector('.pages-wrapper');
	const pages = document.querySelectorAll('.page');
	const navLinks = document.querySelectorAll('.primary-nav a');
	const ctaLinks = document.querySelectorAll('.hero-actions a');

	function navigateToPage(index) {
		if (wrapper) {
			wrapper.style.transform = `translateX(-${index * 100}vw)`;
			
			// Update header state based on the new page's scroll position
			const targetPage = pages[index];
			if (targetPage) {
				if (targetPage.scrollTop > 12) {
					header.classList.add("is-floating");
				} else {
					header.classList.remove("is-floating");
				}
			}
		}
	}

	navLinks.forEach((link, index) => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			navigateToPage(index);
		});
	});

	// Handle CTA buttons
	ctaLinks.forEach(link => {
		link.addEventListener('click', (e) => {
			const href = link.getAttribute('href');
			if (href === '#creators') {
				e.preventDefault();
				navigateToPage(1); // Creators is index 1
			} else if (href === '#preview') {
				e.preventDefault();
				// Smooth scroll to preview section within home page
				const previewSection = document.getElementById('preview');
				if (previewSection) {
					previewSection.scrollIntoView({ behavior: 'smooth' });
				}
			}
		});
	});

	function handleScroll(e) {
		// If called from event, use e.target, otherwise check active page?
		// Actually, we attach this to all pages, so e.target is the scrolling page.
		const target = e.target || pages[0]; // Default to home if no event (initial load)
		
		if (target.scrollTop > 12) {
			header.classList.add("is-floating");
		} else {
			header.classList.remove("is-floating");
		}
	}

	// Attach scroll listener to all pages
	pages.forEach(page => {
		page.addEventListener("scroll", handleScroll, { passive: true });
	});

	function drawScene() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		drawBackdrop();
		const metrics = drawCharacter();

		if (!state.esp || !metrics) {
			return;
		}

		if (state.box) {
			drawBox(state.colors.box, metrics.bounds);
		}

		if (state.skeleton) {
			drawSkeleton(state.colors.skeleton, metrics);
		}
	}

	function drawBackdrop() {
		const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
		gradient.addColorStop(0, "rgba(146, 179, 255, 0.45)");
		gradient.addColorStop(1, "rgba(226, 235, 255, 0)");

		ctx.save();
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.restore();
	}

	function drawCharacter() {
		ctx.save();
		ctx.translate(0.5, 0.5);

		if (imageReady && characterImg?.naturalWidth && characterImg?.naturalHeight) {
			const padding = 28;
			const availableWidth = canvas.width - padding * 2;
			const availableHeight = canvas.height - padding * 2;
			const scale = Math.min(
				availableWidth / spriteMeta.dimensions.width,
				availableHeight / spriteMeta.dimensions.height
			);

			const imgWidth = spriteMeta.dimensions.width * scale;
			const imgHeight = spriteMeta.dimensions.height * scale;
			const imgX = (canvas.width - imgWidth) / 2;
			const imgY = padding + (availableHeight - imgHeight) / 2;

			ctx.save();
			ctx.fillStyle = "rgba(111, 151, 255, 0.22)";
			ctx.filter = "blur(32px)";
			ctx.fillRect(imgX + imgWidth * 0.28, imgY + imgHeight * 0.12, imgWidth * 0.44, imgHeight * 0.78);
			ctx.restore();

			ctx.drawImage(characterImg, imgX, imgY, imgWidth, imgHeight);

			const { bounds: normalizedBounds, joints: jointRatios } = spriteMeta;
			const bounds = {
				x: imgX + imgWidth * normalizedBounds.left,
				y: imgY + imgHeight * normalizedBounds.top,
				w: imgWidth * (normalizedBounds.right - normalizedBounds.left),
				h: imgHeight * (normalizedBounds.bottom - normalizedBounds.top) + 11
			};

			const jointPositions = {};
			Object.entries(jointRatios).forEach(([key, ratio]) => {
				jointPositions[key] = {
					x: imgX + ratio.x * imgWidth,
					y: imgY + ratio.y * imgHeight
				};
			});

			ctx.restore();
			return { bounds, joints: jointPositions };
		}

		const fallbackBounds = {
			x: canvas.width * 0.32,
			y: canvas.height * 0.06,
			w: canvas.width * 0.36,
			h: canvas.height * 0.88
		};
		renderFallbackSilhouette(fallbackBounds);

		const jointPositions = {};
		Object.entries(fallbackRatios).forEach(([key, ratio]) => {
			jointPositions[key] = {
				x: fallbackBounds.x + fallbackBounds.w * ratio.x,
				y: fallbackBounds.y + fallbackBounds.h * ratio.y
			};
		});

		ctx.restore();
		return { bounds: fallbackBounds, joints: jointPositions };
	}

	function renderFallbackSilhouette(bounds) {
		ctx.save();
		ctx.fillStyle = "rgba(127, 172, 255, 0.2)";
		ctx.beginPath();
		ctx.arc(bounds.x + bounds.w / 2, bounds.y + bounds.h * 0.14, bounds.w * 0.38, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = "rgba(127, 196, 255, 0.16)";
		ctx.fillRect(bounds.x + bounds.w * 0.22, bounds.y + bounds.h * 0.32, bounds.w * 0.56, bounds.h * 0.64);
		ctx.restore();
	}

	function drawAccent(color, bounds) {
		const center = {
			x: bounds.x + bounds.w / 2,
			y: bounds.y + bounds.h / 2
		};

		ctx.save();
		ctx.strokeStyle = color;
		ctx.globalAlpha = 0.8;
		ctx.lineWidth = 1.4;
		ctx.shadowColor = color;
		ctx.shadowBlur = 10;

		ctx.beginPath();
		ctx.moveTo(center.x - bounds.w * 0.28, center.y);
		ctx.lineTo(center.x + bounds.w * 0.28, center.y);
		ctx.moveTo(center.x, center.y - bounds.h * 0.28);
		ctx.lineTo(center.x, center.y + bounds.h * 0.28);
		ctx.stroke();

		ctx.setLineDash([6, 10]);
		ctx.beginPath();
		ctx.arc(center.x, center.y, Math.max(bounds.w, bounds.h) * 0.7, 0, Math.PI * 2);
		ctx.stroke();

		ctx.restore();
	}

	function drawBox(color, bounds) {
		ctx.save();
		ctx.strokeStyle = color;
		ctx.lineWidth = 2.2;

		ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);

		ctx.restore();
	}

	function drawSkeleton(color, metrics) {
		ctx.save();
		ctx.strokeStyle = color;
		ctx.lineWidth = 3;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.shadowColor = color;
		ctx.shadowBlur = 14;

		segments.forEach(([from, to]) => {
			const start = metrics.joints[from];
			const end = metrics.joints[to];
			ctx.beginPath();
			ctx.moveTo(start.x, start.y);
			ctx.lineTo(end.x, end.y);
			ctx.stroke();
		});
		ctx.restore();
	}

	toggleButtons.forEach((input) => {
		const key = input.dataset.toggle;
		input.addEventListener("change", () => {
			state[key] = input.checked;
			saveState();
			drawScene();
		});
	});

	colorInputs.forEach((input) => {
		const key = input.dataset.color;
		input.addEventListener("input", (e) => {
			state.colors[key] = e.target.value;
			saveState();
			drawScene();
		});
	});

	if (characterImg) {
		if (characterImg.complete && characterImg.naturalWidth > 0) {
			imageReady = true;
		} else {
			characterImg.addEventListener("load", () => {
				imageReady = true;
				drawScene();
			});
		}
	}

	if (revealTargets.length) {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("is-visible");
						observer.unobserve(entry.target);
					}
				});
			},
			{
				threshold: 0.22
			}
		);

		revealTargets.forEach((target) => observer.observe(target));
	}

	if (history.scrollRestoration) {
		history.scrollRestoration = "manual";
	}
	// window.scrollTo(0, 0); // No longer needed for window

	// window.addEventListener("scroll", handleScroll, { passive: true });
	// handleScroll();
	drawScene();

	// Catgirl Fetcher
	const catgirlContainer = document.getElementById('catgirlContainer');
	const prevBtn = document.getElementById('prevCatgirl');
	const nextBtn = document.getElementById('nextCatgirl');

	let catgirlHistory = [];
	let currentHistoryIndex = -1;

	function updateButtons() {
		if (prevBtn) {
			prevBtn.disabled = currentHistoryIndex <= 0;
		}
	}

	function displayCatgirl(index) {
		if (!catgirlContainer) return;
		
		const imgData = catgirlHistory[index];
		catgirlContainer.innerHTML = '';
		
		const imgEl = document.createElement('img');
		imgEl.src = `https://nekos.moe/image/${imgData.id}`;
		imgEl.alt = 'Catgirl';
		imgEl.loading = 'lazy';
		catgirlContainer.appendChild(imgEl);
		
		updateButtons();
	}

	async function fetchNewCatgirl() {
		if (!catgirlContainer) return;
		
		catgirlContainer.innerHTML = '<p class="loading-text">Loading...</p>';
		
		try {
			const response = await fetch('https://nekos.moe/api/v1/random/image?count=1&nsfw=false');
			if (!response.ok) throw new Error('Network response was not ok');
			
			const data = await response.json();
			
			if (data.images && data.images.length > 0) {
				const img = data.images[0];
				
				// If we were in the middle of history and fetched new, truncate future history
				if (currentHistoryIndex < catgirlHistory.length - 1) {
					catgirlHistory = catgirlHistory.slice(0, currentHistoryIndex + 1);
				}
				
				catgirlHistory.push(img);
				
				// Limit history to 4 items (current + 3 previous)
				if (catgirlHistory.length > 4) {
					catgirlHistory.shift();
				}
				
				currentHistoryIndex = catgirlHistory.length - 1;
				displayCatgirl(currentHistoryIndex);
			} else {
				catgirlContainer.innerHTML = '<p class="loading-text">No catgirls found :(</p>';
			}
		} catch (error) {
			console.error('Failed to fetch catgirls:', error);
			catgirlContainer.innerHTML = '<p class="loading-text">Failed to load catgirls. API might be down.</p>';
		}
	}

	if (prevBtn) {
		prevBtn.addEventListener('click', () => {
			if (currentHistoryIndex > 0) {
				currentHistoryIndex--;
				displayCatgirl(currentHistoryIndex);
			}
		});
	}

	if (nextBtn) {
		nextBtn.addEventListener('click', () => {
			if (currentHistoryIndex < catgirlHistory.length - 1) {
				currentHistoryIndex++;
				displayCatgirl(currentHistoryIndex);
			} else {
				fetchNewCatgirl();
			}
		});
	}
	
	// Initial fetch
	fetchNewCatgirl();
});
