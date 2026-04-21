import { useEffect, useRef, useCallback } from 'react';

const FlowingDots = ({
  backgroundColor = '#1a1a2e',
  particleColor   = '120, 180, 255',
  animationSpeed  = 0.005,
}) => {
  const canvasRef        = useRef(null);
  const timeRef          = useRef(0);
  const animationFrameId = useRef(null);
  const mouseRef         = useRef({ x: 0, y: 0 });
  const flowPointsRef    = useRef([]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr    = window.devicePixelRatio || 1;
    const rect   = canvas.parentElement?.getBoundingClientRect();
    const W      = rect?.width  ?? window.innerWidth;
    const H      = rect?.height ?? window.innerHeight;

    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr); }

    const gridSize = 14;
    flowPointsRef.current = [];
    for (let x = gridSize / 2; x < W; x += gridSize)
      for (let y = gridSize / 2; y < H; y += gridSize)
        flowPointsRef.current.push({
          x, y, vx: 0, vy: 0,
          originalX: x, originalY: y,
        });
  }, []);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const noise = (x, y, t) => {
      const s1 = Math.sin(x * 0.01 + t);
      const s2 = Math.sin(y * 0.01 + t * 0.8);
      const s3 = Math.sin((x + y) * 0.005 + t * 1.2);
      return (s1 + s2 + s3) / 3;
    };

    resizeCanvas();
    timeRef.current = 0;
    const onResize = () => resizeCanvas();
    window.addEventListener('resize', onResize);
    canvas.addEventListener('mousemove', handleMouseMove);

    function animate() {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      timeRef.current += animationSpeed;

      const W = parseFloat(canvas.style.width)  || canvas.width;
      const H = parseFloat(canvas.style.height) || canvas.height;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, W, H);

      flowPointsRef.current.forEach((point) => {
        const noiseVal = noise(point.x, point.y, timeRef.current);
        const angle    = noiseVal * Math.PI * 4;

        const dx   = mouseRef.current.x - point.x;
        const dy   = mouseRef.current.y - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150 && dist > 0) {
          const push = (1 - dist / 150) * 0.6;
          point.vx += (dx / dist) * push;
          point.vy += (dy / dist) * push;
        }

        point.vx += Math.cos(angle) * 0.1;
        point.vy += Math.sin(angle) * 0.1;
        point.vx *= 0.95;
        point.vy *= 0.95;

        const nextX = point.x + point.vx;
        const nextY = point.y + point.vy;

        const speed = Math.sqrt(point.vx * point.vx + point.vy * point.vy);
        const alpha = Math.min(0.85, speed * 8 + 0.25);

        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor}, ${alpha})`;
        ctx.fill();

        point.x = nextX < 0 ? W : nextX > W ? 0 : nextX;
        point.y = nextY < 0 ? H : nextY > H ? 0 : nextY;

        point.vx += (point.originalX - point.x) * 0.008;
        point.vy += (point.originalY - point.y) * 0.008;
      });

      animationFrameId.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      timeRef.current = 0;
      flowPointsRef.current = [];
    };
  }, [backgroundColor, particleColor, animationSpeed, resizeCanvas, handleMouseMove]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ backgroundColor }}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default FlowingDots;
