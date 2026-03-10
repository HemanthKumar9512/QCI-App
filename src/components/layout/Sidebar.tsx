import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Atom, Link2, Shield, DollarSign,
  ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import { useQCIStore } from '@/store/qciStore';

const navItems = [
  { path: '/', label: 'Command Center', icon: LayoutDashboard },
  { path: '/customers', label: 'Customer Matrix', icon: Users },
  { path: '/quantum', label: 'Quantum Engine', icon: Atom },
  { path: '/blockchain', label: 'Blockchain Ledger', icon: Link2 },
  { path: '/retention', label: 'Retention Center', icon: Shield },
  { path: '/pricing', label: 'Pricing Optimizer', icon: DollarSign },
];

const Sidebar: React.FC = () => {
  const collapsed = useQCIStore(s => s.sidebarCollapsed);
  const toggle = useQCIStore(s => s.toggleSidebar);
  const location = useLocation();

  return (
    <motion.aside
      className="fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-30"
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.2 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border">
        <Zap className="w-5 h-5 text-qci-cyan flex-shrink-0" />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-heading font-bold text-sm text-gradient-cyan whitespace-nowrap overflow-hidden"
            >
              Quantum CI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map(item => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <NavLink key={item.path} to={item.path}>
              <div className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                ${active
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="flex items-center justify-center h-10 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
