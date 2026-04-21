import { motion } from "framer-motion";

const PageBanner = ({ title, gradient, shadow, width = "260px", right }) => {
  return (
    <div className="relative w-full h-12 flex items-center justify-between">
      <div className="relative h-full flex-1">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="absolute left-0 top-0 h-full flex items-center px-6 rounded-l-xl"
          style={{
            background: gradient || "linear-gradient(90deg, #D45769 0%, #D4CFC9 100%)",
            clipPath: "polygon(0 0, 93% 0, 100% 100%, 0 100%)",
            boxShadow: shadow || "4px 0 24px rgba(13,148,136,0.30)",
          }}
        >
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="text-white font-bold text-xl sm:text-2xl whitespace-nowrap tracking-tight"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.15)" }}
          >
            {title}
          </motion.span>
        </motion.div>
      </div>

      {right && (
        <div className="relative z-10 pl-4">
          {right}
        </div>
      )}
    </div>
  );
};

export default PageBanner;
