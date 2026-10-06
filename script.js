// Espera a que el HTML exista antes de buscar elementos o registrar eventos.
document.addEventListener('DOMContentLoaded', () => {
  // Tema visual: se guarda en localStorage para conservar la elección entre visitas.
  const themeToggle = document.getElementById('themeToggle');
  const isDimmed = localStorage.getItem('theme-dim') === 'true';

  function setThemeDimmed(dimmed) {
    document.body.classList.toggle('theme-dim', dimmed);
    // aria-pressed informa a lectores de pantalla si el interruptor está activado.
    themeToggle.setAttribute('aria-pressed', String(dimmed));
    themeToggle.setAttribute('aria-label', dimmed ? 'Desactivar modo oscuro' : 'Activar modo oscuro');
    localStorage.setItem('theme-dim', String(dimmed));
  }

  if (themeToggle) {
    setThemeDimmed(isDimmed);
    themeToggle.addEventListener('click', () => {
      setThemeDimmed(!document.body.classList.contains('theme-dim'));
    });
  }

  // La navegación lateral se enlaza con las secciones que comparten su id con cada href.
  const sectionNav = document.querySelector('.hero-section-nav');
  if (sectionNav) {
    const navLinks = [...sectionNav.querySelectorAll('a')];
    const sections = navLinks
      .map(link => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);

    function updateActiveSection() {
      if (!sections.length) return;

      // Se considera activa la sección que ya cruzó esta línea de referencia del viewport.
      const marker = window.innerHeight * 0.15;
      const isAtPageEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

      // Sobre mí se activa por la posición de "Mi historia", no solo por el borde de la sección.
      const aboutSection = sections.find(section => section.id === 'sobre-mi');
      const aboutHeading = aboutSection?.querySelector('.title');
      const aboutHeadingTop = aboutHeading?.getBoundingClientRect().top;
      const isAboutHeadingActive = aboutHeadingTop !== undefined
        && aboutHeadingTop <= window.innerHeight * 0.3
        && aboutHeadingTop + aboutHeading.getBoundingClientRect().height > 0;
      const activeSection = isAtPageEnd
        ? sections[sections.length - 1]
        : isAboutHeadingActive
          ? aboutSection
        : sections.reduce((active, section) => (
          section.getBoundingClientRect().top <= marker ? section : active
        ), sections[0]);

      // Mantiene sincronizados el punto destacado y aria-current para navegación accesible.
      navLinks.forEach(link => {
        const isActive = link.hash === `#${activeSection.id}`;
        link.classList.toggle('current', isActive);
        if (isActive) {
          link.setAttribute('aria-current', 'location');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    updateActiveSection();
  }

  // Este chat es solo una interfaz local: no consulta servicios ni genera respuestas automáticas.
  const chatTrigger = document.getElementById('caroChatTrigger');
  const chatPanel = document.getElementById('caroChatPanel');
  const chatClose = document.getElementById('caroChatClose');
  const chatForm = document.getElementById('caroChatForm');
  const chatInput = document.getElementById('caroChatInput');
  const chatMessages = document.getElementById('caroChatMessages');

  if (chatTrigger && chatPanel && chatClose && chatForm && chatInput && chatMessages) {
    function setChatOpen(isOpen) {
      chatPanel.hidden = !isOpen;
      chatTrigger.setAttribute('aria-expanded', String(isOpen));
      // Al abrir enfoca la entrada; al cerrar devuelve el foco al avatar que abre el chat.
      if (isOpen) {
        chatInput.focus();
      } else {
        chatTrigger.focus();
      }
    }

    chatTrigger.addEventListener('click', () => {
      setChatOpen(chatPanel.hidden);
    });

    chatClose.addEventListener('click', () => setChatOpen(false));

    chatForm.addEventListener('submit', event => {
      event.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;

      // textContent evita interpretar el mensaje escrito como marcado HTML.
      const messageElement = document.createElement('p');
      messageElement.className = 'caro-chat-message caro-chat-message-user';
      messageElement.textContent = message;
      chatMessages.appendChild(messageElement);
      chatInput.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;
      chatInput.focus();
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !chatPanel.hidden) {
        setChatOpen(false);
      }
    });
  }

  // La ruta local debe apuntar al PDF real para que la descarga del CV funcione.
  const downloadBtn = document.getElementById('download-cv-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = 'data/CV_Carolina_Florez.pdf';
      link.download = 'CV_Carolina_Florez.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  // Carrusel de habilidades: los tres controles siguientes coordinan pista y botones.
  const track = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const wrapper = document.querySelector('.carousel-wrapper');

  if (track && prevBtn && nextBtn) {
    const items = track.querySelectorAll('.skill-card');
    let currentIndex = 0;
    let autoSlideInterval = null;

    // Estos cortes coinciden con los anchos de tarjeta definidos en las media queries CSS.
    function getVisibleItemsCount() {
      if (window.innerWidth <= 600) return 3;
      if (window.innerWidth <= 1024) return 5;
      return 9;
    }

    function getMaxIndex() {
      // Limita el índice a la última tarjeta que todavía permite una vista completa.
      return Math.max(0, items.length - getVisibleItemsCount());
    }

    function updateCarousel() {
      if (!items.length) return;
      currentIndex = Math.min(currentIndex, getMaxIndex());
      const itemWidth = items[0].getBoundingClientRect().width;
      // Cada paso suma también los 15 px de gap declarados en .carousel-track.
      track.style.transform = `translateX(-${(itemWidth + 15) * currentIndex}px)`;
    }

    function nextSlide() {
      currentIndex = currentIndex < getMaxIndex() ? currentIndex + 1 : 0;
      updateCarousel();
    }

    function prevSlide() {
      currentIndex = currentIndex > 0 ? currentIndex - 1 : getMaxIndex();
      updateCarousel();
    }

    function stopAutoSlide() {
      // Se limpia el intervalo anterior para que nunca queden dos carruseles simultáneos.
      if (autoSlideInterval) clearInterval(autoSlideInterval);
      autoSlideInterval = null;
    }

    function startAutoSlide() {
      stopAutoSlide();
      // Solo crea un intervalo si existen tarjetas fuera de la parte visible.
      if (items.length > getVisibleItemsCount()) {
        autoSlideInterval = setInterval(nextSlide, 3000);
      }
    }

    // Cada clic mueve una tarjeta y vuelve a contar los tres segundos desde esa acción.
    nextBtn.addEventListener('click', () => {
      nextSlide();
      startAutoSlide();
    });
    prevBtn.addEventListener('click', () => {
      prevSlide();
      startAutoSlide();
    });

    if (wrapper) {
      // Pausar al pasar el cursor evita desplazar contenido que el visitante está leyendo.
      wrapper.addEventListener('mouseenter', stopAutoSlide);
      wrapper.addEventListener('mouseleave', startAutoSlide);
    }

    // Al cambiar el ancho se recalcula cuántas tarjetas caben y se limita el índice actual.
    window.addEventListener('resize', () => {
      updateCarousel();
      startAutoSlide();
    });

    updateCarousel();
    startAutoSlide();
  }

  // Juego decorativo autónomo: la serpiente calcula su ruta hacia la comida sin controles.
  const snakeBoard = document.getElementById('snakeBoard');
  const snakeScore = document.getElementById('snakeScore');

  if (snakeBoard && snakeScore) {
    const foodEmojis = ['🍓', '☕', '⭐', '🫐', '🌸', '✨'];
    // Cada posición se guarda como un índice lineal dentro de cells.
    let columnCount = 0;
    let rowCount = 0;
    let cells = [];
    let baseTones = [];
    let snake = [];
    let foodIndex = -1;
    let eatenCount = 0;
    let movementTimer = null;

    function renderSnake() {
      // Limpia el fotograma anterior, conserva el patrón y vuelve a dibujar cuerpo, cabeza y comida.
      cells.forEach((cell, index) => {
        cell.className = 'snake-cell';
        cell.textContent = '';
        if (baseTones[index]) cell.classList.add(baseTones[index]);
      });

      snake.forEach((cellIndex, segmentIndex) => {
        const cell = cells[cellIndex];
        cell.className = segmentIndex === 0 ? 'snake-cell is-head' : 'snake-cell is-snake';
        if (segmentIndex === 0) cell.textContent = '🐍';
      });

      if (foodIndex >= 0) {
        cells[foodIndex].className = 'snake-cell is-food';
        cells[foodIndex].textContent = cells[foodIndex].dataset.food;
      }
    }

    function placeFood() {
      // La comida solo puede aparecer en casillas que no ocupa ningún segmento.
      const occupiedCells = new Set(snake);
      const availableCells = cells
        .map((cell, index) => index)
        .filter(index => !occupiedCells.has(index));

      if (!availableCells.length) {
        foodIndex = -1;
        return;
      }

      foodIndex = availableCells[Math.floor(Math.random() * availableCells.length)];
      cells[foodIndex].dataset.food = foodEmojis[Math.floor(Math.random() * foodEmojis.length)];
    }

    function setupSnakeBoard() {
      // El tablero cambia de 40 x 6 a 20 x 10 en móvil, manteniendo 240 casillas en ambos casos.
      columnCount = window.innerWidth <= 640 ? 20 : 40;
      rowCount = window.innerWidth <= 640 ? 10 : 6;
      snakeBoard.replaceChildren();
      baseTones = [];
      cells = Array.from({ length: columnCount * rowCount }, () => {
        const cell = document.createElement('div');
        // Las probabilidades escalonadas producen el mosaico oscuro con variaciones moradas.
        const tone = Math.random();
        const baseTone = tone < 0.12
          ? 'is-marked-low'
          : tone < 0.19
            ? 'is-marked-mid'
            : tone < 0.22
              ? 'is-marked-high'
              : '';
        baseTones.push(baseTone);
        cell.className = `snake-cell ${baseTone}`;
        cell.setAttribute('aria-hidden', 'true');
        snakeBoard.appendChild(cell);
        return cell;
      });

      const middleRow = Math.floor(rowCount / 2);
      const startingColumn = Math.floor(columnCount * 0.17);
      const startingCell = middleRow * columnCount + startingColumn;
      snake = [startingCell + 2, startingCell + 1, startingCell];
      placeFood();
      renderSnake();
    }

    function findNextCell() {
      const startCell = snake[0];
      // Búsqueda en anchura (BFS): recorre casillas ortogonales y evita el cuerpo de la serpiente.
      const blockedCells = new Set(snake.slice(0, -1));
      // Este arreglo recuerda de dónde llegó el recorrido a cada casilla para reconstruir la ruta.
      const previousCells = new Int32Array(cells.length);
      previousCells.fill(-1);
      previousCells[startCell] = startCell;
      const queue = [startCell];
      let targetFound = false;

      for (let queueIndex = 0; queueIndex < queue.length && !targetFound; queueIndex++) {
        const currentCell = queue[queueIndex];
        const currentRow = Math.floor(currentCell / columnCount);
        const currentColumn = currentCell % columnCount;
        const neighbors = [];
        if (currentRow > 0) neighbors.push(currentCell - columnCount);
        if (currentColumn < columnCount - 1) neighbors.push(currentCell + 1);
        if (currentRow < rowCount - 1) neighbors.push(currentCell + columnCount);
        if (currentColumn > 0) neighbors.push(currentCell - 1);

        for (const neighbor of neighbors) {
          if (previousCells[neighbor] !== -1 || (blockedCells.has(neighbor) && neighbor !== foodIndex)) continue;
          previousCells[neighbor] = currentCell;
          if (neighbor === foodIndex) {
            targetFound = true;
            break;
          }
          queue.push(neighbor);
        }
      }

      if (!targetFound) return -1;

      // Reconstruye el camino desde la comida y devuelve solo el primer paso que debe dar la cabeza.
      let nextCell = foodIndex;
      while (previousCells[nextCell] !== startCell) {
        nextCell = previousCells[nextCell];
        if (nextCell < 0) return -1;
      }
      return nextCell;
    }

    function moveSnake() {
      const nextCell = findNextCell();
      if (nextCell < 0) {
        setupSnakeBoard();
        return;
      }

      const ateFood = nextCell === foodIndex;
      snake.unshift(nextCell);
      // Al comer no se quita la cola y la serpiente crece, hasta un máximo de 14 segmentos.
      if (!ateFood || snake.length > 14) snake.pop();

      if (ateFood) {
        eatenCount++;
        snakeScore.textContent = eatenCount;
        placeFood();
      }

      renderSnake();
    }

    function startSnake() {
      if (movementTimer) clearInterval(movementTimer);
      if (document.visibilityState !== 'hidden') {
        // Respeta la preferencia de movimiento reducido y no anima cuando la pestaña está oculta.
        const stepDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 420 : 220;
        movementTimer = setInterval(moveSnake, stepDelay);
      }
    }

    setupSnakeBoard();
    startSnake();

    // Reconstruye solo si cambia el número de columnas entre escritorio y móvil.
    window.addEventListener('resize', () => {
      const newColumnCount = window.innerWidth <= 640 ? 20 : 40;
      // Solo reconstruye al cruzar el breakpoint móvil; los cambios menores no reinician el juego.
      if (newColumnCount !== columnCount) {
        setupSnakeBoard();
      }
    });

    // Evita consumir recursos mientras otra pestaña está activa; reinicia al volver.
    document.addEventListener('visibilitychange', startSnake);
  }

  // Proyectos adicionales: alterna su visibilidad y actualiza el texto del botón en conjunto.
  const toggleProjectsBtn = document.getElementById('toggleProjectsBtn');
  const btnText = document.getElementById('btnText');
  const extraProjects = document.querySelectorAll('.extra-project');

  if (toggleProjectsBtn && btnText) {
    toggleProjectsBtn.addEventListener('click', () => {
      const isExpanded = toggleProjectsBtn.getAttribute('aria-expanded') !== 'true';
      toggleProjectsBtn.setAttribute('aria-expanded', String(isExpanded));
      extraProjects.forEach(project => project.classList.toggle('hidden', !isExpanded));
      btnText.textContent = isExpanded ? 'Ver menos proyectos' : 'Ver todos los proyectos';
    });
  }

  // Envía el formulario al backend del mismo origen; las credenciales SMTP nunca salen del servidor.
  const contactForm = document.getElementById('contactForm');
  const contactFormStatus = document.getElementById('contactFormStatus');

  if (contactForm && contactFormStatus) {
    const submitButton = contactForm.querySelector('.submit-btn');
    const submitButtonText = submitButton?.querySelector('span');
    const originalButtonText = submitButtonText?.textContent ?? 'Enviar mensaje';

    contactForm.addEventListener('submit', async event => {
      event.preventDefault();
      contactFormStatus.className = 'contact-form-status';
      contactFormStatus.textContent = 'Enviando mensaje...';
      if (submitButton) submitButton.disabled = true;
      if (submitButtonText) submitButtonText.textContent = 'Enviando...';

      const payload = {
        name: document.getElementById('nombre').value.trim(),
        email: document.getElementById('email').value.trim(),
        message: document.getElementById('mensaje').value.trim()
      };

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          const errorMessage = typeof result.detail === 'string'
            ? result.detail
            : 'Revisa que el nombre, correo y mensaje sean válidos.';
          throw new Error(errorMessage);
        }

        contactFormStatus.classList.add('is-success');
        contactFormStatus.textContent = result.message;
        contactForm.reset();
      } catch (error) {
        contactFormStatus.classList.add('is-error');
        contactFormStatus.textContent = error instanceof TypeError
          ? 'No se pudo conectar con el servidor. Comprueba que FastAPI esté iniciado.'
          : error.message;
      } finally {
        if (submitButton) submitButton.disabled = false;
        if (submitButtonText) submitButtonText.textContent = originalButtonText;
      }
    });
  }
});





