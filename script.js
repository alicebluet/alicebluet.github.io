/* Team Meeting Breakout - vanilla JS canvas */
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Logical canvas size; CSS will scale responsively via aspect-ratio
  const LOGICAL_WIDTH = 1280;
  const LOGICAL_HEIGHT = 720;
  canvas.width = LOGICAL_WIDTH;
  canvas.height = LOGICAL_HEIGHT;

  // Colors & theme
  const colors = {
    bgTop: '#0f172a',
    bgBottom: '#020617',
    paddle: '#22d3ee',
    ball: '#fcd34d',
    wall: '#334155',
    text: '#e2e8f0',
    brickBorder: 'rgba(255,255,255,0.08)',
    calGrid: 'rgba(226,232,240,0.12)',
    calGridBold: 'rgba(226,232,240,0.22)',
    calHeaderBg: '#0b1220',
    calHeaderText: 'rgba(226,232,240,0.85)',
    calTimeText: 'rgba(226,232,240,0.6)'
  };

  // Game objects
  const paddle = {
    width: 160,
    height: 18,
    x: LOGICAL_WIDTH / 2 - 80,
    y: LOGICAL_HEIGHT - 60,
    speed: 9,
    targetX: LOGICAL_WIDTH / 2 - 80,
  };

  const ball = {
    x: LOGICAL_WIDTH / 2,
    y: LOGICAL_HEIGHT - 80,
    radius: 10,
    speed: 6.2,
    vx: 4.4,
    vy: -6.2,
    onPaddle: true,
  };

  // Meeting grid (bricks)
  const meetingRows = 5;
  const meetingCols = 10;
  const meetingPadding = 14;
  const meetingTopOffset = 100;
  const meetingLeftOffset = 60;
  const meetingWidth = Math.floor((LOGICAL_WIDTH - meetingLeftOffset * 2 - meetingPadding * (meetingCols - 1)) / meetingCols);
  const meetingHeight = 60;

  let bricks = [];
  function buildBricks() {
    bricks = [];
    for (let r = 0; r < meetingRows; r++) {
      for (let c = 0; c < meetingCols; c++) {
        const x = meetingLeftOffset + c * (meetingWidth + meetingPadding);
        const y = meetingTopOffset + r * (meetingHeight + meetingPadding);
        const hue = 210 + Math.floor((r * 12 + c * 6) % 40);
        bricks.push({
          x,
          y,
          width: meetingWidth,
          height: meetingHeight,
          alive: true,
          color: `hsl(${hue} 40% 20%)`,
          name: mockName(r, c),
        });
      }
    }
  }

  const mockFirst = ['Alex','Sam','Taylor','Jordan','Casey','Riley','Avery','Cameron','Drew','Harper','Jamie','Logan','Morgan','Parker','Quinn'];
  const mockLast = ['Lee','Patel','Garcia','Nguyen','Kim','Smith','Brown','Khan','Singh','Wong','Lopez','Martinez','Davis','Miller','Wilson'];
  function mockName(r, c) {
    const f = mockFirst[(r * 3 + c * 5) % mockFirst.length];
    const l = mockLast[(r * 7 + c * 11) % mockLast.length];
    return `${f} ${l}`;
  }

  function resetBall() {
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius - 2;
    ball.vx = 4.4 * (Math.random() > 0.5 ? 1 : -1);
    ball.vy = -6.2;
    ball.onPaddle = true;
  }

  function resetGame() {
    paddle.x = LOGICAL_WIDTH / 2 - paddle.width / 2;
    paddle.targetX = paddle.x;
    buildBricks();
    if (calendarEvents.length === 0) buildCalendarEvents();
    resetBall();
  }

  // Input: mouse and keyboard
  let rightPressed = false;
  let leftPressed = false;

  document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    paddle.targetX = mouseX - paddle.width / 2;
    if (ball.onPaddle) {
      ball.x = clamp(paddle.targetX, 0, LOGICAL_WIDTH - paddle.width) + paddle.width / 2;
      ball.y = paddle.y - ball.radius - 2;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') rightPressed = true;
    if (e.key === 'ArrowLeft') leftPressed = true;
    if ((e.key === ' ' || e.key === 'Enter') && ball.onPaddle) {
      ball.onPaddle = false;
    }
    if (e.key.toLowerCase() === 'r') {
      resetGame();
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight') rightPressed = false;
    if (e.key === 'ArrowLeft') leftPressed = false;
  });

  canvas.addEventListener('click', () => {
    if (ball.onPaddle) ball.onPaddle = false;
  });

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function update() {
    // Smooth paddle movement (lerp towards targetX)
    const keyboardDelta = (rightPressed ? 1 : 0) - (leftPressed ? 1 : 0);
    if (keyboardDelta !== 0) {
      paddle.targetX = paddle.x + keyboardDelta * paddle.speed * 2.2;
    }
    paddle.x += (paddle.targetX - paddle.x) * 0.35;
    paddle.x = clamp(paddle.x, 0, LOGICAL_WIDTH - paddle.width);

    if (!ball.onPaddle) {
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall collisions
      if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.vx *= -1; }
      if (ball.x + ball.radius > LOGICAL_WIDTH) { ball.x = LOGICAL_WIDTH - ball.radius; ball.vx *= -1; }
      if (ball.y - ball.radius < 0) { ball.y = ball.radius; ball.vy *= -1; }

      // Paddle collision
      if (ball.y + ball.radius >= paddle.y && ball.y + ball.radius <= paddle.y + paddle.height) {
        if (ball.x >= paddle.x && ball.x <= paddle.x + paddle.width && ball.vy > 0) {
          const hit = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
          ball.vx = hit * 6.5;
          ball.vy = -Math.abs(ball.vy);
          const speed = Math.hypot(ball.vx, ball.vy) * 1.02;
          const angle = Math.atan2(ball.vy, ball.vx);
          ball.vx = Math.cos(angle) * speed;
          ball.vy = Math.sin(angle) * speed;
          ball.y = paddle.y - ball.radius - 1;
        }
      }

      // Bottom (miss)
      if (ball.y - ball.radius > LOGICAL_HEIGHT) {
        resetBall();
      }

      // Brick collisions
      for (const brick of bricks) {
        if (!brick.alive) continue;
        const collided = circleRectCollision(ball.x, ball.y, ball.radius, brick.x, brick.y, brick.width, brick.height);
        if (collided) {
          brick.alive = false;
          resolveBallBounceOffRect(brick);
          break;
        }
      }

      // Win condition
      if (bricks.every(b => !b.alive)) {
        buildBricks();
        resetBall();
      }
    }
  }

  function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = clamp(cx, rx, rx + rw);
    const closestY = clamp(cy, ry, ry + rh);
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) <= cr * cr;
  }

  function resolveBallBounceOffRect(rect) {
    const prevX = ball.x - ball.vx;
    const prevY = ball.y - ball.vy;
    const wasLeft = prevX <= rect.x;
    const wasRight = prevX >= rect.x + rect.width;
    const wasAbove = prevY <= rect.y;
    const wasBelow = prevY >= rect.y + rect.height;

    const overlapLeft = Math.abs((ball.x + ball.radius) - rect.x);
    const overlapRight = Math.abs((rect.x + rect.width) - (ball.x - ball.radius));
    const overlapTop = Math.abs((ball.y + ball.radius) - rect.y);
    const overlapBottom = Math.abs((rect.y + rect.height) - (ball.y - ball.radius));

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (minOverlap === overlapLeft && wasLeft) {
      ball.vx = -Math.abs(ball.vx);
    } else if (minOverlap === overlapRight && wasRight) {
      ball.vx = Math.abs(ball.vx);
    } else if (minOverlap === overlapTop && wasAbove) {
      ball.vy = -Math.abs(ball.vy);
    } else if (minOverlap === overlapBottom && wasBelow) {
      ball.vy = Math.abs(ball.vy);
    } else {
      ball.vy *= -1;
    }
  }

  // --- Teams Calendar Background ---
  const dayNamesShort = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const eventTitles = ['Standup','Sprint Sync','1:1','Design Review','All Hands','Demo','Retro','Planning','Customer Call','Interview'];
  const eventColors = ['#4F6BED', '#464EB8', '#8B88F3', '#43B581', '#C67BF4', '#DC5E5E'];
  let calendarEvents = [];

  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday as first day
    const start = new Date(d.setDate(diff));
    start.setHours(0,0,0,0);
    return start;
  }

  function buildCalendarEvents() {
    calendarEvents = [];
    const start = getStartOfWeek(new Date());
    const days = 7;
    for (let i = 0; i < days; i++) {
      const eventsPerDay = 2 + (i % 3); // 2-4 events
      for (let e = 0; e < eventsPerDay; e++) {
        const startHour = 8 + ((i * 37 + e * 17) % 9); // between 8 and 16
        const startMin = [0, 15, 30, 45][(i * 11 + e * 7) % 4];
        const durationMin = 30 + 15 * ((i + e) % 5); // 30-90
        const title = eventTitles[(i * 5 + e * 3) % eventTitles.length];
        const color = eventColors[(i + e) % eventColors.length];
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        date.setHours(startHour, startMin, 0, 0);
        calendarEvents.push({ dayIndex: i, start: date, durationMin, title, color });
      }
    }
  }

  function drawTeamsCalendarBackground() {
    // Base gradient
    const g = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    g.addColorStop(0, colors.bgTop);
    g.addColorStop(1, colors.bgBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Calendar layout
    const marginX = 24;
    const marginY = 24;
    const headerH = 56;
    const timeGutterW = 64;
    const days = 7;
    const startHour = 8;
    const endHour = 19; // 7 PM
    const hours = endHour - startHour;

    const calX = marginX;
    const calY = marginY + 28;
    const calW = LOGICAL_WIDTH - marginX * 2;
    const calH = LOGICAL_HEIGHT - calY - 32;

    // Header background
    ctx.fillStyle = colors.calHeaderBg;
    roundRect(ctx, calX, calY, calW, headerH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();

    // Header day labels
    const columnW = (calW - timeGutterW) / days;
    const start = getStartOfWeek(new Date());
    ctx.fillStyle = colors.calHeaderText;
    ctx.font = '600 16px Inter, system-ui';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < days; i++) {
      const dayX = calX + timeGutterW + i * columnW;
      const thisDay = new Date(start);
      thisDay.setDate(start.getDate() + i);
      const label = `${dayNamesShort[thisDay.getDay()]} ${thisDay.getMonth()+1}/${thisDay.getDate()}`;
      ctx.fillText(label, dayX + 12, calY + headerH / 2);
    }

    // Grid body
    const gridY = calY + headerH;
    const gridH = calH - headerH;

    // Vertical lines (day separators)
    ctx.strokeStyle = colors.calGridBold;
    ctx.lineWidth = 1;
    for (let i = 0; i <= days; i++) {
      const x = Math.round(calX + timeGutterW + i * columnW) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, gridY);
      ctx.lineTo(x, gridY + gridH);
      ctx.stroke();
    }

    // Horizontal lines (each hour) + time labels
    ctx.strokeStyle = colors.calGrid;
    ctx.fillStyle = colors.calTimeText;
    ctx.font = '12px Inter, system-ui';
    for (let h = 0; h <= hours; h++) {
      const y = Math.round(gridY + (h / hours) * gridH) + 0.5;
      ctx.beginPath();
      ctx.moveTo(calX + timeGutterW, y);
      ctx.lineTo(calX + calW, y);
      ctx.stroke();

      if (h < hours) {
        const hour24 = startHour + h;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        const hour12 = ((hour24 + 11) % 12) + 1;
        ctx.fillText(`${hour12} ${ampm}`, calX + 8, y + 2);
      }
    }

    // Events
    for (const ev of calendarEvents) {
      const dayX = calX + timeGutterW + ev.dayIndex * columnW + 4;
      const evW = columnW - 8;
      const totalMin = hours * 60;
      const minutesFromStart = (ev.start.getHours() - startHour) * 60 + ev.start.getMinutes();
      const yStart = gridY + (minutesFromStart / totalMin) * gridH + 2;
      const yH = Math.max(18, (ev.durationMin / totalMin) * gridH - 4);

      ctx.fillStyle = hexToRgba(ev.color, 0.8);
      roundRect(ctx, dayX, yStart, evW, yH, 8);
      ctx.fill();
      ctx.strokeStyle = hexToRgba('#000000', 0.25);
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      roundRect(ctx, dayX, yStart, evW, yH, 8);
      ctx.clip();
      ctx.fillStyle = 'white';
      ctx.font = '600 12px Inter, system-ui';
      ctx.fillText(ev.title, dayX + 8, yStart + 16);
      ctx.restore();
    }
  }

  function hexToRgba(hex, alpha) {
    const m = hex.replace('#','');
    const bigint = parseInt(m.length === 3 ? m.split('').map(c=>c+c).join('') : m, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Drawing helpers
  function drawBackground() {
    drawTeamsCalendarBackground();
  }

  function drawPaddle() {
    const g = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    g.addColorStop(0, '#06b6d4');
    g.addColorStop(1, '#0891b2');
    ctx.fillStyle = g;
    roundRect(ctx, paddle.x, paddle.y, paddle.width, paddle.height, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.stroke();
  }

  function drawBall() {
    const radial = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 2, ball.x, ball.y, ball.radius);
    radial.addColorStop(0, '#fff7d6');
    radial.addColorStop(1, colors.ball);
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.stroke();
  }

  function drawBricks() {
    for (const b of bricks) {
      if (!b.alive) continue;
      ctx.fillStyle = b.color;
      roundRect(ctx, b.x, b.y, b.width, b.height, 10);
      ctx.fill();
      ctx.strokeStyle = colors.brickBorder;
      ctx.stroke();

      const cx = b.x + 18, cy = b.y + 18, ar = 12;
      ctx.fillStyle = 'hsl(190 80% 60% / 0.9)';
      ctx.beginPath(); ctx.arc(cx, cy, ar, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '14px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.name, b.x + 40, b.y + 18);

      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      roundRect(ctx, b.x + 10, b.y + 36, b.width - 20, b.height - 46, 8);
      ctx.fill();
    }
  }

  function drawHUD() {
    ctx.fillStyle = 'rgba(226,232,240,0.9)';
    ctx.font = '600 20px Inter, system-ui';
    ctx.fillText('Team Meeting Breakout', 24, 40);
    ctx.font = '14px Inter, system-ui';
    ctx.fillStyle = 'rgba(226,232,240,0.75)';
    ctx.fillText('Move: Mouse or ← →   •   Launch: Click / Space / Enter   •   Reset: R', 24, 66);
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function render() {
    drawBackground();
    drawBricks();
    drawPaddle();
    drawBall();
    drawHUD();
  }

  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  // Initialize
  buildCalendarEvents();
  resetGame();
  loop();
})(); 