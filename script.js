/* Team Meeting Breakout - vanilla JS canvas */
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Logical canvas size; CSS will scale responsively via aspect-ratio
  const LOGICAL_WIDTH = 1280;
  const LOGICAL_HEIGHT = 720;
  canvas.width = LOGICAL_WIDTH;
  canvas.height = LOGICAL_HEIGHT;

  // Visual/layout safety
  const SAFE_BOTTOM_GAP = 100; // space reserved above paddle for meetings to stop

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

  // --- Teams Calendar Background + Events as Bricks ---
  const dayNamesShort = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const eventTitles = ['Standup','Sprint Sync','1:1','Design Review','All Hands','Demo','Retro','Planning','Customer Call','Interview','Deep Work','Doc Review','Bug Triage'];
  const eventColors = ['#4F6BED', '#464EB8', '#8B88F3', '#43B581', '#C67BF4', '#DC5E5E', '#E5A50A'];
  const roomNames = ['Conf Room A','Conf Room B','Huddle 2','Room 12F','Boardroom','Zoom Room','Townhall'];
  const peopleFirst = ['Alex','Sam','Taylor','Jordan','Casey','Riley','Avery','Cameron','Drew','Harper','Jamie','Logan','Morgan','Parker','Quinn','Elliot','Rowan','Finley','Sasha','Hayden'];
  const peopleLast = ['Lee','Patel','Garcia','Nguyen','Kim','Smith','Brown','Khan','Singh','Wong','Lopez','Martinez','Davis','Miller','Wilson','Moore','Clark','Young','King','Hall'];
  let calendarEvents = [];

  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday as first day
    const start = new Date(d.setDate(diff));
    start.setHours(0,0,0,0);
    return start;
  }

  function getCalendarLayout() {
    const marginX = 24;
    const marginY = 24;
    const headerH = 56;
    const timeGutterW = 64;
    const days = 7; // Keep 7-day grid; we will not generate events on Sat/Sun
    const startHour = 7;
    const endHour = 19; // 7 PM
    const hours = endHour - startHour;

    const calX = marginX;
    const calY = marginY + 28;
    const calW = LOGICAL_WIDTH - marginX * 2;
    // Reserve bottom gap so meetings visually stop above paddle
    const calH = Math.max(160, LOGICAL_HEIGHT - calY - 32 - SAFE_BOTTOM_GAP);

    const columnW = (calW - timeGutterW) / days;
    const gridY = calY + headerH;
    const gridH = calH - headerH;

    return { marginX, marginY, headerH, timeGutterW, days, startHour, endHour, hours, calX, calY, calW, calH, columnW, gridY, gridH };
  }

  function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randomPerson() {
    return `${randomChoice(peopleFirst)} ${randomChoice(peopleLast)}`;
  }

  function buildCalendarEvents() {
    calendarEvents = [];
    const start = getStartOfWeek(new Date());
    // Only generate for Mon-Fri (dayIndex 1..5)
    for (let i = 1; i <= 5; i++) {
      const eventsPerDay = 7 + ((i * 3) % 4); // 7-10 events per day for "lots of meetings"
      for (let e = 0; e < eventsPerDay; e++) {
        const startHour = 7 + ((i * 37 + e * 17) % 12); // between 7 and 18
        const startMin = [0, 15, 30, 45][(i * 11 + e * 7) % 4];
        const durationMin = 30 + 15 * ((i + e) % 6); // 30-105
        const title = eventTitles[(i * 5 + e * 3) % eventTitles.length];
        const location = randomChoice(roomNames);
        const attendeeCount = randomInt(1, 5);
        const attendees = Array.from({ length: attendeeCount }, () => randomPerson());
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        date.setHours(startHour, startMin, 0, 0);
        // Default color grey
        const color = '#dcdcdc';
        calendarEvents.push({ dayIndex: i, start: date, durationMin, title, color, location, attendees, alive: true });
      }
    }
    // Randomly recolor ~60% to #b22222
    for (const ev of calendarEvents) {
      if (Math.random() < 0.6) ev.color = '#b22222';
    }
  }

  function layoutCalendarEvents(layout) {
    const totalMin = layout.hours * 60;
    for (const ev of calendarEvents) {
      const dayX = layout.calX + layout.timeGutterW + ev.dayIndex * layout.columnW + 4;
      const evW = layout.columnW - 8;
      const minutesFromStart = (ev.start.getHours() - layout.startHour) * 60 + ev.start.getMinutes();
      const yStart = layout.gridY + (minutesFromStart / totalMin) * layout.gridH + 2;
      let yH = Math.max(18, (ev.durationMin / totalMin) * layout.gridH - 4);

      // Simple jitter to reduce visual overlap
      const jitter = ((ev.start.getMinutes() / 15) % 2) * 6;

      // Ensure we keep a gap above the paddle
      const maxBottom = paddle.y - 24; // 24px breathing room
      if (yStart + yH > maxBottom) {
        yH = Math.max(14, maxBottom - yStart);
      }

      ev.x = dayX + jitter;
      ev.y = yStart;
      ev.width = evW - jitter;
      ev.height = yH;
      if (typeof ev.alive !== 'boolean') ev.alive = true;
    }
  }

  function drawTeamsCalendarBackground() {
    const layout = getCalendarLayout();

    // Base gradient
    const g = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    g.addColorStop(0, colors.bgTop);
    g.addColorStop(1, colors.bgBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Header background
    ctx.fillStyle = colors.calHeaderBg;
    roundRect(ctx, layout.calX, layout.calY, layout.calW, layout.headerH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();

    // Header day labels
    const start = getStartOfWeek(new Date());
    ctx.fillStyle = colors.calHeaderText;
    ctx.font = '600 16px Inter, system-ui';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < layout.days; i++) {
      const dayX = layout.calX + layout.timeGutterW + i * layout.columnW;
      const thisDay = new Date(start);
      thisDay.setDate(start.getDate() + i);
      const label = `${dayNamesShort[thisDay.getDay()]} ${thisDay.getMonth()+1}/${thisDay.getDate()}`;
      ctx.fillText(label, dayX + 12, layout.calY + layout.headerH / 2);
    }

    // Vertical lines (day separators)
    ctx.strokeStyle = colors.calGridBold;
    ctx.lineWidth = 1;
    for (let i = 0; i <= layout.days; i++) {
      const x = Math.round(layout.calX + layout.timeGutterW + i * layout.columnW) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, layout.gridY);
      ctx.lineTo(x, layout.gridY + layout.gridH);
      ctx.stroke();
    }

    // Horizontal lines (each hour) + time labels
    ctx.strokeStyle = colors.calGrid;
    ctx.fillStyle = colors.calTimeText;
    ctx.font = '12px Inter, system-ui';
    for (let h = 0; h <= layout.hours; h++) {
      const y = Math.round(layout.gridY + (h / layout.hours) * layout.gridH) + 0.5;
      ctx.beginPath();
      ctx.moveTo(layout.calX + layout.timeGutterW, y);
      ctx.lineTo(layout.calX + layout.calW, y);
      ctx.stroke();

      if (h < layout.hours) {
        const hour24 = layout.startHour + h;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        const hour12 = ((hour24 + 11) % 12) + 1;
        ctx.fillText(`${hour12} ${ampm}`, layout.calX + 8, y + 2);
      }
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
    buildCalendarEvents();
    layoutCalendarEvents(getCalendarLayout());
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

      // Event (brick) collisions
      for (const ev of calendarEvents) {
        if (!ev.alive) continue;
        const collided = circleRectCollision(ball.x, ball.y, ball.radius, ev.x, ev.y, ev.width, ev.height);
        if (collided) {
          ev.alive = false;
          resolveBallBounceOffRect({ x: ev.x, y: ev.y, width: ev.width, height: ev.height });
          break;
        }
      }

      // Win condition: all meetings cleared
      if (calendarEvents.length > 0 && calendarEvents.every(e => !e.alive)) {
        resetGame();
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

  // Draw red "now" line across the calendar (on top of events)
  function drawNowIndicator() {
    const layout = getCalendarLayout();
    const weekStart = getStartOfWeek(new Date());
    const now = new Date();

    // Only draw if current time is within the displayed hours
    const minutesFromStart = (now.getHours() - layout.startHour) * 60 + now.getMinutes();
    const totalMin = layout.hours * 60;
    if (minutesFromStart < 0 || minutesFromStart > totalMin) return;

    const y = Math.round(layout.gridY + (minutesFromStart / totalMin) * layout.gridH) + 0.5;

    // Line across all day columns
    ctx.strokeStyle = '#b22222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(layout.calX + layout.timeGutterW, y);
    ctx.lineTo(layout.calX + layout.calW, y);
    ctx.stroke();

    // Small dot at the current day column edge
    const dayIndex = Math.floor((now - weekStart) / (24 * 60 * 60 * 1000));
    if (dayIndex >= 0 && dayIndex < layout.days) {
      const dayX = layout.calX + layout.timeGutterW + dayIndex * layout.columnW;
      ctx.fillStyle = '#b22222';
      ctx.beginPath();
      ctx.arc(dayX + 4, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
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
    // Draw alive calendar events as bricks with richer content
    for (const ev of calendarEvents) {
      if (!ev.alive) continue;
      ctx.fillStyle = hexToRgba(ev.color, 0.88);
      roundRect(ctx, ev.x, ev.y, ev.width, ev.height, 8);
      ctx.fill();
      ctx.strokeStyle = hexToRgba('#000000', 0.25);
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      roundRect(ctx, ev.x, ev.y, ev.width, ev.height, 8);
      ctx.clip();

      let textY = ev.y + 16;
      const textLeft = ev.x + 8;
      const textRight = ev.x + ev.width - 8;
      const maxY = ev.y + ev.height - 6;

      // Title (bold)
      ctx.fillStyle = 'rgba(255,255,255,0.98)';
      ctx.font = '700 12px Inter, system-ui';
      if (textY <= maxY) {
        drawSingleLine(ctx, ev.title, textLeft, textRight, textY);
        textY += 16;
      }

      // Location (regular)
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = '12px Inter, system-ui';
      if (textY <= maxY) {
        drawSingleLine(ctx, ev.location, textLeft, textRight, textY);
        textY += 14;
      }

      // Attendees (regular, comma-separated)
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '12px Inter, system-ui';
      const attendeesText = ev.attendees.join(', ');
      if (textY <= maxY) {
        drawSingleLine(ctx, attendeesText, textLeft, textRight, textY);
        textY += 14;
      }

      ctx.restore();
    }
  }

  function drawSingleLine(ctx, text, xLeft, xRight, y) {
    const maxWidth = xRight - xLeft;
    // Simple truncation with ellipsis if too long
    let t = text;
    while (ctx.measureText(t).width > maxWidth && t.length > 1) {
      t = t.slice(0, -2);
    }
    if (t !== text) {
      if (t.length > 1) t = t.slice(0, -1) + '…';
    }
    ctx.fillText(t, xLeft, y);
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
    // Draw current time indicator on top of events
    drawNowIndicator();
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
  resetGame();
  loop();
})(); 