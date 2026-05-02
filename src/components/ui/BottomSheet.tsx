/**
 * BottomSheet - 底部弹层组件
 *
 * 功能：
 * - 底部滑出，高度可配置（50%/80%/100%）
 * - 点击遮罩或下拉关闭
 * - 支持拖拽关闭
 * - 支持滚动内容
 *
 * 使用方式：
 * <BottomSheet isOpen={show} onClose={close} height="80%">
 *   {content}
 * </BottomSheet>
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: '50%' | '80%' | '100%'; // 高度百分比
  title?: string; // 可选标题
}

export function BottomSheet({ isOpen, onClose, children, height = '80%', title }: BottomSheetProps) {
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 高度映射
  const heightMap = {
    '50%': '50vh',
    '80%': '80vh',
    '100%': '100vh',
  };

  // 关闭时清理
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 处理拖拽关闭
  const handleDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    setIsDragging(false);
    // 如果向下拖拽超过100px，关闭
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* 底部弹层 */}
          <motion.div
            ref={constraintsRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white shadow-2xl"
            style={{ height: heightMap[height], maxHeight: heightMap[height], paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* 拖拽手柄 */}
            <div
              className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* 标题栏（可选） */}
            {title && (
              <div className="px-4 pb-2 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">{title}</h3>
              </div>
            )}

            {/* 内容区 */}
            <div
              className="overflow-y-auto"
              style={{ height: title ? 'calc(100% - 70px)' : 'calc(100% - 40px)' }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
